// Agendamentos
function carregarAgendamentos() {
  fetch('/api/agendamentos')
    .then(res => res.json())
    .then(lista => {
      const container = document.getElementById('listaAgendamentos');
      container.innerHTML = '';
      lista.forEach(a => {
        const div = document.createElement('div');
        div.innerHTML = `
          <strong>${a.paciente}</strong> - ${new Date(a.data).toLocaleString()}<br>
          Serviço: ${a.servico}<hr>
        `;
        container.appendChild(div);
      });
    });
}

// Pacientes
function carregarPacientes() {
  fetch('/api/pacientes')
    .then(res => res.json())
    .then(lista => {
      const container = document.getElementById('listaPacientes');
      container.innerHTML = '';
      lista.forEach(p => {
        const div = document.createElement('div');
        div.innerHTML = `
          <strong>${p.nome}</strong> - ${p.email}<br>
          Tipo: ${p.tipo}<hr>
        `;
        container.appendChild(div);
      });
    });
}

// Documentos
document.querySelector('form').addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(this);

  fetch('/api/documentos', {
    method: 'POST',
    body: formData
  })
    .then(res => res.text())
    .then(msg => {
      alert(msg);
      this.reset();
      carregarDocumentos();
    });
});

function carregarDocumentos() {
  fetch('/api/documentos')
    .then(res => res.json())
    .then(lista => {
      const container = document.getElementById('documentosEnviados');
      container.innerHTML = '';
      lista.forEach(doc => {
        const div = document.createElement('div');
        div.innerHTML = `
          <strong>${doc.nome}</strong><br>
          <a href="${doc.caminho}" target="_blank">Abrir</a><hr>
        `;
        container.appendChild(div);
      });
    });
}

// Inicialização
carregarAgendamentos();
carregarPacientes();
carregarDocumentos();
function baixarCSV() {
  window.location.href = '/api/relatorio/csv';
}

function baixarExcel() {
  window.location.href = '/api/relatorio/excel';
}

function carregarGrafico() {
  fetch('/api/relatorio/dados')
    .then(res => res.json())
    .then(data => {
      const labels = data.map(d => d._id);
      const valores = data.map(d => d.total);

      new Chart(document.getElementById('graficoAtendimentos'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Atendimentos por dia',
            data: valores,
            borderColor: 'blue',
            fill: false
          }]
        }
      });
    });
}
carregarAgendamentos();
carregarPacientes();
carregarDocumentos();
carregarGrafico();
