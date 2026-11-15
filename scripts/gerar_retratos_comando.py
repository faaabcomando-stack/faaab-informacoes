"""Gera o modelo R6 e a prévia dos comandantes a partir do Roblox Open Cloud."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from functools import reduce
import gzip
from hashlib import sha256
from io import BytesIO
import json
from operator import xor
import os
from pathlib import Path
import re
import subprocess
from tempfile import TemporaryDirectory
from time import sleep
from urllib.error import HTTPError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, build_opener

from PIL import Image

from consultar_comando import CONFIG, NoRedirect, collect

ROOT = CONFIG.parents[1]
UNIFORMS = ROOT / "assets/comando/r6"
RENDER = Path(__file__).resolve().with_name("render_retrato_r6.py")
OUT = ROOT / "assets/comando/titulares"
KEY_PATTERN = re.compile(r"(?:[0-9]+DAY-)?[a-f0-9]{32}")
CDN_DOMAIN = re.compile(r"t[0-7]\.rbxcdn\.com")
NAMEPLATES = {
    "eb": (18, 34, 40, 40, 43), "fab": (18, 35, 40, 42, 42),
    "mb": (18, 38, 39, 45, 43), "pm": (18, 36, 38, 41, 42), "cbm": (11, 35, 28, 41, 38),
}


def read_url(url, key=None):
    headers = {"Accept-Encoding": "gzip", "User-Agent": "FAAAB-CommandPortraits/1"}
    if key:
        headers["x-api-key"] = key
    with build_opener(NoRedirect).open(Request(url, headers=headers), timeout=21) as response:
        payload = response.read()
    return gzip.decompress(payload) if payload.startswith(b"\x1f\x8b") else payload


def shard(asset):
    return f"t{reduce(xor, map(ord, asset), 31) % 8}.rbxcdn.com"


def from_cdn(asset, host):
    if not KEY_PATTERN.fullmatch(asset):
        raise ValueError("Identificador de malha inválido")
    sources = dict.fromkeys((shard(asset), shard(asset.split("-")[-1]), host))
    for source in sources:
        try:
            return read_url(f"https://{source}/{asset}")
        except HTTPError as error:
            if error.code not in (403, 404):
                raise
    raise ValueError("Arquivo indicado pela miniatura indisponível")


def manifest(endpoint, params, key):
    for delay in (0, 2, 4, 7):
        if delay:
            sleep(delay)
        data = json.loads(read_url(f"https://thumbnails.roblox.com/v1/{endpoint}?{urlencode(params)}", key))
        if data.get("state") != "Pending":
            break
    if data.get("state") != "Completed" or not isinstance(data.get("imageUrl"), str):
        raise ValueError("Miniatura 3D do Roblox ainda indisponível")
    url = urlparse(data["imageUrl"])
    host = url.netloc
    if url.scheme != "https" or not CDN_DOMAIN.fullmatch(host):
        raise ValueError("Origem inesperada para miniatura")
    return host, json.loads(read_url(url.geturl()))


@dataclass
class ObjPart:
    material: str = ""
    faces: list = field(default_factory=list)

    def indices(self):
        return {int(token.split("/")[0]) for face in self.faces for token in face}

    def signature(self):
        return len(self.indices()), sum(len(face) - 2 for face in self.faces)


def parse_obj(payload):
    parts = {}
    vertices = {"v": [], "vt": [], "vn": []}
    active = None
    for line in payload.decode("utf-8").splitlines():
        kind, delimiter, data = line.partition(" ")
        if not delimiter:
            continue
        if kind in vertices:
            vertices[kind].append(data)
        elif kind in ("g", "o"):
            active = parts.setdefault(data, ObjPart())
        elif kind == "usemtl" and active is not None:
            active.material = data
        elif kind == "f" and active is not None:
            active.faces.append(data.split())
    return vertices, {name: part for name, part in parts.items() if part.faces}


def match_accessory(asset_id, parts, key, chosen):
    host, info = manifest("assets-thumbnail-3d", {"assetId": asset_id}, key)
    _, isolated = parse_obj(from_cdn(info["obj"], host))
    signature = (
        sum(len(part.indices()) for part in isolated.values()),
        sum(part.signature()[1] for part in isolated.values()),
    )
    matches = [name for name, part in parts.items()
               if name.startswith("Handle") and name not in chosen and part.signature() == signature]
    if len(matches) != 1:
        raise ValueError("O acessório do rosto ou cabelo não pôde ser identificado na malha")
    return matches[0]


def write_identity(target, vertices, parts, chosen, raw_mtl, host):
    obj = ["mtllib identidade.mtl"]
    maps = {kind: {} for kind in vertices}
    materials = {parts[name].material for name in chosen}
    for group in chosen:
        for face in parts[group].faces:
            for token in face:
                for kind, index in zip(vertices, token.split("/")):
                    if not index:
                        continue
                    number = int(index)
                    if number not in maps[kind]:
                        if not 1 <= number <= len(vertices[kind]):
                            raise ValueError("Índice OBJ fora do intervalo")
                        maps[kind][number] = len(maps[kind]) + 1
                        obj.append(f"{kind} {vertices[kind][number - 1]}")
    for group in chosen:
        part = parts[group]
        obj.extend((f"g {group}", f"usemtl {part.material}"))
        for face in part.faces:
            converted = ["/".join(str(maps[kind][int(index)]) if index else ""
                                  for kind, index in zip(vertices, token.split("/"))) for token in face]
            obj.append("f " + " ".join(converted))
    (target / "identidade.obj").write_text("\n".join(obj) + "\n", encoding="utf-8")
    mtl = []
    active = False
    textures = set()
    head_material = parts[chosen[0]].material
    material = ""
    for line in raw_mtl.decode("utf-8").splitlines():
        chunks = line.split()
        if chunks and chunks[0] == "newmtl":
            material = chunks[1]
            active = material in materials
        if not active or not chunks:
            continue
        if chunks[0] in ("map_Kd", "map_d"):
            asset = chunks[-1]
            ext = "jpg" if material == head_material else "png"
            if chunks[0] == "map_Kd" or ext == "png":
                mtl.append(f"{chunks[0]} {asset}.{ext}")
            textures.add((asset, ext))
        elif chunks[0] in ("newmtl", "Kd", "Ka", "Ks", "Ns", "d"):
            mtl.append(line)
    (target / "identidade.mtl").write_text("\n".join(mtl) + "\n", encoding="utf-8")
    for asset, ext in sorted(textures):
        content = from_cdn(asset, host)
        if ext == "png":
            (target / f"{asset}.png").write_bytes(content)
        else:
            Image.open(BytesIO(content)).convert("RGB").save(target / f"{asset}.jpg", quality=93, subsampling=0)


def prepare_uniform(target, force, colors):
    shirt = Image.open(UNIFORMS / force / "camisa.png").convert("RGBA")
    pants = Image.open(UNIFORMS / force / "calca.png").convert("RGBA")
    if shirt.size != (585, 559) or pants.size != shirt.size:
        raise ValueError("Texturas de roupa clássica precisam ter 585 por 559 px")
    for part, textures in {
        "torso": (pants, shirt), "rightArm": (shirt,), "leftArm": (shirt,),
        "rightLeg": (pants,), "leftLeg": (pants,)
    }.items():
        color = colors.get(part + "Color", "eab892")
        if not re.fullmatch(r"[a-fA-F0-9]{6}", color):
            raise ValueError("Cor de pele inválida no avatar")
        atlas = Image.new("RGBA", shirt.size, "#" + color)
        for texture in textures:
            atlas.alpha_composite(texture)
        if part == "torso":
            left, top, _, _ = json.loads((UNIFORMS / "UV.json").read_text())["T"]["F"]
            x1, y1, x2, y2, sample = NAMEPLATES[force]
            for y in range(top + y1, top + y2 + 1):
                atlas.paste(atlas.getpixel((left + sample, y)), (left + x1, y, left + x2 + 1, y+1))
        atlas.convert("RGB").save(target / f"{part}.png")


def bake(force, user, key, blender):
    profile = json.loads(read_url(f"https://users.roblox.com/v1/users/{user}"))
    if profile.get("id") != user or profile.get("isBanned"):
        raise ValueError("Perfil correspondente indisponível")
    avatar_read = json.loads(read_url(f"https://avatar.roblox.com/v4/avatar/users/{user}"))
    avatar = avatar_read.get("avatarModel", avatar_read)
    host, info = manifest("users/avatar-3d", {"userId": user}, key)
    revision = sha256(info["obj"].encode() + RENDER.read_bytes() + Path(__file__).read_bytes()
                      + b"".join((UNIFORMS / force / path).read_bytes() for path in ("camisa.png", "calca.png"))).hexdigest()[:12]
    directory = OUT / force / f"{user}-{revision}"
    image = directory / "retrato.webp"
    model = directory / "avatar-r6.glb"
    if not image.is_file() or not model.is_file():
        vertices, parts = parse_obj(from_cdn(info["obj"], host))
        if "Player1" not in parts:
            raise ValueError("Cabeça não identificada no modelo do avatar")
        ids = [asset["id"] for asset in avatar["assets"]
               if asset["assetType"]["name"] in ("HairAccessory", "FaceAccessory")]
        chosen = ["Player1"]
        for asset_id in ids:
            chosen.append(match_accessory(asset_id, parts, key, chosen))
        with TemporaryDirectory(prefix="faaab-retrato-") as work:
            temp = Path(work)
            write_identity(temp, vertices, parts, chosen, from_cdn(info["mtl"], host), host)
            prepare_uniform(temp, force, avatar["bodyColors"])
            command = [blender, "--background", "--factory-startup", "--python-exit-code", "2",
                       "--python", str(RENDER), "--", str(temp), str(UNIFORMS), force]
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL, timeout=240)
            glb = (temp / "avatar-r6.glb").read_bytes()
            json_length = int.from_bytes(glb[12:16], "little")
            clips = json.loads(glb[20:20 + json_length]).get("animations", [])
            if [clip["name"] for clip in clips] != ["apresentacao"]:
                raise ValueError("A apresentação precisa ser um único clipe sincronizado")
            directory.mkdir(parents=True, exist_ok=True)
            Image.open(temp / "retrato.png").save(image, quality=90, method=6)
            model.write_bytes(glb)
    return {
        "estado": "titular", "id": user, "usuario": profile["name"],
        "imagem": image.relative_to(OUT).as_posix(), "modelo": model.relative_to(OUT).as_posix(),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--arquivo-chave", type=Path)
    parser.add_argument("--snapshot", type=Path, help="resultado da sincronização de cargos já executada")
    parser.add_argument("--blender", default="blender")
    args = parser.parse_args()
    key = args.arquivo_chave.read_text(encoding="utf-8-sig").strip() if args.arquivo_chave else os.environ.get("ROBLOX_OPEN_CLOUD_KEY", "")
    if not key:
        parser.error("Informe ROBLOX_OPEN_CLOUD_KEY ou --arquivo-chave")
    if args.snapshot:
        data = json.loads(args.snapshot.read_text(encoding="utf-8"))
        if data.get("versao") != 1:
            parser.error("Versão inesperada do snapshot de cargos")
        snapshot = data["forcas"]
    else:
        config = json.loads(CONFIG.read_text(encoding="utf-8"))
        snapshot = collect(config, key, os.environ.get("ROBLOX_GROUP_AUDIT_KEY"))

    def portrait(pair):
        force, entry = pair
        commander = entry["comandante"]
        if commander["estado"] != "titular":
            return force, {"estado": commander["estado"]}
        if commander.get("elegiveis", 1) > 1 and commander.get("criterio") != "historico_roblox":
            return force, {"estado": "aguardando_historico"}
        try:
            return force, bake(force, commander["usuario_id"], key, args.blender)
        except (OSError, KeyError, ValueError, subprocess.SubprocessError) as error:
            print(f"{force}: retrato pendente ({type(error).__name__})")
            return force, {"estado": "retrato_pendente"}

    with ThreadPoolExecutor(max_workers=2) as workers:
        result = dict(workers.map(portrait, snapshot.items()))
    OUT.mkdir(parents=True, exist_ok=True)
    draft = OUT / "comando.tmp"
    draft.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    draft.replace(OUT / "comando.json")
    print(", ".join(f"{force}={row['estado']}" for force, row in result.items()))


if __name__ == "__main__":
    main()
