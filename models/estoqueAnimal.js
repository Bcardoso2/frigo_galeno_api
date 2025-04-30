// models/estoqueAnimal.js
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

class EstoqueAnimal {
  // Conexão com o banco de dados
  static async getConnection() {
    return await mysql.createConnection(dbConfig);
  }

  // Listar todos os registros
  static async findAll() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM estoque_animal ORDER BY data_entrada DESC');
      return rows;
    } finally {
      connection.end();
    }
  }

  // Buscar um registro pelo ID
  static async findById(id) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM estoque_animal WHERE id = ?', [id]);
      return rows[0];
    } finally {
      connection.end();
    }
  }

  // Criar novo registro
  static async create(estoqueData) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        'INSERT INTO estoque_animal (parte, peso_kg, data_entrada, fornecedor) VALUES (?, ?, ?, ?)',
        [estoqueData.parte, estoqueData.peso_kg, estoqueData.data_entrada, estoqueData.fornecedor]
      );
      return { id: result.insertId, ...estoqueData };
    } finally {
      connection.end();
    }
  }

  // Atualizar registro
  static async update(id, estoqueData) {
    const connection = await this.getConnection();
    try {
      await connection.execute(
        'UPDATE estoque_animal SET parte = ?, peso_kg = ?, data_entrada = ?, fornecedor = ? WHERE id = ?',
        [estoqueData.parte, estoqueData.peso_kg, estoqueData.data_entrada, estoqueData.fornecedor, id]
      );
      return { id, ...estoqueData };
    } finally {
      connection.end();
    }
  }

  // Excluir registro
  static async delete(id) {
    const connection = await this.getConnection();
    try {
      await connection.execute('DELETE FROM estoque_animal WHERE id = ?', [id]);
      return true;
    } finally {
      connection.end();
    }
  }
}

module.exports = EstoqueAnimal;
