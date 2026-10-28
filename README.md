# FAAAB — Central de Informações

## Preparação específica por prova · interface 2026

A [Central FAAAB — Estudos](central.html#estudos) foi redesenhada. **A primeira escolha é sempre a prova**, não uma matéria genérica. Cada seleção reconhecida abre exclusivamente sua própria lista de disciplinas, aulas explicativas, exemplos resolvidos, questões corrigidas e revisões. O progresso é salvo no dispositivo separadamente para cada prova.

- **Programas preparatórios específicos disponíveis:** EsPCEx, ESA, AFA/CFOAV-INT-INF, EPCAR/CPCAR, EEAR/CFS, Escola Naval/CPAEN, Colégio Naval/CPACN, Aprendizes-Marinheiros/CPAEAM e Soldado Fuzileiro Naval/C-FSD-FN.
- O catálogo mantém **182 fichas individuais**, com ligação às referências reais quando existente. **165 fichas ainda não têm programa de matérias interno confirmado**: nelas o site informa a pendência e não reutiliza uma prova aleatória. Várias fichas ligadas à mesma instituição podem usar a mesma *referência externa*, mas isso não define a avaliação interna FAAAB.
- **57 questões autorais separadas por concurso**, com gabarito explicado e resultado salvo no navegador. Não são questões oficiais de exame nem substituem simulados integrais revisados.
- **104 aulas originais** em Matemática, Português, Geografia, História, Ciências, Física, Química, Inglês e Lógica. São aulas de preparação, não reprodução de provas oficiais nem garantia de equivalência de dificuldade. Alguns programas exigem conteúdos além dessas aulas; para uma preparação integral, os tópicos faltantes deverão ser produzidos e validados.
- Disciplinas exigidas como Redação, Estudos Sociais ou Ciências estão agrupadas conforme o concurso de referência, com acesso direto às respectivas aulas. A redação completa não recebe correção automática do sistema.
- O acesso **não depende do Google** para estudar; whitelist e autenticação são necessárias apenas para funções restritas e editais internos quando ativados.
- **Mobile:** novo `mobile.css` e `institucional.css` incluídos em todas as 11 páginas HTML do projeto. A central ganhou `programas.js` e o catálogo de relações específicas `dados/programas_por_prova.json`.

O conteúdo programático verdadeiro de cada curso FAAAB precisa de homologação pela coordenação. Não confundir referência de concurso militar real com patentes, CDPs ou avaliações do Roblox.


## Escola FAAAB: aulas interativas e site mobile

**[Começar a estudar dentro do site](central.html#estudos)** — a escola não depende do login Google, da whitelist ou da ativação do Firebase.

O site apresenta **104 aulas autorais** distribuídas por Matemática (30), Português (15), Geografia (12), História (9), Ciências (12), Física (7), Química (7), Inglês (7) e Raciocínio Lógico (5). A estrutura de cada aula contém:
- teoria explicada em linguagem direta, passo a passo, exemplo e resolução;
- exercício com quatro alternativas, feedback imediato e explicação da resposta;
- revisão de até dez questões diferentes da mesma matéria (amostra de aulas);
- geração repetível de contas em níveis iniciante, intermediário e avançado para soma, subtração, multiplicação, divisão, porcentagem e equações;
- histórico de aulas concluídas e desempenho salvo **localmente neste dispositivo** (não sincronizado entre celulares).

A experiência de estudo é primária na Central. Os links a acervos externos de provas são referências opcionais, **não substituem as aulas**. Os programas e CDPs da FAAAB não são modificados por estudar ou responder questões.

**Responsividade:** `mobile.css` é compartilhado por todas as páginas HTML atuais (portal, cursos, comando, hierarquia, sistemas, PM, Central e painéis); `aulas.css` oferece layout específico da Academia com seletores por toque, leitura em uma coluna e alternativas grandes. Verifique em dispositivos reais após novas alterações.

Dados de estudo: `dados/aulas_matematica.json`, `dados/aulas_linguagens_humanas.json`, `dados/aulas_ciencias_exatas.json`. Motor do estudo: `aulas.js`. A implantação Firebase continua opcional para as aulas públicas, mas necessária para whitelist, cargos e publicação de editais.


## Catálogo integral de provas e inscrições automatizadas

**[Ver todas as 182 fichas pesquisáveis da FAAAB](central.html#provas)** · **[Estudar por força e formação](central.html#estudos)**.

Foram recuperados e indexados **todos os 55 registros de cursos/formações** mais **127 unidades, centros, batalhões, brigadas, escolas e instituições** já registrados nos arquivos da FAAAB. **182 fichas não significam 182 provas públicas existentes**: o sistema mostra quando uma instituição tem acervo real, avaliação interna ou falta documentação, sem criar prova falsa.

Referências oficiais verificadas incluem EsPCEx (Vunesp), ESA/Exército, AFA, EPCAR, EEAR, CIAAR, CIGS, centros de instrução, Escola Naval, Colégio Naval, Aprendizes-Marinheiros, CIAMPA, CIAA e curso de Comandos Anfíbios do CFN. A especialização Sargento Músico não é apresentada como caminho geral de sargento. As **22 matérias e 53 tópicos iniciais** são orientações de estudo, não simulados completos homologados.

O proprietário poderá publicar editais vinculados a um dos cursos/unidades do catálogo com **datas de início/fim**, cargos autorizados e requisitos. O painel informa *agendada*, *aberta* ou *encerrada*, e o Firestore valida as inscrições no período correto **usando o horário do servidor**. Nenhuma prova nasce aberta automaticamente, nenhuma prova real externa concede graduação no jogo e nenhuma CDP é substituída.

Arquivos de referência: `dados/provas_todas_unidades.json`, `dados/provas_guias_materias.json`, `firebase/firestore.rules`. A [configuração Firebase](firebase/README.md) continua necessária para habilitar inscrição, aprovação de whitelist e publicação online.


## Central de Comunicação, Provas e Estudos — nova opção Firebase

**[Abrir a Central FAAAB](central.html)** · **[Configurar Google em passos simples](firebase/README.md)**

Esta é a alternativa ao backend Cloudflare não ativado: login com Google via Firebase Authentication, sessão persistente e whitelist no Firestore com regras restritivas. Não é necessário criar servidor Cloudflare. O projeto Firebase e as regras precisam ser configurados pelo proprietário; até lá `dados/firebase_config.json` permanece desativado e nenhum login real estará habilitado.

Canais publicados na interface: **Notícias** (menor relevância, informativa, importante, urgente), **Avisos**, **Marketing**, **Provas abertas** e **Estudos**. Os estudos permitem selecionar **tipo de prova → prova → matéria → assunto**, com referências oficiais do CFN/Marinha e exercícios de treino autorais. Provas específicas e inscrições dependem de edital aberto de forma explícita, com cargos elegíveis e fim de inscrição.

A sequência de acesso é **login Google → whitelist → atribuição manual de cargo**. Nenhuma conta recebe privilégios no login. A aprovação e os cargos ficam em documentos protegidos do Firestore. A publicação de anúncios e o acesso a materiais restritos obedecem às regras de autorização do banco. O usuário proprietário é criado uma única vez pelo console Firebase após o primeiro login.

Arquivos: `central.html`, `central.css`, `central.js`, `dados/portal_canais_estudos.json`, `dados/firebase_config.json`, `firebase/firestore.rules`, `firebase/README.md`. O antigo login `auth/` do Cloudflare é legado e não foi ativado; a nova central é o fluxo recomendado.


## Acesso, membros e cargos administrativos

O sistema de permissões segue duas etapas: **primeiro whitelist de acesso; depois atribuição manual de cargo**, nunca automática pelo login.

- `admin.html`: página pública de entrada OAuth Google/Roblox, com opção de lembrar o Google no dispositivo para facilitar futuros retornos. O Google pode pedir seleção de conta ou consentimento.
- `/membros` no Worker: área de membros com cargos e permissões; não libera edição sem cargo.
- `/anunciadores` no Worker: painel de anúncios. Jornalista, marketing e cargos administrativos autorizados podem publicar comunicados.
- `/cargos` no Worker: painel exclusivo do proprietário, com inscrições Google/Roblox, aprovação de whitelist e 11 cargos selecionáveis.
- `dados/admin_roles.json`: catálogo de cargos, sem identificação de usuários nem senhas.
- `auth/schema.sql`: D1 privado com `access_approvals` (aprovação de entrada) e `staff_assignments` (cargos manuais e respectivos escopos).
- `auth/src/worker.js`: verifica autenticação, whitelist, funções, escopo e autorização no servidor, inclusive para publicação.
- `dados/admin_whitelist.json`: aprovados por nick/ID Roblox **sem cargo automático**.

**Cargos planejados:** Administrativo leve, Administrativo aprovado, Administrativo aprovado semi-total, Jornalista, Instrutor, Governo, Alto escalão, Subcriador, Criador, Administrativo marketing total e Desenvolvedor leve. Instrutor exige curso/batalhão/alvo; Governo, cargo específico; Alto escalão, tipo e força.

**Estado:** código implementado e enviado ao repositório, mas **OAuth ainda não implantado**. `dados/auth_public.json` está `enabled: false`; os usuários não conseguem entrar com Google ou Roblox até o proprietário configurar aplicativos OAuth, Worker e banco Cloudflare. O cadastro e a atribuição reais dependem desse backend. Veja [o guia](auth/README.md).


## Novo login de administradores — Roblox ou Google

**Preparado no código, mas ainda não ativado em produção.** A página `admin.html` mostra uma entrada para Roblox/Google, mas mantém os botões ocultos até o proprietário ativar um backend OAuth real.

O backend está em [`auth/`](auth/README.md) e foi estruturado para Cloudflare Workers + D1. O login via Roblox usa o ID permanente verificado por OAuth; login Google pode vincular a conta Roblox para receber a mesma autorização. **A whitelist determina o acesso ao painel:** usuários não aprovados continuam com sessão pendente e não recebem permissão de edição. É possível eu gerenciar nomes aprovados no GitHub conectado quando você me passar os nicks, mas o OAuth precisa primeiro ser configurado nas contas do projeto.

Arquivos:
- `auth/src/worker.js` — login OAuth Roblox/Google, sessões, verificação da whitelist e publicação autenticada do conteúdo.
- `auth/schema.sql` — tabelas privadas D1 de sessões, perfis e vínculo Roblox.
- `auth/wrangler.toml.example` — configuração de exemplo sem segredos.
- `admin.html` — página pública de entrada; não expõe o painel enquanto o backend não estiver ativo.
- `admin-app.html` — interface de administração entregue pelo backend **apenas a usuários autorizados**.
- `dados/admin_whitelist.json` — lista pública de Roblox UserIds e/ou nicknames aprovados; e-mails e tokens não devem ser escritos ali.
- `dados/auth_public.json` — ativação e URL pública do servidor, atualmente desativado.

**Faltam ações explícitas do proprietário:** criar aplicativo OAuth Roblox, configurar OAuth Google, criar Worker/D1 Cloudflare, adicionar segredos do servidor e configurar URL do Worker no `auth_public.json`. Não confunda código pronto com login já operacional.


## Comando e hierarquia são categorias diferentes

- **[Comando e autoridades](comando.html)** — 26 cargos de direção: Presidência, Vice-Presidência, STF, Ministro da Defesa, secretarias, Comandante e Subcomandante das forças aprovados. Somente estes cargos podem ter um titular, foto pública Roblox e histórico de ocupantes.
- **[Hierarquia sem fotos](hierarquia.html)** — 93 postos, graduações e etapas de carreira por força, apresentados do maior para o menor. **Recruta, Soldado e Cabo não aparecem como cargos de comando nem recebem "titular".**
- `dados/autoridades.json` — dados editáveis de titulares, ex-titulares e mandatos dos cargos de direção.
- `dados/hierarquias.json` — lista ordenada de carreiras, sem dados de jogadores.
- `dados/cargos.json` — arquivo legado do planejamento; a interface pública de Comando não o utiliza.

Portal **institucional fictício** do projeto FAAAB no Roblox, hospedado no repositório público `faaabcomando-stack/faaab-informacoes`.

## Conteúdo disponível no código

- `index.html`: portal com instituições, notícias, catálogo, cursos e CDP, além de acessos separados ao Comando e à Hierarquia.
- `sistemas.html`: manual com 40 tópicos de política, mandatos, órgãos administrativos, carreira, FAC, economia, operações e tecnologia, diferenciando realidade e universo FAAAB.
- `admin.html`: painel editorial renovado com menu visual, notícias, titulares do comando, whitelist de colaboradores, comandos rápidos, editor avançado e exportação em ZIP. Não autentica nem escreve diretamente no GitHub.
- `dados/catalogo.json`: 127 registros do catálogo aprovado em 24/10/2026.
- `dados/patentes.json`: 84 registros do manual, incluindo 77 postos de carreira e 7 funções de comando legadas. As funções não são apresentadas como patentes no portal.
- `dados/hierarquias.json`: 93 patentes e graduações da FAAAB; todas reconhecidas como possuidoras de CDP.
- `dados/cursos.json`: 55 registros — cursos, qualificações, rotas formativas e propostas sinalizadas.
- `dados/autoridades.json`: 27 cargos de direção com campos de titular e histórico; patentes são registradas separadamente em `dados/hierarquias.json`.
- `dados/sistemas.json`: 40 registros de documentação por assunto.
- `dados/noticias.json`: comunicados confirmados; inicia vazio.
- `dados/historico.json`: histórico de decisões e atualizações.

**Atenção:** números de dias mínimos nas fichas CDP são propostas de balanceamento, não regras finais confirmadas. Sem nome de titular confirmado, exibir **Não definido**. Cursos de formação e instituições de ensino são registros distintos. O CFN integra a Marinha. Nem toda estrutura gera grupo Roblox individual.

## SOLUÇÃO DO ERRO 404 — ativação do GitHub Pages

A primeira execução do workflow falhou em `actions/configure-pages@v5`:

```text
Get Pages site failed: Not Found
Create Pages site failed: Resource not accessible by integration
```

Causa: o GitHub Pages ainda não tinha sido ativado e a integração não tem permissão para criá-lo na primeira publicação. **Isso não significa que os arquivos estão ausentes.**

O dono da conta precisa fazer uma única configuração:

1. Entrar em https://github.com/faaabcomando-stack/faaab-informacoes/settings/pages
2. Em **Build and deployment > Source**, escolher **GitHub Actions**.
3. Aguardar a ativação aparecer no painel. O workflow já existe em `.github/workflows/pages.yml`; não criar um segundo workflow.
4. Em **Actions**, executar manualmente o workflow **Publicar central FAAAB no GitHub Pages** (`Run workflow`) se o último tiver falhado.
5. Verificar se o job terminou com **success**, e então acessar https://faaabcomando-stack.github.io/faaab-informacoes/.

A URL acima é esperada, mas **não está comprovadamente publicada enquanto o GitHub Pages não for ativado com sucesso**.

Alternativa estática: em Settings > Pages, usar **Deploy from a branch**, branch `main`, pasta `/(root)`. Não mantenha dois modos de publicação em disputa. O workflow incluído foi preparado para GitHub Actions.

## Atualizações editoriais

Depois de implantar o OAuth, entre pelo botão Roblox ou Google no `admin.html`. A versão autorizada do painel é entregue pelo Worker em `/painel` e pode publicar via API autenticada. O ZIP continua disponível como alternativa de exportação. Nunca inclua credenciais, senhas, chaves GitHub ou tokens Roblox no repositório público.

O painel administrativo é **local e limitado**: autenticação, permissões de setores, auditoria e publicação sem GitHub exigem um backend seguro que ainda não existe.

Titulares: use `username` e `robloxId`; o navegador tentará recuperar miniatura pública de avatar no serviço Roblox. Se a consulta falhar, mostra “SEM FOTO”. O mesmo vale para ex-ocupantes. Nunca inventar usernames ou publicar informações privadas.

## Referências / escopo

Catálogo canônico aprovado em outubro de 2026 e manual remasterizado de Capacitação de Patente de setembro de 2026. Outros dados de facções, funcionamento eleitoral, duração dos mandatos, economia e implementação permanecem pendentes de documentação e decisão do projeto.

FAAAB é um **projeto independente de roleplay no Roblox**, sem relação oficial com instituições militares ou governamentais reais.

## Revisão da CDP e das patentes (27/10/2026)

- **CDP significa Capacitação de Patente**: conjunto de etapas exigidas para o jogador naquela patente, não apenas uma descrição genérica de competências.
- **Recruta / FTB**: CDP confirmada com **TC-1, Expedição Militar, Seleção de Brigada e Formação de Soldado**. Essas quatro etapas são obrigatórias.
- **Todas as patentes possuem CDP.** Há 74 fichas com critérios documentados no manual de setembro e a do Recruta confirmada diretamente (total de 75). Para os demais registros, os detalhes específicos ainda não foram recuperados; a PM possui seis passagens com etapas propostas. Isso não significa ausência da CDP.
- Os critérios do manual são exibidos como dados documentados sujeitos a atualizações, e os dias mínimos permanecem propostas até confirmação.
- **FAB**: Comodoro do Ar incluído entre Brigadeiro e Coronel na hierarquia. Comandante da FAB está na página de Comando, não na lista de patentes comuns.
- **Marinha**: Comodoro incluído entre Contra-Almirante e Capitão de Mar e Guerra na hierarquia.
- **Governo**: Governador foi excluído por decisão expressa do projeto.


## Passagens de carreira da Polícia Militar — 28/10/2026

O responsável da FAAAB definiu seis passagens de carreira:

1. Aprendiz → Soldado de Segunda Classe (Aprendiz acrescentado à hierarquia PM).
2. Cabo → Terceiro-Sargento (primeiro grau de Sargento).
3. Aspirante a Oficial → Segundo-Tenente.
4. Capitão → Major.
5. Tenente-Coronel → Coronel.
6. Coronel → Subcomandante-Geral (**nomeação para cargo de comando**, não patente nova).

Passagens confirmadas pelo responsável; **etapas de capacitação propostas e ainda não homologadas**. Foram associadas como **referências ainda não escolhidas** algumas opções do estudo Codex PMDF (CFP, CAP, CFO, CAO e CAE). O CAP não equivale automaticamente a formação de sargentos; a aplicação no jogo precisa ser aprovada. Para Subcomandante-Geral, não foi criado curso novo.

Ver `dados/pm_progressao.json` e `policia-pesquisa.html#progressao-pm`. O arquivo de pesquisa original `dados/pmdf_pesquisa_cursos_2026.json` mantém **46 cursos pesquisados, 19 opções prioritárias e zero cursos homologados/selecionados**.

## Painel administrativo restrito

A interface administrativa funcional agora está em `admin-app.html`, mas o **servidor OAuth só a entrega a usuários autorizados** em `/painel`. A página `admin.html` é a porta de entrada de login. Por enquanto, a autenticação ainda precisa ser ativada pelo proprietário seguindo [auth/README.md](auth/README.md).

Depois de autenticado e autorizado, o usuário com perfil **editor** pode editar/publicar conteúdo no GitHub através do backend; somente **owner** pode modificar a whitelist. O perfil **revisor** não publica. O servidor não concede privilégios dentro do Roblox.

