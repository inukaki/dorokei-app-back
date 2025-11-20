FROM node:20.11.0-alpine3.19

WORKDIR /app

COPY package*.json ./

# 依存関係をクリーンインストール
RUN npm ci

COPY . .

EXPOSE 3001

# 開発サーバーを起動（docker-compose.yamlでオーバーライド可能）
CMD ["npm", "run", "start:dev"]