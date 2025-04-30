// controllers/estoqueAnimalController.js
const EstoqueAnimal = require('../models/estoqueAnimal');

class EstoqueAnimalController {
  // Listar todos os registros
  static async index(req, res) {
    try {
      const estoques = await EstoqueAnimal.findAll();
      return res.status(200).json(estoques);
    } catch (error) {
      console.error('Erro ao listar estoque animal:', error);
      return res.status(500).json({ message: 'Erro ao listar registros de estoque' });
    }
  }

  // Exibir um registro específico
  static async show(req, res) {
    try {
      const { id } = req.params;
      const estoque = await EstoqueAnimal.findById(id);
      
      if (!estoque) {
        return res.status(404).json({ message: 'Registro de estoque não encontrado' });
      }
      
      return res.status(200).json(estoque);
    } catch (error) {
      console.error('Erro ao buscar registro de estoque:', error);
      return res.status(500).json({ message: 'Erro ao buscar registro de estoque' });
    }
  }

  // Criar novo registro
  static async store(req, res) {
    try {
      const { parte, peso_kg, data_entrada, fornecedor } = req.body;
      
      // Validações básicas
      if (!parte || !peso_kg || !data_entrada) {
        return res.status(400).json({ message: 'Os campos parte, peso_kg e data_entrada são obrigatórios' });
      }
      
      if (parte !== 'traseiro' && parte !== 'dianteiro') {
        return res.status(400).json({ message: 'Parte deve ser "traseiro" ou "dianteiro"' });
      }
      
      const novoEstoque = await EstoqueAnimal.create({
        parte,
        peso_kg,
        data_entrada,
        fornecedor
      });
      
      return res.status(201).json(novoEstoque);
    } catch (error) {
      console.error('Erro ao criar registro de estoque:', error);
      return res.status(500).json({ message: 'Erro ao criar registro de estoque' });
    }
  }

  // Atualizar registro
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { parte, peso_kg, data_entrada, fornecedor } = req.body;
      
      // Verifica se o registro existe
      const estoque = await EstoqueAnimal.findById(id);
      if (!estoque) {
        return res.status(404).json({ message: 'Registro de estoque não encontrado' });
      }
      
      // Validações básicas
      if (parte && parte !== 'traseiro' && parte !== 'dianteiro') {
        return res.status(400).json({ message: 'Parte deve ser "traseiro" ou "dianteiro"' });
      }
      
      const estoqueAtualizado = await EstoqueAnimal.update(id, {
        parte: parte || estoque.parte,
        peso_kg: peso_kg || estoque.peso_kg,
        data_entrada: data_entrada || estoque.data_entrada,
        fornecedor: fornecedor !== undefined ? fornecedor : estoque.fornecedor
      });
      
      return res.status(200).json(estoqueAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar registro de estoque:', error);
      return res.status(500).json({ message: 'Erro ao atualizar registro de estoque' });
    }
  }

  // Excluir registro
  static async destroy(req, res) {
    try {
      const { id } = req.params;
      
      // Verifica se o registro existe
      const estoque = await EstoqueAnimal.findById(id);
      if (!estoque) {
        return res.status(404).json({ message: 'Registro de estoque não encontrado' });
      }
      
      await EstoqueAnimal.delete(id);
      return res.status(200).json({ message: 'Registro de estoque excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir registro de estoque:', error);
      return res.status(500).json({ message: 'Erro ao excluir registro de estoque' });
    }
  }
}

module.exports = EstoqueAnimalController;
