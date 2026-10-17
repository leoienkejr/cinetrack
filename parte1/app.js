"use strict";

/**
 * CineTrack — Parte 1 (frontend interativo).
 *
 * Funções puras recebem tudo de que precisam por parâmetro e devolvem
 * valores novos; o estado (filmes, filtro, editandoId) vive apenas neste
 * IIFE e é mexido só pelos handlers, que após cada mudança chamam
 * salvar() e atualizar().
 */
(() => {
    // ---------- Constantes ----------
    const CHAVE = "cinetrack:filmes"
    const ANO_MIN = 1888
    const ANO_MAX = 2030
    const PLACEHOLDER = "https://placehold.co/200x300?text=Sem+p%C3%B4ster"
    const TEMPO_DEBOUNCE = 300

    /** Status válidos → rótulo exibido na badge. */
    const STATUS = Object.freeze({
        assistido: "Assistido",
        assistindo: "Assistindo",
        quero: "Quero assistir"
    })

    /** Um comparador por critério do select de ordenação. */
    const CRITERIOS = Object.freeze({
        titulo: (a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"), // acentos junto da base
        ano: (a, b) => b.ano - a.ano,   // mais recentes primeiro
        nota: (a, b) => b.nota - a.nota // melhor nota primeiro
    })

    /** Dados iniciais: os 6 filmes canônicos da Seção 5, só na primeira visita. */
    const filmesIniciais = [
        { id: 1, titulo: "A Origem", ano: 2010, genero: "Ficção científica", poster: "https://image.tmdb.org/t/p/w300/9e3Dz7aCANy5aRUQF745IlNloJ1.jpg", nota: 5, status: "assistido", comentario: "Revejo sempre." },
        { id: 2, titulo: "Parasita", ano: 2019, genero: "Suspense", poster: "https://image.tmdb.org/t/p/w300/bNGW8zYA91VqTZfV3jnKHPEKKvB.jpg", nota: 4, status: "assistido", comentario: "" },
        { id: 3, titulo: "O Auto da Compadecida", ano: 2000, genero: "Comédia", poster: "https://image.tmdb.org/t/p/w300/y3IhuITELtprMhUd7bccu629rba.jpg", nota: 5, status: "assistido", comentario: "Classico nacional." },
        { id: 4, titulo: "Duna: Parte Dois", ano: 2024, genero: "Ficção científica", poster: "https://image.tmdb.org/t/p/w300/VMy4UGsI2u3f4fALGeCqCdsQBb.jpg", nota: 4, status: "assistindo", comentario: "" },
        { id: 5, titulo: "Interestelar", ano: 2014, genero: "Ficção científica", poster: "https://image.tmdb.org/t/p/w300/tR1XVa5bxgdh2bRw2u0DzrgkO2l.jpg", nota: 5, status: "quero", comentario: "" },
        { id: 6, titulo: "Cidade de Deus", ano: 2002, genero: "Drama", poster: "https://image.tmdb.org/t/p/w300/gfnXixcGC060QcG6JPxN6AMdVsq.jpg", nota: 4, status: "quero", comentario: "" }
    ]

    // ---------- Funções puras (recebem parâmetros, devolvem valores) ----------
    /** Rótulo legível do status ("quero" → "Quero assistir"). */
    const rotuloStatus = (status) => STATUS[status] ?? status

    /** Nota visual: sempre 5 símbolos — cheios até a nota, vazios depois. */
    const estrelas = (nota) => "★".repeat(nota) + "☆".repeat(5 - nota)

    /** Card do filme via createElement + textContent (nada vira HTML). */
    function criarCard(filme) {
        const card = document.createElement("article")
        card.className = "card"
        card.dataset.id = filme.id

        const poster = document.createElement("img")
        poster.src = filme.poster || PLACEHOLDER // ausente → placeholder, não imagem quebrada
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

    /** Busca (case-insensitive) e status combinados: os dois critérios valem juntos. */
    const filtrar = (filmes, filtro) =>
        filmes.filter((filme) =>
            (filtro.status === "todos" || filme.status === filtro.status)
            && filme.titulo.toLowerCase().includes(filtro.busca))

    /** Ordena uma CÓPIA (sort muta o array) pelo critério do select. */
    const ordenar = (filmes, criterio) => [...filmes].sort(CRITERIOS[criterio])

    /** Id inteiro único: maior id da lista + 1 (1 em lista vazia). */
    const gerarId = (filmes) =>
        filmes.length === 0 ? 1 : Math.max(...filmes.map((f) => f.id)) + 1

    /** "quero-assistir" (valor do select) → "quero" (valor dos dados). */
    const statusDoFormulario = (status) => (status === "quero-assistir" ? "quero" : status)

    /** "quero" (valor dos dados) → "quero-assistir" (valor do select). */
    const statusParaFormulario = (status) => (status === "quero" ? "quero-assistir" : status)

    /** Dados do formulário, com os campos numéricos convertidos (RF-05). */
    function lerFormulario(form) {
        const dados = Object.fromEntries(new FormData(form))
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

    /** Mensagens de erro dos dados; lista vazia significa válido (RF-05). */
    function validarFilme(filme) {
        const erros = []
        if (!filme.titulo.trim()) erros.push("Informe o título.")
        if (!Number.isInteger(filme.ano) || filme.ano < ANO_MIN || filme.ano > ANO_MAX) {
            erros.push(`O ano deve ser um número inteiro entre ${ANO_MIN} e ${ANO_MAX}.`)
        }
        if (!filme.genero.trim()) erros.push("Informe o gênero.")
        if (!(filme.status in STATUS)) erros.push("Escolha um status válido.")
        if (!Number.isInteger(filme.nota) || filme.nota < 1 || filme.nota > 5) {
            erros.push("A nota deve ser um número inteiro de 1 a 5.")
        }
        return erros
    }

    /** Adia a chamada até uma pausa de `espera` ms desde a última (busca, RF-02). */
    const debounce = (funcao, espera) => {
        let idTimeout
        return (...argumentos) => {
            clearTimeout(idTimeout)
            idTimeout = setTimeout(() => funcao(...argumentos), espera)
        }
    }

    // ---------- Estado (só este IIFE enxerga) e efeitos ----------
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

    let filmes = carregar()                                        // lista em memória
    let filtro = { busca: "", status: "todos", ordenacao: "titulo" } // busca + status + ordenação
    let editandoId = null                                          // null = cadastrando

    /** Lê a lista salva; sem dados ou JSON inválido, usa os filmes iniciais. */
    function carregar() {
        try {
            const bruto = localStorage.getItem(CHAVE)
            if (bruto === null) return [...filmesIniciais]
            const dados = JSON.parse(bruto)
            return Array.isArray(dados) ? dados : [...filmesIniciais]
        } catch {
            return [...filmesIniciais]
        }
    }

    /** Regrava a lista no localStorage. */
    const salvar = () => localStorage.setItem(CHAVE, JSON.stringify(filmes))

    /** Reconstrói a grade e o rodapé a partir do estado; toda mudança passa por aqui. */
    function atualizar() {
        const visiveis = ordenar(filtrar(filmes, filtro), filtro.ordenacao)

        if (visiveis.length === 0) {
            const vazio = document.createElement("p")
            vazio.className = "vazio"
            vazio.textContent = filtro.busca
                ? `Nenhum filme encontrado para "${filtro.busca}".`
                : "Nenhum filme neste filtro."
            ui.lista.replaceChildren(vazio)
        } else {
            const grade = document.createDocumentFragment()
            for (const filme of visiveis) {
                grade.append(criarCard(filme))
            }
            ui.lista.replaceChildren(grade)
        }

        ui.rodape.textContent = `CineTrack © 2026 · ${filmes.length} filmes cadastrados`
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

    // ---------- Handlers (mutam o estado e sincronizam tela + storage) ----------
    /** Abre o modal em modo cadastro: formulário limpo, foco no título (RF-04). */
    function abrirModal() {
        editandoId = null
        ui.form.reset()
        ui.titulo.textContent = "Adicionar filme"
        mostrarErros([])
        ui.modal.hidden = false
        ui.form.elements["titulo"].focus()
    }

    /** Fecha o modal e volta ao modo cadastro. */
    function fecharModal() {
        ui.modal.hidden = true
        ui.form.reset()
        editandoId = null
        mostrarErros([])
    }

    /** Abre o modal em modo edição, pré-preenchido com o filme (RF-06). */
    function abrirEdicao(filme) {
        editandoId = filme.id
        ui.form.reset()
        ui.form.elements["titulo"].value = filme.titulo
        ui.form.elements["ano"].value = filme.ano
        ui.form.elements["genero"].value = filme.genero
        ui.form.elements["url-poster"].value = filme.poster
        ui.form.elements["status"].value = statusParaFormulario(filme.status)
        ui.form.elements["nota"].value = filme.nota || ""
        ui.form.elements["comentario"].value = filme.comentario
        ui.titulo.textContent = "Editar filme"
        mostrarErros([])
        ui.modal.hidden = false
        ui.form.elements["titulo"].focus()
    }

    /** Valida no submit e grava o filme novo ou editado (RF-04/05/06). */
    function enviarFormulario(evento) {
        evento.preventDefault()
        const dados = lerFormulario(ui.form)
        const erros = validarFilme(dados)
        if (erros.length > 0) {
            mostrarErros(erros)
            return
        }

        if (editandoId === null) {
            filmes = [...filmes, { id: gerarId(filmes), ...dados }]
        } else {
            filmes = filmes.map((f) => (f.id === editandoId ? { ...f, ...dados } : f))
        }
        salvar()
        atualizar()
        fecharModal()
    }

    /** Remove o filme após confirmação (RF-07). */
    function removerFilme(id) {
        const filme = filmes.find((f) => f.id === id)
        if (!filme || !confirm(`Remover "${filme.titulo}" da lista?`)) return
        filmes = filmes.filter((f) => f.id !== id)
        salvar()
        atualizar()
    }

    /** Delegação de eventos: um listener cuida dos botões de todos os cards. */
    function acionarBotaoDoCard(evento) {
        const botao = evento.target.closest("button")
        if (!botao) return
        const id = Number(botao.closest(".card").dataset.id)

        if (botao.classList.contains("btn-remover")) removerFilme(id)
        if (botao.classList.contains("btn-editar")) {
            const filme = filmes.find((f) => f.id === id)
            if (filme) abrirEdicao(filme)
        }
    }

    // ---------- Eventos ----------
    ui.busca.addEventListener("input", debounce((evento) => {
        filtro.busca = evento.target.value.trim().toLowerCase()
        atualizar()
    }, TEMPO_DEBOUNCE))

    ui.filtros.addEventListener("click", (evento) => {
        const botao = evento.target.closest("button")
        if (!botao) return
        ui.filtros.querySelector(".ativo").classList.remove("ativo")
        botao.classList.add("ativo")
        filtro.status = botao.dataset.status
        atualizar()
    })

    ui.ordenar.addEventListener("change", (evento) => {
        filtro.ordenacao = evento.target.value
        atualizar()
    })

    ui.lista.addEventListener("click", acionarBotaoDoCard)
    ui.botaoAdicionar.addEventListener("click", abrirModal)
    ui.form.querySelector("button[type='button']").addEventListener("click", fecharModal)
    ui.modal.querySelector(".modal-fechar").addEventListener("click", fecharModal)
    ui.form.addEventListener("submit", enviarFormulario)
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && !ui.modal.hidden) fecharModal()
    })

    ui.ordenar.value = filtro.ordenacao
    atualizar()
})()