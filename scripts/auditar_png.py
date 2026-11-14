#!/usr/bin/env python3
"""Relatório de transparência dos brasões PNG no repositório FAAAB.
Não altera imagens; identifica fundos uniformes externos para revisão.
"""
from pathlib import Path
from collections import Counter
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FILES = sorted([
  *list((ROOT / "assets" / "insignias").glob("*.png")),
  *list((ROOT / "assets" / "forcas").glob("*.png")),
  ROOT / "assets" / "logo-faaab.png",
  ROOT / "marinha" / "cfn" / "cfn-logo.png",
  ROOT / "ministerio-defesa" / "assets" / "ministerio-da-defesa.png",
])
def kind(rgb):
    r,g,b = rgb
    if min(rgb)>=218 and max(rgb)-min(rgb)<=35: return "claro"
    if max(rgb)<=72: return "escuro"
    if max(rgb)-min(rgb)<=28: return "neutro"
    return "colorido"

for path in FILES:
    if not path.exists():continue
    with Image.open(path) as im:
      rgba=im.convert("RGBA")
      w,h=rgba.size;px=rgba.load()
      samples=[px[min(w-1,max(0,x)),min(h-1,max(0,y))] for x,y in [
        (0,0),(w-1,0),(0,h-1),(w-1,h-1),
        (min(3,w-1),min(3,h-1)),(max(0,w-4),min(3,h-1)),
        (min(3,w-1),max(0,h-4)),(max(0,w-4),max(0,h-4))
      ]]
      kinds=[("transparente" if a<40 else kind((r,g,b))) for r,g,b,a in samples]
      border=[]
      for x in range(w):border.extend((px[x,0],px[x,h-1]))
      for y in range(h):border.extend((px[0,y],px[w-1,y]))
      active=sum(a>245 for _,_,_,a in border)/len(border)
      transparent=sum(a<40 for _,_,_,a in border)/len(border)
      count=Counter(kinds);major,num=count.most_common(1)[0]
      candidate=active>0.8 and major in ("claro","escuro","neutro") and num>=5
      print(("POSSIVEL_FUNDO" if candidate else "REVISAR" if active>.8 and transparent<.1 else "OK")+
        f" | {path.relative_to(ROOT)} | {w}x{h} | mode={im.mode}"+
        f" | borda_opaca={active:.0%} transparente={transparent:.0%}"+
        f" | cantos={','.join(kinds[:4])} | maioria={major}({num}/8)")
