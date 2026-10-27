# ==============================================================================
# ESTÁGIO 1: Instalação de dependências
# ==============================================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia os arquivos de definição de dependências
COPY package*.json ./
RUN npm install

# ==============================================================================
# ESTÁGIO 2: Build da aplicação Next.js
# ==============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desativa telemetria do Next.js durante a compilação
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ==============================================================================
# ESTÁGIO 3: Imagem final enxuta de produção (Standalone)
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criação de grupo e usuário seguro sem privilégios de root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Configura diretório de cache do Next.js e diretório de uploads com permissões adequadas
RUN mkdir .next
RUN chown nextjs:nodejs .next
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Copia apenas os artefatos estáticos e o servidor standalone gerado pelo build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Muda para o usuário não-root
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Inicia o servidor Node standalone gerado pelo Next.js
CMD ["node", "server.js"]
