"use strict";
/* Atlas de emblemas FAAAB. Imagens cedidas pelo projeto, com associação nominal controlada.
   O arquivo compactado contém 74 miniaturas e 12 imagens adicionais; não é banco de emblemas oficiais. */
(()=>{
const IDS=["FTB-BFE","FTB-BPE","FTB-BI-Caat","FTB-BIB","FTB-BAC","FTB-CIE","FTB-BIM","FTB-BIL","FTB-BIS","FTB-GAC","ADM-FMB","FTB-AMAN","FTB-EsPCEx","FTB-ESA","ADM-STF","ADM-CBM","ADM-GOV","FTB-B-Log-Sl","FTB-B-Log","FAB-AFA","FAB-EEAR","FAB-EPCAR","FAB-SIA","FAB-UNIFA","FAB-ECEMAR","FAB-EAOAR","FAB-1-GOA","FAB-EAS-PARA-SAR","FAB-GSD","FAB-ETA","FAB-IEAV","FMB-CIAW","FMB-CIAMPA","FMB-CIAA","FMB-EN","FMB-CN","FMB-EAM","FMB-GRUMEC","FTB-1DE","FTB-3DE","FTB-5DE","FTB-Bda-Inf-Sl","FTB-Bda-Inf-Mth","FTB-BIP","ADM-CFN","FTB-Bda-Inf-AMV","FTB-Bda-Inf-Mec","FTB-Bda-C-Mec","FTB-Bda-Inf-Mtz","FTB-Bda-Inf-Bld","FTB-Bda-C-Bld","FTB-COpEsp","FTB-DECEx","FTB-CIGS","FTB-CIOU","FTB-CIOpC","FTB-CIOpEsp","FTB-CIBld","FTB-CI-Pqdt-GPB","ADM-SGM","ADM-SEFA","FTB-EsAO","FTB-EsSLog","ADM-TAI-EB","ADM-TAI-MB","ADM-TAI-FAB","FTB-Cia-Prec-Pqdt","FTB-RCC","FTB-17--B-Fron","FTB-1--RCG","FTB-ECEME","FTB-B-Op-Psi","PM-ROTAM","PM-BPChoque"];
const COLS=10,ROWS=8;
const map=new Map(IDS.map((id,i)=>[id,i]));
const EXTRA_IDS=["PM-BOPE","FAB-CIAER","CFN-BtlBldFN","CFN-BtlEngFN","CFN-BtlArtFN","PM-BPP","CBM-GBS","CBM-GSFMA","CBM-GOPP","CBM-GOA","CBM-GOESP","FTB-CIOpMth"];
const EXTRA_COLS=4,EXTRA_ROWS=3;
const extraMap=new Map(EXTRA_IDS.map((id,i)=>[id,i]));
// Não exibir versões regionais como brasões universais de toda a instituição.
const genericUnavailable=new Set(["FMB-EAM","FAB-ETA"]);
const src=new URL("faaab-emblemas-site.webp",document.currentScript.src).href;
const srcExtra=new URL("faaab-emblemas-extra.webp",document.currentScript.src).href;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalized=id=>typeof id==="string"&&/^[\w-]{2,60}$/.test(id)?id:"";
function has(id){const k=normalized(id);return (map.has(k)||extraMap.has(k))&&!genericUnavailable.has(k)}
function decorate(node,id){
 if(!node||!has(id))return false;
 const extra=extraMap.has(id);
 const columns=extra?EXTRA_COLS:COLS,rows=extra?EXTRA_ROWS:ROWS;
 const index=extra?extraMap.get(id):map.get(id),col=index%columns,row=Math.floor(index/columns);
 node.classList.add("faaab-emblem");
 node.style.backgroundImage='url("'+(extra?srcExtra:src)+'")';
 node.style.backgroundSize=(columns*100)+"% "+(rows*100)+"%";
 node.style.backgroundPosition=(100*col/(columns-1))+"% "+(100*row/(rows-1))+"%";
 node.dataset.faaabAtlasReady="1";
 if(!node.hasAttribute("aria-label"))node.setAttribute("aria-label","Emblema de referência FAAAB");
 if(!node.hasAttribute("role"))node.setAttribute("role","img");
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
window.FAAABEmblemas=Object.freeze({has,element,markup,decorate,hydrate,count:IDS.length+EXTRA_IDS.length});
})();