"use strict";
/* Governo FAAAB: cada cargo e cada documento é consultado em uma página própria. */
const GOVERNMENT_ROLE_SCOPES={
    "GOV-DEP-FED":["Representação legislativa nacional","Deputado Federal eleito na estrutura nacional da FAAAB, para propostas e deliberações de regras fictícias relacionadas à defesa, segurança e organização do jogo. Número de vagas, mandato e poderes detalhados a definir.","Os limites das competências legislativas de cada deputado ainda precisam ser definidos, inclusive sua participação nas decisões institucionais sobre o Exército."],
    "GOV-PRE":["Presidência e representação institucional","O Governo possui competência para decidir mudanças institucionais no Exército da FAAAB, inclusive novas patentes e batalhões. O rito de aprovação e a participação individual do Presidente ainda precisam ser documentados.","Não negar ao Governo o poder de alterar patentes e batalhões. O que depende de autorização própria é o acesso técnico individual para executar decisões no Roblox, no site e nos grupos."],
    "GOV-V-PRE":["Vice-Presidência e coordenação política","O cargo integra a direção do Governo. Condições de substituição, sucessão e delegações estão pendentes.","Não há concessão automática dos poderes do Presidente nem acesso privilegiado ao painel administrativo."],
    "GOV-M-DEF":["Área ministerial da Defesa","Cargo ministerial registrado para assuntos de Defesa no Governo. Relação funcional com as forças ainda precisa de normas próprias.","Mudanças nas estruturas e patentes do Exército podem ser decididas pelo Governo. A competência individual do Ministro da Defesa e o procedimento de execução ainda não foram definidos."],
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
  const additional=elected?'<div class="v3-gov-detail-line"><h3>Elegibilidade para a eleição</h3><p>A FAAAB exige que o candidato seja civil. Integrantes militares não podem concorrer enquanto permanecerem na força; quem acabou de se desligar deve cumprir uma carência de alguns dias. A quantidade ainda não foi aprovada, portanto não há liberação automática.</p><p><a href="governo-candidaturas.html">Entenda as candidaturas →</a></p></div>':'<div class="v3-gov-detail-line"><h3>Forma de escolha</h3><p>Não há aprovação para eleger este cargo automaticamente. A forma de ingresso registrada continua pendente de regulamentação.</p></div>';
  target.innerHTML='<div class="v3-gov-role-single"><span class="v3-label">Cargo do Governo / '+GovPage.esc(role.sigla||"")+'</span><h2>'+GovPage.esc(role.nome)+'</h2><div class="v3-gov-detail-line"><h3>Área de atuação</h3><p><strong>'+GovPage.esc(area)+'</strong></p><p>'+GovPage.esc(roleText)+'</p></div><div class="v3-gov-detail-line"><h3>Como ingressar</h3><p>'+GovPage.esc(role.tipoIngresso||"Forma de ingresso ainda não definida")+'</p></div><div class="v3-gov-detail-line"><h3>Permissões e limites</h3><p>'+GovPage.esc(powers)+'</p><p>O Governo pode decidir alterações no Exército, incluindo patentes e batalhões. A permissão técnica de aplicar uma decisão no Roblox ou no site deve ser atribuída e registrada separadamente.</p></div><div class="v3-gov-detail-line"><h3>Ocupação do cargo</h3><p>'+(role.titular?"Existe um titular registrado. Consulte o cadastro oficial para verificar dados atualizados.":"Titular não definido na documentação recuperada.")+'</p><p>Tempo de mandato, substituição e atribuições específicas dependem das decisões do projeto.</p></div>'+additional+'</div>';
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
