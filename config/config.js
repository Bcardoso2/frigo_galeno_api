// config/config.js
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'seu_segredo_aqui',
  jwtExpiresIn: '24h',
  database: {
    host: process.env.DB_HOST || '82.29.60.164',
    user: process.env.DB_USER || 'fribest',
    password: process.env.DB_PASSWORD || 'fribest',
    database: process.env.DB_NAME || 'frigo_galeno',
    port: process.env.DB_PORT || 3306
  }
};