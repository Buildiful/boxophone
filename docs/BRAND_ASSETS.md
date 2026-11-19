# Brand assets

Boxophone uses the same live official Buildiful® logo and unified favicon asset URLs as the Buildiful homepage:

- `https://buildiful.github.io/assets/buildiful-logo-white.png`
- `https://buildiful.github.io/assets/favicon.ico`
- `https://buildiful.github.io/assets/favicon-32x32.png`
- `https://buildiful.github.io/assets/favicon-16x16.png`
- `https://buildiful.github.io/assets/apple-touch-icon.png`

These paths were verified against the homepage repository. The public app references them directly to guarantee that the official branding stays consistent without distributing alternate approximations. If you prefer an independent fork, use the originals from the organization homepage repository's `assets/` folder, then change the five URLs in `index.html` to `./assets/...` relative URLs.

The original Boxophone icon is provided separately in `assets/boxophone-tool-icon.svg` and `assets/boxophone-tool-icon-256.png`. Buildiful trademarks are not included in the software's MIT license.
