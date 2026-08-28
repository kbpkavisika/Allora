# Allora

## Stack

React Native (Expo, expo-router) · NativeWind · Supabase · React Hook Form + Zod · TypeScript

## Architecture

All app code lives in `mobile/`.

```
mobile/
  app/            expo-router file-based routes
    (auth)/       sign-in, sign-up, create-password
    (tabs)/       authenticated app shell
  components/
    ui/           reusable design-system primitives
    <feature>/    feature-scoped compositions
  constants/theme.ts   colors, typography, spacing tokens
  hooks/          shared hooks
  lib/            supabase client, AuthProvider, zod schemas, error mapping
```

Routing is file-based. Auth state comes from `lib/AuthProvider.tsx`; Supabase access goes through `lib/supabase.ts`. Validation schemas live in `lib/schemas.ts`.

## Rules

1. **`design.md` is the single source of truth for styling.** Strict compliance — output must be identical to its spec. Never add to or modify `design.md`.
2. **Reuse before building.** One-off components are fine when something is genuinely used in a single place. The moment it appears in more than one place — or a near-identical variant is needed — make it a reusable component in `components/ui/` per the `design.md` spec and reuse it. Always check what already exists first.
3. **Always validate input** with React Hook Form + Zod. Schemas go in `lib/schemas.ts`.
4. **Never hardcode colors or text variants.** Use the tokens/variants declared in `constants/theme.ts`. Hardcoding is strictly prohibited.
5. **No comments.** Write self-describing code. A comment is allowed only when there is a genuine, non-obvious reason for it.
6. **Never enable row level security.** This project does not turn on RLS on any table. New tables must disable it explicitly (see existing migrations for the pattern).
