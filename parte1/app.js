"use strict";

/**
 * CineTrack — Parte 1 (frontend interativo).
 *
 * Toda a lógica vive dentro deste IIFE: nenhuma variável vaza para o
 * escopo global. O estado é mínimo — lista de filmes, critérios de
 * filtro e o id em edição — e a tela é sempre reconstruída a partir
 * dele por atualizar(): adicionar, editar, remover, buscar, filtrar e
 * ordenar apenas mudam o estado e chamam atualizar().
 */
(() => {
    // ---------- Constantes ----------
    /** Prefixo da chave evita colisão com outros dados no mesmo domínio. */
    const CHAVE = "cinetrack:filmes"

    /** Faixa válida do ano de lançamento (RF-04). */
    const FAIXA_ANO = { min: 1888, max: 2030 }

    /** Valores válidos do campo status (Seção 5 da especificação). */
    const STATUS = ["quero", "assistindo", "assistido"]

    /** Rótulo legível de cada status (badges e filtros). */
    const ROTULO_STATUS = {
        assistido: "Assistido",
        assistindo: "Assistindo",
        quero: "Quero assistir"
    }

    /** Imagem usada quando o filme não tem URL de pôster (RF-01). */
    const POSTER_PLACEHOLDER = "https://placehold.co/200x300?text=Sem+p%C3%B4ster"

    /** Pausa (ms) do debounce da busca (RF-02). */
    const TEMPO_DEBOUNCE = 300

    /** Dados iniciais: os 6 filmes canônicos da Seção 5, só na primeira visita. */
    const filmesIniciais = [
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
    ]

    // ---------- Referências de DOM ----------
    const ui = {
        lista: document.querySelector("#lista"),
        busca: document.querySelector("#busca"),
        filtros: document.querySelector("nav"),
        ordenar: document.querySelector("#ordenar"),
        rodape: document.querySelector("#total-filmes"),
        modal: document.querySelector("#modal"),
        titulo: document.querySelector("#modal-titulo"),
        erros: document.querySelector("#erros"),
        form: document.querySelector("#form-filme")
    }

    // ---------- Estado (as únicas variáveis mutáveis) ----------
    /** Lista em memória; espelhada no localStorage após cada mudança. */
    let filmes = carregar()

    /** Critérios ativos: busca, status e ordenação (sempre combinam). */
    let filtro = { busca: "", status: "todos", ordenacao: "titulo" }

    /** Id do filme em edição; null = o formulário está cadastrando. */
    let editandoId = null

    // ---------- Persistência (RF-08/09) ----------
    /** Regrava a lista inteira no localStorage em JSON. */
    function salvar() {
        localStorage.setItem(CHAVE, JSON.stringify(filmes))
    }

    /** Lê a lista salva; sem dados ou JSON inválido, usa os filmes iniciais. */
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

    /** Gera um id inteiro único: maior id da lista + 1 (1 em lista vazia). */
    function gerarId(lista) {
        return lista.length === 0 ? 1 : Math.max(...lista.map((f) => f.id)) + 1
    }

    // ---------- Renderização (RF-01) ----------
    /** Devolve o rótulo legível de um status ("quero" → "Quero assistir"). */
    function rotuloStatus(status) {
        return ROTULO_STATUS[status] ?? status
    }

    /** Monta a nota visual: sempre 5 símbolos, cheios até a nota. */
    function estrelas(nota) {
        let texto = ""
        for (let i = 1; i <= 5; i++) {
            texto += i <= nota ? "★" : "☆"
        }
        return texto
    }

    /**
     * Constrói o card de um filme via createElement + textContent
     * (nada de innerHTML: o conteúdo nunca vira HTML).
     */
    function criarCard(filme) {
        const card = document.createElement("article")
        card.className = "card"
        card.dataset.id = filme.id

        const poster = document.createElement("img")
        // Pôster ausente: placeholder em vez de imagem quebrada.
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

    /** Constrói todos os cards da lista dentro de um DocumentFragment. */
    function renderizarCards(lista) {
        const fragmento = document.createDocumentFragment()
        for (const filme of lista) {
            fragmento.append(criarCard(filme))
        }
        return fragmento
    }

    /**
     * Ordena uma cópia da lista pelo critério ativo (título usa localeCompare
     * pt-BR: acentos ordenam junto da letra base). Copia porque sort muta.
     */
    function ordenarLista(lista) {
        const comparadores = {
            titulo: (a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"),
            ano: (a, b) => b.ano - a.ano,   // mais recentes primeiro
            nota: (a, b) => b.nota - a.nota // melhor nota primeiro
        }
        return [...lista].sort(comparadores[filtro.ordenacao])
    }

    /** Aplica os critérios ativos de busca e status sobre a lista completa. */
    function aplicarFiltros() {
        return filmes.filter((filme) => {
            const casaStatus = filtro.status === "todos" || filme.status === filtro.status
            const casaBusca = filme.titulo.toLowerCase().includes(filtro.busca)
            return casaStatus && casaBusca
        })
    }

    /** Re-renderiza a grade e o rodapé a partir do estado; toda mudança passa por aqui. */
    function atualizar() {
        const subconjunto = ordenarLista(aplicarFiltros())

        // Estado vazio: mensagem em vez de área em branco (aria-live anuncia).
        if (subconjunto.length === 0) {
            const vazio = document.createElement("p")
            vazio.className = "vazio"
            vazio.textContent = filtro.busca !== ""
                ? `Nenhum filme encontrado para "${filtro.busca}".`
                : "Nenhum filme neste filtro."
            ui.lista.replaceChildren(vazio)
        } else {
            ui.lista.replaceChildren(renderizarCards(subconjunto))
        }

        ui.rodape.textContent = `CineTrack © 2026 · ${filmes.length} filmes cadastrados`
    }

    // ---------- Interações da lista ----------
    /**
     * Adia a execução até uma pausa de `espera` ms desde a última chamada
     * (usado na busca: re-renderiza uma vez por pausa, não a cada letra).
     */
    function debounce(funcao, espera) {
        let idTimeout
        return (...argumentos) => {
            clearTimeout(idTimeout)
            idTimeout = setTimeout(() => funcao(...argumentos), espera)
        }
    }

    /** Guarda o termo digitado (trim + minúsculas) e re-renderiza. */
    function aoDigitar(evento) {
        filtro.busca = evento.target.value.trim().toLowerCase()
        atualizar()
    }

    /** Localiza um filme pelo id. */
    function buscarFilme(id) {
        return filmes.find((f) => f.id === id)
    }

    /** Remove o filme após confirmação (RF-07), regravando e re-renderizando. */
    function removerFilme(id) {
        const filme = buscarFilme(id)
        if (!filme || !confirm(`Remover "${filme.titulo}" da lista?`)) {
            return
        }
        filmes = filmes.filter((f) => f.id !== id)
        salvar()
        atualizar()
    }

    // ---------- Formulário no modal (RF-04/05/06) ----------
    /** Valor do select → valor interno ("quero-assistir" → "quero"). */
    const statusDoFormulario = (status) => (status === "quero-assistir" ? "quero" : status)

    /** Valor interno → valor do select (que usa "quero-assistir"). */
    const statusParaFormulario = (status) => (status === "quero" ? "quero-assistir" : status)

    /** Extrai os dados do formulário, convertendo os campos numéricos. */
    function lerFormulario() {
        const dados = Object.fromEntries(new FormData(ui.form))
        return {
            titulo: dados.titulo.trim(),
            ano: Number(dados.ano),
            genero: dados.genero.trim(),
            poster: dados["url-poster"].trim(),
            status: statusDoFormulario(dados.status),
            nota: dados.nota === "" ? 0 : Number(dados.nota),
            comentario: dados.comentario
        }
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

        return erros
    }

    /** Mostra os erros na lista da UI (nunca alert()); esconde quando vazia. */
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

    // ---------- Modal (RF-04/06) ----------
    /** Abre o modal em modo cadastro: formulário limpo, foco no título. */
    function abrirModal() {
        ui.form.reset()
        editandoId = null
        ui.titulo.textContent = "Adicionar filme"
        mostrarErros([])
        ui.modal.hidden = false
        ui.form.elements["titulo"].focus()
    }

    /** Fecha o modal e limpa erros e o estado de edição. */
    function fecharModal() {
        ui.modal.hidden = true
        ui.form.reset()
        editandoId = null
        mostrarErros([])
    }

    /** Abre o modal em modo edição, pré-preenchido com o filme (RF-06). */
    function abrirEdicao(filme) {
        ui.form.reset()
        ui.form.elements["titulo"].value = filme.titulo
        ui.form.elements["ano"].value = filme.ano
        ui.form.elements["genero"].value = filme.genero
        ui.form.elements["url-poster"].value = filme.poster
        ui.form.elements["status"].value = statusParaFormulario(filme.status)
        ui.form.elements["nota"].value = filme.nota || ""
        ui.form.elements["comentario"].value = filme.comentario

        editandoId = filme.id
        ui.titulo.textContent = "Editar filme"
        mostrarErros([])
        ui.modal.hidden = false
        ui.form.elements["titulo"].focus()
    }

    /**
     * Envia o formulário: valida e, sem erros, grava o filme (novo ou em
     * edição), regrava o storage, re-renderiza e fecha o modal.
     */
    function salvarFormulario(evento) {
        evento.preventDefault()

        const filme = lerFormulario()
        const erros = validarFilme(filme)
        if (erros.length > 0) {
            mostrarErros(erros)
            return
        }

        if (editandoId === null) {
            filmes = [...filmes, { id: gerarId(filmes), ...filme }]
        } else {
            filmes = filmes.map((f) =>
                f.id === editandoId ? { ...f, ...filme } : f
            )
        }

        salvar()
        atualizar()
        fecharModal()
    }

    // ---------- Eventos ----------
    // Busca com debounce (RF-02).
    ui.busca.addEventListener("input", debounce(aoDigitar, TEMPO_DEBOUNCE))

    // Delegação de eventos: um único listener cuida dos botões de todos os
    // cards, inclusive dos que forem criados no futuro.
    ui.lista.addEventListener("click", (evento) => {
        const botao = evento.target.closest("button")
        if (!botao) {
            return
        }
        const id = Number(botao.closest(".card").dataset.id)

        if (botao.classList.contains("btn-remover")) {
            removerFilme(id)
        }
        if (botao.classList.contains("btn-editar")) {
            const filme = buscarFilme(id)
            if (filme) {
                abrirEdicao(filme)
            }
        }
    })

    // Filtro de status: troca o botão ativo e o critério (RF-03).
    ui.filtros.addEventListener("click", (evento) => {
        const botao = evento.target.closest("button")
        if (!botao) {
            return
        }

        ui.filtros.querySelector(".ativo").classList.remove("ativo")
        botao.classList.add("ativo")

        filtro.status = botao.dataset.status
        atualizar()
    })

    // Ordenação combina com busca e filtro: atualizar() reordena a lista já filtrada.
    ui.ordenar.value = filtro.ordenacao
    ui.ordenar.addEventListener("change", () => {
        filtro.ordenacao = ui.ordenar.value
        atualizar()
    })

    // Modal: abre pelo "+ Adicionar"; fecha por Cancelar, × e Esc (RF-04).
    document.querySelector(".btn-adicionar").addEventListener("click", abrirModal)
    ui.form.querySelector("button[type='button']").addEventListener("click", fecharModal)
    ui.modal.querySelector(".modal-fechar").addEventListener("click", fecharModal)
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && !ui.modal.hidden) {
            fecharModal()
        }
    })
    ui.form.addEventListener("submit", salvarFormulario)

    // Primeira renderização.
    atualizar()
})()