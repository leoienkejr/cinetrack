// Aula 1 — funções que todo card usa (da Parte 1 ao React)

// 2. Rótulo do badge a partir do status interno.
//    Pura: recebe um valor e devolve outro, sem tocar no DOM.
function rotuloStatus(status) {
    if (status === "assistido") {
        return "Assistido"
    }
    if (status === "assistindo") {
        return "Assistindo"
    }
    if (status === "quero") {
        return "Quero assistir"
    }
    return status // outro valor volta como veio
}

// 3. String de 5 estrelas: cheia (★) se i <= nota, vazia (☆) caso contrário.
//    Arrow function + um for de 1 a 5 acumulando + ternário. Pura também.
const estrelas = (nota) => {
    let texto = ""
    for (let i = 1; i <= 5; i++) {
        texto += i <= nota ? "★" : "☆"
    }
    return texto
}

// 4. Teste no console das duas funções puras:
//    esperado: "Quero assistir ★★★☆☆"
console.log(rotuloStatus("quero"), estrelas(3))

// 5. Reescreve o badge e a nota do primeiro card.
//    O status vem da segunda classe do badge; a nota, do aria-label.
const primeiroCard = document.querySelector(".card")
const badgePrimeiro = primeiroCard.querySelector(".badge")
const statusPrimeiro = badgePrimeiro.classList[1]
badgePrimeiro.textContent = rotuloStatus(statusPrimeiro)

const notaPrimeiro = parseInt(
    primeiroCard.querySelector(".estrelas").getAttribute("aria-label").match(/Nota (\d+)/)[1],
    10
)
primeiroCard.querySelector(".estrelas").textContent = estrelas(notaPrimeiro)

// 7. (pesquisa: seleção no DOM) Aplica as funções aos 6 cards
//    com querySelectorAll e for...of. Na Aula 2, renderizarCards
//    fará isso a partir dos dados, sem HTML repetido à mão.
const cards = document.querySelectorAll(".card")

for (const card of cards) {
    const badge = card.querySelector(".badge")
    const estrelasCard = card.querySelector(".estrelas")

    const status = badge.classList[1]
    const nota = parseInt(estrelasCard.getAttribute("aria-label").match(/Nota (\d+)/)[1], 10)

    badge.textContent = rotuloStatus(status)
    estrelasCard.textContent = estrelas(nota)
}

// 6. Rodapé: total de filmes com template literal.
const TOTAL = 6
const rodapeInfo = document.querySelector("#total-filmes")
rodapeInfo.textContent = `CineTrack © 2026 · ${TOTAL} filmes cadastrados`
