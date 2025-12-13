# Cloudflare Worker - Yahoo Finance Proxy

Ce worker fait office de proxy pour les requêtes vers Yahoo Finance, contournant les problèmes de CORS et de rate limiting.

## Déploiement

### Option 1 : Via le Dashboard Cloudflare (rapide)

1. Va sur [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Crée un compte gratuit si nécessaire
3. Va dans **Workers & Pages** > **Create Worker**
4. Copie le contenu de `worker.js` dans l'éditeur
5. Clique sur **Deploy**
6. Note l'URL du worker (ex: `https://yahoo-proxy.ton-compte.workers.dev`)

### Option 2 : Via Wrangler CLI

```bash
# Installe wrangler
npm install -g wrangler

# Login
wrangler login

# Déploie
cd cloudflare-worker
wrangler deploy
```

## Configuration

Après déploiement, ajoute ton URL de production dans `ALLOWED_ORIGINS` :

```javascript
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://ton-app.vercel.app', // Ajoute ton domaine
];
```

## Utilisation

Une fois déployé, mets à jour `CLOUDFLARE_WORKER_URL` dans `src/utils/fetchStockPrice.ts` :

```typescript
const CLOUDFLARE_WORKER_URL = 'https://yahoo-proxy.ton-compte.workers.dev';
```

## Limites gratuites

- 100,000 requêtes/jour
- 10ms CPU time par requête
- Largement suffisant pour un usage personnel

## Test

```bash
curl "https://yahoo-proxy.ton-compte.workers.dev/v8/finance/chart/AAPL?interval=1d&range=1d"
```
