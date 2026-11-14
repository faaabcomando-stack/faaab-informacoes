#!/usr/bin/env python3
"""Corrige apenas o fundo externo das insígnias já cadastradas na FAAAB.

Mantém o desenho original, as cores, o texto e os detalhes do escudo.
Executado durante a publicação do GitHub Pages; os PNGs publicados são RGBA.
"""
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INSIGNIAS = ROOT / "assets" / "insignias"
TARGETS = {
    "FTB-Bda-Inf-AMV.png": "dark",
    "FTB-Bda-Inf-Bld.png": "light",
    "FTB-Bda-Inf-Mec.png": "dark",
    "FMB-CIAA.png": "light",
}

def remove_outer_background(path: Path, mode: str) -> None:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    visited = bytearray(w * h)
    removed = bytearray(w * h)
    queue = deque()

    def is_background(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        if a <= 12:
            return True
        if mode == "dark":
            return max(r, g, b) <= 58
        # Fundo branco/acinzentado externo, não as cores do brasão.
        return min(r, g, b) >= 227 and max(r, g, b) - min(r, g, b) <= 30

    def add(x: int, y: int):
        idx = y * w + x
        if not visited[idx]:
            visited[idx] = 1
            if is_background(x, y):
                removed[idx] = 1
                queue.append((x, y))

    # Somente regiões claras ou escuras que tocam a borda são eliminadas.
    # Assim, áreas do desenho dentro dos contornos do escudo são preservadas.
    for x in range(w):
        add(x, 0)
        add(x, h - 1)
    for y in range(h):
        add(0, y)
        add(w - 1, y)

    while queue:
        x, y = queue.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1),
                       (1, 1), (1, -1), (-1, 1), (-1, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                add(nx, ny)

    removed_count = 0
    for y in range(h):
        for x in range(w):
            if removed[y * w + x]:
                r, g, b, a = px[x, y]
                if a:
                    px[x, y] = (r, g, b, 0)
                    removed_count += 1

    # Mantém todos os detalhes e dimensões do arquivo original.
    if removed_count < 10:
        print(f"AVISO: {path.name}: fundo externo não detectado; original preservado")
        return
    im.save(path, "PNG", optimize=True)
    check = Image.open(path)
    assert check.mode == "RGBA"
    print(f"{path.name}: PNG RGBA {w}x{h}, {removed_count} pixels externos transparentes")

if __name__ == "__main__":
    for name, mode in TARGETS.items():
        path = INSIGNIAS / name
        if not path.exists():
            raise FileNotFoundError(path)
        remove_outer_background(path, mode)
