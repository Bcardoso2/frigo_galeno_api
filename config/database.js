// config/database.js
const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  port: config.database.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`📦 MySQL conectado ao banco ${config.database.database}`);
    connection.release();
    return pool;
  } catch (error) {
    console.error(`❌ Erro ao conectar ao MySQL: ${error.message}`);
    throw error;
  }
};

module.exports = {
  connectDB,
  pool
};