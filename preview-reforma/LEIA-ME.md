# FAAAB — prévia da reforma institucional (09/11/2026)

Esta pasta oferece uma **prévia não destrutiva** da nova página de entrada do portal público. Não altera o site atual, autenticação, Firebase, Cloudflare Workers, cursos, provas, patentes, grupos, bot, banco de dados ou permissões.

## O que está presente
- **Notícias importantes primeiro**, em seção diferente dos avisos gerais. Os textos deste protótipo são avisos editoriais sobre o planejamento, não notícias oficiais nem editais abertos.
- Seleção visual por símbolos geométricos 2D próprios para EB, MB, FAB, PM, CBM e Governo. Os símbolos são provisórios e podem ser substituídos por logos FAAAB aprovados, sem imitar insígnias oficiais.
- Pesquisa por sigla, nome, tipo ou seção através de `../dados/catalogo.json`, com navegação para `../ficha.html?id=...`.
- Links para páginas, escolas, cursos, carreira e comunicação **já existentes**. Nada afirma que inscrições, cursos internos ou cargos estão ativos sem confirmação.
- Layout acessível com menu móvel, navegação por teclado, contraste adequado e respeito a movimento reduzido.
- Sem scripts externos, rastreamento, anúncios ativos ou formulário de pagamento.

## Inventário e matriz de impacto inicial
| Item | Origem | Destino | Ação | Status | Dependências |
|---|---|---|---|---|---|
| Página principal | `index.html` | futura nova entrada | REWORK | apenas prévia, aguardando revisão | navegação geral |
| Layout atual | `faaab-remaster.css` e `faaab-remaster.js` | preservados | KEEP | intactos | páginas existentes |
| Catálogo | `dados/catalogo.json` | consulta dinâmica na prévia | KEEP | leitura, sem mutação | fichas/forças |
| Fichas | `ficha.html` | URLs preservadas | KEEP | intactas | IDs estáveis |
| Material de estudos | `estudos.html`, `central.html` | links diretos | KEEP | intactos | conteúdos existentes |
| Autenticação/whitelist | `auth/`, `firebase/` | não modificado | KEEP | fora do escopo | configuração externa |
| Governo/CFN/órgãos | páginas atuais | acessos existentes | KEEP | intactos | revisão futura |
| Noticiário | `central.html#noticias` | acesso por link | KEEP | intacto | publicação autorizada |
| Novos ícones | preview HTML | futura biblioteca de assets | REWORK | provisórios | logos 2D aprovados |

## Pendências antes da implantação
1. Integrar notícias importantes com a fonte de dados oficial e aplicar distinção editorial em produção.
2. Migrar o catálogo legado para a hierarquia mais recente, após a auditoria e aprovação expressa: 3 divisões e 9 brigadas no EB; C Op Esp como comando; FAB por bases/esquadrões; PARACOM e ECDA rejeitados; Internato e Instrução Básica no lugar da Expedição.
3. Revisar nomenclaturas e estado operacional de cada instituição sem inventar grupos, cargos ou benefícios.
4. Inserir apenas símbolos e marcas 2D aprovados.
5. Testar em celulares reais, validar a navegação e verificar acessibilidade e desempenho.
6. Configurar Cloudflare Pages e domínio somente após revisão.
7. Monetização: manter Contribuidor e Parceria separados; assinaturas ainda fechadas e publicidade não publicada sem contratos e verificação de políticas.

## Visualização
Após publicação de um branch de prévia pela Cloudflare, abrir `/preview-reforma/`. A integração de publicação não foi alterada; esta ramificação por si só **não publica o site**.

## Separação institucional
FAAAB é projeto independente de simulação no Roblox. Não reivindicar endosso de instituições públicas brasileiras.


## Iteração 2 — Login Roblox, grupos, painel e configurações

Implementado na ramificação de prévia, sem publicação automática.

### Interface do portal
- preview-reforma/index.html contém Entrar com Roblox e Painel no canto superior direito.
- O endereço do backend vem de dados/auth_public.json. Com enabled=true e backendUrl HTTPS válido, direciona ao Worker nos caminhos /auth/roblox e /painel-v2. Quando desativado, usa a página pública de explicações admin.html.
- A página inicial lê dados/noticias.json: somente categoria importante ou urgente fica em Notícias importantes. Notícias informativas ficam em Avisos gerais. O arquivo está vazio atualmente, por isso não inventa notícias.
- dados/portal_config.json define o título público, a descrição e eventual aviso de manutenção.

### Painel protegido
Os novos arquivos painel-v2.html, painel-v2.css e painel-v2.js compõem um painel responsivo com Visão geral, Notícias, Verificação de grupos e Configurações.

O Worker existente foi ampliado apenas no branch:
- GET /painel-v2 exige whitelist e sessão válida;
- GET /api/groups consulta grupos do usuário autenticado;
- PUT /api/data/portal_config exige proprietário, valida os campos, CSRF e versão;
- publicação de notícias usa o mesmo PUT /api/data/noticias, CSRF, SHA e permissões do backend anterior.
- Membros sem cargo não podem publicar; whitelist e cargos continuam separados.

### Grupos Roblox
Definir no Worker a variável de ambiente FAAAB_GROUP_IDS com IDs numéricos oficiais separados por vírgula.
A consulta ao Roblox é feita pelo Worker utilizando o ID de usuário confirmado no OAuth.
Se não configurado, o painel exibe não configurado. Se a API falhar, exibe indisponível.
Nunca conceder cargo, patente, whitelist ou autorização com base somente na participação em grupos.

### Implantação para começar a funcionar
1. Revisar a versão de prévia sem substituir o site principal.
2. Criar/configurar aplicação Roblox OAuth oficial, Worker Cloudflare, banco D1 e segredos OWNER_ROBLOX_ID e CLIENT_SECRET conforme auth/README.md.
3. Preencher FAAAB_GROUP_IDS apenas com IDs reais de comunidades escolhidas.
4. Configurar PUBLIC_SITE para servir os novos arquivos estáticos, disponibilizar a rota protegida no Worker e executar deploy em ambiente de teste.
5. Verificar login, retorno OAuth, cookies, whitelist, cargos, /api/groups, editor de notícias e painel de configurações.
6. Somente após testes reais, ativar dados/auth_public.json e preparar a substituição da página inicial.

### Checklist de testes
- Sem login: painel bloqueado.
- Login sem whitelist: aguardar aprovação, sem editor.
- Whitelist sem cargo: leitura limitada, sem publicação.
- Jornalista: criar notícia, sem poder sobrescrever registros antigos.
- Proprietário: alterar configurações e notícias; outras pessoas não podem alterar portal_config.
- Ausência ou falha de API Roblox: não afirmar associação.
- CSRF ausente: escrita negada. SHA desatualizado: conflito 409.
- Campos de texto não podem executar HTML injetado.
- Navegação por teclado, celular, contraste e retorno de erro testados.

### Escopo e proteção do projeto
Nenhuma patente, grupo Roblox, bot Discord, curso, jogo, banco em produção ou whitelist foi alterado nesta etapa.
O Worker atual ainda não está implantado; nada aqui significa que o login esteja disponível para usuários reais.


## Iteração 3 — portal editorial com identidade própria

### Alterações de interface
- A página `preview-reforma/index.html` foi reconstruída: **Notícias importantes aparecem primeiro**; sequência: forças, avisos gerais, anúncios identificados (se houver), catálogo e ensino.
- Novo sistema visual em `site.css` e comportamento público em `site.js`. A prévia anterior não é a implementação exibida nesta versão.
- Marca vetorial original `assets/marca-faaab.svg`, favicon próprio e seis selos vetoriais em `assets/simbolos.svg`. Os símbolos **não são emblemas oficiais** e não representam endosso institucional.
- Layout específico para Exército, Marinha/Fuzileiros, Aeronáutica, Polícia Militar, Bombeiros e Governo em `forca.html?sigla=...`, com contadores reais e filtros de categorias calculados de `../dados/catalogo.json`.
- Arquivo público `noticias.html`, página de leitura `noticia.html?item=N` e separação de notícias urgentes, importantes, avisos e publicidade.
- O editor `painel-v2.html` aceita a categoria `anuncio` e a identifica visivelmente como publicidade da comunidade. A autorização de publicação permanece no servidor e o login OAuth segue não implantado.

### Conteúdo de demonstração sem notícias inventadas
- `dados/noticias.json` permanece como fonte real e não foi preenchido com comunicados falsos.
- Para revisar o layout completo, abra `preview-reforma/index.html?demo=1` **somente depois que o branch estiver disponível em um ambiente de prévia**. Essa opção carrega `demo-noticias.json` com textos marcados como **EXEMPLO**, incluindo um anúncio fictício.
- O aviso amarelo do modo demonstrativo identifica claramente que o conteúdo não representa decisões, emergências ou publicidade real.
- O parâmetro `demo=1` acompanha os links das notícias de exemplo para abrir o detalhe correto.

### Verificação automatizada
A partir da raiz do repositório, com Node.js 18 ou superior:

```sh
node preview-reforma/verificar.mjs
```

O script checa: integridade de arquivos, links locais da prévia, IDs duplicados, sintaxe do JavaScript, prioridades editoriais, identificação de anúncios, origem dos dados e organização por áreas. **Não substitui testes no navegador**, acessibilidade manual, OAuth real, integração Roblox ou verificação do deploy.

### Próximas exigências antes de publicar
- Abrir o branch em uma URL de prévia e conferir navegador desktop/celular e resoluções intermediárias.
- Validar junto à administração os emblemas de cada unidade, sem reutilizar marcas oficiais de forma que sugira afiliação.
- Auditorar o catálogo legado antes de substituir hierarquias ou atribuir situações de funcionamento não confirmadas.
- Configurar OAuth Roblox, Worker, D1 e whitelist apenas com credenciais guardadas em ambiente seguro; testar login, CSRF, cookies e permissões.
- Aprovar conteúdos e quaisquer anúncios reais pela equipe editorial.
- **Não mesclar esta prévia com `main` até a revisão e implantação do backend.**

### Integração visual das páginas antigas
- `faaab-remaster.css` recebeu uma camada final de harmonização com cores, tipografia, navegação, botões e animações da reforma. Isso deixa as páginas existentes mais coerentes visualmente **no branch de prévia**, sem reescrever o HTML das páginas antigas nem mexer nas rotas ou scripts.
- A correção inclui contrastes separados para botões em fundos claros e para botões sobre o cabeçalho escuro. Ainda é necessário inspecionar cada página em um navegador antes de integrar essa camada à produção.

### Auditoria desta iteração
- Verificados por inspeção estática: sintaxe de `site.js` e `painel-v2.js`, caminhos dos recursos da prévia, IDs únicos, integridade de categorias de anúncio, origem separada de dados reais e de demonstração, presença das seis áreas no catálogo, e ordem de notícias na entrada.
- **10 grupos de checagens estáticas passaram** nesta revisão. O script `verificar.mjs` também está disponível para execução no Node; ainda não houve execução em navegador real nem validação visual da interface publicada.
