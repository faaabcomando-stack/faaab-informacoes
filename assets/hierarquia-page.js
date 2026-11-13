/* Dados da FAAAB e páginas da hierarquia. */
(() => {
'use strict';
const data=window.FAAAB_HIERARQUIAS;
if(!data)return;
const forces=data.forcas;
const params=new URLSearchParams(location.search);
const keys=Object.keys(forces);
const current=keys.includes(params.get('forca'))?params.get('forca'):'eb';
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=k=>'hierarquia.html?forca='+encodeURIComponent(k);
const rankUrl=(k,n)=>'patente.html?forca='+encodeURIComponent(k)+'&patente='+encodeURIComponent(slug(n));
const summaries={
 'Recruta':'Inicia a formação militar e aprende os procedimentos básicos. O Recruta não possui insígnia.',
 'Soldado':'Executa atividades de equipe e tarefas atribuídas pela unidade.',
 'Soldado de Primeira Classe':'Atua em tarefas de equipe com experiência maior.',
 'Soldado de Segunda Classe':'Está na etapa inicial do serviço e aprende procedimentos de sua força.',
 'Aluno-Soldado':'Participa da formação inicial para atuar como soldado.',
 'Aprendiz-Marinheiro':'Aprende a rotina naval, a disciplina e os procedimentos iniciais.',
 'Grumete':'Cumpre a fase de formação naval supervisionada.',
 'Marinheiro':'Realiza atividades de bordo e apoio naval, conforme sua habilitação.',
 'Cabo':'Orienta pequenos grupos e apoia a execução das tarefas.',
 'Terceiro-Sargento':'Supervisiona equipes pequenas e auxilia na instrução.',
 'Segundo-Sargento':'Coordena equipes, instrução e rotinas de serviço.',
 'Primeiro-Sargento':'Supervisiona graduados e ajuda a organizar a unidade.',
 'Sargento-Mor':'Acompanha graduados na estrutura interna da FAAAB.',
 'Sargento-Mor de Comando':'Auxilia na coordenação dos graduados junto ao comando.',
 'Subtenente':'Assessora oficiais e acompanha a rotina da unidade.',
 'Suboficial':'Supervisiona graduados experientes e apoia o comando.',
 'Aluno-Oficial':'Está na fase inicial da formação para o oficialato.',
 'Cadete':'Aprende liderança e planejamento durante a formação de oficiais.',
 'Aspirante':'Está em transição entre a formação e as tarefas de oficial.',
 'Aspirante a Oficial':'Exerce funções de comando em formação e sob supervisão.',
 'Guarda-Marinha':'Exerce funções iniciais do oficialato naval.',
 'Segundo-Tenente':'Lidera equipes e seções sob acompanhamento de superiores.',
 'Primeiro-Tenente':'Coordena equipes e atividades de maior responsabilidade.',
 'Capitão':'Chefia subunidades e organiza treinamentos e serviços.',
 'Capitão-Tenente':'Exerce comando e coordenação de nível intermediário naval.',
 'Major':'Planeja e supervisiona atividades das unidades.',
 'Capitão de Corveta':'Participa da direção e do planejamento de unidades navais.',
 'Tenente-Coronel':'Coordena unidades e supervisiona oficiais.',
 'Capitão de Fragata':'Assume responsabilidades de direção e comando naval.',
 'Coronel':'Dirige unidades e acompanha o planejamento institucional.',
 'Capitão de Mar e Guerra':'Exerce funções superiores de comando naval.',
 'General em Treinamento':'Participa da etapa interna de preparação para o generalato.',
 'General de Brigada':'Coordena grandes unidades da força terrestre.',
 'General de Divisão':'Supervisiona grandes organizações e seus comandos.',
 'General de Exército':'Integra o alto comando terrestre.',
 'Brigadeiro':'Dirige organizações de grande responsabilidade da Aeronáutica.',
 'Major-Brigadeiro':'Supervisiona estruturas e comandos da Aeronáutica.',
 'Tenente-Brigadeiro do Ar':'Integra o alto comando da Aeronáutica.',
 'Contra-Almirante':'Exerce direção superior de organizações navais.',
 'Vice-Almirante':'Supervisiona grandes estruturas navais.',
 'Almirante de Esquadra':'Integra o comando superior naval.',
 'Marechal':'Patente excepcional prevista na tradição militar.',
 'Marechal do Ar':'Patente excepcional prevista na tradição da Aeronáutica.',
 'Almirante':'Patente naval excepcional, associada a condições especiais.'
};
const nav=document.getElementById('hier-forces');
if(nav){
 const f=forces[current];
 nav.innerHTML=keys.map(k=>'<a class="hier-orb'+(k===current?' is-selected':'')+'" href="'+url(k)+'" '+(k===current?'aria-current="page"':'')+'><span class="hier-orb-art"><img src="'+forces[k].imagem+'" alt=""></span><span>'+esc(forces[k].nome)+'</span></a>').join('');
 document.getElementById('hier-force-title').textContent=f.nome;
 document.getElementById('hier-force-description').textContent=f.descricao;
 document.getElementById('hier-ranks').innerHTML=f.grupos.map(g=>'<section class="hier-group"><h3>'+esc(g.titulo)+'</h3><div class="hier-rank-list">'+g.patentes.map(n=>'<a class="hier-rank-link" href="'+rankUrl(current,n)+'"><span>'+esc(n)+(n==='Recruta'?'<small>Sem insígnia</small>':'')+'</span><span class="hier-rank-arrow" aria-hidden="true">↗</span></a>').join('')+'</div></section>').join('');
 document.title='Hierarquia — '+f.nome+' | FAAAB';
}
const content=document.getElementById('rank-page-content');
if(content){
 const k=params.get('forca'),f=forces[k];
 const match=f?.grupos.flatMap(g=>g.patentes.map(n=>({nome:n,grupo:g.titulo}))).find(x=>slug(x.nome)===params.get('patente'));
 if(!match){
   content.innerHTML='<div class="rank-not-found"><h1>Patente não encontrada</h1><a href="hierarquia.html">Consultar hierarquia</a></div>';
   return;
 }
 const n=match.nome;
 const courses=data.cursoObrigatorioPorPatente[k]||{};
 const next=courses[n]||'Ainda não definido na CDP da FAAAB.';
 const optional=(data.cursosOpcionaisPorForca[k]||[]).map(x=>'<li>'+esc(x)+'</li>').join('')||'<li>A definir.</li>';
 const units=f.unidades.map(x=>'<span>'+esc(x)+'</span>').join('');
 const detail=(title,value)=>'<div class="rank-detail"><dt>'+esc(title)+'</dt><dd>'+esc(value)+'</dd></div>';
 content.innerHTML=[
 '<nav class="rank-topnav"><a href="'+url(k)+'">← Hierarquia da '+esc(f.nome)+'</a><span>'+esc(match.grupo)+'</span></nav>',
 '<div class="rank-heading"><img src="'+f.imagem+'" alt=""><div><p>'+esc(f.nome)+'</p><h1>'+esc(n)+'</h1></div></div>',
 '<div class="rank-layout">',
 '<aside class="rank-uniform"><div class="rank-uniform-image"><div class="uniform-placeholder" aria-hidden="true"></div><span>'+esc(n==='Recruta'?'Sem insígnia':'Foto da farda pendente')+'</span></div><div class="rank-uniform-caption"><strong>Farda da patente</strong><small>'+esc(n==='Recruta'?'O Recruta não utiliza insígnia.':'Fotografia ainda não cadastrada; não será substituída por uma farda inventada.')+'</small></div></aside>',
 '<div class="rank-main">',
 '<section class="rank-panel"><h2>CDP — Capacitação de Patente</h2><dl class="rank-data">'+detail('Dias mantidos na patente','A definir pela FAAAB')+detail('Próxima formação liberada pela CDP',next)+detail('Requisitos adicionais','A definir pelo comando')+'</dl><h3>Cursos opcionais e especializações</h3><ul>'+optional+'</ul><p class="rank-fineprint">A conclusão da CDP libera a próxima etapa; não promove automaticamente.</p></section>',
 '<section class="rank-panel"><h2>Informações</h2><p>'+esc(summaries[n]||'Atua em funções previstas para seu posto ou graduação na '+f.nome+'.')+'</p></section>',
 '<section class="rank-panel"><h2>Batalhões, brigadas e unidades</h2><p>O ingresso depende de seleção e qualificação; a patente, sozinha, não libera unidades.</p><div class="rank-tags">'+units+'</div><p class="rank-fineprint">Exemplos de unidades da força, não uma relação de acessos concedidos.</p></section>',
 '<section class="rank-panel"><h2>Permissões e equipamentos</h2><p>Permissões dependem do cargo, da unidade e da habilitação, e não somente da patente.</p><dl class="rank-data">'+detail('Permissões administrativas','A definir')+detail('Armas e equipamentos permitidos','A definir no regulamento do jogo')+'</dl></section>',
 '</div></div>'
 ].join('');
 document.title=n+' — '+f.nome+' | FAAAB';
}
})();