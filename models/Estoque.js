const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Estoque = sequelize.define('Estoque', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    produto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Produtos', // Nome da tabela de produtos
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'Por favor informe o produto'
        }
      }
    },
    quantidade_kg: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
      validate: {
        notNull: {
          msg: 'Por favor informe a quantidade em kg'
        },
        min: {
          args: [0],
          msg: 'A quantidade não pode ser negativa'
        }
      }
    },
    data_atualizacao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    // Opções adicionais
    tableName: 'estoques', // nome da tabela no banco de dados
    timestamps: true, // adiciona createdAt e updatedAt
    
    // Método para configurar associações
    classMethods: {
      associate(models) {
        // Definir associação com Produto
        Estoque.belongsTo(models.Produto, {
          foreignKey: 'produto_id',
          as: 'produto'
        });
      }
    }
  });

  return Estoque;
};