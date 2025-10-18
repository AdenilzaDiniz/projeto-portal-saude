// Diário de Humor
function salvarEntrada(e) {
  e.preventDefault();
  const humor = document.getElementById('humor').value;
  const nota = document.getElementById('nota').value;

  fetch('/api/diario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ humor, nota })
  })
    .then(res => res.text())
    .then(msg => {
      alert(msg);
      document.getElementById('humor').value = '';
      document.getElementById('nota').value = '';
      listarEntradas();
    });
}

function listarEntradas() {
  fetch('/api/diario')
    .then(res => res.json())
    .then(lista => {
      const container = document.getElementById('historico');
      container.innerHTML = '';
      lista.forEach(e => {
        const div = document.createElement('div');
        div.innerHTML = `
          <strong>${e.humor}</strong> - ${new Date(e.data).toLocaleString()}<br>
          ${e.nota}<hr>
        `;
        container.appendChild(div);
      });
    });
}

// Arquivos
let todosArquivos = [];

function carregarArquivos() {
  fetch('/api/arquivos')
    .then(res => res.json())
    .then(data => {
      todosArquivos = data;
      exibirArquivos(data);
    });
}

function exibirArquivos(lista) {
  const container = document.getElementById('arquivos');
  container.innerHTML = '';
  lista.forEach(arq => {
    const div = document.createElement('div');
    div.className = 'file';
    div.innerHTML = `
      <strong>${arq.tipo.toUpperCase()}</strong> - ${arq.nome}<br>
      <small>Enviado em: ${arq.data}</small><br>
      <a href="${arq.caminho}" target="_blank">Abrir</a>
    `;
    container.appendChild(div);
  });
}

function filtrar(tipo) {
  const filtrados = todosArquivos.filter(a => a.tipo === tipo);
  exibirArquivos(filtrados);
}

function buscarArquivo() {
  const termo = document.getElementById('busca').value.toLowerCase();
  const filtrados = todosArquivos.filter(a => a.nome.toLowerCase().includes(termo));
  exibirArquivos(filtrados);
}

// Perfil
function carregarPerfil() {
  fetch('/api/session')
    .then(res => res.json())
    .then(data => {
      if (data.logado) {
        document.getElementById('usuarioNome').textContent = data.nome;
        document.getElementById('usuarioTipo').textContent = data.tipo;
      }
    });
}

// Inicialização
listarEntradas();
carregarArquivos();
carregarPerfil();
function agendar(e) {
  e.preventDefault();
  const servico = document.getElementById('servico').value;
  const data = document.getElementById('data').value;

  fetch('/api/agendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ servico, data })
  }).then(res => res.text()).then(msg => {
    alert(msg);
    document.getElementById('servico').value = '';
    document.getElementById('data').value = '';
  });
}
