# Usando a imagem base Node.js 20 Alpine
FROM node:20-alpine

# Instalar dependências para compilação do bcrypt
RUN apk add --no-cache make gcc g++ python3

# Definindo o diretório de trabalho
WORKDIR /usr/src/app

# Copiar os arquivos de dependências
COPY --chown=node:node package.json ./

# Instalar as dependências usando npm ci
RUN npm install

# Copiar o restante dos arquivos da aplicação
COPY --chown=node:node . .

# Trocar para o usuário node
USER node

# Expor a porta para o container
EXPOSE 3002

# Definir o comando para iniciar a aplicação
CMD ["node", "server.js"]
