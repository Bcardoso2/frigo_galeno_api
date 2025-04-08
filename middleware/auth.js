// middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const config = require('../config/config');

exports.protect = async (req, res, next) => {
  let token;

  // Verificar se o token está no header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar se o token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Sem autorização para acessar esta rota'
    });
  }

  try {
    // Verificar o token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Buscar o usuário no banco
    const [rows] = await pool.query('SELECT id, nome, login, role FROM usuarios WHERE id = ?', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Adicionar o usuário ao request
    req.usuario = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Sem autorização para acessar esta rota'
    });
  }
};

// Middleware para controle de acesso por perfil
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.role)) {
      return res.status(403).json({
        success: false,
        message: `Perfil ${req.usuario.role} não tem permissão para acessar esta rota`
      });
    }
    next();
  };
};