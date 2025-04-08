// controllers/usuarioController.js
const Usuario = require('../models/Usuario');

// @desc    Criar um novo usuário
// @route   POST /api/usuarios
// @access  Privado/Admin
exports.criarUsuario = async (req, res) => {
  try {
    const { nome, login, senha, role } = req.body;

    // Verificar se já existe um usuário com este login
    const usuarioExistente = await Usuario.findOne({ login });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'Este login já está sendo utilizado'
      });
    }

    // Criar o usuário
    const usuario = await Usuario.create({
      nome,
      login,
      senha,
      role: role || 'vendedor'
    });

    res.status(201).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário'
    });
  }
};

// @desc    Listar todos os usuários
// @route   GET /api/usuarios
// @access  Privado/Admin
exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-senha');

    res.status(200).json({
      success: true,
      count: usuarios.length,
      data: usuarios
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários'
    });
  }
};

// @desc    Obter um usuário pelo ID
// @route   GET /api/usuarios/:id
// @access  Privado/Admin
exports.getUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-senha');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário'
    });
  }
};

// @desc    Atualizar um usuário
// @route   PUT /api/usuarios/:id
// @access  Privado/Admin
exports.atualizarUsuario = async (req, res) => {
  try {
    let usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Se estiver atualizando o login, verificar se já existe
    if (req.body.login && req.body.login !== usuario.login) {
      const loginExiste = await Usuario.findOne({ login: req.body.login });
      if (loginExiste) {
        return res.status(400).json({
          success: false,
          message: 'Este login já está sendo utilizado'
        });
      }
    }

    usuario = await Usuario.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-senha');

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário'
    });
  }
};

// @desc    Desativar/Ativar um usuário
// @route   PUT /api/usuarios/:id/status
// @access  Privado/Admin
exports.alterarStatusUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    usuario.ativo = !usuario.ativo;
    await usuario.save();

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar status do usuário'
    });
  }
};