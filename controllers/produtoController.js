// controllers/produtoController.js
const Produto = require('../models/Produto');

// @desc    Criar um novo produto
// @route   POST /api/produtos
// @access  Privado/Admin
exports.criarProduto = async (req, res) => {
  try {
    const { nome, codigo_produto, preco_kg, descricao } = req.body;

    // Verificar se já existe um produto com este código
    const produtoExistente = await Produto.findOne({ codigo_produto });
    if (produtoExistente) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um produto com este código'
      });
    }

    // Criar o produto
    const produto = await Produto.create({
      nome,
      codigo_produto,
      preco_kg,
      descricao
    });

    res.status(201).json({
      success: true,
      data: produto
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar produto'
    });
  }
};

// @desc    Listar todos os produtos
// @route   GET /api/produtos
// @access  Privado
exports.listarProdutos = async (req, res) => {
  try {
    const produtos = await Produto.find();

    res.status(200).json({
      success: true,
      count: produtos.length,
      data: produtos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar produtos'
    });
  }
};

// @desc    Obter um produto pelo ID
// @route   GET /api/produtos/:id
// @access  Privado
exports.getProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: produto
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produto'
    });
  }
};

// @desc    Atualizar um produto
// @route   PUT /api/produtos/:id
// @access  Privado/Admin
exports.atualizarProduto = async (req, res) => {
  try {
    let produto = await Produto.findById(req.params.id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Se estiver atualizando o código, verificar se já existe
    if (req.body.codigo_produto && req.body.codigo_produto !== produto.codigo_produto) {
      const codigoExiste = await Produto.findOne({ codigo_produto: req.body.codigo_produto });
      if (codigoExiste) {
        return res.status(400).json({
          success: false,
          message: 'Já existe um produto com este código'
        });
      }
    }

    produto = await Produto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: produto
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar produto'
    });
  }
};

// @desc    Desativar/Ativar um produto
// @route   PUT /api/produtos/:id/status
// @access  Privado/Admin
exports.alterarStatusProduto = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    produto.ativo = !produto.ativo;
    await produto.save();

    res.status(200).json({
      success: true,
      data: produto
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar status do produto'
    });
  }
};