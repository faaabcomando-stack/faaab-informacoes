#!/usr/bin/env python3
"""Convert the existing FAAAB WebP sprite sheets to individual transparent PNG logos.

For higher-quality prints, use the original-resolution user-supplied images.
No old GOA image is mislabeled as 1º GDA. A mountain qualification is not a unit badge.
"""
from pathlib import Path
from collections import deque
import json
from PIL import Image, ImageOps

BASE=Path(__file__).resolve().parents[1]
MANIFEST=json.loads((BASE/'dados/atlas-emblemas.json').read_text(encoding='utf8'))
OUT=BASE/'assets/emblemas-png'
OUT.mkdir(parents=True,exist_ok=True)
ATLASES=[
    (BASE/'assets/faaab-emblemas-site.webp',MANIFEST['items'],10,8),
    (BASE/'assets/faaab-emblemas-extra.webp',MANIFEST['extras']['items'],4,3)
]
EXCLUDE={'FAB-1-GOA'}
SPECIAL={'FTB-CIOpMth':'FTB-CIOpMth-QUALIFICACAO'}
items=[]

def trim_white_background(image):
    image=image.convert('RGBA')
    width,height=image.size
    pix=image.load()
    def white(color):
        return min(color[:3])>=231 and max(color[:3])-min(color[:3])<27
    visited=set()
    queue=deque()
    for x in range(width):
        for y in (0,height-1):
            if white(pix[x,y]) and (x,y) not in visited:
                visited.add((x,y));queue.append((x,y))
    for y in range(height):
        for x in (0,width-1):
            if white(pix[x,y]) and (x,y) not in visited:
                visited.add((x,y));queue.append((x,y))
    while queue:
        x,y=queue.popleft()
        for xx,yy in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=xx<width and 0<=yy<height and (xx,yy) not in visited and white(pix[xx,yy]):
                visited.add((xx,yy));queue.append((xx,yy))
    for x,y in visited:
        r,g,b,_=pix[x,y];pix[x,y]=(r,g,b,0)
    bbox=image.getchannel('A').getbbox()
    if bbox:image=image.crop(bbox)
    return ImageOps.expand(image,border=2,fill=(255,255,255,0))

for path,records,cols,rows in ATLASES:
    source=Image.open(path).convert('RGBA')
    width,height=source.width//cols,source.height//rows
    for raw_id,entry in records.items():
        if raw_id in EXCLUDE:continue
        key=SPECIAL.get(raw_id,raw_id)
        index=entry['index'];x=index%cols;y=index//cols
        part=source.crop((x*width,y*height,(x+1)*width,(y+1)*height))
        part=trim_white_background(part)
        destination=OUT/(key+'.png')
        part.save(destination,optimize=True)
        items.append({
            'id':key,'path':'assets/emblemas-png/'+key+'.png',
            'source':path.name,'x':x,'y':y,
            'status':'distintivo de qualificação' if key.endswith('-QUALIFICACAO') else 'miniatura recortada'
        })
# The real 1º GDA (Esquadrão Jaguar) has its own official emblem.
# Never relabel the old 'GOA' badge. Download the correctly labeled FAB source, when reachable.
try:
    import io
    from urllib.request import Request, urlopen
    gda_url='https://www2.fab.mil.br/incaer/images/eventgallery/SISCULT/Heraldica/Emblemas/Imagens/1gda.gif'
    req=Request(gda_url,headers={'User-Agent':'Mozilla/5.0 (FAAAB heraldry reference)'})
    with urlopen(req,timeout=12) as response:
        image_bytes=response.read(2_000_000)
    gda=Image.open(io.BytesIO(image_bytes)).convert('RGBA')
    gda=trim_white_background(gda)
    gda.save(OUT/'FAB-1--GDA.png',optimize=True)
    items.append({'id':'FAB-1--GDA','path':'assets/emblemas-png/FAB-1--GDA.png',
                  'source':'Força Aérea Brasileira (INCAER), 1gda.gif',
                  'status':'1º GDA / Esquadrão Jaguar, fonte oficial'})
    print('1º GDA: emblema oficial instalado como PNG')
except Exception as exc:
    print('1º GDA: download oficial indisponível, mantendo entrada sem imagem incorreta:',str(exc)[:140])

manifest={
    'version':1,'format':'png','transparent':True,'count':len(items),
    'items':{row['id']:row for row in items},
    'notes':'PNGs extraídos dos WebPs antigos; substitua por fontes originais de alta resolução quando possível. GDA não foi substituído por GOA.'
}
(BASE/'dados/atlas-png-emblemas.json').write_text(
    json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('FAAAB:',len(items),'logos PNG recortados')
