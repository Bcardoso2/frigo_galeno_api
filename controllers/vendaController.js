const { pool } = require('../config/database');

// Função auxiliar para baixar estoque animal
async function baixarEstoqueAnimal(connection, produto_id, quantidade_kg) {
  try {
    // Verificar se o produto está associado a algum estoque animal
    const [associacoes] = await connection.query(`
      SELECT pea.*, ea.peso_kg as estoque_atual, ea.parte
      FROM produto_estoque_animal pea
      JOIN estoque_animal ea ON pea.estoque_animal_id = ea.id
      WHERE pea.produto_id = ?
    `, [produto_id]);
    
    if (associacoes.length === 0) {
      console.log(`Produto ${produto_id} não está associado a nenhum estoque animal`);
      return false; // Não há associações, continuar normalmente
    }
    
    // Calcular o total de percentual para normalização
    const totalPercentual = associacoes.reduce((total, assoc) => total + parseFloat(assoc.percentual), 0);
    
    // Baixar estoque proporcional em cada estoque animal associado
    for (const assoc of associacoes) {
      // Normalizar o percentual caso o total seja diferente de 100%
      const percentualNormalizado = (parseFloat(assoc.percentual) / totalPercentual) * 100;
      
      // Calcular quantidade a baixar deste estoque específico
      const quantidadeBaixar = (quantidade_kg * percentualNormalizado) / 100;
      
      console.log(`Baixando ${quantidadeBaixar}kg (${percentualNormalizado}%) do estoque animal ${assoc.estoque_animal_id} (${assoc.parte})`);
      
      // Verificar se tem estoque suficiente
      if (parseFloat(assoc.estoque_atual) < quantidadeBaixar) {
        console.warn(`Estoque insuficiente no estoque animal ${assoc.estoque_animal_id}. Disponível: ${assoc.estoque_atual}kg, Necessário: ${quantidadeBaixar}kg`);
        // Continua a operação, baixando o que tem disponível
        await connection.query(
          'UPDATE estoque_animal SET peso_kg = 0 WHERE id = ?',
          [assoc.estoque_animal_id]
        );
      } else {
        // Baixar a quantidade calculada
        await connection.query(
          'UPDATE estoque_animal SET peso_kg = peso_kg - ? WHERE id = ?',
          [quantidadeBaixar, assoc.estoque_animal_id]
        );
      }
      
      // Verificar se o estoque zerou para remover a associação
      const [estoqueAtualizado] = await connection.query(
        'SELECT * FROM estoque_animal WHERE id = ?',
        [assoc.estoque_animal_id]
      );
      
      if (estoqueAtualizado.length > 0 && parseFloat(estoqueAtualizado[0].peso_kg) <= 0) {
        // Remover associação se o estoque zerou
        await connection.query(
          'DELETE FROM produto_estoque_animal WHERE id = ?',
          [assoc.id]
        );
        console.log(`Associação removida devido a estoque zerado: ${assoc.id}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao baixar estoque animal:', error);
    return false; // Erro, mas não impede a venda
  }
}

// Função auxiliar para restaurar estoque animal quando uma venda é cancelada
async function restaurarEstoqueAnimal(connection, produto_id, quantidade_kg) {
  try {
    // Verificar associações disponíveis para este produto
    const [associacoes] = await connection.query(`
      SELECT pea.*, ea.parte
      FROM produto_estoque_animal pea
      JOIN estoque_animal ea ON pea.estoque_animal_id = ea.id
      WHERE pea.produto_id = ?
    `, [produto_id]);
    
    // Se não houver associações, verificar se existem estoques zerados que podem ser restaurados
    if (associacoes.length === 0) {
      // Buscar todos os estoques animais com peso zero
      const [estoquesZerados] = await connection.query(`
        SELECT ea.*
        FROM estoque_animal ea
        WHERE ea.peso_kg = 0
      `);
      
      if (estoquesZerados.length === 0) {
        console.log(`Nenhum estoque animal zerado encontrado para restaurar para o produto ${produto_id}`);
        return false;
      }
      
      // Restaurar o primeiro estoque zerado encontrado (abordagem simplificada)
      // Em um cenário mais complexo, poderia haver lógica para decidir qual estoque restaurar
      const estoqueParaRestaurar = estoquesZerados[0];
      
      // Restaurar o peso
      await connection.query(
        'UPDATE estoque_animal SET peso_kg = peso_kg + ? WHERE id = ?',
        [quantidade_kg, estoqueParaRestaurar.id]
      );
      
      // Criar nova associação
      await connection.query(
        'INSERT INTO produto_estoque_animal (produto_id, estoque_animal_id, percentual) VALUES (?, ?, 100)',
        [produto_id, estoqueParaRestaurar.id]
      );
      
      console.log(`Estoque animal ${estoqueParaRestaurar.id} restaurado com ${quantidade_kg}kg para o produto ${produto_id}`);
      return true;
    }
    
    // Calcular o total de percentual para normalização
    const totalPercentual = associacoes.reduce((total, assoc) => total + parseFloat(assoc.percentual), 0);
    
    // Restaurar estoque proporcional em cada estoque animal associado
    for (const assoc of associacoes) {
      // Normalizar o percentual caso o total seja diferente de 100%
      const percentualNormalizado = (parseFloat(assoc.percentual) / totalPercentual) * 100;
      
      // Calcular quantidade a restaurar neste estoque específico
      const quantidadeRestaurar = (quantidade_kg * percentualNormalizado) / 100;
      
      console.log(`Restaurando ${quantidadeRestaurar}kg (${percentualNormalizado}%) no estoque animal ${assoc.estoque_animal_id} (${assoc.parte})`);
      
      // Restaurar o estoque
      await connection.query(
        'UPDATE estoque_animal SET peso_kg = peso_kg + ? WHERE id = ?',
        [quantidadeRestaurar, assoc.estoque_animal_id]
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao restaurar estoque animal:', error);
    return false;
  }
}

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

      // Baixar também do estoque animal, se houver associação
      await baixarEstoqueAnimal(connection, produtoId, quantidadeKg);
  
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

      // Baixar também do estoque animal, se houver associação
      await baixarEstoqueAnimal(connection, produto_id, quantidade_kg);
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
    // Obter a data de hoje no formato compatível com MySQL
    const hoje = new Date();
    const dataHoje = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    console.log('Buscando resumo para a data:', dataHoje);
    
    // Consulta principal - usando a estrutura real da tabela
    const [vendas] = await pool.query(`
      SELECT v.*, vi.quantidade_kg, vi.preco_kg, vi.valor_total as item_valor_total,
             p.nome as produto_nome
      FROM vendas v
      JOIN venda_itens vi ON v.id = vi.venda_id
      JOIN produtos p ON vi.produto_id = p.id
      WHERE DATE(v.data_hora) = ? AND v.finalizada = 1
    `, [dataHoje]);
    
    console.log(`Encontradas ${vendas.length} vendas para hoje`);
    
    // Caso não haja vendas hoje
    if (vendas.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          data: dataHoje,
          totalVendas: 0,
          totalValor: 0,
          totalQuantidade: 0,
          ticketMedio: 0,
          valorMedioKg: 0,
          porFormaPagamento: {},
          topProdutos: []
        }
      });
    }
    
    // Calcular totais
    const totalVendas = vendas.length;
    const totalValor = vendas.reduce((acc, venda) => {
      return acc + parseFloat(venda.valor_total || 0);
    }, 0);
    
    // Calcular quantidade total de kg vendidos
    let totalQuantidade = 0;
    const produtosVendidos = {};
    
    vendas.forEach(venda => {
      const quantidadeKg = parseFloat(venda.quantidade_kg || 0);
      const valorItem = parseFloat(venda.item_valor_total || 0);
      const produtoNome = venda.produto_nome || 'Produto desconhecido';
      
      totalQuantidade += quantidadeKg;
      
      if (!produtosVendidos[produtoNome]) {
        produtosVendidos[produtoNome] = {
          nome: produtoNome,
          quantidade: 0,
          valor: 0
        };
      }
      
      produtosVendidos[produtoNome].quantidade += quantidadeKg;
      produtosVendidos[produtoNome].valor += valorItem;
    });
    
    // Calcular métricas
    const ticketMedio = totalVendas > 0 ? totalValor / totalVendas : 0;
    const valorMedioKg = totalQuantidade > 0 ? totalValor / totalQuantidade : 0;
    
    // Agrupar por forma de pagamento
    const [pagamentos] = await pool.query(`
      SELECT forma_pagamento, SUM(valor_total) as total
      FROM vendas
      WHERE DATE(data_hora) = ? AND finalizada = 1
      GROUP BY forma_pagamento
    `, [dataHoje]);
    
    const porFormaPagamento = pagamentos.reduce((acc, pagamento) => {
      acc[pagamento.forma_pagamento] = parseFloat(pagamento.total || 0);
      return acc;
    }, {});
    
    // Top 5 produtos mais vendidos
    const topProdutos = Object.values(produtosVendidos)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    
    res.status(200).json({
      success: true,
      data: {
        data: dataHoje,
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
    console.error('Erro detalhado ao buscar resumo diário:', error);
    
    // Fornecer mais detalhes sobre o erro para depuração
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar resumo diário',
      error: error.message
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
      
      // Restaurar também o estoque animal, se houver associação
      await restaurarEstoqueAnimal(connection, item.produto_id, item.quantidade_kg);
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
