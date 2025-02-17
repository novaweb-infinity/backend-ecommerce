# Usar la imagen oficial de Node.js
FROM node:16-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar el package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto de los archivos del proyecto
COPY . .

# Exponer el puerto en el que Strapi correrá
EXPOSE 1337

# Comando para iniciar la aplicación
CMD ["npm", "run", "develop"]
