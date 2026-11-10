"use strict";
/* Emblemas FAAAB: somente PNG individual, sem fallback ampliado de sprites WebP. */
(()=>{
const IDS=["FTB-BFE","FTB-BPE","FTB-BI-Caat","FTB-BIB","FTB-BAC","FTB-CIE","FTB-BIM","FTB-BIL","FTB-BIS","FTB-GAC","ADM-FMB","FTB-AMAN","FTB-EsPCEx","FTB-ESA","ADM-STF","ADM-CBM","ADM-GOV","FTB-B-Log-Sl","FTB-B-Log","FAB-AFA","FAB-EEAR","FAB-EPCAR","FAB-SIA","FAB-UNIFA","FAB-ECEMAR","FAB-EAOAR","FAB-1-GOA","FAB-EAS-PARA-SAR","FAB-GSD","FAB-ETA","FAB-IEAV","FMB-CIAW","FMB-CIAMPA","FMB-CIAA","FMB-EN","FMB-CN","FMB-EAM","FMB-GRUMEC","FTB-1DE","FTB-3DE","FTB-5DE","FTB-Bda-Inf-Sl","FTB-Bda-Inf-Mth","FTB-BIP","ADM-CFN","FTB-Bda-Inf-AMV","FTB-Bda-Inf-Mec","FTB-Bda-C-Mec","FTB-Bda-Inf-Mtz","FTB-Bda-Inf-Bld","FTB-Bda-C-Bld","FTB-COpEsp","FTB-DECEx","FTB-CIGS","FTB-CIOU","FTB-CIOpC","FTB-CIOpEsp","FTB-CIBld","FTB-CI-Pqdt-GPB","ADM-SGM","ADM-SEFA","FTB-EsAO","FTB-EsSLog","ADM-TAI-EB","ADM-TAI-MB","ADM-TAI-FAB","FTB-Cia-Prec-Pqdt","FTB-RCC","FTB-17--B-Fron","FTB-1--RCG","FTB-ECEME","FTB-B-Op-Psi","PM-ROTAM","PM-BPChoque"];
const COLS=10,ROWS=8;
const map=new Map(IDS.map((id,i)=>[id,i]));
const EXTRA_IDS=["PM-BOPE","FAB-CIAER","CFN-BtlBldFN","CFN-BtlEngFN","CFN-BtlArtFN","PM-BPP","CBM-GBS","CBM-GSFMA","CBM-GOPP","CBM-GOA","CBM-GOESP","FTB-CIOpMth"];
const EXTRA_COLS=4,EXTRA_ROWS=3;
const extraMap=new Map(EXTRA_IDS.map((id,i)=>[id,i]));
// Não exibir versões regionais como brasões universais de toda a instituição.
// Um emblema regional pode ser exibido com a origem explícita, não como insígnia universal.
const genericUnavailable=new Set(["FAB-1-GOA","ADM-GOV"]);
const ALIASES=Object.freeze({
 "FTB-DAD":"FTB-BFE","FTB-DRE":"FTB-BFE",
 "FTB-PC":"FTB-BPE","FTB-PELOPES":"FTB-BI-Caat","FTB-DCS":"FTB-BI-Caat",
 "FTB-Precs":"FTB-Cia-Prec-Pqdt","FTB-DCOE":"FTB-BAC",
 "FTB-PRGM":"FTB-BIM","FTB-POS":"FTB-CIGS",
 "FTB-SC":"FTB-CIE","FTB-DGC":"FTB-CIE",
 "FAB-GSD-CHOQUE":"FAB-GSD",
 "CFN-BtlInfFN":"ADM-CFN","CFN-BtlVtrAnf":"ADM-CFN"
});
const PNG_ONLY_IDS=new Set(["CFN-BtlOpRib","FAB-1--GDA","FTB-CIOPan","FMB-SSPM","CFN-BOE-FN","CFN-COMANF","ADM-PM","ADM-TAI-EB","ADM-TAI-FAB","ADM-TAI-MB"]); // GOA nunca substitui GDA.
// Referência heráldica original publicada pela Marinha, em PNG transparente.
const REMOTE_EMBLEMS=Object.freeze({
 "FMB-CIM":"https://upload.wikimedia.org/wikipedia/commons/4/4c/Centro_de_Informa%C3%A7%C3%B5es_da_Marinha.png",
 "FMB-COMSUB":"https://www.marinha.mil.br/sites/www.marinha.mil.br.comfors/files/field/image/brasao.png"
});
const PNG_ALIASES=Object.freeze({
 "FTB-CIOpMth":"FTB-CIOpMth-QUALIFICACAO"
});
const LABELS=Object.freeze({
 "FMB-CIM":"CIM — Centro de Inteligência da Marinha. Emblema original com a cabeça de Argus, confirmado pelo usuário.",
 "FMB-COMSUB":"Comando da Força de Submarinos (ComForS); brasão oficial da Marinha. COMSUB é a sigla adotada na FAAAB.",
 "FMB-EAM":"Referência: Escola de Aprendizes-Marinheiros do Ceará (EAMCE)",
 "FAB-ETA":"Referência: primeiro Esquadrão de Transporte Aéreo (1º ETA)",
 "FTB-CIOpMth":"Distintivo de Guia de Montanha Avançado; referência de curso, não brasão do centro",
 "FTB-Bda-Inf-Mth":"Brasão da 4ª Brigada de Infantaria Leve – Montanha, unidade predecessora renomeada para Brigada de Infantaria de Montanha.",
 "CFN-BtlOpRib":"Distintivo 2D do 1º Batalhão de Operações Ribeirinhas, fonte Marinha do Brasil.",
 "FAB-1--GDA":"1º GDA — Esquadrão Jaguar. No desenho da sigla, a letra D pode parecer O.",
 "ADM-TAI-EB":"Taifa do Exército — QTE.",
 "ADM-TAI-MB":"Taifa da Marinha — referência CPA.",
 "ADM-TAI-FAB":"Taifa da Aeronáutica — QTA."
});
const pngCache=new Map();
const selfUrl=document.currentScript?.src||location.href;
function loadPng(key){
 if(pngCache.has(key))return pngCache.get(key);
 const remote=REMOTE_EMBLEMS[key];
 if(remote){const result=new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(remote);img.onerror=()=>resolve(null);img.src=remote;});pngCache.set(key,result);return result;}
 const asset=new URL("emblemas-png/"+encodeURIComponent(key)+".png",selfUrl);
 asset.searchParams.set("v","20261110-pngoriginais");
 const url=asset.href;
 const result=new Promise(resolve=>{
   const img=new Image();
   img.onload=()=>resolve(url);
   img.onerror=()=>resolve(null);
   img.src=url;
 });
 pngCache.set(key,result);
 return result;
}
function effective(id){
 const key=normalized(id);
 return ALIASES[key]||key;
}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalized=id=>typeof id==="string"&&/^[\w-]{2,60}$/.test(id)?id:"";
function has(id){const k=effective(id);return (map.has(k)||extraMap.has(k)||PNG_ONLY_IDS.has(k)||Object.prototype.hasOwnProperty.call(PNG_ALIASES,k)||Object.prototype.hasOwnProperty.call(REMOTE_EMBLEMS,k))&&!genericUnavailable.has(k)}
function decorate(node,id){
 if(!node||!has(id))return false;
 const key=effective(id),qualified=Object.prototype.hasOwnProperty.call(PNG_ALIASES,key);
 const ref=qualified?PNG_ALIASES[key]:key;
 const inherited=Object.prototype.hasOwnProperty.call(ALIASES,id)&&ALIASES[id]!==id;
 const note=LABELS[key]||(inherited?"Brasão da organização superior; esta subdivisão não possui emblema específico publicado.":"Brasão FAAAB de referência.");
 node.classList.add("faaab-emblem");
 node.dataset.faaabAtlasReady="1";
 node.style.backgroundImage="none"; // Não mostrar sprites WebP de 56px como se fossem PNGs nítidos.
 node.title=note;
 if(!node.hasAttribute("aria-label"))node.setAttribute("aria-label",note);
 if(!node.hasAttribute("role"))node.setAttribute("role","img");
 loadPng(ref).then(url=>{
   if(!node.isConnected)return;
   if(!url){node.classList.add("faaab-sem-png");node.setAttribute("aria-label","Brasão em PNG indisponível");return;}
   const img=new Image();
   img.onload=()=>{
     if(!node.isConnected)return;
     node.style.backgroundImage='url("'+url+'")';
     node.style.backgroundPosition="center";
     node.style.backgroundSize="contain";
     node.classList.add("faaab-png");
     if(img.naturalWidth<160||img.naturalHeight<160){
       node.classList.add("faaab-baixa-resolucao");
       node.title=note+" Miniatura antiga: arquivo de maior resolução pendente.";
     }
   };
   img.src=url;
 });
 return true;
}
function element(id,klass=""){
 if(!has(id))return null;
 const span=document.createElement("span");
 if(klass)span.className=klass;
 decorate(span,id);
 return span;
}
function markup(id,label=""){
 if(!has(id))return "";
 return '<span class="faaab-emblem" data-faaab-emblem="'+esc(id)+'" role="img" aria-label="'+esc(label||"Emblema de referência FAAAB")+'"></span>';
}
function hydrate(root){
 if(!root||root.nodeType!==1)return;
 if(root.matches?.("[data-faaab-emblem]")&&!root.dataset.faaabAtlasReady)decorate(root,root.dataset.faaabEmblem);
 root.querySelectorAll?.("[data-faaab-emblem]:not([data-faaab-atlas-ready])").forEach(el=>decorate(el,el.dataset.faaabEmblem));
}
// DOM dinâmico de catálogos, filtros e páginas setoriais.
const observer=new MutationObserver(records=>{
 for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)hydrate(node);
});
if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>hydrate(document.documentElement),{once:true});
else hydrate(document.documentElement);
window.FAAABEmblemas=Object.freeze({has,element,markup,decorate,hydrate,count:IDS.length+EXTRA_IDS.length,aliases:ALIASES});
})();