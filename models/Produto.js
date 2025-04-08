const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Produto = sequelize.define('Produto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Por favor informe o nome do produto'
        },
        notEmpty: {
          msg: 'O nome do produto não pode estar vazio'
        }
      },
      trim: true
    },
    codigo_produto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        msg: 'Este código de produto já existe'
      },
      validate: {
        notNull: {
          msg: 'Por favor informe o código do produto'
        },
        isInt: {
          msg: 'O código do produto deve ser um número inteiro'
        }
      }
    },
    preco_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Por favor informe o preço por kg'
        },
        isDecimal: {
          msg: 'O preço deve ser um número decimal'
        },
        min: {
          args: [0],
          msg: 'O preço não pode ser negativo'
        }
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
      trim: true
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    // Opções adicionais
    tableName: 'produtos', // nome da tabela no banco de dados
    timestamps: true // adiciona createdAt e updatedAt
  });

  return Produto;
};