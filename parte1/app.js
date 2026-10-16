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

// Aula 5, item 3 — persistência: o array sobrevive ao recarregar (F5)
// graças ao localStorage. A chave usa o prefixo do projeto para não
// colidir com outros dados gravados no mesmo domínio.

const CHAVE = "cinetrack:filmes"

// Escreve o estado atual no localStorage (JSON só guarda dados, não funções).
function salvar() {
    localStorage.setItem(CHAVE, JSON.stringify(filmes))
}

// Lê a lista gravada; sem dados gravados (ou corrompidos), devolve o
// cardápio inicial. try/catch protege contra JSON quebrado — por
// exemplo, editado à mão no DevTools.
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

// Aula 4, item 4: cada card nasce de createElement + textContent
// (nada de innerHTML, então o conteúdo nunca é interpretado como HTML).
// Pura em relação ao DOM externo: só monta e devolve o elemento pronto.
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

// Aula 4, item 4: monta um DocumentFragment com um card por filme.
// O fragmento é inserido de uma vez só em atualizar().
function renderizarCards(lista) {
    const fragmento = document.createDocumentFragment()
    for (const filme of lista) {
        fragmento.append(criarCard(filme))
    }
    return fragmento
}

// 1. Ao carregar: injeta os cards no lugar do HTML digitado à mão.
//    O script está no fim do <body>, então #lista já existe.
//    (Aula 3: este bloco virou a função atualizar(), logo abaixo.)

// Aula 3 — a lista agora tem estado: filmes é a cópia que pode mudar
// (remoções). let porque o filter devolve um array novo a cada remoção.
// Aula 5, item 3: a cópia inicial agora vem do localStorage — o que
// o usuário cadastrou antes continua na lista depois do F5.
let filmes = carregar()

// Status selecionado na nav. "todos" mostra o array inteiro.
let statusAtual = "todos"

// Aula 5, item 2: texto da busca já em minúsculas e sem espaços nas
// pontas. "" significa "sem busca" — o filtro não derruba nenhum filme.
let termoBusca = ""

// Rodapé: a contagem acompanha o estado atual, não é mais fixa.
const rodapeInfo = document.querySelector("#total-filmes")

// Campo de busca do header (Aula 5, item 2).
const busca = document.querySelector("#busca")

// Aula 5, item 1: filtra o array combinando OS DOIS filtros —
// o status da nav e o texto da busca no título. Pura: devolve
// um array novo, sem tocar no DOM nem no estado.
function aplicarFiltros() {
    return filmes.filter((filme) => {
        const casaStatus = statusAtual === "todos" || filme.status === statusAtual
        const casaBusca = filme.titulo.toLowerCase().includes(termoBusca)
        return casaStatus && casaBusca
    })
}

// Aula 5, item 1: atualiza a tela inteira a partir do estado.
// Toda mudança (remoção, filtro, busca, criação ou edição) passa
// por aqui. replaceChildren troca o conteúdo inteiro pelo fragmento
// devolvido por renderizarCards().
function atualizar() {
    const subconjunto = aplicarFiltros()
    const lista = document.querySelector("#lista")

    // estado vazio: se o filtro/busca não achar nada, a área não fica
    // em branco — a mensagem explica o porquê (e lê bem no leitor de tela,
    // já que #lista é aria-live="polite").
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

// Aula 5, item 2: devolve uma versão de `funcao` que só roda depois
// de `espera` ms SEM chamadas novas no meio. Pura: não sabe o que a
// função passada faz, só controla QUANDO ela roda.
function debounce(funcao, espera) {
    let idTimeout
    return (...argumentos) => {
        clearTimeout(idTimeout)
        idTimeout = setTimeout(() => funcao(...argumentos), espera)
    }
}

// Aula 5, item 2: cada pausa de digitação atualiza o termo e re-renderiza.
// O valor novo chega pelo evento — não precisamos de variável extra.
function aoDigitar(evento) {
    termoBusca = evento.target.value.trim().toLowerCase()
    atualizar()
}

// Aula 5, item 2: o debounce espera 300 ms de pausa — digitar "duna"
// re-renderiza uma vez, não quatro (uma por letra).
busca.addEventListener("input", debounce(aoDigitar, 300))

// 3. Delegação de eventos em #lista: um único listener cuida dos botões
//    de todos os cards — inclusive dos que forem criados no futuro.
document.querySelector("#lista").addEventListener("click", (evento) => {
    const botao = evento.target.closest("button")

    if (botao.classList.contains("btn-remover")) {
        // closest sobe do botão até o <article> e lê o data-id do card
        const id = Number(botao.closest(".card").dataset.id)
        const filme = filmes.find((f) => f.id === id)

        // confirm() devolve true só quando o usuário aceita
        if (filme && confirm(`Remover "${filme.titulo}" da lista?`)) {
            filmes = filmes.filter((f) => f.id !== id)
            // Aula 5, item 3: grava antes de redesenhar.
            salvar()
            atualizar()
        }
    }

    if (botao.classList.contains("btn-editar")) {
        // Aula 4, item 5: mesmo closest + data-id do remover,
        // mas aqui o card encontrado vira o formulário do modal
        const id = Number(botao.closest(".card").dataset.id)
        const filme = filmes.find((f) => f.id === id)

        if (filme) {
            abrirEdicao(filme)
        }
    }

    // btn-remover e btn-editar: ambos tratados por esta delegação
})

// 4. Filtros: um listener na nav move a classe .ativo e re-renderiza
//    só o subconjunto do status do botão clicado.
const nav = document.querySelector("nav")

nav.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button")
    if (!botao) {
        return
    }

    // move o destaque visual para o botão clicado
    nav.querySelector(".ativo").classList.remove("ativo")
    botao.classList.add("ativo")

    // Aula 5, item 1: muda o estado e pede a atualização — nada de
    // render inline. data-status vem do HTML: todos, assistido,
    // assistindo, quero
    statusAtual = botao.dataset.status
    atualizar()
})

// Aula 4 — o modal: adicionar e editar sem sair da página.

// Referências do modal e do formulário (o script está no fim do body).
const modal = document.querySelector("#modal")
const modalTitulo = document.querySelector("#modal-titulo")
const caixaErros = document.querySelector("#erros")
const form = document.querySelector("#form-filme")

// 1 + 5. Qual filme está sendo editado? null = modo adicionar.
let editandoId = null

// Aula 4, item 6: próximo id = maior id atual + 1 (ou 1 se vazio).
// Pura: depende só do array recebido.
function gerarId(lista) {
    return lista.length === 0 ? 1 : Math.max(...lista.map((f) => f.id)) + 1
}

// Aula 4, item 3: validação PURA — recebe o objeto do formulário
// e devolve a lista de erros (vazia = válido). Não toca no DOM
// nem no estado, então é fácil de testar no console.
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

// Aula 4, item 3: exibe (ou limpa) os erros dentro do modal.
// Cada erro vira um <li> com textContent.
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

// Aula 4, item 1: abre o modal em modo ADICIONAR —
// formulário limpo (reset) e editandoId nulo.
function abrir() {
    form.reset()
    editandoId = null
    modalTitulo.textContent = "Adicionar filme"
    mostrarErros([])
    modal.hidden = false
    form.elements["titulo"].focus()
}

// Aula 4, item 1: fecha o modal (Cancelar, botão × e Escape).
function fechar() {
    modal.hidden = true
    form.reset()
    editandoId = null
    mostrarErros([])
}

// Aula 4, item 5: preenche o formulário com o filme e abre
// o modal em modo EDIÇÃO, guardando o id em editandoId.
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

// Aula 4, item 1: liga "+ Adicionar" à abrir().
document.querySelector(".btn-adicionar").addEventListener("click", abrir)

// Aula 4, item 1: Cancelar (botão type="button" do form) fecha.
form.querySelector("button[type='button']").addEventListener("click", fechar)

// Bônus coerente: o × do canto também fecha (mesma fechar()).
modal.querySelector(".modal-fechar").addEventListener("click", fechar)

// Aula 4, item 1: Escape fecha o modal, só quando ele está aberto.
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !modal.hidden) {
        fechar()
    }
})

// Aula 4, itens 2 + 3 + 6: o submit coleta, converte, valida
// e só então salva (adicionar ou editar).
form.addEventListener("submit", (evento) => {
    evento.preventDefault()

    // item 2: FormData + Object.fromEntries viram um objeto simples
    const dados = Object.fromEntries(new FormData(form))

    // item 2: ano e nota chegam como string — convertemos com Number.
    // Nota vazia vira 0 (sem nota = ☆☆☆☆☆ no card).
    const filmeDoForm = {
        titulo: dados.titulo.trim(),
        ano: Number(dados.ano),
        genero: dados.genero.trim(),
        poster: dados["url-poster"].trim(),
        status: dados.status === "quero-assistir" ? "quero" : dados.status,
        nota: dados.nota === "" ? 0 : Number(dados.nota),
        comentario: dados.comentario
    }

    // item 3: valida ANTES de tocar no estado; inválido não salva
    const erros = validarFilme(filmeDoForm)
    if (erros.length > 0) {
        mostrarErros(erros)
        return
    }

    if (editandoId === null) {
        // item 6: adicionar — id novo gerado por gerarId
        filmes = [...filmes, { id: gerarId(filmes), ...filmeDoForm }]
    } else {
        // item 6: editar — map + spread preservam o id e a posição
        filmes = filmes.map((f) =>
            f.id === editandoId ? { ...f, ...filmeDoForm } : f
        )
    }

    // Aula 5, item 3: grava no localStorage e depois atualiza a tela —
    // o estado mudou, a tela acompanha.
    salvar()
    atualizar()
    fechar()
})

// Primeira atualização da página (agora já lendo o localStorage).
atualizar()
