FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./ 

# Eliminar node_modules si existen
RUN rm -rf node_modules

# Instalar dependencias asegurando compatibilidad
RUN npm ci --no-optional

# 🔹 Solución: Eliminar esbuild antes de instalarlo de nuevo
RUN npm remove esbuild
RUN npm install esbuild@0.21.3 --platform=linux --force

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Exponer puerto de Strapi
EXPOSE 1337

# Comando de inicio
CMD ["npm", "start"]
