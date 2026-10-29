# FAAAB — início da integração Roblox, Discord e painel

**Estado verificado em 29/10/2026:** a implementação em `auth/src/worker.js` existe no GitHub, mas a configuração pública `dados/auth_public.json` está com `enabled: false` e `backendUrl: null`. O login não está publicado. A opção Firebase também está desativada. Não anunciar login ativo antes de testar servidor, OAuth e banco. Este guia não cria tokens nem ativa o bot.

## Não reconstruir sistemas já existentes

- Portal principal atual: `faaabadministracao-byte/faaab-site` (GitHub Pages).
- Central com protótipo de autenticação/painéis: **este repositório**, `faaabcomando-stack/faaab-informacoes`.
- Bot Discord trabalhado anteriormente no computador: projeto **EB-Security**. Integrar nele quando a pasta ou repositório for disponibilizado; não criar um segundo bot por engano.
- Ao publicar o Worker, escolher e configurar **um** endereço principal para a interface administrativa. Atualmente `SITE_DEFAULT`, `PUBLIC_SITE` e os caminhos dos arquivos editoriais apontam para `faaab-informacoes`; não copiar para `faaab-site` sem adaptar origens, rotas, callbacks e proteção CSRF.

## Ordem de preparação

1. Conferir quais grupos Roblox já são próprios e administráveis; recuperar os IDs dos grupos existentes antes de comprar duplicatas.
2. Criar os grupos prioritários de acordo com a implantação do jogo: proposta Governo, FTB, PM, FAB, FMB; depois CBM e EGAF. A lista não altera a estrutura aprovada nem substitui os grupos próprios de unidades principais.
3. Definir o proprietário principal por ID permanente Roblox. Usar contas de automação com permissão mínima, nunca senha ou cookie de usuário.
4. No Roblox Creator Dashboard, conferir a exigência **ID verificado** para registrar OAuth. Cadastrar app de **vinculação de contas** com `openid` e `profile`, URL de Termos, URL de Privacidade e callback HTTPS do Worker: `https://SEU-WORKER.workers.dev/callback/roblox`.
5. Criar Cloudflare D1 e configurar Worker seguindo `auth/README.md`, `auth/schema.sql` e `auth/wrangler.toml.example`. Chaves e secrets ficam **somente** nas configurações seguras do Worker, nunca nos JSON/HTML do GitHub Pages e nunca em conversas.
6. Testar `/health`, fluxo real `/auth/roblox`, `/callback/roblox` e `/api/me` com contas de teste; validar `state`, PKCE, cookie HttpOnly, anti-CSRF, logout e revogação.
7. Só depois habilitar o endereço do backend no cliente público, sem mostrar botão funcional antes de implantar e verificar o serviço.
8. Adaptar o **bot já existente**, usando token de bot Discord protegido, para associar Discord UserId à identidade Roblox previamente comprovada. Bot precisa da permissão `MANAGE_ROLES` e posição acima dos cargos sincronizados; nunca dar `ADMINISTRATOR` como atalho.
9. Implementar consulta de grupos e patentes via Open Cloud Groups com escopo mínimo; o mapeamento entre IDs dos grupos/roles Roblox e IDs dos cargos Discord deve ser editável pelo proprietário e ter histórico de alterações.
10. Só habilitar sincronização automática após testes de permanência/saída do grupo, promoção, rebaixamento, privilégios e retirada de cargos; respeitar limites da API.

## Fluxo correto de verificação

`Login Roblox OAuth (openid/profile) → ID Roblox (sub) autenticado → whitelist de entrada aprovada manualmente → área de membros → cargo administrativo concedido manualmente → acesso ao painel conforme atribuição`.

Um usuário entrar no grupo ou receber patente **não** significa que ganhou ferramentas de administração. A automação pode atualizar cargo **de identificação** (força, posto, unidade) no Discord, mas deve preservar as atribuições funcionais e administrativas dadas pelo proprietário. Usar ID estável Roblox, nunca nickname como prova.

Para identificar a mesma pessoa no Discord, usar OAuth de usuário com `identify` e autorização explícita, ou um vínculo seguro iniciado no servidor pelo próprio usuário. O usuário precisa estar no servidor para receber cargos. O token do bot não é igual ao token OAuth de pessoa e não deve ser compartilhado.

## Painéis existentes e permissões

O código de autenticação já prevê:

- `/membros`: para quem tem whitelist aprovada, sem privilégios de edição automáticos.
- `/anunciadores`: leitura de comunicados; publicação somente por cargo de comunicação ou administração autorizado, por exemplo **Jornalista**.
- `/painel`: edições administrativas conforme permissões.
- `/cargos`: apenas proprietário, para aprovar whitelist e atribuir/remover cargo.

As **11 funções** estão em `dados/admin_roles.json`: Administrativo leve; Administrativo aprovado; Administrativo aprovado semi-total; Jornalista; Instrutor; Governo; Alto escalão; Subcriador; Criador; Administrativo marketing total; Desenvolvedor leve. Respeitar os escopos dos cargos de Instrutor, Governo e Alto escalão já descritos no arquivo, sem atribuí-los automaticamente após OAuth.

## Infraestrutura e limites

- GitHub Pages hospeda HTML/CSS/JS estáticos. Não hospeda um bot Discord persistente, Cloudflare Worker ou banco D1.
- App OAuth Roblox requer **identificação por documento** do desenvolvedor de acordo com a documentação atual do Roblox; estimativa facial de idade não equivale necessariamente à verificação de documento.
- OAuth Roblox permite conta 13+ autorizar app; o registro/publicação do app tem exigências adicionais. Em testes privados, a documentação de registro informa limite inicial de 10 usuários únicos antes da revisão pública.
- O projeto possui um arquivo de referência `auth/README.md` que ainda descreve Google, mas a rota pública implementada no `auth/src/worker.js` atualmente é **Roblox** (`/auth/roblox` e `/callback/roblox`). Não anunciar os dois como prontos.
- Não publicar informações pessoais dos membros, listas internas de usuários, tokens OAuth, tokens Discord, senhas, cookies, client_secret nem chaves Open Cloud.

## Referências técnicas

- Roblox criação de grupos: https://create.roblox.com/docs/projects/groups
- Roblox OAuth e exigência de ID: https://create.roblox.com/docs/cloud/auth/oauth2-overview
- Roblox OAuth app: https://create.roblox.com/docs/cloud/auth/oauth2-registration
- Roblox Groups Open Cloud: https://create.roblox.com/docs/cloud/reference/features/groups
- Discord OAuth: https://discord.com/developers/docs/topics/oauth2
- Discord gestão de cargos: https://discord.com/developers/docs/platform/server-and-channel-management
