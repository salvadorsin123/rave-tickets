# Instrucciones para Claude Code en este repo

## Antes de hacer `git push`

Este repo tiene un hook `.git/hooks/pre-push` que corre lint, typecheck, tests y
build de `apps/backend` y `apps/frontend` (las mismas verificaciones que
`.github/workflows/ci.yml`) y cancela el push si algo falla. Ese hook es local
(no viaja con `git clone`), así que en un clon nuevo (por ejemplo
`s:\UAQ\Migracion`) no existe a menos que se copie a mano.

Por eso, independientemente de si el hook está presente: antes de cualquier
`git push` a este repo, correr manualmente y confirmar que pasan:

```bash
cd apps/backend && npm run lint:check && npx tsc --noEmit -p tsconfig.build.json && npm test -- --ci && npm run build
cd ../frontend && npx tsc --noEmit && npx next lint && npm run build
```

No usar `git push --no-verify` para saltarse el hook salvo que el usuario lo pida
explícitamente.
