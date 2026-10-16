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

// Aula 2 — os dados viram tela: os cards nascem de um array.

// 1. Dados de exemplo: os mesmos 6 filmes que estavam escritos à mão
//    no index.html. Cada objeto carrega tudo que o card precisa.
const filmesIniciais = [
    {
        id: 1,
        titulo: "A Origem",
        ano: 2010,
        genero: "Ficção científica",
        poster: "https://image.tmdb.org/t/p/w300/9e3Dz7aCANy5aRUQF745IlNloJ1.jpg",
        nota: 5,
        status: "assistido",
        comentario: "A camada do sonho dentro do sonho continua impecável."
    },
    {
        id: 2,
        titulo: "Parasita",
        ano: 2019,
        genero: "Drama, Suspense",
        poster: "https://image.tmdb.org/t/p/w300/bNGW8zYA91VqTZfV3jnKHPEKKvB.jpg",
        nota: 5,
        status: "assistido",
        comentario: "Virada de tom brilhante, nada do que eu esperava."
    },
    {
        id: 3,
        titulo: "O Auto da Compadecida",
        ano: 2000,
        genero: "Comédia",
        poster: "https://image.tmdb.org/t/p/w300/y3IhuITELtprMhUd7bccu629rba.jpg",
        nota: 4,
        status: "assistido",
        comentario: "João Grilo e o Major: clássico do cinema nacional."
    },
    {
        id: 4,
        titulo: "Duna: Parte Dois",
        ano: 2024,
        genero: "Ficção científica",
        poster: "https://image.tmdb.org/t/p/w300/VMy4UGsI2u3f4fALGeCqCdsQBb.jpg",
        nota: 4,
        status: "assistindo",
        comentario: "Parei no meio para ver de novo com som melhor."
    },
    {
        id: 5,
        titulo: "Interestelar",
        ano: 2014,
        genero: "Ficção científica",
        poster: "https://image.tmdb.org/t/p/w300/tR1XVa5bxgdh2bRw2u0DzrgkO2l.jpg",
        nota: 5,
        status: "quero",
        comentario: "Todo mundo diz que preciso rever na telona."
    },
    {
        id: 6,
        titulo: "Cidade de Deus",
        ano: 2002,
        genero: "Drama",
        poster: "https://image.tmdb.org/t/p/w300/gfnXixcGC060QcG6JPxN6AMdVsq.jpg",
        nota: 5,
        status: "assistido",
        comentario: "Fotografia e ritmo: um marco brasileiro."
    }
]

// 3. Monta o HTML de cada card com map (mesma estrutura dos cards
//    antigos) e concatena com join(""). Pura: devolve uma string,
//    quem toca no DOM é quem chama.
function renderizarCards(lista) {
    return lista.map((filme) => `
        <article class="card" data-id="${filme.id}">
            <img src="${filme.poster}" alt="Pôster do filme ${filme.titulo}">
            <h2>${filme.titulo}</h2>
            <p>${filme.ano} &middot; ${filme.genero}</p>
            <span class="estrelas" aria-label="Nota ${filme.nota} de 5">${estrelas(filme.nota)}</span>
            <span class="badge ${filme.status}">${rotuloStatus(filme.status)}</span>
            <button type="button">Editar</button>
            <button type="button">Remover</button>
        </article>
    `).join("")
}

// 4. Ao carregar: injeta os cards no lugar do HTML digitado à mão.
//    O script está no fim do <body>, então #lista já existe.
document.querySelector("#lista").innerHTML = renderizarCards(filmesIniciais)

// 6. Rodapé: total de filmes com template literal.
const TOTAL = 6
const rodapeInfo = document.querySelector("#total-filmes")
rodapeInfo.textContent = `CineTrack © 2026 · ${TOTAL} filmes cadastrados`
