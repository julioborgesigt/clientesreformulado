// Variáveis globais
let clients = [];
let modal, modalBody;

// Função para buscar clientes do backend
async function fetchClients() {
  try {
    const response = await fetch('/clientes/list');
    clients = await response.json();
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
  }
}

// --- Funções globais para ações dos clientes ---

// Atualizamos a função adjustDate para receber (clientId, value, unit)
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
      await fetchClients();
    } catch (error) {
      console.error('Erro ao ajustar a data:', error);
      alert('Erro ao ajustar a data.');
    }
  };

window.markAsPending = async function(id) {
  try {
    const response = await fetch(`/clientes/mark-pending/${id}`, {
      method: 'PUT'
    });
    const data = await response.json();
    alert(data.message);
    await fetchClients();
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao marcar como pagamento pendente.');
  }
};

window.markAsPaid = async function(id) {
  try {
    const response = await fetch(`/clientes/mark-paid/${id}`, {
      method: 'PUT'
    });
    const data = await response.json();
    alert(data.message);
    await fetchClients();
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao marcar como cobrança feita.');
  }
};

window.markAsInDay = async function(id) {
  try {
    const response = await fetch(`/clientes/mark-in-day/${id}`, {
      method: 'PUT'
    });
    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || 'Erro ao marcar como em dias.');
      return;
    }
    const data = await response.json();
    alert(data.message);
    await fetchClients();
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao atualizar status.');
  }
};

window.deleteClient = async function(id) {
  try {
    const response = await fetch(`/clientes/delete/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    alert(data.message);
    await fetchClients();
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

    // Caso os valores sejam NaN, mantém os padrões 15.00 e 6.00
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
            await fetchClients();
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

// --- Funções para exibir conteúdo no modal ---

// Na função displayClientsModal, substitua o trecho dos botões por:
// Atualiza a exibição de cada cliente no modal adicionando um data attribute
function displayClientsModal(clientList, title) {
    modalBody.innerHTML = `<h2>${title}</h2>`;
    if (clientList.length === 0) {
      modalBody.innerHTML += '<p>Nenhum cliente encontrado.</p>';
    } else {
      clientList.forEach(client => {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.setAttribute('data-client-id', client.id); // identificador do cliente
        
        // Define a cor de fundo de acordo com o status (conforme já implementado)
        let bgColor = "#fff"; // cor padrão
        const status = (client.status || "").toLowerCase();
        if (status === "pag. cobrado") {
          bgColor = "#f44336"; // vermelho
        } else if (status === "cobrança feita") {
          bgColor = "#ff9800"; // laranja
        } else if (status === "pag. em dias") {
          bgColor = "#1E7E34"; // verde
        }
        card.style.backgroundColor = bgColor;
        
        card.innerHTML = `
          <div class="client-details">
            <p><strong>${client.name}</strong> - ${client.vencimento.split('-').reverse().join('-')}</p>
            <p>Serviço: ${client.servico}</p>
            <p>WhatsApp: ${client.whatsapp}</p>
            <p>Observações: ${client.observacoes}</p>
            <p>Valor Cobrado: R$${parseFloat(client.valor_cobrado).toFixed(2)}</p>
            <p>Custo: R$${parseFloat(client.custo).toFixed(2)}</p>
            <p class="status-text">Status: ${client.status || 'N/A'}</p>
          </div>
          <div class="client-actions">
            <div class="button-row">
              <button class="pendente" onclick="markAsPending(${client.id})">Pag. pendente</button>
              <button class="cobranca" onclick="markAsPaid(${client.id})">Cobrança feita</button>
              <button class="em-dias" onclick="markAsInDay(${client.id})">Pag. em dias</button>
             <button class="editar" onclick="showEditForm(${client.id}, '${client.name}', '${client.vencimento}', '${client.servico}', '${client.whatsapp}', '${client.observacoes}', ${client.valor_cobrado}, ${client.custo})">Editar</button>


              <button class="whatsapp" onclick="sendWhatsAppMessage('${client.whatsapp}', '${client.id}')">WhatsApp</button>
            </div>
            <div class="button-row">
              <button class="excluir" onclick="deleteClient(${client.id})">Excluir</button>
              <button class="add-1M" onclick="adjustDate(${client.id}, 1, 'MONTH')">+1M</button>
              <button class="sub-1M" onclick="adjustDate(${client.id}, -1, 'MONTH')">-1M</button>
              <button class="add-1" onclick="adjustDate(${client.id}, 1, 'DAY')">+1 dia</button>
              <button class="sub-1" onclick="adjustDate(${client.id}, -1, 'DAY')">-1 dia</button>
            </div>
          </div>
        `;
        modalBody.appendChild(card);
      });
    }
    modal.style.display = 'block';
  }
  
  
  
  // Função para atualizar o fundo do card de acordo com o status
  function updateCardBackground(clientId, color, newStatus) {
    const card = document.querySelector(`.client-card[data-client-id="${clientId}"]`);
    if (card) {
      card.style.backgroundColor = color;
      const statusElem = card.querySelector('.status-text');
      if (statusElem) {
        statusElem.innerHTML = `Status: ${newStatus}`;
      }
    }
  }
  
  window.markAsPending = async function(id) {
    try {
      const response = await fetch(`/clientes/mark-pending/${id}`, { method: 'PUT' });
      const data = await response.json();
      alert(data.message);
      // Atualiza o fundo para vermelho (cor do botão "Pag. pendente")
      updateCardBackground(id, "#f44336", "Pag. cobrado");
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
      // Atualiza o fundo para laranja (cor do botão "Cobrança feita")
      updateCardBackground(id, "#ff9800", "Cobrança feita");
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao marcar como cobrança feita.');
    }
  };
  
  window.markAsInDay = async function(id) {
    try {
      const response = await fetch(`/clientes/mark-in-day/${id}`, { method: 'PUT' });
      const data = await response.json();
      alert(data.message);
      // Atualiza o fundo para verde (cor do botão "Pag. em dias")
      updateCardBackground(id, "#1E7E34", "Pag. em dias");
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao marcar como pagamento em dias.');
    }
  };
  
  
  window.showEditForm = function(clientId, name, vencimento, servico, whatsapp, observacoes, valor_cobrado, custo) {
    const editHtml = `
      <h3>Editar Cliente</h3>
      <form id="edit-form-${clientId}">
        <input type="text" id="edit-name-${clientId}" value="${name}" placeholder="Nome">
        <input type="date" id="edit-vencimento-${clientId}" value="${vencimento}" placeholder="Vencimento">
        <input type="text" id="edit-servico-${clientId}" value="${servico}" placeholder="Serviço">
        <input type="text" id="edit-whatsapp-${clientId}" value="${whatsapp}" placeholder="WhatsApp">
        <textarea id="edit-observacoes-${clientId}" placeholder="Observações">${observacoes}</textarea>
        <label for="edit-valor-cobrado-${clientId}">Valor Cobrado (R$)</label>
        <input type="number" step="0.01" id="edit-valor-cobrado-${clientId}" value="${valor_cobrado}" placeholder="15.00" required>
        <label for="edit-custo-${clientId}">Custo (R$)</label>
        <input type="number" step="0.01" id="edit-custo-${clientId}" value="${custo}" placeholder="6.00" required>
        <button type="submit">Salvar</button>
        <button type="button" onclick="hideEditForm(${clientId})">Cancelar</button>
      </form>

    `;
    modalBody.innerHTML = editHtml;
    document.getElementById(`edit-form-${clientId}`).addEventListener('submit', async (e) => {
      e.preventDefault();
      await editClient(clientId);
    });
    modal.style.display = 'block';
  
  
}

// --- Funções de filtragem dos clientes ---

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

// --- Eventos após o carregamento do DOM ---
document.addEventListener('DOMContentLoaded', async () => {
  modal = document.getElementById('modal');
  modalBody = document.getElementById('modal-body');
  await fetchClients();

  // Fechar modal quando clicar no X ou fora do conteúdo
  document.querySelector('.close-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Eventos dos cards do dashboard
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', async () => {
      const category = card.getAttribute('data-category');
      await fetchClients(); // Atualiza a lista de clientes
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
      } else if (category === 'cadastro') {
        // Caso o usuário queira cadastrar, você pode exibir o formulário de cadastro
        displayRegistrationForm();
        return;
      }
      
      // Exibe a tabela com os clientes filtrados
      displayClientsTable(filteredClients, title);
    });
  });
  
});
// Função para atualizar os cards da tela inicial com a quantidade de clientes
// Função para atualizar os cards da tela inicial com as contagens e totais
// Função para atualizar os cards da tela inicial com contagens e totais
async function updateDashboardCounts() {
    await fetchClients(); // Busca a lista de clientes do backend

    // Contagens e totais
    const vencidosCount = filterVencidos(clients).length;
    const vence3Count = filterVence3(clients).length;
    const emdiasCount = filterEmDias(clients).length;
    const custoTotal = clients.reduce((sum, client) => sum + parseFloat(client.custo), 0);
    const valorApurado = clients.reduce((sum, client) => sum + parseFloat(client.valor_cobrado), 0);
    const lucro = valorApurado - custoTotal;

    // Atualização dos cards existentes
    const vencidosCard = document.querySelector('.card[data-category="vencidos"]');
    if (vencidosCard) {
      vencidosCard.innerHTML = `<h2>Vencidos</h2><p class="count">${vencidosCount}</p>`;
    }
    const vence3Card = document.querySelector('.card[data-category="vence3"]');
    if (vence3Card) {
      vence3Card.innerHTML = `<h2>Vence em 3 dias</h2><p class="count">${vence3Count}</p>`;
    }
    const emdiasCard = document.querySelector('.card[data-category="emdias"]');
    if (emdiasCard) {
      emdiasCard.innerHTML = `<h2>Em dias</h2><p class="count">${emdiasCount}</p>`;
    }
    const custoTotalCard = document.querySelector('.card[data-category="custoTotal"]');
    if (custoTotalCard) {
      custoTotalCard.innerHTML = `<h2>Custo Total</h2><p class="count">R$${custoTotal.toFixed(2)}</p>`;
    }
    const valorApuradoCard = document.querySelector('.card[data-category="valorApurado"]');
    if (valorApuradoCard) {
      valorApuradoCard.innerHTML = `<h2>Valor Apurado</h2><p class="count">R$${valorApurado.toFixed(2)}</p>`;
    }
    const lucroCard = document.querySelector('.card[data-category="lucro"]');
    if (lucroCard) {
      lucroCard.innerHTML = `<h2>Lucro</h2><p class="count">R$${lucro.toFixed(2)}</p>`;
    }
    // Novo card: Total de Clientes
    const totalClientesCard = document.querySelector('.card[data-category="totalClientes"]');
    if (totalClientesCard) {
      totalClientesCard.innerHTML = `<h2>Clientes total</h2><p class="count">${clients.length}</p>`;
    }
}

  
  
  // Chama a função ao carregar o DOM
  document.addEventListener('DOMContentLoaded', async () => {
    modal = document.getElementById('modal');
    modalBody = document.getElementById('modal-body');
    await fetchClients();
    await updateDashboardCounts();
  
    // Pré-carrega a tabela de "Clientes que Vão Vencer em 3 dias"
    const filteredClients = filterVence3(clients);
    displayClientsTable(filteredClients, "Clientes que Vão Vencer em 3 dias");
  
    // Eventos dos cards do dashboard
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', async () => {
        const category = card.getAttribute('data-category');
        await fetchClients(); // Atualiza a lista de clientes
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
        } else if (category === 'cadastro') {
          displayRegistrationForm();
          return;
        }
        
        // Exibe a tabela com os clientes filtrados
        displayClientsTable(filteredClients, title);
      });
    });
  });
  
  

  window.displayRegistrationForm = function() {
    modalBody.innerHTML = `
      <h2>Cadastro de Cliente</h2>
      <form id="registration-form">
        <input type="text" id="reg-name" placeholder="Nome do Cliente" required>
        <input type="date" id="reg-vencimento" required>
        <input type="text" id="reg-servico" placeholder="Serviço" required>
        <div class="whatsapp-field">
          <span class="prefix">+55</span>
          <input type="text" id="reg-whatsapp" placeholder="xx912345678" maxlength="11" required>
        </div>
        <textarea id="reg-observacoes" placeholder="Observações"></textarea>
        <label for="reg-valor-cobrado">Valor Cobrado (R$)</label>
        <input type="number" step="0.01" id="reg-valor-cobrado" placeholder="15.00" value="15.00" required>
        <label for="reg-custo">Custo (R$)</label>
        <input type="number" step="0.01" id="reg-custo" placeholder="6.00" value="6.00" required>
        <button type="submit">Cadastrar Cliente</button>
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
      } catch (error) {
        alert('Erro ao adicionar cliente');
      }
    });
  };
  



  function displayClientsTable(clientList, title) {
    // Cria a estrutura básica da tabela
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
    
    // Para cada cliente, gera uma linha com os dados e outra com os botões de ação
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
      </tr>`;
      // Linha adicional para os botões de ação
      tableHtml += `<tr>
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
    
    // Insere o HTML gerado no container da tabela
    document.getElementById('table-container').innerHTML = tableHtml;
  }
  
  