"use strict";
/*
 FAAAB — avaliação automática, destinada EXCLUSIVAMENTE ao backend.
 Não incluir este módulo como autorização no navegador.
 O chamador deve obter os fatos de Roblox Open Cloud, logs de servidor
 e cadastro de partidos, nunca confiar em flags enviadas pelo candidato.
 Não contém credenciais. Este módulo não executa chamadas de rede.
*/
const DAY=86400000;
const REQUIRED_ROLES=["Presidente","Vice-Presidente","Membro do Partido","Deputado Federal"];
const AGE_ACCOUNT=90, AGE_PARTY_GROUP=20, DAYS_CANDIDACY=30, DAYS_CREATION=60;
function normalize(s){return String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").replace(/\s+/g," ").trim();}
function numberOfDays(timestamp,now){
 if(!timestamp||!Number.isFinite(Date.parse(timestamp)))return null;
 const delta=now-Date.parse(timestamp);
 return Number.isFinite(delta)&&delta>=0?Math.floor(delta/DAY):null;
}
function gate(reasons,missing,label,value,minimum){
 if(value===null||value===undefined||!Number.isFinite(Number(value)))missing.push(label+" não verificável");
 else if(Number(value)<minimum)reasons.push(label+": exigidos "+minimum+" dias; verificados "+value);
}
function verifiedFlag(reasons,missing,label,value){
 if(value===false)reasons.push(label+" não atendido");
 else if(value!==true)missing.push(label+" não verificado");
}
function result(rejected,pending){return {status:rejected.length?"rejeitado":pending.length?"pendente":"apto",reprovacoes:rejected,pendencias:pending};}
function baseApplicant(applicant,now,days){
 const fail=[],wait=[];
 if(!applicant||applicant.identityVerified!==true){wait.push("Identidade Roblox deve ser verificada no servidor");return {fail,wait};}
 gate(fail,wait,"Idade da conta Roblox",numberOfDays(applicant.accountCreatedAt,now),AGE_ACCOUNT);
 verifiedFlag(fail,wait,"Participação no grupo oficial FAAAB",applicant.officialGroupMember);
 const gameplay=applicant.gameActivity;
 if(!gameplay||gameplay.verifiedByServer!==true||gameplay.metric!=="distinct-active-days"){
  wait.push("Histórico de dias jogados não comprovado por servidor da FAAAB");
 }else gate(fail,wait,"Participação no jogo",gameplay.distinctActiveDays,days);
 return {fail,wait};
}
function evaluateCandidacy(applicant,now=Date.now(),config={}){
 const {fail,wait}=baseApplicant(applicant,now,DAYS_CANDIDACY);
 if(applicant){
  verifiedFlag(fail,wait,"Situação civil",applicant.isCivil);
  verifiedFlag(fail,wait,"Filiação a organização fictícia aprovada",applicant.registeredPartyMember);
  verifiedFlag(fail,wait,"Aprovação da organização política no catálogo FAAAB",applicant.registeredPartyApproved);
  if(applicant.lastMilitaryExitAt){
   const cooling=config.militaryCooldownDays;
   if(!Number.isInteger(cooling)||cooling<0)wait.push("Carência após desligamento militar ainda não definida");
   else gate(fail,wait,"Carência ex-militar",numberOfDays(applicant.lastMilitaryExitAt,now),cooling);
  }else if(applicant.militaryHistoryVerified!==true){
   wait.push("Histórico de desligamento militar ainda não verificado");
  }
 }
 return result(fail,wait);
}
function evaluatePartyCreation(applicant,partyGroup,now=Date.now()){
 const {fail,wait}=baseApplicant(applicant,now,DAYS_CREATION);
 if(!partyGroup||partyGroup.dataVerified!==true){
  wait.push("Grupo político não verificado pela API Roblox");
  return result(fail,wait);
 }
 gate(fail,wait,"Idade do grupo político",numberOfDays(partyGroup.createdAt,now),AGE_PARTY_GROUP);
 verifiedFlag(fail,wait,"Permissão do solicitante para cadastrar o grupo",partyGroup.applicantCanManage);
 if(typeof partyGroup.name!=="string"||!partyGroup.name.trim())fail.push("Nome do grupo político obrigatório");
 if(!Array.isArray(partyGroup.roles)){wait.push("Cargos do grupo não recuperados via Roblox");}
 else {
  const roles=new Set(partyGroup.roles.map(r=>normalize(typeof r==="string"?r:r?.name)));
  for(const role of REQUIRED_ROLES)if(!roles.has(normalize(role)))fail.push("Falta o cargo: "+role);
 }
 // Verificar ausência de relação com conteúdo político REAL requer análise
 // de nome, descrição, símbolos, nomes históricos e qualquer referência externa.
 // Uma simples comparação de strings não é prova suficiente.
 if(partyGroup.nameModeration==="rejected")fail.push("Nome ou vínculos com entidades políticas reais");
 else if(partyGroup.nameModeration!=="approved")wait.push("Validação de ausência de referências políticas reais pendente");
 if(partyGroup.uniqueNameVerified===false)fail.push("Nome de partido já usado no catálogo");
 else if(partyGroup.uniqueNameVerified!==true)wait.push("Unicidade do nome não verificada no registro FAAAB");
 return result(fail,wait);
}
module.exports={REQUIRED_ROLES,AGE_ACCOUNT,AGE_PARTY_GROUP,DAYS_CANDIDACY,DAYS_CREATION,evaluateCandidacy,evaluatePartyCreation,normalize};
