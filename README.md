# nest_next_turbo_v2

Monorepo com `NestJS` na API e `Next.js` no frontend, usando `Turbo` e `pnpm workspaces`.

## Estrutura

- `apps/api`: API em NestJS
- `apps/web`: aplicação web em Next.js
- `packages/*`: configurações e pacotes compartilhados

## Requisitos

- Node.js 18+
- pnpm 9+
- Docker opcional para banco local

## Instalação

```bash
pnpm install
cp .env.example .env
```

## Desenvolvimento

```bash
pnpm dev
```

## Scripts úteis

```bash
pnpm build
pnpm lint
pnpm check-types
pnpm test
```

## Observações

- Não versione `.env` nem chaves privadas.
- Use apenas `.env.example` para documentar variáveis necessárias.

# Gere as chaves privadas e publicas

## 1. Gerar a chave privada RSA (4096 bits para produção)

```bash
openssl genrsa -out private.pem 4096
```

## 2. Gerar a chave publica RSA

```bash
openssl rsa -in private.pem -pubout -out public.pem
```

## 3. Converter para formato de linha única (para usar em .env)

```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private.pem
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' public.pem
```
