// controllers/autenticacaoController.js
const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

// Gerar token JWT
const gerarToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

// @desc    Autenticar usuário
// @route   POST /api/auth/login
// @access  Público
exports.login = async (req, res) => {
  try {
    const { login, senha } = req.body;

    // Verificar se login e senha foram informados
    if (!login || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe login e senha'
      });
    }

    // Verificar se o usuário existe
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE login = ?', [login]);
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    const usuario = rows[0];

    // Verificar se a senha está correta
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se o usuário está ativo
    if (!usuario.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Usuário inativo, contate o administrador'
      });
    }

    // Criar token
    const token = gerarToken(usuario.id);

    res.status(200).json({
      success: true,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        login: usuario.login,
        role: usuario.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Privado
exports.getMe = async (req, res) => {
  try {
    // req.usuario.id vem do middleware de autenticação
    const [rows] = await pool.query('SELECT id, nome, login, role, ativo FROM usuarios WHERE id = ?', [req.usuario.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};