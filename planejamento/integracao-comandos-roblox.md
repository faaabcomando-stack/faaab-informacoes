# FAAAB — titulares e avatares de comando

## Implementado
- `scripts/consultar_comando.py`: código inicial encontrado no projeto Codex, conservado.
- `data/titulares.json`: grupos e papéis configurados. **EB, FAB, PM e CBM** têm IDs para comandante e subcomandante; **MB** ainda não possui os IDs dos dois papéis.
- `scripts/sincronizar_comandos.py`: consulta Open Cloud com filtro de papéis e paginação; verifica cada cargo, registra ingresso observado e escolhe o primeiro elegível quando a ordem é conhecida.
- `assets/comando/titulares.json`: gerado **durante o deploy**, nunca recebe token; usado no quadro central, nas hierarquias locais e nos detalhes de função.
- `.github/workflows/pages.yml`: no GitHub Actions, executa a verificação a cada 15 minutos e na atualização do repositório.
- `tests/test_comandos.py`: testes offline de ordem, desempate, paginação, saída, cargo vazio e indisponibilidade.

## Para ativar
1. Acessar o Roblox Creator Dashboard e criar **uma chave Open Cloud dedicada, somente leitura**, com as permissões necessárias para consultar papéis/membros nos grupos.
2. No GitHub deste repositório: **Settings → Secrets and variables → Actions → New repository secret**.
3. Nome: `ROBLOX_OPEN_CLOUD_KEY`. Valor: a **chave**, sem aspas; NÃO colocar em um arquivo do projeto.
4. Opcionalmente: `ROBLOX_GROUP_AUDIT_KEY` para consultar histórico de mudanças de cargo, se a permissão da API de auditoria estiver disponível.
5. Em GitHub Actions, disparar manualmente **Publicar template FAAAB** (`workflow_dispatch`). Examinar o log **Sincronizar comandantes do Roblox**. Não enviar o conteúdo de uma chave por chat, commit ou variável pública.

**Nunca** publicar `.secret`, `.env`, chave/cookie `.ROBLOSECURITY` ou qualquer credencial no diretório de páginas. O site é hospedado como arquivos estáticos e só lê um JSON público produzido no servidor do GitHub Actions.

## O que acontece
- Um único elegível no cargo → aparece como titular.
- Vários elegíveis → a chave de auditoria, ou um histórico de consultas anteriores, pode revelar o primeiro; sem certeza, mostra **Aguardando histórico**, sem atribuir aleatoriamente.
- Primeiro sai do cargo → na próxima consulta bem-sucedida ele deixa de ser titular. O próximo elegível é escolhido conforme a ordem conhecida.
- Cargo vazio → **Cargo vago**. A posição não mostra o ex-comandante como ocupante atual.
- API indisponível → a UI distingue **Último titular confirmado** de um titular atual; não afirma que ainda ocupa o cargo.
- Mudança de nome/visual → perfil e thumbnail atuais são consultados novamente; quando a API do Roblox retorna a mesma miniatura, é possível haver cache temporário.

## Farda e avatar: limitação atual
As referências da FAAAB em `assets/comando/*-farda.webp` **não são roupas aplicadas no Roblox**; são imagens estáticas.
A API pública de thumbnails gera o avatar conforme está vestido no Roblox. Ela NÃO aplica automaticamente a farda 5 A1, 5 A, uniforme branco etc. ao avatar de terceiro.
Para criar retratos personalizados com farda, é necessária uma segunda etapa com **ID real da camisa, calça e cobertura** de cada força, modelo Roblox Studio e serviço de renderização autorizado. Os itens pendentes estão em `data/fardas-comando.json`. Não publicar imagens montadas que sugiram ser um uniforme efetivamente vestido quando são apenas uma ilustração.

## Informações ainda necessárias
- Secret de Roblox em **Actions**, sem expor a chave.
- IDs de cargos de comandante e subcomandante do grupo MB.
- IDs de roupas/acessórios para equipar os avatares em um renderizador.

Fonte de referência: https://create.roblox.com/docs/cloud/reference/features/groups
