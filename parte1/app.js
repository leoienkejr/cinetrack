"use strict";

/**
 * CineTrack — Parte 1 (frontend interativo).
 *
 * Arquitetura: núcleo funcional + casca imperativa.
 *
 * - Núcleo: funções PURAS que recebem o estado como parâmetro e devolvem
 *   um NOVO estado (transições imutáveis, prefixo com/se na convenção).
 *   Nenhuma função do núcleo lê variáveis externas nem toca no DOM.
 * - Casca: a única célula mutável do programa é `estado`. Os listeners
 *   leem o DOM, aplicam uma transição ao estado e pedem a re-renderização;
 *   os efeitos colaterais (localStorage, confirm, DOM) ficam isolados aqui.
 *
 * Nada vaza para o escopo global: o IIFE existe apenas para isolar o
 * arquivo (o script comum não tem escopo de módulo).
 */
(() => {
    // ---------- Constantes ----------
    /** Prefixo da chave evita colisão com outros dados no mesmo domínio. */
    const CHAVE = "cinetrack:filmes"

    /** Faixa válida do ano de lançamento (RF-04). */
    const FAIXA_ANO = Object.freeze({ min: 1888, max: 2030 })

    /** Valores válidos do campo status (Seção 5 da especificação). */
    const STATUS = Object.freeze(["quero", "assistindo", "assistido"])

    /** Rótulo legível de cada status (badges e filtros). */
    const ROTULO_STATUS = Object.freeze({
        assistido: "Assistido",
        assistindo: "Assistindo",
        quero: "Quero assistir"
    })

    /** Imagem usada quando o filme não tem URL de pôster (RF-01). */
    const POSTER_PLACEHOLDER = "https://placehold.co/200x300?text=Sem+p%C3%B4ster"

    /** Pausa (ms) do debounce da busca (RF-02). */
    const TEMPO_DEBOUNCE = 300

    /** Filtro inicial: sem busca, status "todos", ordenação por título. */
    const FILTRO_INICIAL = Object.freeze({ busca: "", status: "todos", ordenacao: "titulo" })

    /** Dados iniciais: os 6 filmes canônicos da Seção 5, só na primeira visita. */
    const filmesIniciais = Object.freeze([
        {
            id: 1,
            titulo: "A Origem",
            ano: 2010,
            genero: "Ficção científica",
            poster: "https://image.tmdb.org/t/p/w300/9e3Dz7aCANy5aRUQF745IlNloJ1.jpg",
            nota: 5,
            status: "assistido",
            comentario: "Revejo sempre."
        },
        {
            id: 2,
            titulo: "Parasita",
            ano: 2019,
            genero: "Suspense",
            poster: "https://image.tmdb.org/t/p/w300/bNGW8zYA91VqTZfV3jnKHPEKKvB.jpg",
            nota: 4,
            status: "assistido",
            comentario: ""
        },
        {
            id: 3,
            titulo: "O Auto da Compadecida",
            ano: 2000,
            genero: "Comédia",
            poster: "https://image.tmdb.org/t/p/w300/y3IhuITELtprMhUd7bccu629rba.jpg",
            nota: 5,
            status: "assistido",
            comentario: "Classico nacional."
        },
        {
            id: 4,
            titulo: "Duna: Parte Dois",
            ano: 2024,
            genero: "Ficção científica",
            poster: "https://image.tmdb.org/t/p/w300/VMy4UGsI2u3f4fALGeCqCdsQBb.jpg",
            nota: 4,
            status: "assistindo",
            comentario: ""
        },
        {
            id: 5,
            titulo: "Interestelar",
            ano: 2014,
            genero: "Ficção científica",
            poster: "https://image.tmdb.org/t/p/w300/tR1XVa5bxgdh2bRw2u0DzrgkO2l.jpg",
            nota: 5,
            status: "quero",
            comentario: ""
        },
        {
            id: 6,
            titulo: "Cidade de Deus",
            ano: 2002,
            genero: "Drama",
            poster: "https://image.tmdb.org/t/p/w300/gfnXixcGC060QcG6JPxN6AMdVsq.jpg",
            nota: 4,
            status: "quero",
            comentario: ""
        }
    ])

    // ---------- Núcleo funcional: modelo e transições (puras) ----------
    /**
     * Cria o estado inicial a partir de uma lista de filmes: filtro zerado
     * e nenhuma edição em andamento. Congela o estado e a lista (imutabilidade).
     */
    function criarEstado(filmes) {
        return Object.freeze({
            filmes: Object.freeze([...filmes]),
            filtro: FILTRO_INICIAL,
            editandoId: null
        })
    }

    /** Transição: define o termo de busca (trim + minúsculas). */
    const comBusca = (estado, termo) =>
        ({ ...estado, filtro: { ...estado.filtro, busca: termo.trim().toLowerCase() } })

    /** Transição: define o status do filtro ("todos" ou um status válido). */
    const comStatus = (estado, status) =>
        ({ ...estado, filtro: { ...estado.filtro, status } })

    /** Transição: define o critério de ordenação ("titulo", "ano" ou "nota"). */
    const comOrdenacao = (estado, criterio) =>
        ({ ...estado, filtro: { ...estado.filtro, ordenacao: criterio } })

    /** Transição: acrescenta um filme com id novo e único (RF-04/09). */
    const comFilmeAdicionado = (estado, dados) =>
        ({ ...estado, filmes: Object.freeze([...estado.filmes, { id: gerarId(estado.filmes), ...dados }]) })

    /** Transição: substitui os dados do filme em edição, preservando o id (RF-06). */
    const comFilmeEditado = (estado, dados) =>
        ({
            ...estado,
            filmes: Object.freeze(
                estado.filmes.map((f) => (f.id === estado.editandoId ? { ...f, ...dados } : f))
            )
        })

    /** Transição: remove o filme com o id dado (RF-07). */
    const semFilme = (estado, id) =>
        ({ ...estado, filmes: Object.freeze(estado.filmes.filter((f) => f.id !== id)) })

    /** Transição: marca o filme como "em edição" no formulário. */
    const emEdicao = (estado, filme) => ({ ...estado, editandoId: filme.id })

    /** Transição: encerra o modo de edição (formulário volta a cadastrar). */
    const semEdicao = (estado) => ({ ...estado, editandoId: null })

    // ---------- Núcleo funcional: consultas e visões (puras) ----------
    /** Gera um id inteiro único: maior id da lista + 1 (1 em lista vazia). */
    function gerarId(filmes) {
        return filmes.length === 0 ? 1 : Math.max(...filmes.map((f) => f.id)) + 1
    }

    /** Consulta: devolve o filme com o id dado, ou undefined. */
    const filmePorId = (estado, id) => estado.filmes.find((f) => f.id === id)

    /** Predicado: o filme passa pela busca e pelo status do filtro (RF-02/03)? */
    const visivelSob = (filtro) => (filme) =>
        (filtro.status === "todos" || filme.status === filtro.status)
        && filme.titulo.toLowerCase().includes(filtro.busca)

    /** Consulta: filmes visíveis com os critérios ativos (busca ∩ status). */
    const filtrados = (estado) => estado.filmes.filter(visivelSob(estado.filtro))

    /** Consulta: visíveis já ordenados pelo critério ativo (cópia: sort muta). */
    const ordenados = (estado) => {
        const criterios = {
            titulo: (a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"), // acentos junto da base
            ano: (a, b) => b.ano - a.ano,   // mais recentes primeiro
            nota: (a, b) => b.nota - a.nota // melhor nota primeiro
        }
        return [...filtrados(estado)].sort(criterios[estado.filtro.ordenacao])
    }

    /** Consulta pura: rótulo legível de um status ("quero" → "Quero assistir"). */
    const rotuloStatus = (status) => ROTULO_STATUS[status] ?? status

    /** Consulta pura: nota visual — sempre 5 símbolos, cheios até a nota. */
    const estrelas = (nota) => {
        let texto = ""
        for (let i = 1; i <= 5; i++) {
            texto += i <= nota ? "★" : "☆"
        }
        return texto
    }

    // ---------- Núcleo funcional: visões de DOM (fábricas puras de nós) ----------
    /**
     * Fábrica pura do card de um filme: cria nós destacados via
     * createElement + textContent (nada de innerHTML — o conteúdo
     * nunca vira HTML). Pôster ausente recebe placeholder (RF-01).
     */
    function criarCard(filme) {
        const card = document.createElement("article")
        card.className = "card"
        card.dataset.id = filme.id

        const poster = document.createElement("img")
        poster.src = filme.poster || POSTER_PLACEHOLDER
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

    /** Fábrica pura: todos os cards da lista num DocumentFragment. */
    const renderizarCards = (lista) => {
        const fragmento = document.createDocumentFragment()
        for (const filme of lista) {
            fragmento.append(criarCard(filme))
        }
        return fragmento
    }

    /** Fábrica pura: mensagem de lista vazia (lida pelo aria-live). */
    function mensagemVazia(termoBusca) {
        const vazio = document.createElement("p")
        vazio.className = "vazio"
        vazio.textContent = termoBusca !== ""
            ? `Nenhum filme encontrado para "${termoBusca}".`
            : "Nenhum filme neste filtro."
        return vazio
    }

    /** Visão pura: conteúdo da grade a partir do estado (cards ou vazio). */
    const vistaGrade = (estado) => {
        const visiveis = ordenados(estado)
        return visiveis.length === 0
            ? mensagemVazia(estado.filtro.busca)
            : renderizarCards(visiveis)
    }

    // ---------- Núcleo funcional: formulário e validação (puras) ----------
    /** Valor do select → valor interno ("quero-assistir" → "quero"). */
    const statusDoFormulario = (status) => (status === "quero-assistir" ? "quero" : status)

    /** Valor interno → valor do select (que usa "quero-assistir"). */
    const statusParaFormulario = (status) => (status === "quero" ? "quero-assistir" : status)

    /** Extrai os dados do formulário, convertendo os campos numéricos. */
    function lerFormulario(form) {
        const dados = Object.fromEntries(new FormData(form))
        return Object.freeze({
            titulo: dados.titulo.trim(),
            ano: Number(dados.ano),
            genero: dados.genero.trim(),
            poster: dados["url-poster"].trim(),
            status: statusDoFormulario(dados.status),
            nota: dados.nota === "" ? 0 : Number(dados.nota),
            comentario: dados.comentario
        })
    }

    /** Valida os dados; devolve a lista de mensagens de erro (vazia = válido). */
    function validarFilme(filme) {
        const erros = []

        if (!filme.titulo || filme.titulo.trim() === "") {
            erros.push("Informe o título.")
        }
        if (!Number.isInteger(filme.ano) || filme.ano < FAIXA_ANO.min || filme.ano > FAIXA_ANO.max) {
            erros.push(`O ano deve ser um número inteiro entre ${FAIXA_ANO.min} e ${FAIXA_ANO.max}.`)
        }
        if (!filme.genero || filme.genero.trim() === "") {
            erros.push("Informe o gênero.")
        }
        if (!STATUS.includes(filme.status)) {
            erros.push("Escolha um status válido.")
        }
        if (!Number.isInteger(filme.nota) || filme.nota < 1 || filme.nota > 5) {
            erros.push("A nota deve ser um número inteiro de 1 a 5.")
        }

        return Object.freeze(erros)
    }

    /**
     * Função de ordem superior PURA: adia a execução até uma pausa de
     * `espera` ms desde a última chamada (usado na busca, RF-02).
     */
    const debounce = (funcao, espera) => {
        let idTimeout
        return (...argumentos) => {
            clearTimeout(idTimeout)
            idTimeout = setTimeout(() => funcao(...argumentos), espera)
        }
    }

    // ---------- Casca imperativa: referências de DOM e estado ----------
    const ui = Object.freeze({
        lista: document.querySelector("#lista"),
        busca: document.querySelector("#busca"),
        filtros: document.querySelector("nav"),
        ordenar: document.querySelector("#ordenar"),
        rodape: document.querySelector("#total-filmes"),
        modal: document.querySelector("#modal"),
        titulo: document.querySelector("#modal-titulo"),
        erros: document.querySelector("#erros"),
        form: document.querySelector("#form-filme"),
        botaoAdicionar: document.querySelector(".btn-adicionar")
    })

    /**
     * A ÚNICA célula mutável do programa. Toda a lógica (núcleo) é pura e
     * recebe/devolve estados; só esta casca a lê e a substitui.
     */
    let estado = criarEstado(carregarSalvos())

    // ---------- Casca imperativa: efeitos de persistência (RF-08/09) ----------
    /** Efeito de leitura: lista salva no localStorage; sem dados válidos, a semente. */
    function carregarSalvos() {
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

    /** Efeito de escrita: regrava a lista inteira no localStorage em JSON. */
    function salvar(filmes) {
        localStorage.setItem(CHAVE, JSON.stringify(filmes))
    }

    // ---------- Casca imperativa: efeitos de renderização ----------
    /** Efeito: sincroniza a grade e o rodapé com o estado (única escrita na #lista). */
    function renderizar(estado) {
        ui.lista.replaceChildren(vistaGrade(estado))
        ui.rodape.textContent = `CineTrack © 2026 · ${estado.filmes.length} filmes cadastrados`
    }

    /** Efeito: mostra os erros na lista da UI (nunca alert()); esconde quando vazia. */
    function mostrarErros(erros) {
        if (erros.length === 0) {
            ui.erros.replaceChildren()
            ui.erros.hidden = true
            return
        }

        const itens = erros.map((erro) => {
            const item = document.createElement("li")
            item.textContent = erro
            return item
        })
        ui.erros.replaceChildren(...itens)
        ui.erros.hidden = false
    }

    // ---------- Casca imperativa: ações da interface ----------
    /** Ação: abre o modal em modo cadastro — formulário limpo, foco no título. */
    function abrirModal() {
        estado = semEdicao(estado)
        ui.form.reset()
        ui.titulo.textContent = "Adicionar filme"
        mostrarErros([])
        ui.modal.hidden = false
        ui.form.elements["titulo"].focus()
    }

    /** Ação: fecha o modal e encerra qualquer edição. */
    function fecharModal() {
        ui.modal.hidden = true
        ui.form.reset()
        estado = semEdicao(estado)
        mostrarErros([])
    }

    /** Ação: abre o modal em modo edição, pré-preenchido com o filme (RF-06). */
    function abrirEdicao(filme) {
        ui.form.reset()
        ui.form.elements["titulo"].value = filme.titulo
        ui.form.elements["ano"].value = filme.ano
        ui.form.elements["genero"].value = filme.genero
        ui.form.elements["url-poster"].value = filme.poster
        ui.form.elements["status"].value = statusParaFormulario(filme.status)
        ui.form.elements["nota"].value = filme.nota || ""
        ui.form.elements["comentario"].value = filme.comentario

        estado = emEdicao(estado, filme)
        ui.titulo.textContent = "Editar filme"
        mostrarErros([])
        ui.modal.hidden = false
        ui.form.elements["titulo"].focus()
    }

    /** Ação: remove o filme após confirmação (RF-07), persistindo e re-renderizando. */
    function removerFilme(id) {
        const filme = filmePorId(estado, id)
        if (!filme || !confirm(`Remover "${filme.titulo}" da lista?`)) {
            return
        }
        estado = semFilme(estado, id)
        salvar(estado.filmes)
        renderizar(estado)
    }

    /** Ação: envia o formulário — valida, grava (novo ou edição) e fecha o modal. */
    function enviarFormulario(evento) {
        evento.preventDefault()

        const dados = lerFormulario(ui.form)
        const erros = validarFilme(dados)
        if (erros.length > 0) {
            mostrarErros(erros)
            return
        }

        estado = estado.editandoId === null
            ? comFilmeAdicionado(estado, dados)
            : comFilmeEditado(estado, dados)

        salvar(estado.filmes)
        renderizar(estado)
        fecharModal()
    }

    // ---------- Casca imperativa: eventos ----------
    /** Handler da busca: termo digitado → nova estado → re-renderização (RF-02). */
    function aoDigitar(evento) {
        estado = comBusca(estado, evento.target.value)
        renderizar(estado)
    }

    /** Handler dos filtros: troca o botão ativo e o status (RF-03). */
    function trocarStatus(evento) {
        const botao = evento.target.closest("button")
        if (!botao) {
            return
        }

        ui.filtros.querySelector(".ativo").classList.remove("ativo")
        botao.classList.add("ativo")

        estado = comStatus(estado, botao.dataset.status)
        renderizar(estado)
    }

    /** Handler da ordenação: troca o critério (combina com busca e filtro). */
    function trocarOrdenacao(evento) {
        estado = comOrdenacao(estado, evento.target.value)
        renderizar(estado)
    }

    /** Handler dos cards: delegação — um listener cuida de todos, atuais e futuros. */
    function acionarBotaoDoCard(evento) {
        const botao = evento.target.closest("button")
        if (!botao) {
            return
        }
        const id = Number(botao.closest(".card").dataset.id)

        if (botao.classList.contains("btn-remover")) {
            removerFilme(id)
        }
        if (botao.classList.contains("btn-editar")) {
            const filme = filmePorId(estado, id)
            if (filme) {
                abrirEdicao(filme)
            }
        }
    }

    // Liga os eventos aos handlers (a casca é o único lugar que toca em listeners).
    ui.busca.addEventListener("input", debounce(aoDigitar, TEMPO_DEBOUNCE))
    ui.filtros.addEventListener("click", trocarStatus)
    ui.ordenar.addEventListener("change", trocarOrdenacao)
    ui.lista.addEventListener("click", acionarBotaoDoCard)
    ui.botaoAdicionar.addEventListener("click", abrirModal)
    ui.form.querySelector("button[type='button']").addEventListener("click", fecharModal)
    ui.modal.querySelector(".modal-fechar").addEventListener("click", fecharModal)
    ui.form.addEventListener("submit", enviarFormulario)
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && !ui.modal.hidden) {
            fecharModal()
        }
    })

    // Sincroniza o select com o filtro inicial e faz a primeira renderização.
    ui.ordenar.value = FILTRO_INICIAL.ordenacao
    renderizar(estado)
})()