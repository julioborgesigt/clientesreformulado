// Variáveis globais
let clients = [];
let modal, modalBody;
let chart;  // Variável para o gráfico
let bsModal; // Modal usando nosso método (se for customizado, senão usa modal.style)

// Função para buscar clientes do backend
async function fetchClients() {
  try {
    const response = await fetch('/clientes/list');
    clients = await response.json();
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
  }
}

// Função para exibir a tabela de clientes
function displayClientsTable(clientList, title) {
  let tableHtml = `<h2>${title}</h2>`;
  tableHtml += `<table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Nome</th>
        <th>Vencimento</th>
        <th>Serviço</th>
        <th>WhatsApp</th>
        <th>Observações</th>
        <th>Valor Cobrado</th>
        <th>Custo</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>`;
  
  clientList.forEach(client => {
    tableHtml += `<tr>
      <td>${client.id}</td>
      <td>${client.name}</td>
      <td>${client.vencimento.split('-').reverse().join('-')}</td>
      <td>${client.servico}</td>
      <td>${client.whatsapp}</td>
      <td>${client.observacoes}</td>
      <td>R$${parseFloat(client.valor_cobrado).toFixed(2)}</td>
      <td>R$${parseFloat(client.custo).toFixed(2)}</td>
      <td>${client.status || 'N/A'}</td>
    </tr>
    <tr>
      <td colspan="9">
        <div class="button-group">
          <button class="pendente" onclick="markAsPending(${client.id})">Pag. pendente</button>
          <button class="cobranca" onclick="markAsPaid(${client.id})">Cobrança feita</button>
          <button class="em-dias" onclick="markAsInDay(${client.id})">Pag. em dias</button>
          <button class="editar" onclick="showEditForm(${client.id}, '${client.name}', '${client.vencimento}', '${client.servico}', '${client.whatsapp}', '${client.observacoes}', ${client.valor_cobrado}, ${client.custo})">Editar</button>
          <button class="whatsapp" onclick="sendWhatsAppMessage('${client.whatsapp}', ${client.id})">WhatsApp</button>
          <button class="add-1M" onclick="adjustDate(${client.id}, 1, 'MONTH')">+1m</button>
          <button class="sub-1M" onclick="adjustDate(${client.id}, -1, 'MONTH')">-1m</button>
          <button class="add-1" onclick="adjustDate(${client.id}, 1, 'DAY')">+1d</button>
          <button class="sub-1" onclick="adjustDate(${client.id}, -1, 'DAY')">-1d</button>
          <button class="excluir" onclick="deleteClient(${client.id})">Excluir</button>
        </div>
      </td>
    </tr>`;
  });
  
  tableHtml += `</tbody></table>`;
  document.getElementById('table-container').innerHTML = tableHtml;
}

// Função para atualizar os dados (cards e tabela)
async function updateData() {
  await fetchClients();
  await updateDashboardCounts();
  let currentCategory = sessionStorage.getItem('currentCategory') || 'vence3';
  
  if (currentCategory === 'vencidos') {
    displayClientsTable(filterVencidos(clients), "Clientes Vencidos");
  } else if (currentCategory === 'vence3') {
    displayClientsTable(filterVence3(clients), "Clientes que Vão Vencer em 3 dias");
  } else if (currentCategory === 'emdias') {
    displayClientsTable(filterEmDias(clients), "Clientes em Dias");
  } else if (currentCategory === 'totalClientes') {
    displayClientsTable(clients, "Total de Clientes");
  }
}

// Função para atualizar os contadores (cards)
async function updateDashboardCounts() {
  await fetchClients();
  
  const vencidosCount = filterVencidos(clients).length;
  const vence3Count = filterVence3(clients).length;
  const emdiasCount = filterEmDias(clients).length;
  const custoTotal = clients.reduce((sum, client) => sum + parseFloat(client.custo), 0);
  const valorApurado = clients.reduce((sum, client) => sum + parseFloat(client.valor_cobrado), 0);
  const lucro = valorApurado - custoTotal;
  
  const vencidosCard = document.querySelector('.card[data-category="vencidos"]');
  if (vencidosCard) {
    vencidosCard.innerHTML = `<h2>Vencidos</h2><p class="count">${vencidosCount}</p>`;
  }
  const vence3Card = document.querySelector('.card[data-category="vence3"]');
  if (vence3Card) {
    vence3Card.innerHTML = `<h2>Vence em 3</h2><p class="count">${vence3Count}</p>`;
  }
  const emdiasCard = document.querySelector('.card[data-category="emdias"]');
  if (emdiasCard) {
    emdiasCard.innerHTML = `<h2>Em dias</h2><p class="count">${emdiasCount}</p>`;
  }
  const custoTotalCard = document.querySelector('.card[data-category="custoTotal"]');
  if (custoTotalCard) {
    custoTotalCard.innerHTML = `<h2>Custo</h2><p class="count">R$${custoTotal.toFixed(2)}</p>`;
  }
  const valorApuradoCard = document.querySelector('.card[data-category="valorApurado"]');
  if (valorApuradoCard) {
    valorApuradoCard.innerHTML = `<h2>Receita</h2><p class="count">R$${valorApurado.toFixed(2)}</p>`;
  }
  const lucroCard = document.querySelector('.card[data-category="lucro"]');
  if (lucroCard) {
    lucroCard.innerHTML = `<h2>Lucro</h2><p class="count">R$${lucro.toFixed(2)}</p>`;
  }
  const totalClientesCard = document.querySelector('.card[data-category="totalClientes"]');
  if (totalClientesCard) {
    totalClientesCard.innerHTML = `<h2>Nº Clientes</h2><p class="count">${clients.length}</p>`;
  }
}

// Funções de ações
window.adjustDate = async function(clientId, value, unit) {
  try {
    const response = await fetch(`/clientes/adjust-date/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, unit })
    });
    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || 'Erro ao ajustar a data.');
      return;
    }
    const data = await response.json();
    alert(data.message);
    await updateData();
  } catch (error) {
    console.error('Erro ao ajustar a data:', error);
    alert('Erro ao ajustar a data.');
  }
};

window.markAsPending = async function(id) {
  try {
    const response = await fetch(`/clientes/mark-pending/${id}`, { method: 'PUT' });
    const data = await response.json();
    alert(data.message);
    await updateData();
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao marcar como pagamento pendente.');
  }
};

window.markAsPaid = async function(id) {
  try {
    const response = await fetch(`/clientes/mark-paid/${id}`, { method: 'PUT' });
    const data = await response.json();
    alert(data.message);
    await updateData();
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao marcar como cobrança feita.');
  }
};

window.markAsInDay = async function(id) {
  try {
    const response = await fetch(`/clientes/mark-in-day/${id}`, { method: 'PUT' });
    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || 'Erro ao marcar como em dias.');
      return;
    }
    const data = await response.json();
    alert(data.message);
    await updateData();
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao atualizar status.');
  }
};

window.deleteClient = async function(id) {
  try {
    const response = await fetch(`/clientes/delete/${id}`, { method: 'DELETE' });
    const data = await response.json();
    alert(data.message);
    await updateData();
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    alert('Erro ao excluir cliente.');
  }
};

window.getClientVencimento = async function(clientId) {
  try {
    const response = await fetch(`/clientes/get-vencimento/${clientId}`);
    const data = await response.json();
    if (!response.ok) {
      console.error('Erro ao buscar data de vencimento');
      return null;
    }
    return data.vencimento;
  } catch (error) {
    console.error('Erro ao obter data de vencimento:', error);
    return null;
  }
};

window.editClient = async function(clientId) {
  const name = document.getElementById(`edit-name-${clientId}`).value;
  const vencimento = document.getElementById(`edit-vencimento-${clientId}`).value;
  const servico = document.getElementById(`edit-servico-${clientId}`).value;
  const whatsapp = document.getElementById(`edit-whatsapp-${clientId}`).value;
  const observacoes = document.getElementById(`edit-observacoes-${clientId}`).value;
  let valor_cobrado = parseFloat(document.getElementById(`edit-valor-cobrado-${clientId}`).value);
  let custo = parseFloat(document.getElementById(`edit-custo-${clientId}`).value);

  if (isNaN(valor_cobrado)) valor_cobrado = 15.00;
  if (isNaN(custo)) custo = 6.00;

  try {
    const response = await fetch(`/clientes/update/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, vencimento, servico, whatsapp, observacoes, valor_cobrado, custo })
    });
    const data = await response.json();
    if (response.ok) {
      alert('Cliente atualizado com sucesso!');
      modal.style.display = 'none';
      await updateData();
    } else {
      alert(`Erro ao atualizar cliente: ${data.error}`);
    }
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    alert('Erro ao atualizar cliente.');
  }
};

window.hideEditForm = function() {
  modal.style.display = 'none';
};

window.sendWhatsAppMessage = async function(whatsapp, clientId) {
  try {
    const response = await fetch('/clientes/get-message');
    const data = await response.json();
    if (!response.ok) {
      alert('Nenhuma mensagem padrão foi configurada.');
      return;
    }
    const vencimento = await getClientVencimento(clientId);
    if (!vencimento) {
      alert('Data de vencimento não encontrada.');
      return;
    }
    const vencimentoDate = new Date(vencimento);
    const formattedDate = vencimentoDate.toLocaleDateString('pt-BR');
    const message = `${data.message} Vencimento: ${formattedDate}`;
    const whatsappLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  } catch (error) {
    console.error('Erro ao enviar mensagem pelo WhatsApp:', error);
    alert('Erro ao enviar mensagem pelo WhatsApp.');
  }
};

// Funções de filtragem
function filterVencidos(clients) {
  const today = new Date().setHours(0, 0, 0, 0);
  return clients.filter(client => {
    const venc = new Date(client.vencimento).setHours(0, 0, 0, 0);
    return venc < today;
  });
}

function filterVence3(clients) {
  const today = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);
  return clients.filter(client => {
    const venc = new Date(client.vencimento);
    return venc >= today && venc <= threeDaysLater;
  });
}

function filterEmDias(clients) {
  const today = new Date().setHours(0, 0, 0, 0);
  const threeDaysLater = new Date();
  threeDaysLater.setDate(new Date().getDate() + 3);
  threeDaysLater.setHours(0, 0, 0, 0);
  return clients.filter(client => {
    const venc = new Date(client.vencimento).setHours(0, 0, 0, 0);
    return venc > threeDaysLater;
  });
}

// Função auxiliar para remover acentuação (para pesquisa)
function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Funções para renderizar o gráfico
function getDaysInCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const labels = [];
  for (let i = 1; i <= days; i++) {
    labels.push(i.toString());
  }
  return labels;
}

function getPredictedPaymentsData() {
  const labels = getDaysInCurrentMonth();
  return labels.map(() => Math.floor(Math.random() * 20) + 1);
}

function renderChart() {
  const ctx = document.getElementById('myChart').getContext('2d');
  const labels = getDaysInCurrentMonth();
  const data = getPredictedPaymentsData();
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Previsão de Pagamentos',
        data: data,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Função para exibir o formulário de cadastro
window.displayRegistrationForm = function() {
  modalBody.innerHTML = `
    <h2>Cadastro de Cliente</h2>
    <form id="registration-form">
      <input type="text" class="form-control my-2" id="reg-name" placeholder="Nome do Cliente" required>
      <input type="date" class="form-control my-2" id="reg-vencimento" required>
      <input type="text" class="form-control my-2" id="reg-servico" placeholder="Serviço" required>
      <div class="input-group my-2">
        <span class="input-group-text">+55</span>
        <input type="text" class="form-control" id="reg-whatsapp" placeholder="xx912345678" maxlength="11" required>
      </div>
      <textarea class="form-control my-2" id="reg-observacoes" placeholder="Observações"></textarea>
      <label for="reg-valor-cobrado" class="form-label">Valor Cobrado (R$)</label>
      <input type="number" step="0.01" class="form-control my-2" id="reg-valor-cobrado" placeholder="15.00" value="15.00" required>
      <label for="reg-custo" class="form-label">Custo (R$)</label>
      <input type="number" step="0.01" class="form-control my-2" id="reg-custo" placeholder="6.00" value="6.00" required>
      <button type="submit" class="btn btn-primary">Cadastrar Cliente</button>
    </form>
  `;
  modal.style.display = 'block';
  
  document.getElementById('registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('reg-name').value;
    const vencimento = document.getElementById('reg-vencimento').value;
    const servico = document.getElementById('reg-servico').value;
    const whatsapp = '+55' + document.getElementById('reg-whatsapp').value;
    const observacoes = document.getElementById('reg-observacoes').value;
    const valor_cobrado = document.getElementById('reg-valor-cobrado').value;
    const custo = document.getElementById('reg-custo').value;
    
    if (!/^\d{11}$/.test(document.getElementById('reg-whatsapp').value)) {
      alert('O número de WhatsApp deve conter exatamente 11 dígitos.');
      return;
    }
    
    const client = { name, vencimento, servico, whatsapp, observacoes, valor_cobrado, custo };
    
    try {
      const response = await fetch('/clientes/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      const data = await response.json();
      alert(data.message);
      await fetchClients();
      modal.style.display = 'none';
      window.location.reload();
    } catch (error) {
      alert('Erro ao adicionar cliente');
    }
  });
};

// Função para exibir o formulário de edição da mensagem padrão do WhatsApp
window.displayEditMessageForm = async function() {
  try {
    const response = await fetch('/clientes/get-message');
    const data = await response.json();
    let currentMessage = data.message || '';
    
    modalBody.innerHTML = `
      <h2>Editar Mensagem Padrão do WhatsApp</h2>
      <form id="edit-message-form">
        <textarea class="form-control my-2" id="default-message" rows="4" placeholder="Digite a mensagem padrão">${currentMessage}</textarea>
        <button type="submit" class="btn btn-primary">Salvar Mensagem</button>
      </form>
    `;
    modal.style.display = 'block';
    
    document.getElementById('edit-message-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      let newMessage = document.getElementById('default-message').value;
      if(newMessage.trim() === '') {
        alert('A mensagem não pode estar vazia.');
        return;
      }
      const saveResponse = await fetch('/clientes/save-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });
      const saveData = await saveResponse.json();
      if(saveResponse.ok) {
        alert(saveData.message);
        modal.style.display = 'none';
      } else {
        alert('Erro ao salvar a mensagem padrão.');
      }
    });
  } catch (error) {
    console.error('Erro ao editar mensagem padrão:', error);
    alert('Erro ao editar mensagem padrão.');
  }
};

// Função para exibir o formulário de edição de cliente
window.showEditForm = function(clientId, name, vencimento, servico, whatsapp, observacoes, valor_cobrado, custo) {
  const editHtml = `
    <h3>Editar Cliente</h3>
    <form id="edit-form-${clientId}">
      <input type="text" class="form-control my-2" id="edit-name-${clientId}" value="${name}" placeholder="Nome">
      <input type="date" class="form-control my-2" id="edit-vencimento-${clientId}" value="${vencimento}" placeholder="Vencimento">
      <input type="text" class="form-control my-2" id="edit-servico-${clientId}" value="${servico}" placeholder="Serviço">
      <input type="text" class="form-control my-2" id="edit-whatsapp-${clientId}" value="${whatsapp}" placeholder="WhatsApp">
      <textarea class="form-control my-2" id="edit-observacoes-${clientId}" placeholder="Observações">${observacoes}</textarea>
      <label for="edit-valor-cobrado-${clientId}" class="form-label">Valor Cobrado (R$)</label>
      <input type="number" step="0.01" class="form-control my-2" id="edit-valor-cobrado-${clientId}" value="${valor_cobrado}" placeholder="15.00" required>
      <label for="edit-custo-${clientId}" class="form-label">Custo (R$)</label>
      <input type="number" step="0.01" class="form-control my-2" id="edit-custo-${clientId}" value="${custo}" placeholder="6.00" required>
      <button type="submit" class="btn btn-primary">Salvar</button>
      <button type="button" class="btn btn-secondary" onclick="hideEditForm(${clientId})">Cancelar</button>
    </form>
  `;
  modalBody.innerHTML = editHtml;
  document.getElementById(`edit-form-${clientId}`).addEventListener('submit', async (e) => {
    e.preventDefault();
    await editClient(clientId);
  });
  modal.style.display = 'block';
};

window.hideEditForm = function() {
  modal.style.display = 'none';
};

window.sendWhatsAppMessage = async function(whatsapp, clientId) {
  try {
    const response = await fetch('/clientes/get-message');
    const data = await response.json();
    if (!response.ok) {
      alert('Nenhuma mensagem padrão foi configurada.');
      return;
    }
    const vencimento = await getClientVencimento(clientId);
    if (!vencimento) {
      alert('Data de vencimento não encontrada.');
      return;
    }
    const vencimentoDate = new Date(vencimento);
    const formattedDate = vencimentoDate.toLocaleDateString('pt-BR');
    const message = `${data.message} Vencimento: ${formattedDate}`;
    const whatsappLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  } catch (error) {
    console.error('Erro ao enviar mensagem pelo WhatsApp:', error);
    alert('Erro ao enviar mensagem pelo WhatsApp.');
  }
};

// Funções de filtragem
function filterVencidos(clients) {
  const today = new Date().setHours(0, 0, 0, 0);
  return clients.filter(client => {
    const venc = new Date(client.vencimento).setHours(0, 0, 0, 0);
    return venc < today;
  });
}

function filterVence3(clients) {
  const today = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);
  return clients.filter(client => {
    const venc = new Date(client.vencimento);
    return venc >= today && venc <= threeDaysLater;
  });
}

function filterEmDias(clients) {
  const today = new Date().setHours(0, 0, 0, 0);
  const threeDaysLater = new Date();
  threeDaysLater.setDate(new Date().getDate() + 3);
  threeDaysLater.setHours(0, 0, 0, 0);
  return clients.filter(client => {
    const venc = new Date(client.vencimento).setHours(0, 0, 0, 0);
    return venc > threeDaysLater;
  });
}

// Função auxiliar para remover acentuação (para pesquisa)
function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Funções para renderizar o gráfico
function getDaysInCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const labels = [];
  for (let i = 1; i <= days; i++) {
    labels.push(i.toString());
  }
  return labels;
}

function getPredictedPaymentsData() {
  const labels = getDaysInCurrentMonth();
  return labels.map(() => Math.floor(Math.random() * 20) + 1);
}

function renderChart() {
  const ctx = document.getElementById('myChart').getContext('2d');
  const labels = getDaysInCurrentMonth();
  const data = getPredictedPaymentsData();
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Previsão de Pagamentos',
        data: data,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Carregamento Inicial
document.addEventListener('DOMContentLoaded', async () => {
  modal = document.getElementById('modal');
  modalBody = document.getElementById('modal-body');
  
  await fetchClients();
  await updateDashboardCounts();
  
  // Renderiza o gráfico na área designada
  renderChart();
  
  // Recupera o filtro atual salvo (ou usa 'vence3' como padrão)
  let currentCategory = sessionStorage.getItem('currentCategory') || 'vence3';
  
  if (currentCategory === 'vencidos') {
    displayClientsTable(filterVencidos(clients), "Clientes Vencidos");
  } else if (currentCategory === 'vence3') {
    displayClientsTable(filterVence3(clients), "Clientes que Vão Vencer em 3 dias");
  } else if (currentCategory === 'emdias') {
    displayClientsTable(filterEmDias(clients), "Clientes em Dias");
  } else if (currentCategory === 'totalClientes') {
    displayClientsTable(clients, "Total de Clientes");
  } else if (currentCategory === 'cadastro') {
    displayRegistrationForm();
  }
  
  // Eventos para fechar o modal com confirmação
  document.querySelector('.close-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (confirm("Deseja realmente sair? Suas alterações serão perdidas.")) {
        modal.style.display = 'none';
      }
    }
  });
  
  // Eventos dos cards do dashboard
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', async () => {
      const category = card.getAttribute('data-category');
      sessionStorage.setItem('currentCategory', category);
      
      // Para os cards de "custoTotal", "valorApurado" e "lucro", não altera a tabela
      if (category === 'custoTotal' || category === 'valorApurado' || category === 'lucro') {
        return;
      }
      
      await fetchClients();
      let filteredClients = [];
      let title = '';
      
      if (category === 'vencidos') {
        filteredClients = filterVencidos(clients);
        title = "Clientes Vencidos";
      } else if (category === 'vence3') {
        filteredClients = filterVence3(clients);
        title = "Clientes que Vão Vencer em 3 dias";
      } else if (category === 'emdias') {
        filteredClients = filterEmDias(clients);
        title = "Clientes em Dias";
      } else if (category === 'totalClientes') {
        filteredClients = clients;
        title = "Total de Clientes";
      }
      
      displayClientsTable(filteredClients, title);
    });
  });
  
  // Evento para o campo de pesquisa
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      let query = removeAccents(this.value.trim().toLowerCase());
      const filteredClients = clients.filter(client => {
        let normalizedName = removeAccents(client.name.toLowerCase());
        return normalizedName.includes(query);
      });
      displayClientsTable(filteredClients, "Resultado da Pesquisa");
    });
  }
  
  // Eventos para os links da Navbar
  document.getElementById('registerLink').addEventListener('click', (e) => {
    e.preventDefault();
    displayRegistrationForm();
  });
  
  document.getElementById('editMessageLink').addEventListener('click', (e) => {
    e.preventDefault();
    displayEditMessageForm();
  });
});

// Função de Modo Escuro
document.getElementById('darkModeToggle').addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    this.textContent = 'Modo Claro';
  } else {
    this.textContent = 'Modo Escuro';
  }
});

// Função de Logout
document.getElementById('logoutButton').addEventListener('click', function() {
  if (confirm('Deseja realmente sair?')) {
    sessionStorage.clear();
    window.location.href = '/'; // Altere para a rota de login ou logout da sua aplicação
  }
});