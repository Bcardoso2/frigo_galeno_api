const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VendaItem = sequelize.define('VendaItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    venda_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Vendas', // Nome da tabela de vendas
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'A venda é obrigatória'
        }
      }
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
          msg: 'O produto é obrigatório'
        }
      }
    },
    quantidade_kg: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'A quantidade é obrigatória'
        },
        min: {
          args: [0],
          msg: 'A quantidade não pode ser negativa'
        }
      }
    },
    preco_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'O preço por kg é obrigatório'
        },
        min: {
          args: [0],
          msg: 'O preço não pode ser negativo'
        }
      }
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'O valor total é obrigatório'
        },
        min: {
          args: [0],
          msg: 'O valor total não pode ser negativo'
        }
      }
    },
    codigo_barras: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    // Opções adicionais
    tableName: 'venda_itens', // nome da tabela no banco de dados
    timestamps: true, // adiciona createdAt e updatedAt
    
    // Método para configurar associações
    classMethods: {
      associate(models) {
        // Associação com Venda
        VendaItem.belongsTo(models.Venda, {
          foreignKey: 'venda_id',
          as: 'venda'
        });

        // Associação com Produto
        VendaItem.belongsTo(models.Produto, {
          foreignKey: 'produto_id',
          as: 'produto'
        });
      }
    },

    // Hook para calcular valor total (opcional)
    hooks: {
      beforeValidate: (vendaItem) => {
        // Calcula valor total baseado em quantidade e preço por kg
        if (vendaItem.quantidade_kg && vendaItem.preco_kg) {
          vendaItem.valor_total = (vendaItem.quantidade_kg * vendaItem.preco_kg).toFixed(2);
        }
      }
    }
  });

  return VendaItem;
};