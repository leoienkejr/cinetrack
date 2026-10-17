# Testes da Parte 1 — roteiro da ANP 06

Teste de mesa executado sobre `parte1/` no estado entregue pela
Aula 6 (antes da ordenação) e repetido após a funcionalidade nova.

**Como foi executado:** além da conferência manual no navegador, os 8 casos
do roteiro foram automatizados com jsdom (DOM real, `localStorage` real)
carregando os próprios `index.html` e `app.js` deste diretório — cada caso
clica os botões, digita nos campos e lê o card renderizado, como um usuário
faria. O `confirm()` de remoção foi substituído por um stub controlável para
testar também o caminho "cancelar".

## Rodada 1 — estado da Aula 6 (antes da ordenação)

| # | Caso | Resultado esperado | Resultado | Correção feita |
|---|------|--------------------|-----------|----------------|
| 1 | Adicionar filme válido ("Filme de Teste", 2023) | Card aparece sem recarregar; modal fecha | **Passou** — 7 cards, modal `hidden = true`, filme no `localStorage` | — |
| 2 | Enviar ano fora da faixa (1500) | Erro na interface e nada é salvo | **Passou** — lista `#erros` visível com "O ano deve ser um número inteiro entre 1888 e 2030."; storage continua com 7 filmes | — |
| 3 | Editar "Parasita" (título e nota) | Card certo muda, sem duplicar | **Passou** — modal abre em modo "Editar filme" com os dados preenchidos; 7 cards; título antigo desaparece | — |
| 4 | Remover e cancelar a confirmação | O filme continua | **Passou** — `confirm()` cancelado: 7 cards e 7 filmes no storage | — |
| 5 | Busca + filtro de status juntos | Os dois critérios combinam | **Passou** — "cidade"+Assistido → só "Cidade de Deus"; "du"+Assistido → 0 cards com mensagem `.vazio` ("Duna" é assistindo); sem busca+Assistido → 4 | — |
| 6 | Recarregar a página | A lista persiste | **Passou** — nova carga com o mesmo storage mostra os 7 filmes, incluindo a edição do caso 3 | — |
| 7 | Esc e Cancelar fecham o modal | Modal fecha nas duas interações | **Passou** — `modal.hidden = true` nos dois caminhos | — |
| 8 | Primeira visita (chave `cinetrack:filmes` limpa) | Os 6 filmes canônicos carregam | **Passou** — 6 cards com os títulos canônicos | — |

**Balanço da rodada 1: 8/8 passaram.** Nenhum dos 8 casos falhou, então não
houve correção de comportamento associada a eles.

**Correção encontrada fora dos 8 casos:** ao abrir a página, o console
imprimia `Quero assistir ★★★☆☆` — um `console.log` de exercício da aula
que sobrou no `app.js` e roda a cada carregamento. Corrigido no commit
`fix: remove console.log de teste que roda a cada carregamento`.

**Observação do caso 2:** no navegador, o `<input type="number" min max>`
bloqueia o envio com a validação nativa antes do JavaScript rodar; via
`submit` direto (como no automatizado), quem mostra o erro é a validação
em `app.js`. Nos dois caminhos o resultado é o mesmo: erro visível e nada
salvo.

## Rodada 2 — após `feat: ordenacao` (estado final)

Os 8 casos continuam passando (com uma diferença esperada: o card novo não
é mais o último da lista, porque o padrão agora é ordenar por título).
Além disso, os cenários da ordenação:

| # | Cenário | Resultado esperado | Resultado |
|---|---------|--------------------|-----------|
| O1 | Ordenar por título | `localeCompare` com locale `pt-BR`: acento ordena junto da letra base | **Passou** — "Água Viva" ficou logo após "A Origem" (sem `localeCompare`, `Á` teria code point maior que `Z` e iria para o fim) |
| O2 | Ordenar por ano | Mais recentes primeiro | **Passou** — Duna (2024), Filme de Teste (2023), Parasita (2019), … |
| O3 | Ordenar por nota | Melhores primeiro | **Passou** — notas 5, 5, 5, 4, 4, 4, 3, 2 |
| O4 | `filmes` não é mutado | O array original mantém a ordem de inserção | **Passou** — ids `1..8` na ordem original no storage, mesmo com a lista reordenada na tela |
| O5 | Ordenação + filtro + busca combinam | Ordenar não desliga os outros critérios; trocar de filtro mantém a ordem | **Passou** — Assistido ordenado por título → [A Origem, Cidade de Deus, O Auto da Compadecida, Parasita (v.e.)]; busca "cidade" refina dentro da ordenação; trocar para "Quero assistir" manteve a ordem por ano → [Interestelar, Água Viva] |

**Resultado final: 13/13 casos passaram.**

## Detalhes de implementação da ordenação

- `<select id="ordenar">` ao lado dos filtros, com as opções `titulo`,
  `ano` e `nota` (padrão: título).
- A escolha fica na variável `ordenacaoAtual` (como `statusAtual` guarda o
  filtro) e é aplicada em `atualizar()`, sobre a lista **já filtrada** —
  por isso ordenação, busca e filtro sempre combinam.
- `ordenarLista()` copia o array (`[...lista].sort(...)`) porque `sort`
  muta o array em que é chamado; `filmes` nunca é alterado.
- Ano e nota ordenam decrescente (mais recente / melhor nota primeiro).