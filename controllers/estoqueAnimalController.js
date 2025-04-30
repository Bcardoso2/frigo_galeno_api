// controllers/estoqueAnimalController.js
const { pool } = require('../config/database');

// @desc    Adicionar novo item ao estoque animal
// @route   POST /api/estoque-animal
// @access  Privado/Admin
exports.adicionarEstoqueAnimal = async (req, res) => {
  try {
    const { parte, peso_kg, data_entrada, fornecedor } = req.body;

    // Validar dados
    if (!parte || !peso_kg) {
      return res.status(400).json({
        success: false,
        message: 'Parte e peso são campos obrigatórios'
      });
    }
    
    // Validar parte (traseiro ou dianteiro)
    if (parte !== 'traseiro' && parte !== 'dianteiro') {
      return res.status(400).json({
        success: false,
        message: 'Parte deve ser "traseiro" ou "dianteiro"'
      });
    }

    // Formatar data de entrada
    const dataFormatada = data_entrada || new Date().toISOString().split('T')[0];

    // Inserir no banco de dados
    const [result] = await pool.query(
      'INSERT INTO estoque_animal (parte, peso_kg, data_entrada, fornecedor) VALUES (?, ?, ?, ?)',
      [parte, peso_kg, dataFormatada, fornecedor]
    );

    // Buscar o registro inserido
    const [novoEstoque] = await pool.query(
      'SELECT * FROM estoque_animal WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: novoEstoque[0]
    });
  } catch (error) {
    console.error('Erro ao adicionar estoque animal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar estoque animal'
    });
  }
};

// @desc    Listar todos os itens de estoque animal
// @route   GET /api/estoque-animal
// @access  Privado
exports.listarEstoqueAnimal = async (req, res) => {
  try {
    const [estoques] = await pool.query(
      'SELECT * FROM estoque_animal ORDER BY data_entrada DESC'
    );

    res.status(200).json({
      success: true,
      count: estoques.length,
      data: estoques
    });
  } catch (error) {
    console.error('Erro ao listar estoque animal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar estoque animal'
    });
  }
};

// @desc    Obter item específico do estoque animal
// @route   GET /api/estoque-animal/:id
// @access  Privado
exports.getEstoqueAnimalPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [estoque] = await pool.query(
      'SELECT * FROM estoque_animal WHERE id = ?',
      [id]
    );

    if (estoque.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item de estoque não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: estoque[0]
    });
  } catch (error) {
    console.error('Erro ao buscar item de estoque animal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar item de estoque animal'
    });
  }
};

// @desc    Atualizar item do estoque animal
// @route   PUT /api/estoque-animal/:id
// @access  Privado/Admin
exports.atualizarEstoqueAnimal = async (req, res) => {
  try {
    const { id } = req.params;
    const { parte, peso_kg, data_entrada, fornecedor } = req.body;

    // Verificar se o item existe
    const [estoqueExistente] = await pool.query(
      'SELECT * FROM estoque_animal WHERE id = ?',
      [id]
    );

    if (estoqueExistente.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item de estoque não encontrado'
      });
    }

    // Validar parte se foi fornecida
    if (parte && parte !== 'traseiro' && parte !== 'dianteiro') {
      return res.status(400).json({
        success: false,
        message: 'Parte deve ser "traseiro" ou "dianteiro"'
      });
    }

    // Preparar dados para atualização
    const itemAtual = estoqueExistente[0];
    const dadosAtualizados = {
      parte: parte || itemAtual.parte,
      peso_kg: peso_kg || itemAtual.peso_kg,
      data_entrada: data_entrada || itemAtual.data_entrada,
      fornecedor: fornecedor !== undefined ? fornecedor : itemAtual.fornecedor
    };

    // Atualizar no banco de dados
    await pool.query(
      'UPDATE estoque_animal SET parte = ?, peso_kg = ?, data_entrada = ?, fornecedor = ? WHERE id = ?',
      [dadosAtualizados.parte, dadosAtualizados.peso_kg, dadosAtualizados.data_entrada, dadosAtualizados.fornecedor, id]
    );

    // Buscar o registro atualizado
    const [estoqueAtualizado] = await pool.query(
      'SELECT * FROM estoque_animal WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      data: estoqueAtualizado[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar estoque animal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar estoque animal'
    });
  }
};

// @desc    Excluir item do estoque animal
// @route   DELETE /api/estoque-animal/:id
// @access  Privado/Admin
exports.excluirEstoqueAnimal = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o item existe
    const [estoqueExistente] = await pool.query(
      'SELECT * FROM estoque_animal WHERE id = ?',
      [id]
    );

    if (estoqueExistente.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item de estoque não encontrado'
      });
    }

    // Excluir do banco de dados
    await pool.query(
      'DELETE FROM estoque_animal WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Item de estoque excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir estoque animal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir estoque animal'
    });
  }
};
