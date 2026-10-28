# FAAAB — Login Google simples com Firebase

## O que está pronto

Acesse [Central FAAAB](../central.html). A página foi criada para:
- **Notícias** por menor relevância, informativas, importantes e urgentes.
- **Avisos** institucionais.
- **Marketing** com publicação por cargos autorizados.
- **Provas abertas**: editais feitos pelo proprietário com data, requisitos, encerramento e cargos elegíveis.
- **Estudos**: tipo de prova → prova → matéria → assunto. Primeira referência: provas anteriores oficiais do CFN/Marinha, com exercícios de prática originais (não são questões oficiais). 
- **Google Authentication** com sessão persistente no navegador, whitelist de entrada e cargos separados manualmente.

O antigo login Cloudflare em `auth/` NÃO está implantado e não é necessário para a nova opção Firebase. O link `admin.html` agora direciona para `central.html`.

## Configure uma vez, pelo console Firebase

**Você não precisa criar Cloudflare, servidor nem Client Secret do Google.** Não compartilhe senha, token nem credencial secreta.

1. Entre no **[Console Firebase](https://console.firebase.google.com/)** e crie um projeto (ex.: `faaab-site`). Cadastre um **aplicativo Web** clicando em `</>` e copie o objeto público `firebaseConfig`.
2. Abra **Build → Authentication → Get Started → Sign-in method → Google**, ative e indique um e-mail de suporte. Em **Authentication → Settings → Authorized domains**, adicione `faaabcomando-stack.github.io` (sem `https://`, sem caminho).
3. Abra **Build → Firestore Database → Create database**, escolha a região e **modo de produção** (não deixar aberto). Na aba **Rules**, substitua as regras pelo conteúdo de [`firebase/firestore.rules`](firestore.rules) e clique em **Publish**. A segurança de login, whitelist e cargos depende das regras publicadas; sem elas os formulários não devem ser usados.
4. Edite [`dados/firebase_config.json`](../dados/firebase_config.json) no GitHub do projeto (o mesmo que hospeda o site), copiando **exatamente** os valores do `firebaseConfig` da sua aplicação e definindo `enabled: true`. Exemplo de FORMATO (não é configuração funcional):
   ```json
   {
     "enabled": true,
     "app": {
       "apiKey": "VALOR_PUBLICO_FIREBASE",
       "authDomain": "SEU-PROJETO.firebaseapp.com",
       "projectId": "SEU-PROJETO",
       "appId": "1:NUMERO:web:APP_ID",
       "messagingSenderId": "NUMERO_PUBLICO"
     }
   }
   ```
   As opções Firebase do app web identificam o projeto e **não são uma senha**. A proteção dos dados vem das regras Firestore.
5. Depois que o GitHub Pages publicar o JSON, abra [`central.html`](../central.html), clique em **Entrar com Google** e escolha sua conta. O Firebase criará uma identidade e um documento `users/{UID}` **pendente de whitelist**.
6. Para habilitar **o primeiro proprietário**, abra **Firebase Console → Authentication → Users**, copie o **UID exato** da sua conta (não o e-mail). Depois abra **Firestore Database → Data → users → seu UID** e edite SOMENTE os campos:
   - `approved`: `true` (boolean)
   - `owner`: `true` (boolean)
   - `roles`: `[]` (array vazia)
   Não modifique o UID nem dê `owner: true` a outras contas. Essa é uma ação inicial privilegiada, feita somente no console por você.
7. Reabra a Central da FAAAB. A aba **Administração** aparecerá para o proprietário. De lá:
   - Primeiro clique em **Aprovar whitelist** para o membro que entrou com Google.
   - Em outra seção, escolha o membro **já aprovado**, atribua manualmente um cargo e, se necessário, curso, batalhão, Governo ou força.
   - Só então a pessoa poderá publicar conforme o cargo.

O estado de login é mantido no navegador pela opção de persistência local do Firebase, até a pessoa sair ou o navegador limpar os dados. Não é possível garantir entrada totalmente silenciosa quando o Google precisa solicitar consentimento, escolher conta ou verificar a sessão.

## Regras fundamentais

- **Entrar com Google NÃO autoriza o painel.** O novo usuário só pode cadastrar o próprio documento com `approved: false`, `owner: false` e `roles: []`.
- **Whitelist NÃO é cargo.** Aprovação apenas libera a área de membros e certas inscrições.
- **Cargo é manual.** Somente proprietário pode atualizar documentos de outros membros.
- **Prova NÃO abre automaticamente** por existir um curso, CDP ou concurso real. Somente o proprietário publica um edital FAAAB com requisitos e data futura.
- **Inscrição em prova** só é aceita para usuário aprovado, dentro do prazo e, quando definidos, com os cargos elegíveis; as regras são verificadas no Firestore.
- **Material complementar de estudo** pode ser público, restrito à whitelist ou a cargos específicos. Material restrito não deve ser colocado em JSON público.
- **Notícias e marketing** só podem ser publicados por funções explicitamente autorizadas em `firestore.rules`. Os canais e a hierarquia originais da FAAAB não são modificados automaticamente.

## Material real de referência

- [Marinha — provas anteriores do CFN](https://www.marinha.mil.br/cpesfn/provas-anteriores)
- [Marinha — concursos CFN e editais](https://www.marinha.mil.br/cpesfn/concursoscfn)
- [Marinha — provas anteriores de Sargento Músico](https://www.marinha.mil.br/cpesfn/provas-anteriores-c-fsg-mu-cfn)

No edital C-FSD-FN para turmas de 2027, a prova escrita é composta por **50 questões**, 25 de Língua Portuguesa e 25 de Matemática, com **cinco alternativas**. É uma referência real de formato e dificuldade. Os exercícios curtos iniciais da FAAAB são autorais e de demonstração; **não são equivalentes a uma prova inteira nem provas oficiais**. A elaboração dos simulados completos ainda exigirá seleção de edital, programa e validação.

## Verificação antes de usar em produção

Teste com duas contas Google diferentes: uma proprietária, outra pendente. A segunda deve poder entrar sem acessar a aba Administração nem atribuir cargo; só a primeira pode aprovar whitelist e depois atribuir cargo. Teste acesso negado a posts, materiais e provas restritas pela conta pendente. Teste revogar a whitelist e confirmar que o usuário perde privilégios. Ative limites/monitoramento de uso do Firebase conforme o plano.

Documentação oficial: [Firebase Google Sign-in](https://firebase.google.com/docs/auth/web/google-signin), [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started) e [persistência de login](https://firebase.google.com/docs/auth/web/auth-state-persistence).

**Status nesta entrega:** interface e regras preparadas no GitHub. `dados/firebase_config.json` permanece desativado até você criar o projeto e configurar a conta. O login NÃO foi testado em um Firebase real, pois não há projeto ou credenciais conectados.
