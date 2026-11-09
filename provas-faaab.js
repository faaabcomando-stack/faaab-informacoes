"use strict";
(()=>{const $=id=>document.getElementById(id);
 const E=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=String(text);return x};
 const result=$("results"),search=$("search"),force=$("force");
 const q=new URLSearchParams(location.search),school=(q.get("instituicao")||"").toLowerCase(),division=(q.get("forca")||"").toUpperCase();
 const validSchool=/^[a-z0-9-]{1,40}$/.test(school)?school:"";
 const prefix=division==="FAB"||division==="FMB"||division==="FTB"?division:"";
 let records=[];
 const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 function draw(){
  result.replaceChildren();
  const query=normalize(search.value);
  let rows=records.filter(r=>(!force.value||r.forca===force.value)&&(!validSchool||r.instituicao===validSchool)&&(!query||normalize([r.titulo,r.tipo,r.instituicao,r.formacao].join(" ")).includes(query)));
  if(!rows.length){result.append(E("p","noresults","Nenhuma prova encontrada. Confira o nome da instituição ou altere o filtro."));return}
  for(const r of rows){
   const a=E("article","entry");a.append(E("span","badge-text",r.tipo+" · Inscrições fechadas"),E("h2",null,r.titulo));
   a.append(E("p",null,r.formacao||"Critérios em elaboração."));
   const facts=E("div","facts");
   const names={FTB:"Exército",FAB:"Aeronáutica",FMB:"Marinha"};
   facts.append(E("span",null,"Força: "+(names[r.forca]||"A definir")));
   facts.append(E("span",null,"Patentes: "+(r.patentesCandidatas?.length?r.patentesCandidatas.join(", "):"A definir")));
   facts.append(E("span",null,"Grupo Roblox: "+(r.grupoId?"Configurado no servidor":"A configurar")));
   a.append(facts);
   a.append(E("p",null,"Situação: "+(r.situacao||"Regulamento pendente")));
   const links=E("div","links");
   const institution=E("a",null,"Abrir portal da instituição ↗");institution.href=r.instituicao+".html";
   const study=E("a",null,"Estudar matérias ↗");study.href="estudos.html";
   const b=E("button",null,"Inscrição indisponível");b.disabled=true;b.type="button";
   links.append(institution,study,b);a.append(links);result.append(a);
  }
 }
 async function run(){
  if(prefix)force.value=prefix;
  try{const r=await fetch("dados/selecoes_faaab.json",{cache:"no-store"});if(!r.ok)throw Error("indisponível");const j=await r.json();if(!Array.isArray(j.provas))throw Error("catálogo inválido");records=j.provas;draw()}
  catch{result.replaceChildren(E("p","noresults","O catálogo não está disponível agora."))}
 }
 search.addEventListener("input",draw);force.addEventListener("change",draw);run()
})();