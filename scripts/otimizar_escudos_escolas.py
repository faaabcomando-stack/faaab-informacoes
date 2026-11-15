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

def update_eseqex():
    target=INSIGNIAS/"eseqex.png"
    with Image.open(target) as old:
        ow,oh=old.size
        original=old.convert("RGBA")
    try:
        import fitz
        from PIL import ImageChops, ImageStat
        raw=download(ESEQEX_PDF_URL)
        document=fitz.open(stream=raw,filetype="pdf")
        base=Image.new("RGBA", original.size, (255,255,255,255))
        base.alpha_composite(original)
        reference=base.convert("RGB").resize((64,80),Image.Resampling.LANCZOS)
        best=None
        for ref in document[0].get_images(full=True):
            info=document.extract_image(ref[0])
            if not info:continue
            pic=Image.open(BytesIO(info["image"])).convert("RGB")
            if pic.width<ow*1.15 or pic.height<oh*1.15:continue
            if pic.width>350 or pic.height>420:continue
            sample=pic.resize((64,80),Image.Resampling.LANCZOS)
            score=sum(ImageStat.Stat(ImageChops.difference(reference,sample)).mean)/3
            if best is None or score<best[0]:best=(score,pic)
        # Só aceita o MESMO brasão confirmado, não escudo semelhante.
        if best is None or best[0]>=65:
            raise ValueError("Não foi encontrado um exemplar correspondente")
        score,pic=best
        pic.save(target,"PNG",optimize=True)
        print(f"QUALIDADE EsEqEx: substituído {ow}x{oh} por {pic.width}x{pic.height}; mesmo brasão, diferença {score:.1f}; fonte: {ESEQEX_PDF_URL}")
        print("QUALIDADE EsEqEx: melhoria limitada; ainda é necessário um original maior para nitidez HD.")
    except Exception as exc:
        print(f"QUALIDADE EsEqEx: original {ow}x{oh} mantido: {exc}")

if __name__=="__main__":
    update_esefex()
    update_eseqex()
