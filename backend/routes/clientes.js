const express = require('express');
const db = require('../db/connection');
const router = express.Router();

// Rota para adicionar cliente
// Rota para adicionar cliente (clientes.js)
router.post('/add', (req, res) => {
    const { name, vencimento, servico, whatsapp, observacoes, valor_cobrado, custo } = req.body;

    // Se os valores não forem enviados, utiliza os padrões
    const valorCobrado = valor_cobrado ? parseFloat(valor_cobrado) : 15.00;
    const custoValor = custo ? parseFloat(custo) : 6.00;

    db.query(
        'INSERT INTO clientes (name, vencimento, servico, whatsapp, observacoes, valor_cobrado, custo) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, vencimento, servico, whatsapp, observacoes, valorCobrado, custoValor],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Erro ao adicionar cliente' });
            res.status(201).json({ message: 'Cliente adicionado com sucesso!' });
        }
    );
});


module.exports = router;





router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM clientes WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao excluir cliente' });
        res.status(200).json({ message: 'Cliente excluído com sucesso!' });
    });
});


router.put('/update/:id', (req, res) => {
    const clientId = req.params.id;
    const { name, vencimento, servico, whatsapp, observacoes, valor_cobrado, custo } = req.body;

    const query = `
        UPDATE clientes 
        SET name = ?, vencimento = ?, servico = ?, whatsapp = ?, observacoes = ?, valor_cobrado = ?, custo = ?
        WHERE id = ?
    `;

    db.query(query, [name, vencimento, servico, whatsapp, observacoes, valor_cobrado, custo, clientId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar cliente:', err);
            return res.status(500).json({ error: 'Erro ao atualizar cliente.' });
        }

        res.status(200).json({ message: 'Cliente atualizado com sucesso!' });
    });
});





router.put('/mark-pending/:id', (req, res) => {
    const { id } = req.params;
    db.query('UPDATE clientes SET status = "Não pagou" WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar status' });
        res.status(200).json({ message: 'Cliente marcado como pagamento pendente' });
    });
});


router.put('/mark-paid/:id', (req, res) => {
    const { id } = req.params;
    db.query('UPDATE clientes SET status = "cobrança feita" WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar status' });
        res.status(200).json({ message: 'Cliente marcado como cobrança feita' });
    });
});


router.get('/list', (req, res) => {
    db.query('SELECT * FROM clientes ORDER BY vencimento ASC', (err, results) => {
        if (err) {
            console.error('Erro ao listar clientes:', err);
            return res.status(500).json({ error: 'Erro ao listar clientes.' });
        }

        // Formata a data de vencimento para YYYY-MM-DD antes de enviar ao frontend
        const formattedResults = results.map(cliente => ({
            ...cliente,
            vencimento: cliente.vencimento.toISOString().split('T')[0]
        }));

        res.status(200).json(formattedResults);
    });
});

// Rota para buscar clientes com vencimento próximo
router.get('/alerts', (req, res) => {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    db.query(
        'SELECT * FROM clientes WHERE vencimento BETWEEN ? AND ?',
        [today.toISOString().slice(0, 10), threeDaysLater.toISOString().slice(0, 10)],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Erro ao buscar alertas' });
            res.status(200).json(results);
        }
    );
});



// Salvar mensagem padrão no banco de dados
// Salvar mensagem padrão no banco de dados
router.post('/save-message', (req, res) => {
    const { message } = req.body;

    // Verifica se a mensagem foi recebida
    console.log('Mensagem recebida no servidor:', message);

    if (!message || message.trim() === '') {
        console.log('Mensagem vazia ou inválida.');
        return res.status(400).json({ error: 'A mensagem não pode estar vazia.' });
    }

    db.query(
        'UPDATE config SET whatsapp_message = ? WHERE id = 1',
        [message],
        (err) => {
            if (err) {
                console.error('Erro ao salvar mensagem padrão no banco:', err);
                return res.status(500).json({ error: 'Erro ao salvar mensagem padrão.' });
            }
            console.log('Mensagem padrão salva no banco de dados com sucesso!');
            res.status(200).json({ message: 'Mensagem padrão salva com sucesso!' });
        }
    );
});




// Rota para buscar a mensagem padrão
router.get('/get-message', (req, res) => {
    db.query('SELECT whatsapp_message FROM config WHERE id = 1', (err, results) => {
        if (err) {
            console.error('Erro ao buscar mensagem padrão:', err);
            return res.status(500).json({ error: 'Erro ao buscar mensagem padrão.' });
        }
        res.status(200).json({ message: results[0]?.whatsapp_message || '' });
    });
});


// Rota para buscar a data de vencimento de um cliente pelo ID
router.get('/get-vencimento/:id', (req, res) => {
    const clientId = req.params.id; // Obtém o ID do cliente

    // Consulta ao banco de dados para obter o vencimento do cliente
    db.query('SELECT vencimento FROM clientes WHERE id = ?', [clientId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar data de vencimento:', err);
            return res.status(500).json({ error: 'Erro ao buscar data de vencimento.' });
        }

        // Verifica se encontrou o cliente
        if (results.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        // Retorna a data de vencimento
        res.status(200).json({ vencimento: results[0].vencimento });
    });
});


router.put('/adjust-date/:id', (req, res) => {
    const { id } = req.params;
    const { value, unit } = req.body; // unit deve ser 'DAY' ou 'MONTH'
    
    const validUnits = ['DAY', 'MONTH'];
    if (!validUnits.includes(unit)) {
      return res.status(400).json({ error: 'Unidade inválida. Use DAY ou MONTH.' });
    }
    
    // Como não é possível parametrizar a unidade, ela é injetada após validação
    const query = `UPDATE clientes SET vencimento = DATE_ADD(vencimento, INTERVAL ? ${unit}) WHERE id = ?`;
    
    db.query(query, [value, id], (err) => {
        if (err) {
            console.error('Erro ao ajustar a data:', err);
            return res.status(500).json({ error: 'Erro ao ajustar a data.' });
        }
        db.query('SELECT vencimento FROM clientes WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).json({ error: 'Erro ao buscar data ajustada.' });
            const formattedDate = results[0].vencimento.toISOString().split('T')[0];
            res.status(200).json({ message: `Data ajustada com sucesso!`, vencimento: formattedDate});
        });
    });
});


router.put('/mark-in-day/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'UPDATE clientes SET status = "Pag. em dias" WHERE id = ?',
        [id],
        (err) => {
            if (err) {
                console.error('Erro ao atualizar status para em dias:', err);
                return res.status(500).json({ error: 'Erro ao atualizar status para em dias.' });
            }
            res.status(200).json({ message: 'Cliente marcado como em dias com sucesso!' });
        }
    );
});




router.get('/pagamentos/dias', (req, res) => {
    const query = `
      SELECT DAY(vencimento) AS day, COUNT(*) AS count
      FROM clientes
      GROUP BY DAY(vencimento)
      ORDER BY day
    `;
    
    db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar dados para o gráfico.' });
      
      // Cria um array de 31 posições (dias do mês), iniciando com 0
      const payments = Array(31).fill(0);
      
      // Para cada dia encontrado, atualiza a contagem (ajuste o índice, pois DAY(vencimento) varia de 1 a 31)
      results.forEach(row => {
        payments[row.day - 1] = row.count;
      });
      
      // Cria os rótulos de 1 a 31
      const labels = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
      
      res.status(200).json({ days: labels, payments: payments });
    });
  });
  