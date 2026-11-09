/* Node.js 18+: node preview-reforma/verificar.mjs — verificação estática, sem publicação */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
const preview=dirname(fileURLToPath(import.meta.url));
const project=resolve(preview,"..");
const read=p=>readFileSync(resolve(project,p),"utf8");
const pages=["index.html","noticias.html","noticia.html","forca.html"];
const required=["site.css","site.js","assets/marca-faaab.svg","assets/favicon.svg","assets/simbolos.svg","demo-noticias.json"];
let passed=0;
function test(label,fn){try{fn();console.log("✔",label);passed++}catch(err){console.error("✘",label,err.message);process.exitCode=1}}
test("Arquivos do portal presentes",()=>{for(const p of [...pages,...required])assert.ok(existsSync(join(preview,p)),p)});
test("HTML básico e IDs únicos",()=>{for(const p of pages){const doc=read("preview-reforma/"+p);assert.match(doc,/<html lang="pt-BR">/);assert.match(doc,/<main id="main">/);assert.match(doc,/<nav class="nav"/);assert.match(doc,/aria-expanded="false"/);const ids=[...doc.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,"ID duplicado em "+p)}});
test("Links locais da prévia têm arquivos reais",()=>{for(const p of pages){const doc=read("preview-reforma/"+p);for(const m of doc.matchAll(/\b(?:href|src)="([^"]+)"/g)){const href=m[1];if(href.startsWith("#")||href.startsWith("../")||href.startsWith("/")||href.startsWith("http"))continue;const rel=href.split(/[?#]/,1)[0];if(!rel)continue;assert.ok(existsSync(join(preview,rel)),p+" -> "+href)}}});
test("Código JavaScript é sintaticamente válido",()=>{new Function(read("preview-reforma/site.js"));new Function(read("painel-v2.js"))});
test("Identidade visual presente nas páginas",()=>{for(const p of pages){const doc=read("preview-reforma/"+p);assert.ok(doc.includes("marca-faaab.svg"),p);assert.ok(doc.includes("site.css"),p);assert.ok(doc.includes("site.js"),p);assert.ok(doc.includes("demo-banner"),p)}});
test("Notícias prioritárias antes de outras áreas",()=>{const doc=read("preview-reforma/index.html");assert.ok(doc.indexOf('id="importantes"')<doc.indexOf('id="forcas"'));assert.ok(doc.indexOf('id="importantes"')<doc.indexOf('id="avisos"'))});
test("Editor tem categoria de anúncio identificada",()=>{assert.ok(read("painel-v2.html").includes('value="anuncio"'));assert.ok(read("painel-v2.js").includes('"anuncio"'))});
test("Demonstração não publica notícias reais",()=>{const demo=JSON.parse(read("preview-reforma/demo-noticias.json"));const real=JSON.parse(read("dados/noticias.json"));assert.ok(Array.isArray(real));assert.ok(demo.length>=5);assert.ok(demo.every(x=>x.titulo.startsWith("EXEMPLO")));for(const tipo of ["importante","urgente","informativa","anuncio"])assert.ok(demo.some(x=>x.categoria===tipo))});
test("Categorias e registros das forças são reais",()=>{const data=JSON.parse(read("dados/catalogo.json"));const codes=new Set(data.map(x=>x.forca));for(const x of ["FTB","FMB","FAB","CBM","PM","ADM"])assert.ok(codes.has(x),x);assert.ok(data.length>100)});
test("Configuração do portal preserva o esquema",()=>{const c=JSON.parse(read("dados/portal_config.json"));assert.equal(c.versao,1);assert.equal(typeof c.heroTitle,"string");assert.equal(typeof c.maintenanceEnabled,"boolean")});
test("Não há scripts de terceiros na prévia",()=>{for(const p of pages)assert.doesNotMatch(read("preview-reforma/"+p),/<script[^>]+src="https?:/i)});
if(!process.exitCode)console.log("Verificação estática concluída:",passed,"testes aprovados.");
