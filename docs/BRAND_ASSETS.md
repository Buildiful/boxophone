# Brand assets

Boxophone uses the **official unified Buildiful® favicon set**, supplied with this release, just like the other Buildiful browser tools. All asset references are local and relative, so deployment under `/boxophone/` works without relying on remote favicon files.

- `assets/buildiful-logo-white.png` — official Buildiful® header logo.
- `assets/favicon.ico` — shared Buildiful® browser favicon.
- `assets/favicon-32x32.png` — shared 32×32 browser icon.
- `assets/favicon-16x16.png` — shared 16×16 browser icon.
- `assets/apple-touch-icon.png` — shared 180×180 touch icon.

Both `index.html` and `privacy.html` reference the shared favicon files via `./assets/...`. The standalone Boxophone app does **not** use a yellow Boxophone favicon. The separate yellow Boxophone artwork is only for the tool catalog and announcement cards, managed outside this public app repository.

The Buildiful® name, logo, and related trademarks are not included in the software's MIT license.
