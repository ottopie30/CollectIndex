# Altum Analytics

**Plateforme d'Intelligence d'Investissement pour Cartes Pokémon**

[Demo](https://altum-analytics.vercel.app) | [Documentation](#) | [Roadmap](#roadmap)

---

## 🎯 Vision

Altum Analytics est le **Bloomberg Terminal pour les investisseurs Pokémon**. Notre plateforme fournit des outils d'analyse avancés pour :

- 📊 **Distinguer Spéculation vs Investissement** via un scoring multi-critères
- 📈 **Détecter les Corrections Imminentes** avec des algorithmes prédictifs
- 💰 **Calculer la Fair Value** de n'importe quelle carte
- 📱 **Gérer votre Portefeuille** avec suivi et alertes personnalisées

## ⚡ Features

| Feature | Status | Description |
|---------|--------|-------------|
| Score Spéculation | ✅ | Score 0-100 sur 5 dimensions |
| Recherche Cards | ✅ | Intégration TCGdex temps réel |
| Dashboard | ✅ | Stats marché, alertes, tendances |
| Graphiques Prix | ✅ | Charts interactifs SVG |
| Portfolio | 🔄 | Gestion collection (Sprint 1.4) |
| Prédictions ML | 🔄 | XGBoost correction (Sprint 1.2) |
| Fair Value | 🔄 | 4 méthodes valuation (Sprint 1.3) |
| Alertes | 🔄 | Notifications temps réel (Sprint 1.5) |

## 🛠️ Stack Technique

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **UI**: Design glassmorphism premium, dark theme
- **Data**: TCGdex API, planifié: eBay, CardMarket

## 🚀 Getting Started

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase (gratuit)

### Installation

```bash
# Clone le repository
git clone https://github.com/yourusername/altum-analytics.git
cd altum-analytics

# Installe les dépendances
npm install

# Copie le fichier d'environnement
cp env.example.md .env.local
# Édite .env.local avec tes clés Supabase

# Lance le serveur de développement
npm run dev
```

### Configuration Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans **Settings > API** et copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Va dans **SQL Editor** et exécute `supabase/migrations/001_initial_schema.sql`

## 📊 Scoring System

Le **Score de Spéculation** (0-100) est calculé sur 5 dimensions:

| Dimension | Poids | Métriques |
|-----------|-------|-----------|
| D1: Volatilité | 25% | CV, PTR, Acceleration |
| D2: Croissance | 25% | Excess Return, Pump&Dump, Crypto Corr |
| D3: Rareté | 20% | PSA Population, Supply/Demand |
| D4: Sentiment | 15% | Social Score, Buyer/Seller Ratio |
| D5: Macro | 15% | BTC Correlation, Fear & Greed |

**Interprétation:**
- 🟢 0-30: Investissement Solide
- 🟠 30-60: Zone de Transition
- 🔴 60-100: Spéculation Élevée

## 📁 Structure du Projet

```
altum-analytics/
├── src/
│   ├── app/                 # Pages Next.js
│   ├── components/          # Composants React
│   │   ├── cards/          # ScoreGauge, CardGrid
│   │   ├── charts/         # PriceChart
│   │   └── layout/         # Sidebar, Header
│   └── lib/
│       ├── supabase.ts     # Client + types
│       ├── tcgdex.ts       # API integration
│       └── scoring/        # Algorithmes scoring
├── supabase/
│   └── migrations/         # SQL schema
└── public/
```

## 🗺️ Roadmap

### Phase 0: MVP (Mois 1-3) ✅
- [x] Dashboard avec stats marché
- [x] Recherche cards TCGdex
- [x] Page détail avec scoring 5D
- [ ] Authentification Supabase
- [ ] Déploiement Vercel

### Phase 1: Core Features (Mois 4-6)
- [ ] Scoring complet (5 dimensions)
- [ ] Prédictions ML (XGBoost)
- [ ] Fair Value models
- [ ] Portfolio management
- [ ] Système d'alertes

### Phase 2: Premium (Mois 7-12)
- [ ] Mobile app
- [ ] API publique
- [ ] Partnerships TCG shops

## 📄 License

MIT License - Voir [LICENSE](LICENSE) pour détails.

## 🤝 Contributing

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md).

---

Made with ❤️ by the Altum Analytics team
