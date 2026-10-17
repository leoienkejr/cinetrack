# CineTrack

Um gerenciador pessoal de filmes usado como projeto
integrador da disciplina.

- Cadastro com título, ano, gênero, pôster, status, nota e
comentário.
- Interface com busca por título, filtros de status, lista de filmes
e formulário de cadastro.
- Inclusão, edição e remoção (CRUD).
- Evolui em duas partes: frontend interativo e aplicação full
stack.

## Operações da API

| Ação      | Método | Rota futura   |
| --------- | ------ | ------------- |
| Listar    | GET    | /filmes       |
| Buscar    | GET    | /filmes/:id   |
| Cadastrar | POST   | /filmes       |
| Editar    | PUT    | /filmes/:id   |
| Remover   | DELETE | /filmes/:id   |