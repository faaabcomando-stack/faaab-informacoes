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
