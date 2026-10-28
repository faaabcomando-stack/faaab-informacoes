// FAAAB • Backend real de login e autorização (Cloudflare Worker + D1).
// Não use este script diretamente como arquivo público executável no GitHub Pages.
// OAuth somente Roblox, whitelist verificável por identidade, sessão HttpOnly e proteção CSRF.
const SITE_DEFAULT="https://faaabcomando-stack.github.io/faaab-informacoes";
const API="https://api.github.com/repos/";
const ALLOWED=new Set(["admin_roles","noticias","autoridades","admin_whitelist","catalogo","hierarquias","cursos","sistemas","historico","geral","pm_progressao"]);
const PUBLIC_ASSETS=new Set(["admin-panel.css","admin-roles.css","admin-panel.js"]);
const COOKIE="__Host-faaab_session";
const ONE_DAY=86400;
const now=()=>Math.floor(Date.now()/1000);
const enc=new TextEncoder();
const toBase64URL=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
const random=n=>toBase64URL(crypto.getRandomValues(new Uint8Array(n)));
async function hash(s){return toBase64URL(await crypto.subtle.digest("SHA-256",enc.encode(s)))}
const jsonify=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",...extra}});
const textResponse=(body,status=200,ctype="text/plain; charset=utf-8")=>new Response(body,{status,headers:{"content-type":ctype,"cache-control":"no-store","x-content-type-options":"nosniff"}});
const redirect=(to,headers={})=>new Response(null,{status:302,headers:{"location":to,"cache-control":"no-store",...headers}});
const site=(env)=>String(env.PUBLIC_SITE||SITE_DEFAULT).replace(/\/$/,"");
const cookies=req=>Object.fromEntries((req.headers.get("cookie")||"").split(";").map(s=>s.trim().split(/=(.*)/s).slice(0,2)).filter(x=>x.length===2));
const sessionCookie=v=>COOKIE+"="+v+"; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age="+12*3600;
const clearCookie=()=>COOKIE+"=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0";
function verifyInput(origin,req){
 const h=req.headers.get("origin");
 if(h&&h!==origin)return false;
 const fetchSite=req.headers.get("sec-fetch-site");
 if(fetchSite&&fetchSite!=="same-origin"&&fetchSite!=="none")return false;
 return req.headers.get("content-type")?.startsWith("application/json")===true
}
function requireConfig(env,provider){
 const name=provider.toUpperCase();
 if(!env.DB||!env[name+"_CLIENT_ID"]||!env[name+"_CLIENT_SECRET"])throw new Error("OAuth "+name+" ainda não configurado no servidor.");
}
async function oauthStart(req,env,provider,link=false){
 if(provider!=="roblox"||link)return textResponse("Provedor desativado",404);
 requireConfig(env,provider);
 if(!["google","roblox"].includes(provider))return textResponse("Provedor inválido",404);
 const url=new URL(req.url),origin=url.origin;
 let linkKey=null;
 if(link){
  if(provider!=="roblox")return textResponse("Vinculação deve usar Roblox",400);
  const session=await getSession(req,env);
  if(!session||session.user.provider!=="google")return redirect("/");
  linkKey=session.user.user_key;
 }
 const state=random(32),verifier=random(48),nonce=random(24),challenge=await hash(verifier);
 await env.DB.prepare("DELETE FROM oauth_states WHERE created_at < ?").bind(now()-600).run();
 await env.DB.prepare("INSERT INTO oauth_states(state,provider,verifier,nonce,link_user_key,created_at) VALUES(?,?,?,?,?,?)").bind(state,provider,verifier,nonce,linkKey,now()).run();
 const callback=origin+"/callback/"+provider;
 let auth;
 if(provider==="roblox"){
  auth=new URL("https://apis.roblox.com/oauth/v1/authorize");
  auth.searchParams.set("scope","openid profile");
 }else{
  auth=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("scope","openid profile email");
 }
 auth.searchParams.set("client_id",env[provider.toUpperCase()+"_CLIENT_ID"]);
 auth.searchParams.set("redirect_uri",callback);
 auth.searchParams.set("response_type","code");
 auth.searchParams.set("state",state);
 auth.searchParams.set("nonce",nonce);
 auth.searchParams.set("code_challenge",challenge);
 auth.searchParams.set("code_challenge_method","S256");
 return redirect(auth.toString());
}
async function exchangeCode(provider,code,row,env,origin){
 const body=new URLSearchParams({grant_type:"authorization_code",code,redirect_uri:origin+"/callback/"+provider,client_id:env[provider.toUpperCase()+"_CLIENT_ID"],client_secret:env[provider.toUpperCase()+"_CLIENT_SECRET"],code_verifier:row.verifier});
 const endpoint=provider==="roblox"?"https://apis.roblox.com/oauth/v1/token":"https://oauth2.googleapis.com/token";
 const tokenResponse=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body,redirect:"error"});
 if(!tokenResponse.ok)throw new Error("Falha na autenticação do provedor.");
 const token=await tokenResponse.json();
 if(!token.access_token)throw new Error("Token de login não recebido.");
 const endpointUser=provider==="roblox"?"https://apis.roblox.com/oauth/v1/userinfo":"https://openidconnect.googleapis.com/v1/userinfo";
 const u=await fetch(endpointUser,{headers:{"authorization":"Bearer "+token.access_token},redirect:"error"});
 if(!u.ok)throw new Error("Não foi possível verificar a identidade.");
 const profile=await u.json();
 if(typeof profile.sub!=="string"||!profile.sub||profile.sub.length>255)throw new Error("Identidade inválida");
 if(provider==="roblox"&&!/^\d+$/.test(profile.sub))throw new Error("ID Roblox inválido");
 if(provider==="google"&&profile.email_verified!==true)throw new Error("Conta Google sem e-mail verificado");
 return {provider,subject:profile.sub,name:String(profile.preferred_username||profile.name||profile.email||"Usuário").slice(0,120),email:provider==="google"?String(profile.email||"").slice(0,254):null,robloxId:provider==="roblox"?profile.sub:null};
}
async function getSession(req,env){
 const cookie=cookies(req)[COOKIE];if(!cookie||cookie.length>160)return null;
 const row=await env.DB.prepare("SELECT s.token_hash,s.csrf,s.expires_at,i.* FROM sessions s JOIN identities i ON i.user_key=s.user_key WHERE s.token_hash=?").bind(await hash(cookie)).first();
 if(!row||row.expires_at<=now())return null;
 return {user:row,csrf:row.csrf,expires_at:row.expires_at,raw:cookie};
}
async function oauthCallback(req,env,provider){
 if(provider!=="roblox")return textResponse("Provedor desativado",404);
 requireConfig(env,provider);
 const url=new URL(req.url),state=url.searchParams.get("state"),code=url.searchParams.get("code");
 if(!state||!code||state.length>160)return textResponse("Login cancelado ou incompleto.",400);
 const row=await env.DB.prepare("SELECT * FROM oauth_states WHERE state=? AND provider=?").bind(state,provider).first();
 if(!row||now()-row.created_at>600)return textResponse("Sessão de login expirada.",400);
 const deletion=await env.DB.prepare("DELETE FROM oauth_states WHERE state=? AND provider=?").bind(state,provider).run();
 if(deletion.meta?.changes!==1)return textResponse("Código de login já utilizado.",400);
 const person=await exchangeCode(provider,code,row,env,url.origin);
 if(row.link_user_key){
  if(provider!=="roblox")return textResponse("Vinculação inválida",403);
  const old=await env.DB.prepare("SELECT * FROM identities WHERE user_key=? AND provider='google'").bind(row.link_user_key).first();
  if(!old)return textResponse("Conta Google não encontrada",403);
  // Prove ownership of the Google session that requested linking: only the session associated with this flow.
  const session=await getSession(req,env);
  if(!session||session.user.user_key!==row.link_user_key)return textResponse("Vinculação não autorizada. Entre com Google novamente.",403);
  await env.DB.prepare("UPDATE identities SET linked_roblox_id=? WHERE user_key=?").bind(person.robloxId,row.link_user_key).run();
  return redirect("/");
 }
 const key=provider+":"+person.subject;
 await env.DB.prepare("INSERT INTO identities(user_key,provider,subject,display_name,email,linked_roblox_id,created_at,last_login_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_key) DO UPDATE SET display_name=excluded.display_name,email=excluded.email,last_login_at=excluded.last_login_at").bind(key,provider,person.subject,person.name,person.email,person.robloxId,now(),now()).run();
 const token=random(48),csrf=random(32);
 await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now()).run();
 await env.DB.prepare("INSERT INTO sessions(token_hash,user_key,csrf,expires_at,created_at) VALUES(?,?,?,?,?)").bind(await hash(token),key,csrf,now()+43200,now()).run();
 return redirect("/",{"set-cookie":sessionCookie(token)});
}
async function githubFetch(path,env,method="GET",body=null){
 const owner=env.GITHUB_OWNER||"faaabcomando-stack",repo=env.GITHUB_REPO||"faaab-informacoes";
 const headers={"accept":"application/vnd.github+json","user-agent":"faaab-secure-panel","x-github-api-version":"2022-11-28"};
 if(env.GITHUB_TOKEN)headers.authorization="Bearer "+env.GITHUB_TOKEN;
 if(method!=="GET")headers["content-type"]="application/json";
 const uri=API+encodeURIComponent(owner)+"/"+encodeURIComponent(repo)+"/contents/"+path;
 const r=await fetch(uri,{method,headers,body:body?JSON.stringify(body):undefined,redirect:"error",cf:{cacheTtl:0}});
 if(!r.ok){const kind=r.status===404?"Arquivo ausente":r.status===409?"Conflito de edição":"GitHub indisponível";throw new Error(kind+" ("+r.status+")")}
 return r.json();
}
function decodeGithub(obj){
 if(obj.encoding!=="base64"||typeof obj.content!=="string")throw new Error("Resposta de arquivo inválida");
 const bytes=Uint8Array.from(atob(obj.content.replace(/\s/g,"")),c=>c.charCodeAt(0));
 return new TextDecoder().decode(bytes);
}
function encodeGithub(content){
 const bytes=enc.encode(content);let output="";
 for(let n=0;n<bytes.length;n+=8192)output+=String.fromCharCode(...bytes.slice(n,n+8192));
 return btoa(output);
}
async function roster(env){
 try{
  const file=await githubFetch("dados/admin_whitelist.json",env);
  const list=JSON.parse(decodeGithub(file));
  if(!Array.isArray(list.membros))throw Error("Whitelist malformada");
  return list;
 }catch(e){console.warn("Whitelist indisponível; acesso negado:",e.message);return {membros:[]}}
}
async function resolveRobloxUsername(username){
 if(!/^[a-zA-Z0-9_]{3,20}$/.test(String(username||"")))return null;
 const r=await fetch("https://users.roblox.com/v1/usernames/users",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({usernames:[username],excludeBannedUsers:false}),redirect:"error"});
 if(!r.ok)return null;
 const body=await r.json();
 const match=(body.data||[]).find(x=>String(x.requestedUsername||"").toLowerCase()===username.toLowerCase());
 return match?String(match.id):null;
}
async function pinnedRobloxId(name,env){
 const key=String(name||"").toLowerCase();
 const existing=await env.DB.prepare("SELECT roblox_id FROM nickname_pins WHERE username_key=?").bind(key).first();
 if(existing)return String(existing.roblox_id);
 const id=await resolveRobloxUsername(name);
 if(!id)return null;
 // Ao aprovar pelo nick, a primeira identificação fica presa ao UserId Roblox.
 await env.DB.prepare("INSERT OR IGNORE INTO nickname_pins(username_key,roblox_id,first_seen_at) VALUES(?,?,?)").bind(key,id,now()).run();
 const pinned=await env.DB.prepare("SELECT roblox_id FROM nickname_pins WHERE username_key=?").bind(key).first();
 return pinned?String(pinned.roblox_id):null;
}
const STAFF_ROLES=new Set(["administrativo_leve","administrativo_aprovado","administrativo_aprovado_semitotal","jornalista","instrutor","governo","alto_escalao","sub_criador","criador","administrativo_marketing_total","desenvolvedor_leve"]);
function ownerUser(user,env){
 const id=user.provider==="roblox"?user.subject:user.linked_roblox_id;
 return !!((id&&env.OWNER_ROBLOX_ID&&id===String(env.OWNER_ROBLOX_ID))||(user.provider==="google"&&env.OWNER_GOOGLE_SUB&&user.subject===String(env.OWNER_GOOGLE_SUB)));
}
async function isApprovedUser(user,env){
 if(ownerUser(user,env))return true;
 const explicit=await env.DB.prepare("SELECT user_key FROM access_approvals WHERE user_key=?").bind(user.user_key).first();
 if(explicit)return true;
 const rbx=user.provider==="roblox"?user.subject:user.linked_roblox_id;
 const list=await roster(env);
 for(const member of list.membros||[]){
  if(rbx&&member.robloxId&&String(member.robloxId)===rbx)return true;
  if(user.provider==="google"&&member.googleSub&&member.googleSub===user.subject)return true;
  if(rbx&&member.robloxUsername&&!member.robloxId){
   try{const id=await pinnedRobloxId(member.robloxUsername,env);if(id===rbx)return true}catch(e){console.warn("Whitelist Roblox indisponível:",e.message)}
  }
 }
 return false;
}
async function staffFor(user,env){
 const rows=await env.DB.prepare("SELECT role_key,scope_json FROM staff_assignments WHERE user_key=?").bind(user.user_key).all();
 return (rows.results||[]).filter(x=>STAFF_ROLES.has(x.role_key)).map(x=>({role:x.role_key,scope:JSON.parse(x.scope_json||"{}")}));
}
function capabilities(ctx){
 const roles=ctx?.roles||[],keys=roles.map(x=>x.role);
 const has=name=>keys.includes(name)||ctx?.role==="owner";
 const broad=has("criador")||has("sub_criador");
 return {manageWhitelist:ctx?.role==="owner",manageRoles:ctx?.role==="owner",
 publishNews:broad||["jornalista","administrativo_aprovado","administrativo_aprovado_semitotal","administrativo_marketing_total"].some(has),
 publishAuthorities:broad||has("administrativo_aprovado_semitotal")||has("governo")||has("alto_escalao"),
 publishCourses:broad||has("instrutor"),publishAllContent:broad,canAnnounce:broad||["jornalista","administrativo_aprovado","administrativo_aprovado_semitotal","administrativo_marketing_total"].some(has)};
}
async function userContext(req,env){
 const session=await getSession(req,env);if(!session)return null;
 const owner=ownerUser(session.user,env);
 const approved=owner||await isApprovedUser(session.user,env);
 if(!approved)return {...session,role:null,roles:[],approved:false,permissions:{}};
 const roles=owner?[]:await staffFor(session.user,env);
 const role=owner?"owner":roles[0]?.role||"membro";
 const ctx={...session,role,roles,approved:true};ctx.permissions=capabilities(ctx);return ctx;
}
function loginPage(ctx){
 const u=ctx?.user,allowed=!!ctx?.role;
 const header='<meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>FAAAB · Acesso à administração</title>';
 const intro=u?'<p>Conectado como <strong>'+safe(u.display_name||"Usuário")+'</strong> pelo Roblox.</p>':'<p>Entre com sua conta Roblox. O acesso ao painel depende da whitelist da FAAAB.</p>';
 const buttons=allowed?'<a class="primary" href="/membros">Abrir área de membros</a>':'<a class="primary" href="/auth/roblox">Continuar com Roblox</a>';
 const pending=u&&!allowed?'<aside>Identidade verificada. Seu acesso está <strong>aguardando aprovação</strong> da FAAAB. Informe ao responsável o seu nick verdadeiro do Roblox. O nome por si só não libera acesso.</aside>':"";
 const link="";
 const linked=u?.linked_roblox_id?'<small>Roblox vinculado: ID '+safe(u.linked_roblox_id)+'</small>':"";
 const logout=u?'<form action="/logout" method="post"><button type="submit">Sair</button></form>':"";
 return '<!doctype html><html lang="pt-BR"><head>'+header+'<style>body{font:15px/1.6 system-ui;background:#f4f6f2;color:#203f2d;margin:0}main{max-width:530px;background:#fff;border:1px solid #dbe5da;border-top:5px solid #ad9765;border-radius:7px;margin:11vh auto 40px;padding:32px;box-shadow:0 8px 30px #10251811}small{color:#69806c;display:block}h1{font:normal 33px Georgia,serif;margin:10px 0}a,button{display:block;text-align:center;border:1px solid #cadacb;background:#f7faf7;border-radius:5px;padding:12px 16px;margin:12px 0;color:#234d34;font-weight:750;text-decoration:none;cursor:pointer;font-size:14px}a.primary{background:#274e37;border-color:#274e37;color:white}aside{padding:15px 18px;background:#fff8e9;color:#705e37;border-left:4px solid #bba06c;margin:15px 0}form button{width:100%}p{color:#627567}footer{color:#829082;font-size:12px;text-align:center}</style></head><body><main><small>FAAAB · ADMINISTRAÇÃO</small><h1>Controle de acesso</h1>'+intro+pending+buttons+link+linked+logout+'<small>O login Roblox e a whitelist não atribuem cargo administrativo; isso é definido separadamente pela administração.</small></main><footer>Projeto fictício da FAAAB no Roblox · Login oficial do provedor, sem compartilhar senhas</footer></body></html>';
}
function safe(v){return String(v??"").replace(/[&<>"']/g,c=>c==="&"?"&amp;":c==="<"?"&lt;":c===">"?"&gt;":c==='"'?"&quot;":"&#39;")}
async function githubData(name,env){
 const file=await githubFetch("dados/"+name+".json",env);
 return {content:decodeGithub(file),sha:file.sha};
}
function mayWrite(ctx,name){
 if(!ctx?.approved)return false;
 const p=ctx.permissions||{};
 if(name==="admin_whitelist")return !!p.manageWhitelist;
 if(p.publishAllContent)return true;
 if(name==="noticias")return !!p.publishNews;
 if(name==="autoridades")return !!p.publishAuthorities;
 if(name==="cursos")return !!p.publishCourses;
 return false;
}
function changesLimitedTo(original,updated,check){
 if(!Array.isArray(original)||!Array.isArray(updated)||original.length!==updated.length)return false;
 const before=new Map(original.map(x=>[x.id,x])),after=new Map(updated.map(x=>[x.id,x]));
 if(before.size!==original.length||after.size!==updated.length||before.size!==after.size)return false;
 for(const [id,old] of before){const newer=after.get(id);if(!newer)return false;if(JSON.stringify(old)!==JSON.stringify(newer)&&!check(old,newer))return false}
 return true;
}
function authorizeScopedWrite(ctx,name,oldData,newData){
 if(ctx.role==="owner"||ctx.permissions.publishAllContent)return true;
 const roles=ctx.roles||[];
 if(name==="autoridades"){
  if(roles.some(x=>x.role==="administrativo_aprovado_semitotal"))return true;
  return changesLimitedTo(oldData,newData,(old,updated)=>{
   if(old.id!==updated.id||old.forca!==updated.forca)return false;
   return roles.some(a=>(a.role==="governo"&&old.forca==="GOV"&&a.scope.cargoId===old.id)||
    (a.role==="alto_escalao"&&a.scope.forca===old.forca));
  });
 }
 if(name==="cursos"){
  return changesLimitedTo(oldData,newData,(old,updated)=>roles.some(a=>a.role==="instrutor"&&a.scope.tipo==="curso"&&a.scope.targetId===old.id));
 }
 if(name==="noticias"&&ctx.permissions.publishNews){
  const broad=roles.some(x=>["administrativo_aprovado","administrativo_aprovado_semitotal"].includes(x.role));
  if(broad)return true;
  // Jornalista e marketing publicam novos anúncios, mas não podem apagar/alterar os anteriores.
  if(!Array.isArray(oldData)||!Array.isArray(newData)||newData.length!==oldData.length+1)return false;
  for(let i=0;i<oldData.length;i++)if(JSON.stringify(oldData[i])!==JSON.stringify(newData[i]))return false;
  const item=newData[newData.length-1];
  return !!(item&&typeof item.titulo==="string"&&item.titulo.trim()&&item.titulo.length<=150&&typeof item.resumo==="string"&&item.resumo.trim()&&item.resumo.length<=2500&&/^\d{4}-\d{2}-\d{2}$/.test(String(item.data||"")));
 }
 return false;
}
async function apiWrite(req,env,ctx,name){
 if(!mayWrite(ctx,name))return jsonify({error:"Este cargo não permite alterar esse conteúdo."},403);
 if(name==="admin_whitelist"&&ctx.role!=="owner")return jsonify({error:"Whitelist exclusiva do proprietário"},403);
 const origin=new URL(req.url).origin;
 if(!verifyInput(origin,req)||req.headers.get("x-faaab-csrf")!==ctx.csrf)return jsonify({error:"Requisição bloqueada por origem ou CSRF"},403);
 const body=await req.json().catch(()=>null);
 if(!body||typeof body.content!=="string"||body.content.length>1000000||typeof body.sha!=="string")return jsonify({error:"Dados inválidos"},400);
 let parsed;
 try{parsed=JSON.parse(body.content)}catch{return jsonify({error:"JSON inválido"},400)}
 if(["noticias","autoridades","catalogo","hierarquias","cursos","sistemas","historico"].includes(name)&&!Array.isArray(parsed))return jsonify({error:"Esperada lista JSON"},400);
 if(name==="admin_whitelist"){
  if(!Array.isArray(parsed.membros)||parsed.proprietarioGitHub!=="faaabcomando-stack")return jsonify({error:"Whitelist inválida"},400);
  const seen=new Set();
  for(const m of parsed.membros){
   const nick=String(m.robloxUsername||"").toLowerCase(),id=String(m.robloxId||"");
   if(!((/^[a-z0-9_]{3,20}$/.test(nick))||(/^\d{1,20}$/.test(id))||(/^\d{1,50}$/.test(String(m.googleSub||"")))))return jsonify({error:"Informe nickname, ID Roblox ou Google sub válido"},400);
   if(nick){if(seen.has(nick))return jsonify({error:"Nickname duplicado"},400);seen.add(nick)}
  }
 }
 try{
  const current=await githubData(name,env);
  if(body.sha!==current.sha)return jsonify({error:"Arquivo alterado por outro administrador; recarregue antes de publicar"},409);
  const oldData=JSON.parse(current.content);
  if(!authorizeScopedWrite(ctx,name,oldData,parsed))return jsonify({error:"A alteração excede o escopo do cargo atribuído"},403);
  const result=await githubFetch("dados/"+name+".json",env,"PUT",{
   message:"[FAAAB painel] Atualizar "+name+".json por "+ctx.user.provider+":"+ctx.user.subject,
   content:encodeGithub(JSON.stringify(parsed,null,2)+"\n"),sha:current.sha
  });
  return jsonify({ok:true,sha:result.content?.sha,commit:result.commit?.html_url});
 }catch(e){return jsonify({error:"Falha de publicação: "+e.message},502)}
}
async function fetchStatic(env,path,contentType){
 const target=site(env)+"/"+path;
 const r=await fetch(target,{redirect:"error",cf:{cacheTtl:0}});
 if(!r.ok)return textResponse("Arquivo do painel ainda não publicado no GitHub Pages",502);
 return new Response(r.body,{status:200,headers:{"content-type":contentType,"cache-control":"no-store","x-content-type-options":"nosniff","content-security-policy":"default-src 'self'; img-src 'self' https://tr.rbxcdn.com https://*.rbxcdn.com data:; connect-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'","x-frame-options":"DENY","referrer-policy":"no-referrer"}});
}
export default {
 async fetch(req,env){
  try{
   const url=new URL(req.url),path=url.pathname;
   if(req.method==="GET"&&path==="/health")return jsonify({status:"ok",service:"faaab-auth",configured:!!env.DB});
   if(!env.DB)return textResponse("Backend FAAAB sem banco configurado. Veja auth/README.md.",503);
   if(req.method==="GET"&&path==="/auth/roblox")return oauthStart(req,env,"roblox");
   if(req.method==="GET"&&path==="/callback/roblox")return oauthCallback(req,env,"roblox");
   if(req.method==="POST"&&path==="/logout"){
    const s=await getSession(req,env);if(s)await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await hash(s.raw)).run();
    return redirect("/",{"set-cookie":clearCookie()});
   }
   const ctx=await userContext(req,env);
   if(req.method==="GET"&&path==="/"){if(ctx?.approved)return redirect("/membros");return textResponse(loginPage(ctx),200,"text/html; charset=utf-8");}
   if(req.method==="GET"&&path==="/api/me")return jsonify({loggedIn:!!ctx,user:ctx?{provider:ctx.user.provider,displayName:ctx.user.display_name,robloxId:ctx.user.provider==="roblox"?ctx.user.subject:ctx.user.linked_roblox_id}:null,whitelisted:!!ctx?.approved,role:ctx?.role||null,roles:ctx?.roles||[],permissions:ctx?.permissions||{},csrf:ctx?.approved?ctx.csrf:null});
   if(!ctx?.role)return req.method==="GET"?redirect("/"):jsonify({error:"Acesso negado. Login e whitelist necessários."},403);
   if(req.method==="GET"&&path==="/api/registrations"){
    if(ctx.role!=="owner")return jsonify({error:"Reservado ao proprietário"},403);
    const rows=await env.DB.prepare("SELECT i.user_key,i.provider,i.display_name,i.email,i.linked_roblox_id,i.last_login_at,a.approved_at FROM identities i LEFT JOIN access_approvals a ON a.user_key=i.user_key ORDER BY i.last_login_at DESC LIMIT 100").all();
    return jsonify({registrations:(rows.results||[]).map(x=>({...x,approved:!!x.approved_at}))});
   }
   if(req.method==="POST"&&path==="/api/grant"){
    if(ctx.role!=="owner")return jsonify({error:"Somente o proprietário aprova whitelist"},403);
    if(!verifyInput(url.origin,req)||req.headers.get("x-faaab-csrf")!==ctx.csrf)return jsonify({error:"CSRF/origem inválido"},403);
    const payload=await req.json().catch(()=>null);
    const target=String(payload?.userKey||""),action=payload?.action;
    if(!target||target.length>320||!["grant","revoke"].includes(action)||target===ctx.user.user_key)return jsonify({error:"Solicitação inválida"},400);
    const found=await env.DB.prepare("SELECT user_key FROM identities WHERE user_key=?").bind(target).first();
    if(!found)return jsonify({error:"Conta não registrada"},404);
    if(action==="grant"){
     await env.DB.prepare("INSERT INTO access_approvals(user_key,approved_at,approved_by) VALUES(?,?,?) ON CONFLICT(user_key) DO UPDATE SET approved_at=excluded.approved_at,approved_by=excluded.approved_by").bind(target,now(),ctx.user.user_key).run();
    }else{
     await env.DB.prepare("DELETE FROM access_approvals WHERE user_key=?").bind(target).run();
     await env.DB.prepare("DELETE FROM staff_assignments WHERE user_key=?").bind(target).run();
    }
    return jsonify({ok:true,action,userKey:target,notice:"A whitelist apenas libera acesso. Os cargos são atribuídos em etapa manual separada."});
   }
   if(req.method==="GET"&&path==="/api/staff"){
    if(ctx.role!=="owner")return jsonify({error:"Somente proprietário"},403);
    const rows=await env.DB.prepare("SELECT i.user_key,i.provider,i.display_name,i.email,i.linked_roblox_id,a.approved_at,s.role_key,s.scope_json FROM identities i LEFT JOIN access_approvals a ON a.user_key=i.user_key LEFT JOIN staff_assignments s ON s.user_key=i.user_key ORDER BY i.display_name ASC LIMIT 250").all();
    const people=new Map();
    for(const row of rows.results||[]){
     if(!people.has(row.user_key))people.set(row.user_key,{userKey:row.user_key,provider:row.provider,displayName:row.display_name,email:row.email,robloxId:row.linked_roblox_id,approved:!!row.approved_at,assignments:[]});
     if(row.role_key)people.get(row.user_key).assignments.push({role:row.role_key,scope:JSON.parse(row.scope_json||"{}")});
    }
    return jsonify({members:[...people.values()]});
   }
   if(req.method==="POST"&&path==="/api/staff"){
    if(ctx.role!=="owner")return jsonify({error:"Somente o proprietário atribui cargos"},403);
    if(!verifyInput(url.origin,req)||req.headers.get("x-faaab-csrf")!==ctx.csrf)return jsonify({error:"CSRF/origem inválido"},403);
    const payload=await req.json().catch(()=>null);
    const target=String(payload?.userKey||""),role=String(payload?.roleKey||"");
    const action=payload?.action,scope=payload?.scope||{};
    if(!target||target.length>320||target===ctx.user.user_key||!STAFF_ROLES.has(role)||!["assign","remove"].includes(action))return jsonify({error:"Solicitação inválida"},400);
    const found=await env.DB.prepare("SELECT * FROM identities WHERE user_key=?").bind(target).first();
    if(!found)return jsonify({error:"Conta não cadastrada no site"},404);
    const allowed=await isApprovedUser(found,env);
    if(!allowed)return jsonify({error:"Primeiro aprove o usuário na whitelist, depois atribua um cargo"},403);
    if(action==="assign"){
     const validType=["curso","batalhao","outro"];
     if(role==="instrutor"){
      if(!validType.includes(scope.tipo)||!/^[-a-zA-Z0-9_]{1,80}$/.test(String(scope.targetId||"")))return jsonify({error:"Selecione curso/batalhão e um registro válido"},400);
     }else if(role==="governo"){
      const govt=await githubData("autoridades",env);
      if(!JSON.parse(govt.content).some(x=>x.forca==="GOV"&&x.id===scope.cargoId))return jsonify({error:"Escolha um cargo do Governo existente"},400);
     }else if(role==="alto_escalao"){
      if(!["militar","civil"].includes(scope.categoria)||!["FTB","FAB","FMB","CBM","PM","GOV"].includes(scope.forca)||(scope.categoria==="civil"&&scope.forca!=="GOV")||(scope.categoria==="militar"&&scope.forca==="GOV"))return jsonify({error:"Selecione força e categoria válidas"},400);
     }else if(Object.keys(scope).length)return jsonify({error:"Este cargo não exige seleções adicionais"},400);
     await env.DB.prepare("INSERT INTO staff_assignments(user_key,role_key,scope_json,assigned_by,assigned_at) VALUES(?,?,?,?,?) ON CONFLICT(user_key,role_key) DO UPDATE SET scope_json=excluded.scope_json,assigned_by=excluded.assigned_by,assigned_at=excluded.assigned_at").bind(target,role,JSON.stringify(scope),ctx.user.user_key,now()).run();
    }else{
     await env.DB.prepare("DELETE FROM staff_assignments WHERE user_key=? AND role_key=?").bind(target,role).run();
    }
    return jsonify({ok:true,action,userKey:target,role});
   }
   if(req.method==="GET"&&path==="/painel"){if(ctx.role==="membro")return redirect("/membros");return fetchStatic(env,"admin-app.html","text/html; charset=utf-8");}
   if(req.method==="GET"&&path==="/membros")return fetchStatic(env,"membros.html","text/html; charset=utf-8");
   if(req.method==="GET"&&path==="/membros.js")return fetchStatic(env,"membros.js","application/javascript; charset=utf-8");
   if(req.method==="GET"&&path==="/cargos"){if(ctx.role!=="owner")return jsonify({error:"Cargos são atribuídos somente pelo proprietário"},403);return fetchStatic(env,"cargos.html","text/html; charset=utf-8")}
   if(req.method==="GET"&&path==="/cargos.js"){if(ctx.role!=="owner")return jsonify({error:"Acesso restrito"},403);return fetchStatic(env,"cargos.js","application/javascript; charset=utf-8")}
   if(req.method==="GET"&&path==="/anunciadores")return fetchStatic(env,"anunciadores.html","text/html; charset=utf-8");
   if(req.method==="GET"&&path==="/anunciadores.js")return fetchStatic(env,"anunciadores.js","application/javascript; charset=utf-8");
   if(req.method==="GET"&&PUBLIC_ASSETS.has(path.slice(1)))return fetchStatic(env,path.slice(1),path.endsWith(".css")?"text/css; charset=utf-8":"application/javascript; charset=utf-8");
   const dataMatch=path.match(/^\/dados\/([a-z_]+)\.json$/),apiMatch=path.match(/^\/api\/data\/([a-z_]+)$/);
   if(req.method==="GET"&&dataMatch&&ALLOWED.has(dataMatch[1])){
    const r=await githubData(dataMatch[1],env);
    return new Response(r.content,{status:200,headers:{"content-type":"application/json; charset=utf-8","etag":'"'+r.sha+'"',"cache-control":"no-store","x-content-type-options":"nosniff"}});
   }
   if(req.method==="PUT"&&apiMatch&&ALLOWED.has(apiMatch[1]))return apiWrite(req,env,ctx,apiMatch[1]);
   return jsonify({error:"Rota não encontrada"},404);
  }catch(e){console.error("auth worker error",e);return textResponse("Não foi possível concluir a solicitação. Verifique a configuração e tente novamente.",500)}
 }
};
