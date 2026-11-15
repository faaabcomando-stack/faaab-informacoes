(()=>{
"use strict";
const catalog=window.FAAAB_HIERARQUIAS;if(!catalog)return;
const key=document.body.dataset.force;
const force=catalog.forcas[key];if(!force)return;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const list=document.getElementById('institution-ranks');
if(list)list.innerHTML=force.grupos.map(g=>'<section class="local-group"><h2>'+esc(g.titulo)+'</h2><div class="local-rank-list">'+g.patentes.map(n=>'<a href="patente.html?patente='+encodeURIComponent(slug(n))+'"><span>'+esc(n)+(g.previstos?.includes(n)?'<small>Cargo previsto</small>':n==='Recruta'?'<small>Sem insígnia</small>':'')+'</span><span aria-hidden="true">↗</span></a>').join('')+'</div></section>').join('');
const detail=document.getElementById('institution-rank-detail');
if(detail){
const selected=new URLSearchParams(location.search).get('patente');
const group=force.grupos.find(g=>g.patentes.some(n=>slug(n)===selected));
const n=group?.patentes.find(n=>slug(n)===selected);
if(!n){detail.innerHTML='<p>Patente não encontrada. <a href="hierarquia.html">Voltar à hierarquia</a></p>';return;}
if(group.funcoes){
  const heading=document.querySelector('main h1');
  if(heading)heading.textContent='Função de comando';
  const descricao=n.startsWith('Subcomandante')?'Auxilia o comandante e o substitui quando designado.':'Responde pela direção da força na estrutura da FAAAB.';
  detail.innerHTML='<a class="local-back" href="hierarquia.html">← Hierarquia da força</a><section class="local-box"><h2>'+esc(n)+'</h2><p>'+descricao+'</p>'+
    (group.previstos?.includes(n)?'<p>Cargo previsto na estrutura da força.</p>':'')+'</section>';
  document.title=n+' | '+force.nome;
  const state=document.createElement('p');
  state.className='local-command-holder';
  state.textContent='Consultando o cargo do grupo Roblox…';
  const box=detail.querySelector('.local-box');
  box?.append(state);
  const office=n.startsWith('Subcomandante')?'subcomandante':'comandante';
  fetch('../assets/comando/titulares.json',{cache:'no-store'})
    .then(response=>{if(!response.ok)throw Error('Sem snapshot');return response.json();})
    .then(data=>{
      const holder=data?.forcas?.[key]?.[office];
      state.replaceChildren();
      const person=holder?.estado==='titular'?holder:
        holder?.estado==='consulta_indisponivel'?holder.ultimo_confirmado:null;
      if(person&&Number.isSafeInteger(person.usuario_id)&&person.usuario_id>0){
        const link=document.createElement('a');
        link.href='https://www.roblox.com/users/'+person.usuario_id+'/profile';
        link.target='_blank';link.rel='noopener noreferrer';
        link.textContent=person.nome_usuario?'@'+person.nome_usuario:
          'Roblox #'+person.usuario_id;
        state.append(holder.estado==='titular'?'Ocupante confirmado: ':'Último ocupante confirmado (consulta indisponível): ',link);
      }else{
        const labels={vago:'Cargo vago',configuracao_pendente:'Cargo não configurado',
          aguardando_historico:'Aguardando histórico do primeiro ocupante',
          consulta_indisponivel:'Consulta indisponível'};
        state.textContent=labels[holder?.estado]||'Nenhum ocupante confirmado';
      }
    })
    .catch(()=>{state.textContent='Consulta ao Roblox ainda não disponível.';});
  return;
}
const day=catalog.diasPorPatente?.[key]?.[n],course=catalog.cursoObrigatorioPorPatente?.[key]?.[n];
const item=(label,value)=>'<dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd>';
detail.innerHTML='<a class="local-back" href="hierarquia.html">← Hierarquia da força</a><div class="local-detail"><section class="local-box"><h2>'+esc(n)+'</h2><div class="local-farda">'+(n==='Recruta'?'Recruta — sem insígnia':'Insígnia/farda não cadastrada para esta patente')+'</div><p>O acesso a uma unidade depende de seleção e formação específicas. Esta ficha não concede lotação automaticamente.</p></section><section class="local-box"><h2>CDP e formação</h2><dl>'+item('Dias registrados',day?day+' dia(s)':'Sem quantidade confirmada no catálogo atual')+item('Curso ou formação vinculada',course||'Não especificado no catálogo atual')+'</dl><p>Concluir a CDP não promove automaticamente.</p></section></div>';
document.title=n+' | '+force.nome;
}
})();
