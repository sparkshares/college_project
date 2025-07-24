# Builder stage
FROM golang:1.21-alpine AS builder
ENV GOTOOLCHAIN=auto

WORKDIR /app
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
COPY .env .env

RUN go build -o app ./cmd/main.go

# Runtime stage
FROM alpine:latest
WORKDIR /root/

COPY --from=builder /app/app .
COPY --from=builder /app/.env .env

EXPOSE 8080

CMD ["./app"]
