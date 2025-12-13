# 📊 Stock Analyzer

Analyseur boursier avec indicateurs techniques et analyse IA pour investissement long terme.

## Features

- **Indicateurs techniques calculés localement** : MM200, RSI, MACD, ATR
- **Analyse IA** via Groq (Llama 3.3 70B) - ultra rapide et gratuit
- **Verdict clair** : 🟢 Favorable / 🟠 Neutre / 🔴 Défavorable
- **Support actions internationales** : US, Europe (ex: MC.PAR pour LVMH)

## Installation

```bash
# Créer le projet Vite
npm create vite@latest stock-analyzer -- --template react-ts
cd stock-analyzer

# Installer les dépendances
npm install

# Copier le composant
# Remplacer src/App.tsx par le contenu de StockAnalyzer.tsx

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API
```

## Configuration

Créez un fichier `.env` à la racine :

```env
VITE_ALPHA_VANTAGE_KEY=votre_cle_alpha_vantage
VITE_GROQ_API_KEY=votre_cle_groq
```

### Obtenir les clés API

1. **Alpha Vantage** (gratuit, 25 req/jour) : https://www.alphavantage.co/support/#api-key
2. **Groq** (gratuit, 1000 req/jour) : https://console.groq.com/keys

## Utilisation

```bash
npm run dev
```

Entrez un ticker :
- Actions US : `AAPL`, `MSFT`, `NVDA`, `GOOGL`
- Actions EU : `MC.PAR` (LVMH), `AIR.PAR` (Airbus), `SAN.PAR` (Sanofi)

## Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Configurer les variables d'environnement dans Vercel Dashboard
# Settings > Environment Variables
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Frontend (React + Vite)             │
├─────────────────────────────────────────────────┤
│  1. Alpha Vantage API → Prix historiques         │
│  2. Calcul local → MM200, RSI, MACD, ATR        │
│  3. Groq API → Analyse IA + Verdict             │
└─────────────────────────────────────────────────┘
```

## Indicateurs utilisés

| Indicateur | Description | Signal |
|------------|-------------|--------|
| **MM200** | Moyenne Mobile 200 jours | Cours > MM200 = haussier |
| **RSI** | Relative Strength Index | 50-70 = achat, >70 = surachat |
| **MACD** | Convergence/Divergence | MACD > Signal = momentum + |
| **ATR** | Average True Range | Mesure la volatilité |

## Limites API

- **Alpha Vantage Free** : 25 requêtes/jour, 5/minute
- **Groq Free** : 1000 requêtes/jour, 30/minute

## License

MIT
