"use strict";
(()=>{
 const qs=new URLSearchParams(location.search), id=/^(1de|3de|5de)$/.test(qs.get("id")||"")?qs.get("id"):"1de";
 const logo={"1de":"FTB-1DE","3de":"FTB-3DE","5de":"FTB-5DE"};
 const copy={
  "1de":{motto:"Tropas leves, mobilidade e emprego em diferentes terrenos.",lede:"1ª Divisão de Exército",profile:"A 1ª DE reúne brigadas de infantaria leve, selva, montanha e aeromóvel. Nesta página, a divisão aparece como o comando que organiza essas brigadas — sem misturar suas unidades com as de outras divisões.",context:"No Exército FAAAB, a 1ª Divisão concentra as brigadas de emprego leve. Cada brigada mantém sua própria organização, seleção e ficha; a divisão serve como referência de comando e subordinação.",brigades:["inf-selva","inf-montanha","inf-paraquedista","inf-aeromovel"]},
  "3de":{motto:"Tropas médias, motorizadas e mecanizadas.",lede:"3ª Divisão de Exército",profile:"A 3ª DE reúne as brigadas voltadas ao deslocamento motorizado e mecanizado. O portal separa a divisão das páginas das brigadas para que a cadeia de comando fique fácil de consultar.",context:"A 3ª Divisão é a referência para as brigadas de infantaria mecanizada, cavalaria mecanizada e infantaria motorizada. O vínculo não cria uma patente nova nem libera acesso administrativo por si só.",brigades:["inf-mecanizada","cav-mecanizada","inf-motorizada"]},
  "5de":{motto:"Tropas blindadas e emprego de meios pesados.",lede:"5ª Divisão de Exército",profile:"A 5ª DE reúne as brigadas blindadas previstas na estrutura do Exército FAAAB. Seu espaço próprio apresenta as brigadas e deixa as unidades subordinadas para as páginas correspondentes.",context:"A 5ª Divisão organiza a Brigada de Infantaria Blindada e a Brigada de Cavalaria Blindada. A implantação de cargos, grupos e permissões depende das regras do jogo e não é criada apenas por esta página.",brigades:["inf-blindada","cav-blindada"]}
 }[id];
 const dataKey={"1de":"1ª DE","3de":"3ª DE","5de":"5ª DE"}[id];
 const brigadeLogos={"inf-selva":"FTB-Bda-Inf-Sl","inf-montanha":"FTB-Bda-Inf-Mth","inf-paraquedista":"FTB-BIP","inf-aeromovel":"FTB-Bda-Inf-AMV","inf-mecanizada":"FTB-Bda-Inf-Mec","cav-mecanizada":"FTB-Bda-C-Mec","inf-motorizada":"FTB-Bda-Inf-Mtz","inf-blindada":"FTB-Bda-Inf-Bld","cav-blindada":"FTB-Bda-C-Bld"};
 const $=x=>document.getElementById(x), esc=x=>String(x??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 document.body.dataset.division=id;
 $("division-logo").src=`assets/emblemas-png/${logo[id]}.png`;
 $("division-logo").alt=`Emblema da ${dataKey}`;
 $("division-name").textContent=dataKey;
 $("division-code").textContent=dataKey;
 $("division-motto").textContent=copy.motto;
 $("division-lede").textContent=copy.lede;
 $("division-profile").textContent=copy.profile;
 $("division-context").textContent=copy.context;
 $("footer-division").textContent=`${dataKey} · Exército FAAAB`;
 $("nav-brigadas").href=`brigadas.html?divisao=${id}`;
 $("all-brigades").href=`brigadas.html?divisao=${id}`;
 document.title=`${dataKey} | Exército FAAAB`;
 fetch("dados/estrutura_eb_2026.json",{cache:"no-store"}).then(r=>r.json()).then(data=>{
  const division=(data.divisoes||[]).find(x=>x.id===id);
  const list=$("brigade-list");
  if(!division){list.innerHTML='<p>Esta divisão ainda não está registrada.</p>';return}
  $("brigade-count").textContent=`${division.brigadas.length} brigadas registradas`;
  list.innerHTML=division.brigadas.map(b=>{
   const image=brigadeLogos[b.id]?`<img class="badge" src="assets/emblemas-png/${brigadeLogos[b.id]}.png" alt="">`:"";
   const units=(b.unidades||[]).length;
   const unitText=units===1?"1 unidade listada na estrutura.":units?`${units} unidades listadas na estrutura.`:"Organização registrada na estrutura da divisão.";
   return `<article class="brigade-card">${image}<span class="code">Brigada subordinada</span><h3>${esc(b.nome)}</h3><p>${unitText}</p><a href="brigadas.html?divisao=${id}&brigada=${encodeURIComponent(b.id)}">Abrir página da brigada ↗</a></article>`;
  }).join("");
 }).catch(()=>{$("brigade-list").innerHTML='<p>Não foi possível carregar as brigadas agora.</p>'});
})();
