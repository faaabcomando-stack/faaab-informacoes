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
        sources=[
            ESEQEX_PDF_URL,
            "https://www.eseqex.eb.mil.br/images/2019/eseqex.pdf",
            "https://adestramentobrasil.com/wp-content/uploads/2021/02/programa-adestramento_aman_2021.pdf",
        ]
        all_candidates=[]
        for url in sources:
            try:
                raw=download(url)
                document=fitz.open(stream=raw,filetype="pdf")
                refs=[]
                for page in document[:min(3,len(document))]:
                    refs.extend((document,ref) for ref in page.get_images(full=True))
                all_candidates.extend((url,doc,ref) for doc,ref in refs)
            except Exception as issue:
                print(f"QUALIDADE EsEqEx: fonte indisponível {url}: {issue}")
        original=Image.open(target).convert("RGBA")
        base=Image.new("RGBA",original.size,(255,255,255,255))
        base.alpha_composite(original)
        reference=base.convert("RGB").resize((64,80),Image.Resampling.LANCZOS)
        from PIL import ImageChops,ImageStat
        imgs=[]
        for url,doc,ref in all_candidates:
            xref=ref[0]
            info=doc.extract_image(xref)
            if not info:continue
            pic=Image.open(BytesIO(info["image"])).convert("RGB")
            if pic.width>1800 or pic.height>1800:continue
            candidate=pic.resize((64,80),Image.Resampling.LANCZOS)
            score=round(sum(ImageStat.Stat(ImageChops.difference(reference,candidate)).mean)/3,1)
            imgs.append((score,pic.width,pic.height,info.get("ext","?"),url.split('/')[2],xref))
            if score < 94 and pic.height >= 135 and pic.width >= 100:
                import base64
                buff=BytesIO()
                pic.save(buff,format="JPEG",quality=80,optimize=True)
                print("QUALIDADE_CANDIDATO "+str(score)+" "+url.split('/')[2]+" "+str(xref)+" "+base64.b64encode(buff.getvalue()).decode("ascii"))
        imgs.sort()
        print(f"QUALIDADE EsEqEx: candidatos por diferença de cores (menor é melhor): {imgs}")
        print("QUALIDADE EsEqEx: substituição aguarda conferência visual da candidata correta.")
    except Exception as exc:
        print(f"QUALIDADE EsEqEx: documento indisponível; brasão original mantido: {exc}")

if __name__=="__main__":
    update_esefex()
    probe_eseqex()
