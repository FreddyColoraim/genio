# Déploiement Vercel

## Prérequis

- Un projet Supabase créé.
- Les tables, politiques RLS et le bucket `employee-documents` appliqués depuis `supabase/schema.sql`.
- Les variables d'environnement configurées dans Vercel.

## Variables d'environnement

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

## Configuration Vercel

- Framework preset: `Next.js`
- Root directory: `nexo-platform`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `.next`

## Configuration Supabase Auth

Ajoutez les URLs suivantes dans Supabase Auth > URL Configuration:

- Site URL: `https://votre-domaine.vercel.app`
- Redirect URL locale: `http://localhost:3000/**`
- Redirect URL production: `https://votre-domaine.vercel.app/**`

## Checklist avant production

- Vérifier les politiques RLS.
- Remplacer les données mockées par des requêtes Supabase.
- Configurer les emails transactionnels Supabase.
- Tester l'upload dans le bucket privé `employee-documents`.
