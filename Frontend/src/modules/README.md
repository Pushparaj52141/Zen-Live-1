# Frontend Modules

This folder is the primary feature boundary for production-scale frontend code.

## Module contract

Each module should follow:

```txt
modules/<module-name>/
  pages/
  components/
  hooks/
  services/
  constants/
  utils/
  store/      (optional)
  schemas/    (optional)
  index.js
```

## Rules

- Keep `pages/` thin; compose hooks and components.
- Keep API calls in `services/` only.
- Keep `components/` presentational when possible.
- Move shared code to `src/shared/` only if reused by 2+ modules.
- Keep naming lowercase and consistent.

## Migration strategy

During migration, old paths in `src/features/` may coexist.
Create module wrappers first, then move internals incrementally per module.
