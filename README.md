# CineTrack

Gerenciador pessoal de filmes ("o que já vi, estou vendo e quero ver"),
projeto integrador da disciplina de Programação de Sistemas Web (UEM/DIN).

## Aluno

- **Nome:** NOME_COMPLETO
- **R.A.:** RA_ALUNO

## Estrutura

- `parte1/` — versão em HTML, CSS e JavaScript puro (Parte 1 do trabalho, tag `v1.0`).
- `docs/requisitos.md` — descrição do projeto.
- `docs/testes-parte1.md` — roteiro de testes da Parte 1.

## Como executar a Parte 1

Não há build nem dependências: é um site estático.

```bash
# opção 1: abrir direto no navegador
xdg-open parte1/index.html

# opção 2 (recomendada): servir por HTTP a partir da raiz do repositório
npx serve .
# abrir http://localhost:3000/parte1/index.html
```

Os dados ficam no `localStorage` do navegador (chave `cinetrack:filmes`);
na primeira visita a lista é semeada com os 6 filmes canônicos da
especificação.