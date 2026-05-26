# GeniO — Déploiement Vercel + Supabase

## Dépôt Git

```
https://github.com/FreddyColoraim/nexo-platform
```

---

## 1. Supabase — Création du projet

1. Aller sur [supabase.com](https://supabase.com) → **New project**
2. Nom : `genio-core` (ou `nexo-rh-prod`)
3. **Région : `eu-west-1` (Ireland) ou `eu-central-1` (Frankfurt)** — obligatoire pour RGPD données EU
4. Mot de passe DB : générer et stocker dans un gestionnaire de mots de passe
5. Attendre la création (~2 min)

### Appliquer le schéma

Dans **SQL Editor** du projet Supabase, exécuter dans l'ordre :

```bash
# Via Supabase CLI (recommandé)
supabase link --project-ref <project-id>
supabase db push
```

Ou copier-coller dans le SQL Editor :
- `supabase/migrations/0004_genio_core.sql`
- `supabase/migrations/0005_genio_i18n_gdpr.sql`

### Configurer Auth

**Authentication > URL Configuration :**
- Site URL : `https://nexo-platform.vercel.app` (à remplacer par votre domaine)
- Redirect URLs :
  ```
  http://localhost:3000/**
  https://nexo-platform.vercel.app/**
  https://*.vercel.app/**
  ```

**Authentication > Email Templates :** personnaliser avec la marque GeniO/Nexo

### Récupérer les clés API

**Project Settings > API :**
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ ne jamais exposer côté client)

---

## 2. Vercel — Import du projet

1. Aller sur [vercel.com](https://vercel.com) → **Add New Project**
2. **Import Git Repository** → `FreddyColoraim/nexo-platform`
3. Configuration :
   - **Framework preset** : `Next.js`
   - **Root directory** : `nexo-platform` (si monorepo) ou `.` (si standalone)
   - **Node version** : 20.x
   - **Build command** : `npm run build`
   - **Install command** : `npm install`
   - **Output directory** : `.next`

### Variables d'environnement

Dans **Settings > Environment Variables**, ajouter toutes les variables de `.env.example` :

| Variable | Env | Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Supabase > Settings > API |
| `NEXT_PUBLIC_APP_URL` | Production | URL Vercel de production |
| `STRIPE_SECRET_KEY` | All | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | All | Stripe > Webhooks |
| `ANTHROPIC_API_KEY` | All | console.anthropic.com |
| `RESEND_API_KEY` | All | resend.com |

### Webhook Stripe

Dans **Stripe > Developers > Webhooks** → **Add endpoint** :
```
https://nexo-platform.vercel.app/api/webhooks/stripe
```
Événements à écouter :
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

## 3. Domaines custom (optionnel)

- **Vercel** : Settings > Domains → ajouter `genio.app` ou `nexorh.fr`
- **Supabase** : mettre à jour Site URL avec le nouveau domaine
- **DNS** : ajouter les enregistrements CNAME fournis par Vercel

---

## 4. Checklist avant mise en production

### Obligatoire
- [ ] Migrations SQL 0004 et 0005 appliquées
- [ ] RLS activé sur toutes les tables (vérifié via `supabase db lint`)
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Stripe webhook configuré et `STRIPE_WEBHOOK_SECRET` renseigné
- [ ] Auth redirect URLs à jour dans Supabase
- [ ] Build Vercel passant (`npm run build` sans erreur)
- [ ] TypeCheck passant (`npm run typecheck`)

### RGPD / Sécurité
- [ ] Région Supabase = EU (Ireland ou Frankfurt)
- [ ] PostHog configuré sur `eu.posthog.com` (si utilisé)
- [ ] Bucket Supabase Storage configuré en **privé** (pas de lecture publique)
- [ ] Signed URLs pour les documents (TTL 1h)
- [ ] Page Politique de confidentialité à jour (mentions RGPD)
- [ ] Bannière cookies si analytics activés

### Optionnel mais recommandé
- [ ] Sentry configuré pour le tracking d'erreurs
- [ ] Resend emails transactionnels vérifiés (domaine + DKIM)
- [ ] `NEXT_PUBLIC_APP_URL` = URL de production (pas localhost)

---

## 5. Développement local

```bash
# Cloner
git clone https://github.com/FreddyColoraim/nexo-platform.git
cd nexo-platform

# Installer
npm install

# Configurer
cp .env.example .env.local
# Remplir .env.local avec les clés Supabase de votre projet de dev

# Lancer
npm run dev
# → http://localhost:3000
```

### Supabase en local (optionnel)

```bash
npm install -g supabase
supabase start
# Applique les migrations automatiquement depuis supabase/migrations/
```

---

## 6. Variables par environnement

| Variable | Local | Preview | Production |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_` | `sk_test_` | `sk_live_` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_` | `pk_test_` | `pk_live_` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL preview Vercel | URL production |
| Supabase keys | Projet dev | Projet staging | Projet prod |
