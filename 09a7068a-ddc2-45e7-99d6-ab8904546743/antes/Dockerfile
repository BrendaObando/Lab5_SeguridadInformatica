FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server.js instrument.js telemetry.js index.html ./
COPY libs ./libs
USER node
EXPOSE 3000
CMD ["npm", "start"]
