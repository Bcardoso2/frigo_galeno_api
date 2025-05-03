// controllers/produtoEstoqueController.js
const { pool } = require('../config/database');

// @desc    Associar produto a um estoque animal com percentual
// @route   POST /api/produtos-estoque
// @access  Privado/Admin
exports.associarProdutoEstoque = async (req, res) => {
  try {
    const { produto_id, estoque_animal_tipo_id, percentual = 100 } = req.body;
    
    // Verificar se o produto existe
    const [produtos] = await pool.query(
      'SELECT * FROM produtos WHERE id = ?', 
      [produto_id]
    );
    
    if (produtos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }
    
    // Verificar se o tipo de estoque animal existe
    const [estoqueAnimalTipo] = await pool.query(
      'SELECT * FROM estoque_animal_tipo WHERE id = ?', 
      [estoque_animal_tipo_id]
    );
    
    if (estoqueAnimalTipo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de estoque animal não encontrado'
      });
    }
    
    // Verificar se já existe essa associação
    const [associacaoExistente] = await pool.query(
      'SELECT * FROM produto_estoque_animal WHERE produto_id = ? AND estoque_animal_tipo_id = ?',
      [produto_id, estoque_animal_tipo_id]
    );
    
    if (associacaoExistente.length > 0) {
      // Atualizar o percentual da associação existente
      await pool.query(
        'UPDATE produto_estoque_animal SET percentual = ? WHERE produto_id = ? AND estoque_animal_tipo_id = ?',
        [percentual, produto_id, estoque_animal_tipo_id]
      );
    } else {
      // Criar nova associação
      await pool.query(
        'INSERT INTO produto_estoque_animal (produto_id, estoque_animal_tipo_id, percentual) VALUES (?, ?, ?)',
        [produto_id, estoque_animal_tipo_id, percentual]
      );
    }
    
    // Buscar todas as associações do produto
    const [associacoes] = await pool.query(`
      SELECT pea.*, eat.parte, eat.peso_total_kg
      FROM produto_estoque_animal pea
      JOIN estoque_animal_tipo eat ON pea.estoque_animal_tipo_id = eat.id
      WHERE pea.produto_id = ?
      ORDER BY pea.percentual DESC
    `, [produto_id]);
    
    res.status(200).json({
      success: true,
      message: 'Produto associado ao estoque animal com sucesso',
      data: associacoes
    });
  } catch (error) {
    console.error('Erro ao associar produto ao estoque animal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao associar produto ao estoque animal'
    });
  }
};

// @desc    Remover associação de produto com estoque animal
// @route   DELETE /api/produtos-estoque/:id
// @access  Privado/Admin
exports.removerAssociacao = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se associação existe
    const [associacao] = await pool.query(
      'SELECT * FROM produto_estoque_animal WHERE id = ?',
      [id]
    );
    
    if (associacao.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Associação não encontrada'
      });
    }
    
    // Remover associação
    await pool.query(
      'DELETE FROM produto_estoque_animal WHERE id = ?',
      [id]
    );
    
    res.status(200).json({
      success: true,
      message: 'Associação removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover associação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover associação'
    });
  }
};

// @desc    Listar associações de um produto
// @route   GET /api/produtos-estoque/produto/:produtoId
// @access  Privado
exports.listarAssociacoesProduto = async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const [associacoes] = await pool.query(`
      SELECT pea.*, eat.parte, eat.peso_total_kg
      FROM produto_estoque_animal pea
      JOIN estoque_animal_tipo eat ON pea.estoque_animal_tipo_id = eat.id
      WHERE pea.produto_id = ?
      ORDER BY pea.percentual DESC
    `, [produtoId]);
    
    res.status(200).json({
      success: true,
      count: associacoes.length,
      data: associacoes
    });
  } catch (error) {
    console.error('Erro ao listar associações do produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar associações do produto'
    });
  }
};
