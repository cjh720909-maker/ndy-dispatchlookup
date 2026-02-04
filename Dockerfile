# 1단계: 빌드 환경 (Node 20으로 업그레이드)
FROM node:20-alpine AS builder
WORKDIR /app

# [추가] 강제로 운영 환경(Postgres) 빌드로 인식시킴
ENV FORCE_POSTGRES_BUILD=1

# Prisma가 Alpine 리눅스에서 돌려면 openssl이 필요합니다.
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .

# DB 연결 설정을 위한 스키마 생성
RUN npx prisma generate

# Next.js 앱 빌드
RUN npm run build

# [수정] Standalone 모드를 사용하여 이미지 크기 최적화

# 2단계: 실행 환경 (경량화)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 실행 환경에도 openssl 설치
RUN apk add --no-cache openssl

# Standalone 빌드 결과물 복사
# .next/standalone 폴더에는 실행에 필요한 모든 파일(node_modules 포함)이 들어있습니다.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]