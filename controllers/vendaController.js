const { pool } = require('../config/database');

// @desc    Registrar uma venda
// @route   POST /api/vendas
// @access  Privado
const registrarVenda = async (req, res) => {
    const connection = await pool.getConnection();
  
    try {
      console.log('Corpo da requisição:', req.body);
  
      const { produto_id, quantidade_vendida, usuario_id, forma_pagamento } = req.body;
  
      // Log detalhado dos valores recebidos
      console.log('produto_id:', produto_id);
      console.log('quantidade_vendida:', quantidade_vendida);
      console.log('usuario_id:', usuario_id);
      console.log('forma_pagamento:', forma_pagamento);
  
      // Validar entrada com logs detalhados
      if (!produto_id) {
        console.log('Erro: produto_id está indefinido');
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Produto não especificado'
        });
      }
  
      if (quantidade_vendida === undefined || quantidade_vendida === null) {
        console.log('Erro: quantidade_vendida está indefinida');
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Quantidade não especificada'
        });
      }
  
      if (!usuario_id) {
        console.log('Erro: usuario_id está indefinido');
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Usuário não especificado'
        });
      }
  
      // Converter para números, se necessário
      const produtoId = Number(produto_id);
      const quantidadeKg = Number(quantidade_vendida);
      const usuarioId = Number(usuario_id);
  
      // Verificar se as conversões são válidas
      if (isNaN(produtoId) || isNaN(quantidadeKg) || isNaN(usuarioId)) {
        console.log('Erro: Conversão de valores inválida');
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos para registro de venda'
        });
      }
  
      // Iniciar transação
      await connection.beginTransaction();
  
      // Verificar se o produto existe
      const [produtos] = await connection.query('SELECT * FROM produtos WHERE id = ?', [produtoId]);
      if (produtos.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }
      const produto = produtos[0];
  
      // Verificar estoque disponível
      const [estoques] = await connection.query('SELECT * FROM estoque WHERE produto_id = ?', [produtoId]);
      if (estoques.length === 0 || estoques[0].quantidade_kg < quantidadeKg) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Estoque insuficiente'
        });
      }
      const estoque = estoques[0];
  
      // Calcular valor total
      const valorTotal = Number(produto.preco_kg * quantidadeKg).toFixed(2);
  
      // Inserir venda
      const [vendaResult] = await connection.query(
        'INSERT INTO vendas (usuario_id, data_hora, valor_total, forma_pagamento, finalizada) VALUES (?, NOW(), ?, ?, 1)',
        [usuarioId, valorTotal, forma_pagamento || 'dinheiro']
      );
      const vendaId = vendaResult.insertId;
  
      // Inserir item da venda
      await connection.query(
        'INSERT INTO venda_itens (venda_id, produto_id, quantidade_kg, preco_kg, valor_total) VALUES (?, ?, ?, ?, ?)',
        [vendaId, produtoId, quantidadeKg, produto.preco_kg, valorTotal]
      );
  
      // Atualizar estoque
      await connection.query(
        'UPDATE estoque SET quantidade_kg = quantidade_kg - ?, data_atualizacao = NOW() WHERE produto_id = ?',
        [quantidadeKg, produtoId]
      );
  
      // Commit da transação
      await connection.commit();
      connection.release();
  
      // Buscar venda completa
      const [vendas] = await pool.query(`
        SELECT v.*, 
               u.nome as usuario_nome, 
               vi.quantidade_kg, 
               vi.preco_kg, 
               vi.valor_total as item_valor_total,
               p.nome as produto_nome
        FROM vendas v
        JOIN usuarios u ON v.usuario_id = u.id
        JOIN venda_itens vi ON v.id = vi.venda_id
        JOIN produtos p ON vi.produto_id = p.id
        WHERE v.id = ?
      `, [vendaId]);
  
      res.status(201).json({
        success: true,
        data: vendas[0]
      });
    } catch (error) {
      // Garantir rollback em caso de erro
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error('Erro ao registrar venda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar venda'
      });
    }
  };

// @desc    Registrar venda com múltiplos itens
// @route   POST /api/vendas/completa
// @access  Privado
const registrarVendaCompleta = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { itens, usuario_id, forma_pagamento, observacao } = req.body;
    
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'É necessário informar pelo menos um item'
      });
    }
    
    // Iniciar transação
    await connection.beginTransaction();
    
    // Calcular valor total da venda
    let valorTotal = 0;
    
    // Criar a venda principal
    const [vendaResult] = await connection.query(
      'INSERT INTO vendas (usuario_id, valor_total, forma_pagamento, observacao, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [usuario_id, 0, forma_pagamento || 'dinheiro', observacao]
    );
    const vendaId = vendaResult.insertId;
    
    // Processar cada item
    for (const item of itens) {
      const { produto_id, quantidade_kg } = item;
      
      // Verificar produto
      const [produtos] = await connection.query('SELECT * FROM produtos WHERE id = ?', [produto_id]);
      if (produtos.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: `Produto ${produto_id} não encontrado`
        });
      }
      const produto = produtos[0];
      
      // Verificar estoque
      const [estoques] = await connection.query('SELECT * FROM estoque WHERE produto_id = ?', [produto_id]);
      if (estoques.length === 0 || estoques[0].quantidade_kg < quantidade_kg) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Estoque insuficiente para o produto ${produto.nome}`
        });
      }
      
      // Calcular valor do item
      const valorItem = produto.preco_kg * quantidade_kg;
      valorTotal += valorItem;
      
      // Criar item da venda
      await connection.query(
        'INSERT INTO venda_itens (venda_id, produto_id, quantidade_kg, preco_kg, valor_total, codigo_barras, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [vendaId, produto_id, quantidade_kg, produto.preco_kg, valorItem, item.codigo_barras]
      );
      
      // Atualizar estoque
      await connection.query(
        'UPDATE estoque SET quantidade_kg = quantidade_kg - ?, data_atualizacao = NOW() WHERE produto_id = ?',
        [quantidade_kg, produto_id]
      );
    }
    
    // Atualizar valor total da venda
    await connection.query(
      'UPDATE vendas SET valor_total = ? WHERE id = ?',
      [valorTotal, vendaId]
    );
    
    // Commit da transação
    await connection.commit();
    connection.release();
    
    // Buscar venda completa
    const [vendas] = await pool.query(`
      SELECT v.*, 
             u.nome as usuario_nome, 
             vi.quantidade_kg, 
             vi.preco_kg, 
             vi.valor_total as item_valor_total,
             p.nome as produto_nome
      FROM vendas v
      JOIN usuarios u ON v.usuario_id = u.id
      JOIN venda_itens vi ON v.id = vi.venda_id
      JOIN produtos p ON vi.produto_id = p.id
      WHERE v.id = ?
    `, [vendaId]);

    res.status(201).json({
      success: true,
      data: vendas[0]
    });
  } catch (error) {
    // Garantir rollback em caso de erro
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Erro ao registrar venda completa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar venda'
    });
  }
};

// @desc    Listar vendas com filtro de data opcional
// @route   GET /api/vendas
// @access  Privado
const listarVendas = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    let queryString = `
      SELECT v.*, 
             u.nome as usuario_nome, 
             vi.quantidade_kg, 
             vi.preco_kg, 
             vi.valor_total as item_valor_total,
             p.nome as produto_nome
      FROM vendas v
      JOIN usuarios u ON v.usuario_id = u.id
      JOIN venda_itens vi ON v.id = vi.venda_id
      JOIN produtos p ON vi.produto_id = p.id
    `;
    let whereConditions = [];
    let queryParams = [];

    if (data_inicio && data_fim) {
      whereConditions.push('v.createdAt BETWEEN ? AND ?');
      queryParams.push(new Date(data_inicio), new Date(data_fim));
    } else if (data_inicio) {
      whereConditions.push('v.createdAt >= ?');
      queryParams.push(new Date(data_inicio));
    } else if (data_fim) {
      whereConditions.push('v.createdAt <= ?');
      queryParams.push(new Date(data_fim));
    }

    if (whereConditions.length > 0) {
      queryString += ' WHERE ' + whereConditions.join(' AND ');
    }

    queryString += ' ORDER BY v.createdAt DESC';

    const [vendas] = await pool.query(queryString, queryParams);

    res.status(200).json({
      success: true,
      count: vendas.length,
      data: vendas
    });
  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar vendas'
    });
  }
};

// @desc    Obter resumo das vendas do dia
// @route   GET /api/vendas/resumo-dia
// @access  Privado
const getResumoDiario = async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const [vendas] = await pool.query(`
      SELECT v.*, vi.quantidade_kg, vi.preco_kg, vi.valor_total as item_valor_total,
             p.nome as produto_nome
      FROM vendas v
      JOIN venda_itens vi ON v.id = vi.venda_id
      JOIN produtos p ON vi.produto_id = p.id
      WHERE v.createdAt >= ? AND v.createdAt < ? AND v.cancelada = FALSE
    `, [hoje, amanha]);
    
    // Calcular totais
    const totalVendas = vendas.length;
    const totalValor = vendas.reduce((acc, venda) => acc + venda.valor_total, 0);
    
    // Calcular quantidade total de kg vendidos
    let totalQuantidade = 0;
    const produtosVendidos = {};
    
    vendas.forEach(venda => {
      const item = {
        quantidade_kg: venda.quantidade_kg,
        valor_total: venda.item_valor_total,
        produto_nome: venda.produto_nome
      };
      
      totalQuantidade += item.quantidade_kg;
      
      const produtoId = item.produto_nome;
      if (!produtosVendidos[produtoId]) {
        produtosVendidos[produtoId] = {
          nome: item.produto_nome,
          quantidade: 0,
          valor: 0
        };
      }
      
      produtosVendidos[produtoId].quantidade += item.quantidade_kg;
      produtosVendidos[produtoId].valor += item.valor_total;
    });
    
    // Calcular métricas
    const ticketMedio = totalVendas > 0 ? totalValor / totalVendas : 0;
    const valorMedioKg = totalQuantidade > 0 ? totalValor / totalQuantidade : 0;
    
    // Agrupar por forma de pagamento
    const [pagamentos] = await pool.query(`
      SELECT forma_pagamento, SUM(valor_total) as total
      FROM vendas
      WHERE createdAt >= ? AND createdAt < ? AND cancelada = FALSE
      GROUP BY forma_pagamento
    `, [hoje, amanha]);
    
    const porFormaPagamento = pagamentos.reduce((acc, pagamento) => {
      acc[pagamento.forma_pagamento] = pagamento.total;
      return acc;
    }, {});
    
    // Top 5 produtos mais vendidos
    const topProdutos = Object.values(produtosVendidos)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    
    res.status(200).json({
      success: true,
      data: {
        data: hoje,
        totalVendas,
        totalValor,
        totalQuantidade,
        ticketMedio,
        valorMedioKg,
        porFormaPagamento,
        topProdutos
      }
    });
  } catch (error) {
    console.error('Erro ao buscar resumo diário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar resumo diário'
    });
  }
};

// @desc    Obter detalhes de uma venda
// @route   GET /api/vendas/:id
// @access  Privado
const getVenda = async (req, res) => {
  try {
    const [vendas] = await pool.query(`
      SELECT v.*, 
             u.nome as usuario_nome, 
             vi.quantidade_kg, 
             vi.preco_kg, 
             vi.valor_total as item_valor_total,
             p.nome as produto_nome
      FROM vendas v
      JOIN usuarios u ON v.usuario_id = u.id
      JOIN venda_itens vi ON v.id = vi.venda_id
      JOIN produtos p ON vi.produto_id = p.id
      WHERE v.id = ?
    `, [req.params.id]);
    
    if (vendas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vendas[0]
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes da venda'
    });
}
};

// @desc    Cancelar uma venda
// @route   PUT /api/vendas/:id/cancelar
// @access  Privado
const cancelarVenda = async (req, res) => {
const connection = await pool.getConnection();

try {
  const { id } = req.params;
  const { motivo } = req.body;
  
  // Iniciar transação
  await connection.beginTransaction();
  
  // Verificar se a venda existe
  const [vendas] = await connection.query('SELECT * FROM vendas WHERE id = ?', [id]);
  
  if (vendas.length === 0) {
    await connection.rollback();
    connection.release();
    return res.status(404).json({
      success: false,
      message: 'Venda não encontrada'
    });
  }
  
  const venda = vendas[0];
  
  // Verificar se a venda já foi cancelada
  if (venda.cancelada) {
    await connection.rollback();
    connection.release();
    return res.status(400).json({
      success: false,
      message: 'Venda já cancelada'
    });
  }
  
  // Buscar itens da venda
  const [itens] = await connection.query('SELECT * FROM venda_itens WHERE venda_id = ?', [id]);
  
  // Restaurar estoque para cada item
  for (const item of itens) {
    await connection.query(
      'UPDATE estoque SET quantidade_kg = quantidade_kg + ?, data_atualizacao = NOW() WHERE produto_id = ?',
      [item.quantidade_kg, item.produto_id]
    );
  }
  
  // Marcar venda como cancelada
  await connection.query(
    'UPDATE vendas SET cancelada = TRUE, motivo_cancelamento = ?, updatedAt = NOW() WHERE id = ?',
    [motivo || 'Não informado', id]
  );
  
  // Commit da transação
  await connection.commit();
  connection.release();
  
  // Buscar venda atualizada
  const [vendaAtualizada] = await pool.query(`
    SELECT v.*, 
           u.nome as usuario_nome, 
           vi.quantidade_kg, 
           vi.preco_kg, 
           vi.valor_total as item_valor_total,
           p.nome as produto_nome
    FROM vendas v
    JOIN usuarios u ON v.usuario_id = u.id
    JOIN venda_itens vi ON v.id = vi.venda_id
    JOIN produtos p ON vi.produto_id = p.id
    WHERE v.id = ?
  `, [id]);
  
  res.status(200).json({
    success: true,
    data: vendaAtualizada[0]
  });
} catch (error) {
  // Garantir rollback em caso de erro
  if (connection) {
    await connection.rollback();
    connection.release();
  }
  console.error('Erro ao cancelar venda:', error);
  res.status(500).json({
    success: false,
    message: 'Erro ao cancelar venda'
  });
}
};

// Exportar todos os métodos do controller
module.exports = {
registrarVenda,
registrarVendaCompleta,
listarVendas,
getResumoDiario,
getVenda,
cancelarVenda
};