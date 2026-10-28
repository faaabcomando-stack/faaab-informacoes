"use strict";
/* Governo FAAAB: cada cargo e cada documento é consultado em uma página própria. */
const GOVERNMENT_ROLE_SCOPES={
    "GOV-DEP-FED":["Representação legislativa eletiva","Cargo eleito individualmente dentro do sistema político atual. O Governo pode elaborar leis fictícias; a competência concreta do Deputado em sua tramitação ainda precisa ser aprovada.","O cargo não pode ser concedido pelo presidente do partido por simples nomeação, pois é mandato de eleição. Número de vagas, mandato e rito legislativo pendentes."],
    "GOV-PRE":["Presidência e decisões nacionais","O Presidente autoriza o emprego do Exército quando as condições de conflito previstas são cumpridas. Pode propor mudanças na estrutura militar; a criação de batalhões exige permissão do Ministro da Defesa.","Poderes governamentais e execução técnica são distintos. A distribuição completa de funções, a vigência das leis e a autorização de novas patentes ainda dependem das regras específicas."],
    "GOV-V-PRE":["Vice-Presidência","Cargo eleito separadamente do Presidente, podendo pertencer a partido fictício diferente. Substituições e delegações precisam de regras próprias.","Não presumir que o Vice-Presidente detenha todos os poderes pessoais do Presidente sem previsão no regulamento."],
    "GOV-M-DEF":["Ministério da Defesa","A autorização do Ministro da Defesa é necessária para a proposta de criação de novos batalhões pelo Presidente, segundo a regra recuperada. A atuação ministerial detalhada ainda precisa de regulamento.","O Ministro não recebe automaticamente edição irrestrita do Roblox ou de todas as patentes. Mudanças exigem procedimentos e permissões válidos."],
    "GOV-P-STF":["Presidência do tribunal fictício","Cargo de direção do STF do universo FAAAB; organização do tribunal e procedimento judicial ainda não definidos.","Sem autorização registrada para abrir processos, determinar punições, banir jogadores ou acessar dados privados."],
    "GOV-M-STF":["Composição do STF fictício","Integra a estrutura judiciária planejada. Julgamentos, regras de voto e processos dependem de regulamentação.","Não há permissão aprovada para julgar, punir, remover cargos ou modificar contas do Roblox."],
    "GOV-SGP":["Secretaria-Geral da Presidência","Área de coordenação e expediente da Presidência. Competências específicas ainda não constam do regulamento.","Publicar atos, editar cargos, acessar registros ou representar o Presidente depende de autorização específica."],
    "GOV-V-SGP":["Vice-Secretaria-Geral da Presidência","Função adjunta à Secretaria-Geral. Atribuições e hipóteses de substituição ainda não definidas.","Não herda automaticamente poderes da Secretaria-Geral ou acesso ao painel do proprietário."],
    "GOV-S-DEF":["Secretaria de Defesa","Setor temático de Defesa no Governo. A relação com a pasta ministerial e as forças ainda não foi regulamentada.","A autoridade individual da Secretaria de Defesa ainda precisa ser definida. O Governo como instituição pode alterar patentes e batalhões do Exército; execução técnica depende de acesso autorizado."],
    "GOV-V-S-DEF":["Vice-Secretaria de Defesa","Apoio à área de Defesa. Responsabilidades concretas ainda exigem regulamentação.","A vice-função não concede comando militar ou recursos administrativos automaticamente."],
    "GOV-S-JUS":["Secretaria de Justiça","Área administrativa de Justiça prevista no Governo. Não se confunde com a magistratura do STF.","Não integra o STF por esse cargo; atos judiciais, punições e acesso a processos não estão autorizados."],
    "GOV-V-S-JUS":["Vice-Secretaria de Justiça","Função adjunta à Secretaria de Justiça. Substituições e acesso documental ainda pendentes.","Nenhuma competência judicial nem administração do STF é automática."],
    "GOV-S-RI":["Secretaria de Relações Institucionais","Área de relacionamento institucional do Governo, com procedimentos específicos ainda não definidos.","Negociações em nome de outras forças, alterações de cargos e acesso a grupos dependem de aprovação."],
    "GOV-V-S-RI":["Vice-Secretaria de Relações Institucionais","Função adjunta às relações institucionais. Delegações ainda não definidas.","Não pode ser presumida representação automática de instituições ou acesso administrativo."],
    "GOV-S-SEG":["Secretaria de Segurança Pública","Área temática de segurança pública do Governo. Não se confunde com postos e comandos da Polícia Militar.","Não concede automaticamente comando da PM, armamentos virtuais, equipamentos nem poder de punição."],
    "GOV-V-S-SEG":["Vice-Secretaria de Segurança Pública","Apoio à área de Segurança Pública. Atividades e substituições aguardam definição.","A função não herda acesso automático a sistemas policiais, grupos e registros."],
    "GOV-S-COM":["Secretaria de Comunicação Social","Área de comunicação do Governo. Regras para notícias, comunicados e publicação oficial ainda precisam de autorização.","Publicar ou editar notícias no portal exige permissão editorial separada, não apenas o cargo Roblox."],
    "GOV-V-S-COM":["Vice-Secretaria de Comunicação Social","Função adjunta à Comunicação Social. Atividades próprias ainda pendentes.","Nenhum acesso de publicação ou administração é herdado automaticamente da Secretaria."]
   };
const GOVERNMENT_GROUPS=[
 {name:"Presidência e ministério",ids:["GOV-PRE","GOV-V-PRE","GOV-M-DEF"]},
 {name:"Representação legislativa",ids:["GOV-DEP-FED"]},
  {name:"Supremo Tribunal Federal",ids:["GOV-P-STF","GOV-M-STF"]},
 {name:"Secretarias e vice-secretarias",ids:["GOV-SGP","GOV-V-SGP","GOV-S-DEF","GOV-V-S-DEF","GOV-S-JUS","GOV-V-S-JUS","GOV-S-RI","GOV-V-S-RI","GOV-S-SEG","GOV-V-S-SEG","GOV-S-COM","GOV-V-S-COM"]}
];
const GovPage={
 esc:v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),
 async load(name){const res=await fetch("dados/"+name+".json",{cache:"no-store"});if(!res.ok)throw Error("Falha ao carregar "+name);const x=await res.json();if(!Array.isArray(x))throw Error("Formato inesperado de "+name);return x},
 url:id=>"governo-cargo.html?id="+encodeURIComponent(id),
 info:id=>GOVERNMENT_ROLE_SCOPES[id]||["Área institucional","Competências específicas pendentes.","Nenhuma permissão de administração aprovada automaticamente."],
 section(title,body){return '<section class="v3-gov-roles-section"><h3>'+GovPage.esc(title)+'</h3>'+body+'</section>'},
 async list(){
  const target=document.getElementById("v3-government-role-directory");if(!target)return;
  const roles=(await GovPage.load("cargos")).filter(x=>x.forca==="GOV");
  const byId=new Map(roles.map(r=>[r.id,r]));
  target.innerHTML=GOVERNMENT_GROUPS.map(g=>GovPage.section(g.name,'<div class="v3-record-list">'+g.ids.map(id=>{
   const r=byId.get(id);if(!r)return "";
   return '<article class="v3-record-item"><span class="v3-record-code">'+GovPage.esc(r.sigla||"GOV")+'</span><div><h3><a href="'+GovPage.url(id)+'">'+GovPage.esc(r.nome)+'</a></h3><p>'+GovPage.esc(GovPage.info(id)[0])+'</p></div><a href="'+GovPage.url(id)+'">Ver ficha →</a></article>';
  }).join("")+'</div>')).join("");
 },
 async detail(){
  const target=document.getElementById("v3-government-role-detail");if(!target)return;
  const id=new URLSearchParams(location.search).get("id");
  const roles=(await GovPage.load("cargos")).filter(x=>x.forca==="GOV");
  const role=roles.find(x=>x.id===id);
  if(!role){target.innerHTML='<h2>Cargo não encontrado</h2><p>O código informado não corresponde a um cargo registrado do Governo da FAAAB.</p>';return}
  const [area,roleText,powers]=GovPage.info(role.id);
  document.title=role.nome+" | Governo da FAAAB";
  const headline=document.querySelector(".v3-government-hero h1");
  if(headline)headline.textContent=role.nome;
  const desc=document.querySelector(".v3-government-hero p");
  if(desc)desc.textContent="Informações individuais sobre o cargo "+role.nome+" na estrutura política da FAAAB.";
  const elected=["GOV-PRE","GOV-V-PRE","GOV-DEP-FED"].includes(role.id);
  const additional=elected?'<div class="v3-gov-detail-line"><h3>Eleição</h3><p>Este cargo faz parte da eleição individual da FAAAB. <a href="governo-candidaturas.html">Consultar os requisitos atuais de candidatura →</a></p></div>':'<div class="v3-gov-detail-line"><h3>Regulamentação</h3><p>Este cargo não é objeto de eleição popular automática. O modo específico de ingresso está indicado no cadastro, quando definido.</p></div>';
  target.innerHTML='<div class="v3-gov-role-single"><span class="v3-label">Cargo do Governo / '+GovPage.esc(role.sigla||"")+'</span><h2>'+GovPage.esc(role.nome)+'</h2><div class="v3-gov-detail-line"><h3>Área de atuação</h3><p><strong>'+GovPage.esc(area)+'</strong></p><p>'+GovPage.esc(roleText)+'</p></div><div class="v3-gov-detail-line"><h3>Como ingressar</h3><p>'+GovPage.esc(role.tipoIngresso||"Forma de ingresso ainda não definida")+'</p></div><div class="v3-gov-detail-line"><h3>Permissões e limites</h3><p>'+GovPage.esc(powers)+'</p><p>O acesso técnico a sistemas do projeto depende das permissões específicas do cargo.</p></div><div class="v3-gov-detail-line"><h3>Ocupação do cargo</h3><p>'+(role.titular?"Existe um titular registrado. Consulte o cadastro oficial para verificar dados atualizados.":"Titular não definido na documentação recuperada.")+'</p><p>Tempo de mandato, substituição e atribuições específicas dependem das decisões do projeto.</p></div>'+additional+'</div>';
 },
 async regulations(){
  const target=document.getElementById("v3-government-regulations");if(!target)return;
  const entries=(await GovPage.load("sistemas")).filter(x=>x.forca==="GOV").sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  target.innerHTML=entries.length?entries.map(x=>'<article class="v3-government-doc"><div class="v3-government-doc-title"><span class="v3-label">'+GovPage.esc(x.id)+'</span><h3>'+GovPage.esc(x.nome)+'</h3><span class="v3-state">'+GovPage.esc(x.estado||"A confirmar")+'</span></div><p>'+GovPage.esc(x.resumo||"")+'</p>'+(x.jogo?'<p><strong>No Roblox:</strong> '+GovPage.esc(x.jogo)+'</p>':"")+(x.regras?'<p><strong>Regras e pendências:</strong> '+GovPage.esc(x.regras)+'</p>':"")+'</article>').join(""):'<p>Nenhum registro localizado para o Governo.</p>';
 }
};
document.addEventListener("DOMContentLoaded",()=>{
 let target=document.getElementById("v3-government-role-directory")||document.getElementById("v3-government-role-detail")||document.getElementById("v3-government-regulations");
 if(!target)return;
 const type=target.id==="v3-government-role-directory"?"list":target.id==="v3-government-role-detail"?"detail":"regulations";
 GovPage[type]().catch(e=>{console.error("Governo FAAAB:",e);target.textContent="Não foi possível carregar os registros. Recarregue a página.";});
});
