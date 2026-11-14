# FAAAB — execução dos itens 31–65 (14/11/2026)

Este registro distingue **implementado**, **estrutura pronta/parcial** e **pendente de dados ou testes**. As alterações de CSS e HTML no repositório não comprovam, sozinhas, resultado visual em todos os dispositivos.

## Unidades, escolas e fardas

| Item | Estado | Evidência / limite |
|---|---|---|
| 31 | Implementado no piloto | Cartões de BIS, 17º B Fron e B Log Sl; catálogo de escolas usa sigla, nome e vínculo |
| 32 | Implementado no piloto | Fichas da Brigada de Selva com retorno à brigada e unidades irmãs |
| 33 | Implementado no piloto | A Brigada de Selva vai direto às três unidades; sem segunda faixa com título |
| 34 | Implementado | /ensino/ filtra 25 instituições por força, etapa e texto |
| 35 | Implementado nas 25 escolas | Diretoria em linha compacta; descrição existente abaixo |
| 36 | Parcial | Estilo `fx-tag` para "Proposta" disponível; inserção nos demais cadastros ainda pendente |
| 37 | Pendente | Não há miniaturas de farda comum e específica confirmadas |
| 38 | Implementado | BIS, 17º B Fron e B Log Sl em /exercito/brigadas/selva/ |
| 39 | Implementado em 3 diretorias | DECEx, DEnsM e DIRENS com capa compacta; outras secretarias pendentes |
| 40 | Parcial | Links ao acervo nas fichas, ainda sem miniaturas verificadas |
| 41 | Pendente | Padronização real de botas depende de imagens do acervo |
| 42 | Estrutura pronta | Espaço frontal e lateral da cobertura no /acervo/; fotos pendentes |
| 43 | Estrutura pronta | Campo origem/documento pronto; referências pendentes |
| 44 | Implementado no piloto | Data de revisão e estado "Em revisão" na ficha de exemplo |
| 45 | Implementado | Busca por força, unidade, patente e atividade no /acervo/ |

## Publicações e navegação

| Item | Estado | Evidência / limite |
|---|---|---|
| 46 | Estrutura pronta | /publicacoes/materia.html mostra força e retorno quando houver matéria publicada |
| 47 | Estrutura pronta | Cada matéria aceita uma capa, título e legenda vinculados |
| 48 | Estrutura pronta | Tipo "Publicação" ou "Comunicado", mesma malha |
| 49 | Estrutura pronta | Data precede manchetes em cartões e listas cronológicas |
| 50 | Não implementado | Sem atalho fixo flutuante até testar sobreposição no celular |
| 51 | Parcial | Controles responsivos; teste de toque real pendente |
| 52 | Implementado no piloto | Links nomeados para unidades, brigada e organização superior |
| 53 | Implementado no piloto | Estado sem dados e dois caminhos úteis nas fichas de unidade |
| 54 | Parcial | Filtro por força em /creditos.html; conferência manual de todas as atribuições pendente |
| 55 | Parcial | Breadcrumb e retorno nos novos sites; ampliar para toda FAAAB depois |

## Acabamento, acessibilidade e consistência

| Item | Estado | Evidência / limite |
|---|---|---|
| 56 | Parcial | CSS prevê celular de 320 px; teste visual real ainda pendente |
| 57 | Parcial | `object-fit:contain` e área de brasão em escolas/diretorias; revisão óptica manual pendente |
| 58 | Implementado no novo padrão | Bordas finas, acento dourado controlado |
| 59 | Implementado no novo padrão | `:focus-visible` nos controles; auditoria das páginas antigas pendente |
| 60 | Implementado no novo padrão | Texto de estado e `aria-current`; não depende só de cor |
| 61 | Parcial | `prefers-reduced-motion` no novo padrão; transições de força antigas não reavaliadas |
| 62 | Implementado no novo padrão | Capas têm fundo sólido antes de qualquer imagem |
| 63 | Parcial | Tipografia e margens responsivas; teste de zoom 200% pendente |
| 64 | Estrutura pronta | Retrato estático de fallback no piloto; 3D não implementado |
| 65 | Implementado | /verificacao-visual/ com ficha, vaga, farda, notícia e grupo vazio |

## Etapas de entrega

1. **Provar visual — parcial:** quadro de comando responsivo em /hierarquia-piloto/ com título e retrato em preparação. Bandeira exata, avatar, farda e pose real ainda precisam de aprovação.
2. **Provar vínculo — pendente:** não há IDs de grupos/cargos confirmados. Não há consultas de titulares nem publicação automática.
3. **Cinco comandos — pendente:** aguarda validação do piloto, poses e conjuntos por força.
4. **Governo — pendente:** não atribuir titulares nem fardas civis antes da definição dos cargos e da identidade visual.
5. **Automação — pendente:** requer serviço autorizado, testes de paginação, cargos elegíveis, atualização de snapshots e geração de retratos.

## Verificações disponíveis

O workflow GitHub Pages executa `scripts/validar_piloto.py` para checar arquivos, links internos, idioma, viewport e JSON, além de `node --check` nos novos scripts. Testes de API Roblox, renderização 3D, toque, teclas, zoom, movimento reduzido, troca de cargos e comparação central/local **ainda não foram executados**. Resultado de publicação GitHub Pages não equivale a aprovação desses testes.

## Catálogo de notícias

`assets/publicacoes-data.json` começa vazio. Uma matéria só será exibida quando tiver `status: "publicado"`, ID único, data ISO, tipo `publicacao` ou `comunicado`, força (`eb`, `fab`, `mb`, `cbm`, `pm`) e título. A imagem e o crédito são opcionais juntos; nunca publicar crédito de uma foto separada da sua manchete.

## Titulares Roblox

`data/titulares.json` guarda somente **configuração pendente**, sem nomes de usuários ou tokens. Nunca inserir segredos de API em HTML ou JS público. Uma etapa futura deve consultar membros e papéis elegíveis no servidor, paginar resultados, guardar último estado validado, sinalizar indisponibilidade e não confundir dono do grupo com ocupante do cargo. A identificação e o retrato devem ser publicados juntos, após validação.
