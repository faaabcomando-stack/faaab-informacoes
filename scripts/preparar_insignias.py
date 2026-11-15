#!/usr/bin/env python3
"""Prepara PNGs do portal FAAAB sem redesenhar brasões.

- Recorta SOMENTE as áreas de fundo externas, contíguas à borda, de quatro
  imagens com falhas conhecidas. Branco/preto internos permanecem no escudo.
- Converte insígnias já transparentes de PNG indexado (P/tRNS) para RGBA
  explícito, para melhor compatibilidade com visualizadores.
- Não confunde PNG (formato) com transparência e NÃO remove fundos de
  fotografias, fardas ou de imagens sem máscara segura.
O checkout original não é modificado no GitHub; o GitHub Pages usa estes
arquivos processados durante o build.
"""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

ROOT = Path(__file__).resolve().parents[1]
INSIGNIAS = ROOT / "assets" / "insignias"
TARGETS = {
    INSIGNIAS / "FTB-Bda-Inf-AMV.png": "escuro",
    INSIGNIAS / "FTB-Bda-Inf-Bld.png": "claro",
    INSIGNIAS / "FTB-Bda-Inf-Mec.png": "escuro",
    INSIGNIAS / "FMB-CIAA.png": "claro",
}
FOLDERS = [
    ROOT / "assets" / "insignias",
    ROOT / "assets" / "forcas",
    ROOT / "ministerio-defesa" / "assets" / "forcas",
    ROOT / "marinha" / "cfn",
]
ADDITIONAL = [
    ROOT / "assets" / "logo-faaab.png",
    ROOT / "ministerio-defesa" / "assets" / "logo-faaab.png",
    ROOT / "ministerio-defesa" / "assets" / "ministerio-da-defesa.png",
]

def external_matte(rgb, mode):
    r, g, b = rgb
    spread = max(rgb) - min(rgb)
    if mode == "escuro":
        return max(rgb) <= 100 and spread <= 32
    if mode == "claro":
        return min(rgb) >= 207 and spread <= 36
    return False

def remove_exterior(im, mode):
    rgba = im.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    visited = bytearray(w*h)
    removed = bytearray(w*h)
    queue = deque()

    def add(x,y):
        at = y*w+x
        if visited[at]: return
        visited[at] = 1
        r,g,b,a = px[x,y]
        if a <= 12 or external_matte((r,g,b), mode):
            removed[at] = 1
            queue.append((x,y))

    for x in range(w):
        add(x,0)
        add(x,h-1)
    for y in range(h):
        add(0,y)
        add(w-1,y)
    while queue:
        x,y=queue.popleft()
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
            nx,ny=x+dx,y+dy
            if 0<=nx<w and 0<=ny<h:
                add(nx,ny)

    changed=0
    for y in range(h):
        for x in range(w):
            if removed[y*w+x]:
                r,g,b,a=px[x,y]
                if a:
                    px[x,y]=(r,g,b,0)
                    changed+=1
    return rgba, changed

def has_transparency(image):
    if image.mode in ("RGBA","LA"):
        return image.getchannel("A").getextrema()[0] < 255
    return "transparency" in image.info

def mask_outside_emblem(image, kind):
    """Remove the white rectangle baked *around* two confirmed emblems.

    GBS is a circular crest. EEAR is a shield; the white inside the shield
    is part of the original artwork and MUST stay opaque. Coordinates are
    normalized from the existing source sizes, never from the UI screenshot.
    Use a supersampled alpha mask for smooth curved boundaries.
    """
    w, h = image.size
    scale = 4
    mask = Image.new("L", (w * scale, h * scale), 0)
    draw = ImageDraw.Draw(mask)
    if kind == "medalha":
        draw.ellipse((5*scale, 6*scale, (w-6)*scale, (h-6)*scale), fill=255)
    elif kind == "escudo":
        # Shape of EEAR's outline; mask only the area OUTSIDE the shield.
        outline = [(8,6),(415,6),(414,295),(411,346),(395,405),
                   (364,460),(321,490),(266,506),(212,510),(153,504),
                   (101,485),(56,443),(23,388),(9,340),(8,292)]
        points = [(round(x/423*w*scale),round(y/512*h*scale)) for x,y in outline]
        draw.polygon(points, fill=255)
    else:
        raise ValueError(kind)
    mask = mask.resize((w, h), Image.Resampling.LANCZOS)
    rgba = image.convert("RGBA")
    rgba.putalpha(ImageChops.multiply(rgba.getchannel("A"), mask))
    assert rgba.getpixel((0,0))[3] == 0
    assert rgba.getpixel((w//2,h//2))[3] > 0
    return rgba

SHAPE_FIXES = {
    INSIGNIAS / "CBM-GBS.png": "medalha",
    INSIGNIAS / "FAB-EEAR.png": "escudo",
}

def main():
    files=sorted(set(p for root in FOLDERS for p in root.glob("*.png") if p.is_file())|set(p for p in ADDITIONAL if p.is_file()))
    converted=0
    untouched_opaque=[]
    cut=0
    for path in files:
        with Image.open(path) as src:
            transparent=has_transparency(src)
            if not transparent and path not in TARGETS:
                untouched_opaque.append(str(path.relative_to(ROOT)))
                continue
            if path in TARGETS:
                rgba,n=remove_exterior(src,TARGETS[path])
                cut+=1
                print(f"RECORTE {path.relative_to(ROOT)}: {n} pixels de fundo externo removidos")
            elif path in SHAPE_FIXES:
                rgba=mask_outside_emblem(src, SHAPE_FIXES[path])
                cut+=1
                print(f"RECORTE DE FORMA {path.relative_to(ROOT)}: fundo retangular externo removido")
            else:
                rgba=src.convert("RGBA")
            rgba.save(path,"PNG",optimize=True)
            converted+=1
    print(f"PNG RGBA: {converted} arquivos convertidos; {cut} recortes específicos.")
    if untouched_opaque:
        print("REVISÃO MANUAL (opacos, preservados):")
        for name in untouched_opaque: print("  "+name)
    else:
        print("Nenhum PNG de insígnia totalmente opaco pendente.")
if __name__ == "__main__":
    main()
