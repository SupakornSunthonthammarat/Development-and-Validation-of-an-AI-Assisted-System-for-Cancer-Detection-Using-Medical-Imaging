# Publishing OncoVision AI

You need a public host before the app can be accessed from the internet. The simplest production path is a VPS with Docker installed and a domain pointed at that server.

## Option A: Single VPS with Docker

1. Buy or create a VPS.
2. Point DNS records to the VPS public IP:
   - `your-domain.com` -> frontend
   - `api.your-domain.com` -> backend
3. Install Docker and Docker Compose on the VPS.
4. Copy the project to the server.
5. Create a production env file:

```bash
cp .env.production.example .env
```

6. Edit `.env`:

```bash
POSTGRES_PASSWORD=use-a-strong-password
JWT_SECRET=use-a-long-random-secret
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
GOOGLE_CLIENT_ID=optional-google-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=optional-google-client-id
OPENAI_API_KEY=server-side-openai-key
OPENAI_MODEL=gpt-5.5
```

7. Start the app:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up --build -d
```

8. Put a reverse proxy such as Caddy, Nginx Proxy Manager, Traefik, or Nginx in front of it for HTTPS:
   - `your-domain.com` proxies to `localhost:3000`
   - `api.your-domain.com` proxies to `localhost:8000`

Do not expose this as a medical diagnosis product. Keep the research-only disclaimer visible.

## Option B: Split Hosting

You can deploy the frontend to a managed Next.js host and the backend/database to a backend host with PostgreSQL.

Set the frontend variable:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url
```

Set backend variables:

```bash
DATABASE_URL=postgresql+psycopg://...
JWT_SECRET=long-random-secret
CORS_ORIGINS=https://your-frontend-url
OPENAI_API_KEY=server-side-openai-key
```

## Local Public Preview

For a short-lived demo from your own computer, use a tunnel such as Cloudflare Tunnel or ngrok:

- Tunnel frontend port `3000`
- Tunnel backend port `8000`
- Set `NEXT_PUBLIC_API_URL` to the backend tunnel URL
- Set backend `CORS_ORIGINS` to the frontend tunnel URL

This is useful for demos, not production.
