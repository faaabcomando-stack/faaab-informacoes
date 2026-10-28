# FAAAB — Central de Informações

## Comando e hierarquia são categorias diferentes

- **[Comando e autoridades](comando.html)** — 27 cargos de direção: Presidência, vice, STF, Ministro da Defesa, Governador, secretarias, Comandante e Subcomandante das forças aprovados. Somente estes cargos podem ter um titular, foto pública Roblox e histórico de ocupantes.
- **[Hierarquia sem fotos](hierarquia.html)** — 90 postos, graduações e etapas de carreira por força, apresentados do maior para o menor. **Recruta, Soldado e Cabo não aparecem como cargos de comando nem recebem "titular".**
- `dados/autoridades.json` — dados editáveis de titulares, ex-titulares e mandatos dos cargos de direção.
- `dados/hierarquias.json` — lista ordenada de carreiras, sem dados de jogadores.
- `dados/cargos.json` — arquivo legado do planejamento; a interface pública de Comando não o utiliza.

Portal **institucional fictício** do projeto FAAAB no Roblox, hospedado no repositório público `faaabcomando-stack/faaab-informacoes`.

## Conteúdo disponível no código

- `index.html`: portal com instituições, notícias, catálogo, cursos e CDP, além de acessos separados ao Comando e à Hierarquia.
- `sistemas.html`: manual com 40 tópicos de política, mandatos, órgãos administrativos, carreira, FAC, economia, operações e tecnologia, diferenciando realidade e universo FAAAB.
- `admin.html`: **editor local**, com formulários para notícias e ocupantes de cargos. Não autentica usuários nem escreve diretamente no GitHub.
- `dados/catalogo.json`: 127 registros do catálogo aprovado em 24/10/2026.
- `dados/patentes.json`: 82 fichas individuais de CDP de EB/FTB, FAB, FMB e CBM extraídas do manual de setembro de 2026.
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

Abra `admin.html` no site (depois de ativado), escolha um arquivo, edite os dados, valide JSON e baixe. Depois substitua o arquivo correspondente em `dados/` pelo editor de arquivos do GitHub autenticado. Nunca inclua credenciais, senhas, chaves GitHub ou tokens Roblox no repositório público.

O painel administrativo é **local e limitado**: autenticação, permissões de setores, auditoria e publicação sem GitHub exigem um backend seguro que ainda não existe.

Titulares: use `username` e `robloxId`; o navegador tentará recuperar miniatura pública de avatar no serviço Roblox. Se a consulta falhar, mostra “SEM FOTO”. O mesmo vale para ex-ocupantes. Nunca inventar usernames ou publicar informações privadas.

## Referências / escopo

Catálogo canônico aprovado em outubro de 2026 e manual remasterizado de Capacitação de Patente de setembro de 2026. Outros dados de facções, funcionamento eleitoral, duração dos mandatos, economia e implementação permanecem pendentes de documentação e decisão do projeto.

FAAAB é um **projeto independente de roleplay no Roblox**, sem relação oficial com instituições militares ou governamentais reais.
