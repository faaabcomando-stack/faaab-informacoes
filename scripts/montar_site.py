#!/usr/bin/env python3
"""Publica só arquivos de site. Nenhum .secret, token ou código de servidor.

A pasta _site é o único diretório enviado ao GitHub Pages.
"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "_site"
WEB_DIRS = {
    "acervo", "aeronautica", "assets", "bombeiros", "chec",
    "diretorias", "ensino", "escolas", "esg", "exercito",
    "governo", "hierarquia-piloto", "marinha", "ministerio-defesa",
    "policia-militar", "portais", "publicacoes",
    "verificacao-png", "verificacao-visual",
}
WEB_ROOT = {"index.html", "hierarquia.html", "patente.html", "publicacoes.html", "creditos.html"}
SUFFIXES = {".html", ".css", ".js", ".json", ".png", ".webp", ".jpg", ".jpeg",
            ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".txt", ".mp4", ".webm", ".pdf"}
BAD_NAMES = {".secret", ".env", ".roblosecurity", "secret", "secret.json",
             "credentials.json", "credentials", "token.txt", "private.json"}


def may_publish(path: Path):
    rel = path.relative_to(ROOT)
    if path.is_symlink() or len(rel.parts) < 2:
        return False
    if rel.parts[0] not in WEB_DIRS:
        return False
    if any(part.startswith(".") for part in rel.parts):
        return False
    name = path.name.lower()
    if name in BAD_NAMES or name.endswith((".secret", ".env", ".pem", ".key", ".p12")):
        return False
    if path.suffix.lower() not in SUFFIXES:
        return False
    return True


def build():
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir()
    copied = 0
    for name in WEB_ROOT:
        src = ROOT / name
        if src.is_file() and not src.is_symlink():
            shutil.copy2(src, DEST / name)
            copied += 1
    for directory in WEB_DIRS:
        source = ROOT / directory
        if not source.is_dir() or source.is_symlink():
            continue
        for src in source.rglob("*"):
            if not src.is_file() or not may_publish(src):
                continue
            rel = src.relative_to(ROOT)
            out = DEST / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, out)
            copied += 1
    if not (DEST / "assets/comando/titulares.json").is_file():
        raise RuntimeError("JSON de status do comando ausente da publicação")
    print(f"Site público montado: {copied} arquivos permitidos.")


if __name__ == "__main__":
    build()
