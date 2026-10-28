# FAAAB — integração de automação política

**Estado atual:** lógica de avaliação e exemplo de coleta criados no repositório. **Não há bot ativo, formulário de inscrição ou autenticação Roblox instalada.**

## Fontes para o backend
- Identidade e idade da conta: Roblox Users API autenticada ou consulta confiável.
- Membro do grupo oficial FAAAB: Roblox Groups API.
- Filiação ao partido aprovado: cadastro verificado e vínculo com o grupo de partido.
- Criação e nome do grupo do partido: Roblox Groups API.
- Lista de cargos do grupo: Roblox Open Cloud Groups / roles.
- Dias distintos de jogo: dados **gravados pelo servidor** da experiência no DataStore; veja `roblox/RegistroDiasFAAAB.server.lua`.
- Situação civil e histórico de saída militar: grupos/patentes/histórico da FAAAB; requer verificação de mudança de patentes e carência (número ainda a definir).
- Nomes e símbolos reais: filtro de originalidade, política editorial e moderação. Uma simples comparação de texto não exclui todas as associações reais.

## Requisitos
**Eleição:** filiação a partido aprovado, grupo oficial, conta Roblox >=90 dias, 30 dias distintos jogados, situação civil, e carência ex-militar quando aplicável.

**Partido:** grupo oficial, conta >=90 dias, 60 dias distintos jogados, possuir um grupo Roblox com >=20 dias, nome obrigatório e sem vínculos com conteúdo político real. Cargos: Presidente, Vice-Presidente, Membro do Partido, Deputado Federal; adaptar a lista caso novos cargos eletivos sejam aprovados.

**Cargos eletivos atuais:** Presidente, Vice-Presidente e Deputado Federal. Quantidade de deputados e processo exato ainda não definidos.

## Aprovação segura
A rotina em `backend/avaliacao-politica.js` avalia um objeto de dados **previamente verificado no servidor** e devolve `apto`, `rejeitado` ou `pendente`. O navegador nunca executa aprovação, nem armazena segredo API. A rotina não liga o backend ou o bot automaticamente; faltam autenticação, conexão com Roblox, DataStore e persistência de pedidos.

A aprovação de partido também depende de checagens de semelhança com **entidades reais**; em casos incertos a rotina devolve `pendente` em vez de aprovar silenciosamente. A política do Roblox é aplicável inclusive a nomes e representações fictícias que reproduzam entidades reais. Consulte https://about.roblox.com/pt-br/community-standards.

## Campo em aberto
A expressão "dias no jogo" foi implementada **provisoriamente** como quantidade de **dias distintos de participação**; não como tempo total nem dias corridos desde o primeiro acesso. Confirmar antes de ativar a validação de candidatos. Também falta especificar o número de dias da carência militar.
