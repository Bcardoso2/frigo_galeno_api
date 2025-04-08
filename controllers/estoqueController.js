// controllers/estoqueController.js
const { pool } = require('../config/database');

// @desc    Atualizar estoque de um produto
// @route   PUT /api/estoque/:produtoId
// @access  Privado/Admin
exports.atualizarEstoque = async (req, res) => {
  try {
    const { produtoId } = req.params;
    const { quantidade_kg } = req.body;

    // Verificar se o produto existe
    const [produtos] = await pool.query('SELECT * FROM produtos WHERE id = ?', [produtoId]);
    if (produtos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Verificar se já existe registro de estoque para este produto
    const [estoques] = await pool.query('SELECT * FROM estoque WHERE produto_id = ?', [produtoId]);

    if (estoques.length > 0) {
      // Atualizar estoque existente
      await pool.query(
        'UPDATE estoque SET quantidade_kg = ?, data_atualizacao = NOW() WHERE produto_id = ?',
        [quantidade_kg, produtoId]
      );
    } else {
      // Criar novo registro de estoque
      await pool.query(
        'INSERT INTO estoque (produto_id, quantidade_kg, data_atualizacao) VALUES (?, ?, NOW())',
        [produtoId, quantidade_kg]
      );
    }

    // Buscar o estoque atualizado
    const [estoqueAtualizado] = await pool.query(
      'SELECT * FROM estoque WHERE produto_id = ?', 
      [produtoId]
    );

    res.status(200).json({
      success: true,
      data: estoqueAtualizado[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar estoque'
    });
  }
};

// @desc    Listar estoque de todos os produtos
// @route   GET /api/estoque
// @access  Privado
exports.listarEstoque = async (req, res) => {
  try {
    const [estoque] = await pool.query(`
      SELECT e.*, p.nome, p.codigo_produto, p.preco_kg, p.ativo 
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
    `);

    res.status(200).json({
      success: true,
      count: estoque.length,
      data: estoque
    });
  } catch (error) {
    console.error('Erro ao listar estoque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar estoque'
    });
  }
};

// @desc    Obter estoque de um produto específico
// @route   GET /api/estoque/:produtoId
// @access  Privado
exports.getEstoqueProduto = async (req, res) => {
  try {
    const { produtoId } = req.params;

    const [estoque] = await pool.query(`
      SELECT e.*, p.nome, p.codigo_produto, p.preco_kg, p.ativo 
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
      WHERE e.produto_id = ?
    `, [produtoId]);

    if (estoque.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estoque não encontrado para este produto'
      });
    }

    res.status(200).json({
      success: true,
      data: estoque[0]
    });
  } catch (error) {
    console.error('Erro ao buscar estoque do produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estoque do produto'
    });
  }
};

// @desc    Obter produtos disponíveis para venda
// @route   GET /api/estoque/disponiveis
// @access  Privado
exports.getProdutosDisponiveis = async (req, res) => {
  try {
    // Buscar produtos com estoque maior que zero e ativos
    const [produtos] = await pool.query(`
      SELECT p.id, p.nome, p.codigo_produto, p.preco_kg, e.quantidade_kg
      FROM produtos p
      JOIN estoque e ON p.id = e.produto_id
      WHERE p.ativo = TRUE AND e.quantidade_kg > 0
    `);

    res.status(200).json({
      success: true,
      count: produtos.length,
      data: produtos
    });
  } catch (error) {
    console.error('Erro ao buscar produtos disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos disponíveis'
    });
  }
};