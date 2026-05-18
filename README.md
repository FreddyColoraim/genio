# Nexo RH

Nexo RH est une plateforme SaaS moderne d'onboarding RH construite avec Next.js 15, TypeScript, TailwindCSS, des composants shadcn-style et Supabase.

## Vision produit

Le stack produit V1/V2 est documenté dans [`NEXO_STACK.md`](./NEXO_STACK.md).

Nexo fluidifie le passage:

```text
besoin RH -> recrutement -> integration collaborateur
```

## Démarrage

```bash
npm install
npm run dev
```

Copiez `.env.example` vers `.env.local`, puis renseignez l'URL Supabase et la clé anon de votre projet.

## Structure

- `src/app`: routes App Router avec groupes auth et dashboard.
- `src/components`: composants UI partagés et composants de composition.
- `src/components/ui`: primitives réutilisables inspirées de shadcn UI.
- `src/features`: modules fonctionnels par domaine produit.
- `src/hooks`: hooks React réutilisables.
- `src/lib/supabase`: clients Supabase browser, server, middleware et storage.
- `src/services`: accès aux services externes et opérations applicatives.
- `supabase/schema.sql`: tables, politiques RLS et bucket storage de départ.
- `supabase/migrations`: migrations SQL prêtes pour Supabase CLI.
- `src/types`: types domaine et structure role-based.

## Architecture

L'application suit une architecture scalable par couches:

- `app` orchestre les routes, layouts et server actions Next.js.
- `features` regroupe les exports métier par domaine: auth, dashboard, employees, documents.
- `components` contient les composants réutilisables, sans logique backend directe.
- `services` centralise les opérations applicatives vers Supabase ou des APIs externes.
- `lib` contient les clients techniques, helpers et adaptateurs bas niveau.
- `types` expose les contrats TypeScript partagés.

TypeScript est configuré en mode strict avec `strict`, `noUncheckedIndexedAccess` et `exactOptionalPropertyTypes`.

## Supabase

1. Créez un projet Supabase.
2. Executez `supabase/schema.sql` dans le SQL Editor, ou appliquez la migration dans `supabase/migrations`.
3. Activez l'authentification email/password dans Supabase Auth.
4. Renseignez les variables de `.env.local`.

## Déploiement Vercel

1. Importez le dossier `nexo-platform` dans Vercel.
2. Configurez les variables d'environnement listees dans `.env.example`.
3. Utilisez les commandes par défaut Vercel pour Next.js:
   - build: `npm run build`
   - install: `npm install`
   - output: `.next`
4. Ajoutez l'URL Vercel finale dans `NEXT_PUBLIC_APP_URL`.
5. Dans Supabase Auth, ajoutez l'URL Vercel aux redirect URLs autorisées.
