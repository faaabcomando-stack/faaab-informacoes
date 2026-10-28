// FAAAB • Backend real de login e autorização (Cloudflare Worker + D1).
// Não use este script diretamente como arquivo público executável no GitHub Pages.
// OAuth Google/Roblox, whitelist verificável por identidade, sessão HttpOnly e proteção CSRF.
const SITE_DEFAULT="https://faaabcomando-stack.github.io/faaab-informacoes";
const API="https://api.github.com/repos/";
const ALLOWED=new Set(["noticias","autoridades","admin_whitelist","catalogo","hierarquias","cursos","sistemas","historico","geral","pm_progressao"]);
const PUBLIC_ASSETS=new Set(["admin-panel.css","admin-panel.js"]);
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
async function roleFor(user,env){
 const rbx=user.provider==="roblox"?user.subject:user.linked_roblox_id;
 if(rbx&&env.OWNER_ROBLOX_ID&&rbx===String(env.OWNER_ROBLOX_ID))return "owner";
 if(user.provider==="google"&&env.OWNER_GOOGLE_SUB&&user.subject===String(env.OWNER_GOOGLE_SUB))return "owner";
 const list=await roster(env);
 const allowed=list.membros.filter(m=>m&&typeof m==="object"&&["editor","revisor"].includes(m.perfil));
 for(const member of allowed){
  if(rbx&&member.robloxId&&String(member.robloxId)===rbx)return member.perfil;
  if(user.provider==="google"&&member.googleSub&&String(member.googleSub)===user.subject)return member.perfil;
  if(rbx&&member.robloxUsername&&!member.robloxId){
   try{const id=await pinnedRobloxId(member.robloxUsername,env);if(id===rbx)return member.perfil;}catch(e){console.warn("Não foi possível validar nick Roblox",e.message)}
  }
 }
 return null;
}
async function userContext(req,env){const session=await getSession(req,env);if(!session)return null;return {...session,role:await roleFor(session.user,env)}}
function loginPage(ctx){
 const u=ctx?.user,allowed=!!ctx?.role;
 const header='<meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>FAAAB · Acesso à administração</title>';
 const intro=u?'<p>Conectado como <strong>'+safe(u.display_name||"Usuário")+'</strong> pelo '+safe(u.provider)+'.</p>':'<p>Entre com sua conta Roblox ou Google. O acesso ao painel é liberado somente para contas aprovadas na whitelist da FAAAB.</p>';
 const buttons=allowed?'<a class="primary" href="/painel">Abrir painel administrativo</a>':'<a class="primary" href="/auth/roblox">Continuar com Roblox</a><a href="/auth/google">Continuar com Google</a>';
 const pending=u&&!allowed?'<aside>Identidade verificada. Seu acesso está <strong>aguardando aprovação</strong> da FAAAB. Informe ao responsável o seu nick verdadeiro do Roblox. O nome por si só não libera acesso.</aside>':"";
 const link=u&&u.provider==="google"&&!u.linked_roblox_id?'<a href="/link/roblox">Vincular minha conta Roblox a este Google</a>':"";
 const linked=u?.linked_roblox_id?'<small>Roblox vinculado: ID '+safe(u.linked_roblox_id)+'</small>':"";
 const logout=u?'<form action="/logout" method="post"><button type="submit">Sair</button></form>':"";
 return '<!doctype html><html lang="pt-BR"><head>'+header+'<style>body{font:15px/1.6 system-ui;background:#f4f6f2;color:#203f2d;margin:0}main{max-width:530px;background:#fff;border:1px solid #dbe5da;border-top:5px solid #ad9765;border-radius:7px;margin:11vh auto 40px;padding:32px;box-shadow:0 8px 30px #10251811}small{color:#69806c;display:block}h1{font:normal 33px Georgia,serif;margin:10px 0}a,button{display:block;text-align:center;border:1px solid #cadacb;background:#f7faf7;border-radius:5px;padding:12px 16px;margin:12px 0;color:#234d34;font-weight:750;text-decoration:none;cursor:pointer;font-size:14px}a.primary{background:#274e37;border-color:#274e37;color:white}aside{padding:15px 18px;background:#fff8e9;color:#705e37;border-left:4px solid #bba06c;margin:15px 0}form button{width:100%}p{color:#627567}footer{color:#829082;font-size:12px;text-align:center}</style></head><body><main><small>FAAAB · ADMINISTRAÇÃO</small><h1>Controle de acesso</h1>'+intro+pending+buttons+link+linked+logout+'<small>Seu login não concede permissões sozinho. A aprovação exige identidade verificada e whitelist no servidor.</small></main><footer>Projeto fictício da FAAAB no Roblox · Login oficial do provedor, sem compartilhar senhas</footer></body></html>';
}
function safe(v){return String(v??"").replace(/[&<>"']/g,c=>c==="&"?"&amp;":c==="<"?"&lt;":c===">"?"&gt;":c==='"'?"&quot;":"&#39;")}
async function githubData(name,env){
 const file=await githubFetch("dados/"+name+".json",env);
 return {content:decodeGithub(file),sha:file.sha};
}
async function apiWrite(req,env,ctx,name){
 if(!ctx?.role||ctx.role==="revisor")return jsonify({error:"Sem permissão de escrita"},403);
 if(name==="admin_whitelist"&&ctx.role!=="owner")return jsonify({error:"Whitelist só pode ser alterada pelo proprietário"},403);
 const origin=new URL(req.url).origin;
 if(!verifyInput(origin,req)||req.headers.get("x-faaab-csrf")!==ctx.csrf)return jsonify({error:"Requisição bloqueada: origem ou CSRF inválido"},403);
 const body=await req.json().catch(()=>null);
 if(!body||typeof body!=="object"||typeof body.content!=="string"||body.content.length>1000000||typeof body.sha!=="string")return jsonify({error:"Payload inválido"},400);
 let parsed;
 try{parsed=JSON.parse(body.content)}catch{return jsonify({error:"JSON inválido"},400)}
 if(Array.isArray(parsed)===false&&["noticias","autoridades","catalogo","hierarquias","cursos","sistemas","historico"].includes(name))return jsonify({error:"Esperada lista JSON"},400);
 if(name==="admin_whitelist"){
  if(!Array.isArray(parsed.membros)||parsed.proprietarioGitHub!=="faaabcomando-stack")return jsonify({error:"Formato da whitelist incorreto"},400);
  for(const m of parsed.membros){if(!["editor","revisor"].includes(m.perfil)||!/^\d{1,20}$/.test(String(m.robloxId||""))&&!/^[0-9A-Za-z_-]{1,255}$/.test(String(m.googleSub||""))&&!/^[a-zA-Z0-9_]{3,20}$/.test(String(m.robloxUsername||"")))return jsonify({error:"Whitelist exige nickname Roblox, ID Roblox ou Google sub verificado"},400)}
 }
 try{
 const current=await githubData(name,env);
 if(body.sha.replace(/^"|"$/g,"")!==current.sha)return jsonify({error:"Conflito: arquivo mudou desde que foi aberto. Recarregue para não sobrescrever outro administrador."},409);
 const result=await githubFetch("dados/"+name+".json",env,"PUT",{message:"[FAAAB painel] Atualizar "+name+".json por "+ctx.user.provider+":"+ctx.user.subject,content:encodeGithub(JSON.stringify(parsed,null,2)+"\n"),sha:current.sha});
 return jsonify({ok:true,sha:result.content?.sha,commit:result.commit?.html_url});
 }catch(e){return jsonify({error:"Falha ao publicar: "+e.message},502)}
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
   if(req.method==="GET"&&path==="/auth/google")return oauthStart(req,env,"google");
   if(req.method==="GET"&&path==="/link/roblox")return oauthStart(req,env,"roblox",true);
   if(req.method==="GET"&&path==="/callback/roblox")return oauthCallback(req,env,"roblox");
   if(req.method==="GET"&&path==="/callback/google")return oauthCallback(req,env,"google");
   if(req.method==="POST"&&path==="/logout"){
    const s=await getSession(req,env);if(s)await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await hash(s.raw)).run();
    return redirect("/",{"set-cookie":clearCookie()});
   }
   const ctx=await userContext(req,env);
   if(req.method==="GET"&&path==="/")return textResponse(loginPage(ctx),200,"text/html; charset=utf-8");
   if(req.method==="GET"&&path==="/api/me")return jsonify({loggedIn:!!ctx,user:ctx?{provider:ctx.user.provider,displayName:ctx.user.display_name,robloxId:ctx.user.provider==="roblox"?ctx.user.subject:ctx.user.linked_roblox_id}:null,role:ctx?.role||null,csrf:ctx?.role?ctx.csrf:null});
   if(!ctx?.role)return req.method==="GET"?redirect("/"):jsonify({error:"Acesso negado. Login e whitelist necessários."},403);
   if(req.method==="GET"&&path==="/painel")return fetchStatic(env,"admin-app.html","text/html; charset=utf-8");
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
