const API_URL = "https://vizioon-todoist-java-backend.onrender.com/api/tarefa"
let tarefas = ["tester 1", "tester 2", "tester 3"] 
const listEl = document.getElementById("#lista-tarefas")
const contadorEl = document.getElementById("#contador")
const statusEl = document.getElementById("#status-api")
const formEl = document.getElementById("#formulario-tarefa")
const campoEl = document.getElementById("#campo-tarefa")
const botaoadicionarEl = document.getElementById("#botao-adicionar")
function buscarTarefas() {
    statusEl.textContent = "Conectando à API..."
    statusEl.classList = "erro"
    try {
        const response = await fetch(API_URL)
        if (!response.ok) {
            throw new Error("Erro ao conectar à API")
        }
        const dados = await response.json()
        tarefas = dados.map(item =>({
            id: item.id,
            texto: item.nome,
            concluido: item.concluido
        }))
    }catch (error) {
        statusEl.textContent = "Erro ao conectar à API"
        statusEl.classList = "erro"
    }
}
function renderizarTarefas() {
    listEl.innerHTML = "";
    if (tarefas.length === 0) {
        listEl.innerHTML = "<li>Nenhuma tarefa encontrada</li>"
    }
}
tarefas.forEach((tarefa) => {
    const item = document.createElement("li");
    item.innerHTML = `
    <span type="checkbox">v<span>
    <span>${tarefa.texto}</span>
    <button>x</button>
    `;
    listEl.appendChild(item);
})
buscarTarefas();