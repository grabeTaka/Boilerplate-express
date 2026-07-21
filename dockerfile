# Use uma imagem oficial do Node.js baseada no Alpine (versão leve)
FROM node:24-alpine

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copie apenas os arquivos de dependência primeiro para aproveitar o cache
COPY package*.json ./

# Instale as dependências da aplicação
RUN npm install

# Copie todo o resto dos arquivos do projeto para o contêiner
COPY . .

# Exponha a porta que o seu Express está utilizando
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:dev"]