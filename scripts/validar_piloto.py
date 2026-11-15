#!/usr/bin/env python3
"""Verificações estáticas do piloto FAAAB.
Não substitui teste visual em 320 px, integração Roblox ou inspeção humana.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import posixpath

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "ensino/index.html",
    "acervo/index.html",
    "publicacoes/materia.html",
    "hierarquia-piloto/index.html",
    "verificacao-visual/index.html",
    "exercito/brigadas/selva/index.html",
    "exercito/brigadas/selva/unidades/bis/index.html",
    "exercito/brigadas/selva/unidades/17-b-fron/index.html",
    "exercito/brigadas/selva/unidades/b-log-sl/index.html",
]
class Scan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.anchors = set()
        self.images = []
        self.viewport = False
        self.language = False

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get("id"):
            self.anchors.add(attrs["id"])
        if tag == "html":
            self.language = attrs.get("lang") == "pt-BR"
        if tag == "meta" and attrs.get("name") == "viewport":
            self.viewport = True
        if tag in ("a", "link", "script", "img"):
            attr = "src" if tag in ("script", "img") else "href"
            if attrs.get(attr):
                self.links.append((tag, attrs[attr]))
        if tag == "img":
            self.images.append(attrs)

def validate():
    bad = []
    for name in PAGES:
        file = ROOT / name
        if not file.is_file():
            bad.append(f"{name}: arquivo inexistente")
            continue
        scan = Scan()
        scan.feed(file.read_text(encoding="utf-8"))
        if not scan.language or not scan.viewport:
            bad.append(f"{name}: idioma ou viewport ausente")
        for img in scan.images:
            if "alt" not in img:
                bad.append(f"{name}: imagem sem atributo alt")
        for tag, url in scan.links:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc or url.startswith("//"):
                continue
            if not parsed.path:
                if parsed.fragment and parsed.fragment not in scan.anchors:
                    bad.append(f"{name}: destino interno ausente #{parsed.fragment}")
                continue
            normalized = posixpath.normpath(posixpath.join(posixpath.dirname(name), unquote(parsed.path)))
            if parsed.path.endswith("/"):
                normalized = posixpath.join(normalized, "index.html")
            if normalized.startswith("../") or not (ROOT / normalized).is_file():
                bad.append(f"{name}: recurso quebrado {url} -> {normalized}")
    titulares = json.loads((ROOT / "data/titulares.json").read_text(encoding="utf-8"))
    for f in ("eb", "fab", "mb", "cbm", "pm"):
        cfg = titulares["forcas"][f]
        gid = cfg["grupo_id"]
        if gid is not None and (type(gid) is not int or gid <= 0):
            bad.append(f"{f}: ID de grupo inválido")
        for office in ("papeis_ids", "papeis_subcomando_ids"):
            roles = cfg[office]
            if not isinstance(roles, list) or any(type(role) is not int or role <= 0 for role in roles):
                bad.append(f"{f}: IDs inválidos em {office}")
            elif gid is None and roles:
                bad.append(f"{f}: papéis configurados sem ID de grupo")
    noticias = json.loads((ROOT / "assets/publicacoes-data.json").read_text(encoding="utf-8"))
    if not isinstance(noticias, list):
        bad.append("Catálogo de notícias precisa ser uma lista")
    if bad:
        print("Falhas de verificação:")
        for problem in bad: print(" -", problem)
        raise SystemExit(1)
    print(f"Verificação estática concluída: {len(PAGES)} páginas, caminhos e dados de piloto.")

if __name__ == "__main__":
    validate()
