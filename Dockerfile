# ========== 阶段1: 构建前端 ==========
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ ./
COPY backend/ /app/backend/

RUN npm run build

# ========== 阶段2: 构建后端 ==========
FROM golang:1.25-alpine AS backend-builder

ENV GOPROXY=https://goproxy.cn,direct

WORKDIR /app/backend

COPY backend/go.mod backend/go.sum ./
RUN go mod download && go mod tidy

COPY backend/ ./
COPY --from=frontend-builder /app/backend/dist ./dist

RUN go mod tidy && CGO_ENABLED=0 go build -o /app/practice-system .

# ========== 阶段3: 运行 ==========
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app

COPY --from=backend-builder /app/practice-system .
COPY --from=backend-builder /app/backend/dist ./dist

EXPOSE 8080

CMD ["./practice-system"]
