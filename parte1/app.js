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
    return status
}

const estrelas = (nota) => {
    let texto = ""
    for (let i = 1; i <= 5; i++) {
        texto += i <= nota ? "★" : "☆"
    }
    return texto
}

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

// Prefixo da chave evita colisão com outros dados no mesmo domínio.
const CHAVE = "cinetrack:filmes"

function salvar() {
    localStorage.setItem(CHAVE, JSON.stringify(filmes))
}

function carregar() {
    try {
        const bruto = localStorage.getItem(CHAVE)
        if (bruto === null) {
            return [...filmesIniciais]
        }
        const dados = JSON.parse(bruto)
        return Array.isArray(dados) ? dados : [...filmesIniciais]
    } catch {
        return [...filmesIniciais]
    }
}

// createElement + textContent (nada de innerHTML): o conteúdo
// nunca é interpretado como HTML.
function criarCard(filme) {
    const card = document.createElement("article")
    card.className = "card"
    card.dataset.id = filme.id

    const poster = document.createElement("img")
    poster.src = filme.poster
    poster.alt = `Pôster do filme ${filme.titulo}`
    card.append(poster)

    const titulo = document.createElement("h2")
    titulo.textContent = filme.titulo
    card.append(titulo)

    const info = document.createElement("p")
    info.textContent = `${filme.ano} · ${filme.genero}`
    card.append(info)

    const nota = document.createElement("span")
    nota.className = "estrelas"
    nota.setAttribute("aria-label", `Nota ${filme.nota} de 5`)
    nota.textContent = estrelas(filme.nota)
    card.append(nota)

    const badge = document.createElement("span")
    badge.className = `badge ${filme.status}`
    badge.textContent = rotuloStatus(filme.status)
    card.append(badge)

    const btnEditar = document.createElement("button")
    btnEditar.type = "button"
    btnEditar.className = "btn-editar"
    btnEditar.textContent = "Editar"
    card.append(btnEditar)

    const btnRemover = document.createElement("button")
    btnRemover.type = "button"
    btnRemover.className = "btn-remover"
    btnRemover.textContent = "Remover"
    card.append(btnRemover)

    return card
}

function renderizarCards(lista) {
    const fragmento = document.createDocumentFragment()
    for (const filme of lista) {
        fragmento.append(criarCard(filme))
    }
    return fragmento
}

let filmes = carregar()

let statusAtual = "todos"

let termoBusca = ""

// ANP 06: critério de ordenação escolhido no select; o padrão é título.
let ordenacaoAtual = "titulo"

// Um comparador por critério. Título usa localeCompare com locale pt-BR,
// que posiciona acentos junto da letra base ("Água" ordena com os "A",
// e não depois do "Z", como aconteceria na comparação de code points).
const comparadores = {
    titulo: (a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"),
    ano: (a, b) => b.ano - a.ano,   // mais recentes primeiro
    nota: (a, b) => b.nota - a.nota // melhor nota primeiro
}

// sort muta o array em que é chamado, então ordenarLista copia antes
// ([...lista]) para nunca alterar o array filmes nem o resultado de
// aplicarFiltros.
function ordenarLista(lista) {
    return [...lista].sort(comparadores[ordenacaoAtual])
}

const rodapeInfo = document.querySelector("#total-filmes")
const busca = document.querySelector("#busca")

function aplicarFiltros() {
    return filmes.filter((filme) => {
        const casaStatus = statusAtual === "todos" || filme.status === statusAtual
        const casaBusca = filme.titulo.toLowerCase().includes(termoBusca)
        return casaStatus && casaBusca
    })
}

// Atualiza a tela inteira a partir do estado; toda mudança passa por aqui.
function atualizar() {
    const subconjunto = ordenarLista(aplicarFiltros())
    const lista = document.querySelector("#lista")

    // Estado vazio: mensagem em vez de área em branco (lida pelo
    // leitor de tela via aria-live).
    if (subconjunto.length === 0) {
        const vazio = document.createElement("p")
        vazio.className = "vazio"
        vazio.textContent = termoBusca !== ""
            ? `Nenhum filme encontrado para "${termoBusca}".`
            : "Nenhum filme neste filtro."
        lista.replaceChildren(vazio)
    } else {
        lista.replaceChildren(renderizarCards(subconjunto))
    }

    rodapeInfo.textContent = `CineTrack © 2026 · ${filmes.length} filmes cadastrados`
}

function debounce(funcao, espera) {
    let idTimeout
    return (...argumentos) => {
        clearTimeout(idTimeout)
        idTimeout = setTimeout(() => funcao(...argumentos), espera)
    }
}

function aoDigitar(evento) {
    termoBusca = evento.target.value.trim().toLowerCase()
    atualizar()
}

// Re-renderiza uma vez por pausa de digitação, não a cada letra.
busca.addEventListener("input", debounce(aoDigitar, 300))

// Delegação de eventos: um único listener cuida dos botões de todos
// os cards, inclusive dos que forem criados no futuro.
document.querySelector("#lista").addEventListener("click", (evento) => {
    const botao = evento.target.closest("button")

    if (botao.classList.contains("btn-remover")) {
        const id = Number(botao.closest(".card").dataset.id)
        const filme = filmes.find((f) => f.id === id)

        if (filme && confirm(`Remover "${filme.titulo}" da lista?`)) {
            filmes = filmes.filter((f) => f.id !== id)
            salvar()
            atualizar()
        }
    }

    if (botao.classList.contains("btn-editar")) {
        const id = Number(botao.closest(".card").dataset.id)
        const filme = filmes.find((f) => f.id === id)

        if (filme) {
            abrirEdicao(filme)
        }
    }

})

const nav = document.querySelector("nav")

nav.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button")
    if (!botao) {
        return
    }

    nav.querySelector(".ativo").classList.remove("ativo")
    botao.classList.add("ativo")

    statusAtual = botao.dataset.status
    atualizar()
})

// ANP 06: a escolha de ordenação fica guardada em ordenacaoAtual (como
// statusAtual guarda o filtro) e vale para qualquer combinação de busca
// e filtro: atualizar() sempre reordena a lista já filtrada.
const ordenar = document.querySelector("#ordenar")
ordenar.value = ordenacaoAtual

ordenar.addEventListener("change", () => {
    ordenacaoAtual = ordenar.value
    atualizar()
})

const modal = document.querySelector("#modal")
const modalTitulo = document.querySelector("#modal-titulo")
const caixaErros = document.querySelector("#erros")
const form = document.querySelector("#form-filme")

let editandoId = null

function gerarId(lista) {
    return lista.length === 0 ? 1 : Math.max(...lista.map((f) => f.id)) + 1
}

function validarFilme(filme) {
    const erros = []

    if (!filme.titulo || filme.titulo.trim() === "") {
        erros.push("Informe o título.")
    }
    if (!Number.isInteger(filme.ano) || filme.ano < 1888 || filme.ano > 2030) {
        erros.push("O ano deve ser um número inteiro entre 1888 e 2030.")
    }
    if (!filme.genero || filme.genero.trim() === "") {
        erros.push("Informe o gênero.")
    }
    if (!["quero", "assistindo", "assistido"].includes(filme.status)) {
        erros.push("Escolha um status válido.")
    }
    if (filme.nota !== 0 && (filme.nota < 1 || filme.nota > 5)) {
        erros.push("A nota deve ser de 1 a 5.")
    }

    return erros
}

function mostrarErros(erros) {
    caixaErros.replaceChildren()

    if (erros.length === 0) {
        caixaErros.hidden = true
        return
    }

    for (const erro of erros) {
        const item = document.createElement("li")
        item.textContent = erro
        caixaErros.append(item)
    }
    caixaErros.hidden = false
}

function abrir() {
    form.reset()
    editandoId = null
    modalTitulo.textContent = "Adicionar filme"
    mostrarErros([])
    modal.hidden = false
    form.elements["titulo"].focus()
}

function fechar() {
    modal.hidden = true
    form.reset()
    editandoId = null
    mostrarErros([])
}

function abrirEdicao(filme) {
    form.reset()
    form.elements["titulo"].value = filme.titulo
    form.elements["ano"].value = filme.ano
    form.elements["genero"].value = filme.genero
    form.elements["url-poster"].value = filme.poster
    // o select usa "quero-assistir"; o array interno usa "quero"
    form.elements["status"].value = filme.status === "quero" ? "quero-assistir" : filme.status
    form.elements["nota"].value = filme.nota || ""
    form.elements["comentario"].value = filme.comentario

    editandoId = filme.id
    modalTitulo.textContent = "Editar filme"
    mostrarErros([])
    modal.hidden = false
    form.elements["titulo"].focus()
}

document.querySelector(".btn-adicionar").addEventListener("click", abrir)
form.querySelector("button[type='button']").addEventListener("click", fechar)
modal.querySelector(".modal-fechar").addEventListener("click", fechar)

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !modal.hidden) {
        fechar()
    }
})

form.addEventListener("submit", (evento) => {
    evento.preventDefault()

    const dados = Object.fromEntries(new FormData(form))

    const filmeDoForm = {
        titulo: dados.titulo.trim(),
        ano: Number(dados.ano),
        genero: dados.genero.trim(),
        poster: dados["url-poster"].trim(),
        status: dados.status === "quero-assistir" ? "quero" : dados.status,
        nota: dados.nota === "" ? 0 : Number(dados.nota),
        comentario: dados.comentario
    }

    const erros = validarFilme(filmeDoForm)
    if (erros.length > 0) {
        mostrarErros(erros)
        return
    }

    if (editandoId === null) {
        filmes = [...filmes, { id: gerarId(filmes), ...filmeDoForm }]
    } else {
        filmes = filmes.map((f) =>
            f.id === editandoId ? { ...f, ...filmeDoForm } : f
        )
    }

    salvar()
    atualizar()
    fechar()
})

atualizar()
