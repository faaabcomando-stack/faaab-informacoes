# FAAAB — Login real com Roblox ou Google + whitelist

Esta pasta contém uma implementação de **autenticação OAuth 2.0 com PKCE**, sesssões HTTP-only e validação de whitelist no servidor, pensada para a Central da FAAAB.

**Status atual:** o código está versionado no GitHub; o backend **não está implantado**, porque é necessário que o proprietário cadastre os aplicativos OAuth, crie o D1 e guarde as credenciais na Cloudflare. Nenhum token ou senha deve ser colocado no GitHub nem enviado ao ChatGPT.

## Resultado após ativar

1. O visitante abre `admin.html` no GitHub Pages.
2. Escolhe **Entrar com Roblox** ou **Entrar com Google**. O login verdadeiro acontece no site oficial do provedor.
3. O Worker verifica a identidade (Google `sub` e `email_verified`, ou Roblox `userinfo.sub` / ID permanente).
4. Se não estiver aprovado, recebe status **aguardando whitelist**.
5. O proprietário adiciona o **nickname verdadeiro do Roblox** em `dados/admin_whitelist.json`. O backend confere e fixa o ID Roblox ao autenticar; o nome sozinho nunca é tratado como prova de identidade. Quando o usuário entra com Google, pode **vincular sua conta Roblox** com outro login OAuth; assim recebe a mesma aprovação pelo ID Roblox. Há também a opção técnica de whitelist direta por Google `sub`, mas nunca exponha o e-mail de ninguém no repositório.
6. Somente quem tem perfil **editor** ou **owner** recebe o painel de edição. O perfil **revisor** pode consultar, mas não publicar. A whitelist só pode ser modificada por **owner**.
7. Edições vão ao GitHub pelo Worker, que guarda o token como segredo, valida cookies, CSRF, sessão, permissão e a versão do arquivo para impedir substituição acidental de outro editor.

**Importante:** os dados públicos do portal (notícias, catálogo, CDP etc.) continuam visíveis; o que é restrito são a interface administrativa funcional e as operações de gravação. O código HTML/JS pode ser público sem representar um sistema de autorização; a segurança está exclusivamente no servidor.

## Configuração inicial

É necessário ter uma conta [Cloudflare](https://dash.cloudflare.com/), uma aplicação OAuth Roblox, uma aplicação OAuth Google e autorização sobre o repositório `faaabcomando-stack/faaab-informacoes`.

### 1. Criar o banco e Worker

No computador com Node.js e terminal:

```bash
git clone https://github.com/faaabcomando-stack/faaab-informacoes.git
cd faaab-informacoes/auth
cp wrangler.toml.example wrangler.toml
npx wrangler login
npx wrangler d1 create faaab-auth
```

Copie o `database_id` informado para `wrangler.toml`, substituindo `SUBSTITUIR_POR_ID_REAL_DO_D1`.

Crie as tabelas privadas:

```bash
npx wrangler d1 execute faaab-auth --remote --file=./schema.sql
```

O D1 armazena sessões, contas que fizeram login, vínculos com Roblox e nicknames fixados a UserIds; **não é banco público do GitHub Pages**. Não execute um `d1 execute` remoto sem antes revisar o arquivo SQL.

### 2. Criar o aplicativo de login Roblox

No [Creator Dashboard](https://create.roblox.com/dashboard/credentials), registre um aplicativo OAuth da FAAAB. Habilite **openid** e **profile**. Registre exatamente esta URL de retorno, substituindo pelo domínio real do Worker:

```
https://SEU-WORKER.workers.dev/callback/roblox
```

A API oficial usada é `https://apis.roblox.com/oauth/v1/authorize` e `/v1/token`, seguida de `/v1/userinfo`; a identificação estável é o `sub` numérico. A configuração e eventuais revisões do app dependem das políticas Roblox. Não solicite senha ou cookie Roblox dos usuários.

### 3. Criar login Google

No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configure tela de consentimento OAuth e credenciais de aplicativo web. Registre exatamente a URL de retorno do Worker:

```
https://SEU-WORKER.workers.dev/callback/google
```

Scopes: `openid profile email`. O Worker consulta `https://openidconnect.googleapis.com/v1/userinfo` após receber um token por meio do fluxo OAuth e exige `email_verified = true`.

O login com Google pode começar sem um nick Roblox associado; o usuário pode vincular o Roblox na tela de acesso pendente, provando a posse das duas contas.

### 4. Guardar credenciais como segredos

Em `faaab-informacoes/auth`, configure cada valor **somente no servidor**, usando o comando e inserindo-o no terminal quando solicitado:

```bash
npx wrangler secret put ROBLOX_CLIENT_ID
npx wrangler secret put ROBLOX_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put OWNER_ROBLOX_ID
```

- `OWNER_ROBLOX_ID` é o **ID numérico da conta Roblox do proprietário**. Verifique-o na URL pública do perfil Roblox, não utilize apelido mutável. Este é o primeiro acesso `owner`. Alternativamente, configure `OWNER_GOOGLE_SUB` **somente** depois de descobrir o `sub` verificado de sua conta Google, pela tabela privada `identities` no D1 após o primeiro login.
- `GITHUB_TOKEN`: **fine-grained personal access token**, restrito exclusivamente ao repositório `faaabcomando-stack/faaab-informacoes`, com permissão **Contents: Read and write**. Não use tokens de outras pessoas e não exponha esse valor no front-end.
- Apenas o proprietário configura/rotaciona esses valores.

**Recomendação:** não dê permissão de escrita a qualquer pessoa até ter testado a conta de proprietário, uma conta pendente e uma conta aprovada.

### 5. Publicar o Worker e ativar botões de login

```bash
npx wrangler deploy
```

A Cloudflare informará a URL HTTPS do Worker. Confira a rota `/health`, abra `/auth/roblox` e `/auth/google` para testar os fluxos e os callbacks.

Depois, edite **somente** `dados/auth_public.json` no GitHub:

```json
{
  "enabled": true,
  "backendUrl": "https://DOMINIO-REAL-DO-WORKER.workers.dev",
  "provider": "Cloudflare Workers OAuth",
  "status": "ativo"
}
```

Essa configuração é pública e contém **somente a URL do servidor**, não credenciais. Só habilite após testes reais de login, whitelist e publicação. O `admin.html` público libera os botões Roblox/Google quando `enabled=true`.

### 6. Dar whitelist usando nick

Envie ao ChatGPT:

**“Adicione o Roblox `NickExato` como editor no painel FAAAB.”**

Com sua autorização, o assistente pode editar `dados/admin_whitelist.json` no GitHub conectado. O registro poderá ter:

```json
{
  "robloxUsername": "NickExato",
  "robloxId": null,
  "perfil": "editor",
  "observacao": "Aprovado pelo proprietário"
}
```

Na primeira entrada, o Worker consulta a API oficial `users.roblox.com/v1/usernames/users` para identificar o ID atual e o fixa no D1 (`nickname_pins`). Se você fornecer o ID público ou o link do perfil também, o registro pode ser preenchido diretamente com o ID estável.

Revogar: remova o membro da whitelist. A autorização é reavaliada pelo Worker **a cada operação**. Uma sessão aberta perde permissões quando a whitelist muda; nenhuma revogação de login depende apenas de ocultar um botão no navegador.

### 7. Permissões e limitações

- **owner:** entra no painel, publica e altera a whitelist.
- **editor:** entra e publica notícias, titulares e outros dados autorizados, mas o servidor bloqueia modificações à whitelist.
- **revisor:** entra para consulta, sem publicação.
- **sem whitelist:** pode registrar/login, mas recebe “aguardando aprovação”, sem o painel de edição.

Um administrador do painel **não** ganha acesso automático ao GitHub nem comandos no jogo Roblox; essas permissões são independentes. O botão de publicação usa um token protegido no backend para o escopo exato do repositório.

O Worker bloqueia requisições externas para operações de escrita, usa cookies `Secure`, `HttpOnly`, `SameSite=Lax`, proteção CSRF, OAuth `state` e PKCE, e compara SHA para evitar sobrescrita de edições concorrentes. **Antes de produção com muitos editores, faça revisão de segurança e teste de ponta a ponta de OAuth e permissões.** Nenhuma implementação de autenticação deve ser considerada aprovada sem esse teste.

Se alguém entrar com Google e depois vincular Roblox, isso comprova os dois logins. Para impedir vinculações indevidas, o Worker exige a sessão Google ativa na etapa de retorno OAuth Roblox.

## Fontes técnicas

- Roblox OAuth: https://create.roblox.com/docs/cloud/auth/oauth2-reference
- Roblox cadastro de aplicativo: https://create.roblox.com/docs/cloud/auth/oauth2-registration
- Google OpenID Connect: https://developers.google.com/identity/openid-connect/openid-connect
- Cloudflare D1/Wrangler: https://developers.cloudflare.com/d1/get-started/

> Nunca adicione `auth/wrangler.toml` (configuração real da conta), `.dev.vars`, segredos, senhas ou tokens ao repositório público.
