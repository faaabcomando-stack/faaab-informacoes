#!/usr/bin/env python3
"""Obtém versões de maior definição dos MESMOS brasões; nunca gera novo desenho.

EsEFEx: emblema 512x512 publicado no site do Fórum Científico da EsEFEx.
EsEqEx: procura imagens nos PDFs institucionais; apenas relata candidatas
para avaliação, sem substituir automaticamente um brasão diferente.
Se rede externa falhar, preserva o original e a publicação continua.
"""
from pathlib import Path
from io import BytesIO
import urllib.request
from PIL import Image, ImageDraw, ImageChops

ROOT = Path(__file__).resolve().parents[1]
INSIGNIAS = ROOT / "assets" / "insignias"
ESEFEX_URL = "https://www.forumesefex.com/Logo%20esefex.png"
ESEQEX_PDF_URL = "https://www.fph.com.br/sportmanager/uploads/torneio/2970/arquivos/Programa%20Campeonato%20Brasileiro%20de%20Hipismo%20Completo%202024.pdf"

def download(url, maxbytes=12_000_000):
    req = urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; FAAAB-AssetReview/1.0)"})
    with urllib.request.urlopen(req, timeout=16) as response:
        raw=response.read(maxbytes+1)
    if len(raw)>maxbytes: raise ValueError("Arquivo remoto grande demais")
    return raw

def update_esefex():
    target=INSIGNIAS/"esefex.png"
    old=Image.open(target)
    try:
        raw=download(ESEFEX_URL,5_000_000)
        original=Image.open(BytesIO(raw))
        original.load()
        if original.width<350 or original.height<350:
            raise ValueError(f"Fonte pequena: {original.size}")
        if max(original.size)/min(original.size)>1.13:
            raise ValueError(f"Proporção inesperada: {original.size}")
        im=original.convert("RGBA")
        im.thumbnail((640,640),Image.Resampling.LANCZOS)
        w,h=im.size
        # O brasão é circular; elimina somente os cantos externos.
        mask=Image.new("L",im.size,0)
        dr=ImageDraw.Draw(mask)
        pad=max(1,round(min(w,h)*.004))
        dr.ellipse((pad,pad,w-pad-1,h-pad-1),fill=255)
        im.putalpha(ImageChops.multiply(im.getchannel("A"),mask))
        im.save(target,"PNG",optimize=True)
        print(f"QUALIDADE EsEFEx: substituído {old.width}x{old.height} por {w}x{h}, fonte: {ESEFEX_URL}")
    except Exception as exc:
        print(f"QUALIDADE EsEFEx: original {old.width}x{old.height} mantido; fonte indisponível: {exc}")

def probe_eseqex():
    target=INSIGNIAS/"eseqex.png"
    with Image.open(target) as im:
        print(f"QUALIDADE EsEqEx: original {im.width}x{im.height}; não ampliar artificialmente")
    try:
        import fitz
        raw=download(ESEQEX_PDF_URL)
        document=fitz.open(stream=raw,filetype="pdf")
        original=Image.open(target).convert("RGBA")
        base=Image.new("RGBA",original.size,(255,255,255,255))
        base.alpha_composite(original)
        reference=base.convert("RGB").resize((64,80),Image.Resampling.LANCZOS)
        from PIL import ImageChops,ImageStat
        imgs=[]
        for page in document[:1]:
            for ref in page.get_images(full=True):
                xref=ref[0]
                info=document.extract_image(xref)
                if not info:continue
                pic=Image.open(BytesIO(info["image"])).convert("RGB")
                if pic.width>400 or pic.height>400: continue
                candidate=pic.resize((64,80),Image.Resampling.LANCZOS)
                score=round(sum(ImageStat.Stat(ImageChops.difference(reference,candidate)).mean)/3,1)
                imgs.append((score,pic.width,pic.height,info.get("ext","?"),xref))
        imgs.sort()
        print(f"QUALIDADE EsEqEx: candidatos por diferença de cores (menor é melhor): {imgs}")
        print("QUALIDADE EsEqEx: substituição aguarda conferência visual da candidata correta.")
    except Exception as exc:
        print(f"QUALIDADE EsEqEx: documento indisponível; brasão original mantido: {exc}")

if __name__=="__main__":
    update_esefex()
    probe_eseqex()
