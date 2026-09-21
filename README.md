# FerriteWebsite

The project page for [Ferrite](https://github.com/AaravGupta17/Ferrite) — a
neural-network inference runtime in 222 KB of C11, with zero dependencies.

## What's here

```
index.html    the whole page
styles.css    design tokens and layout
main.js       nav, scroll-spy, copy buttons, a small syntax highlighter
favicon.svg   the ferrite-toroid mark
.nojekyll     tells GitHub Pages to serve the files as-is
```

No build step, no npm, no CDN, no webfont. Ferrite links libc and nothing else,
so the site that explains it does the same. Open `index.html` in a browser and
it works.

## Local preview

```sh
python -m http.server 8000
# then open http://localhost:8000/
```

## Deploying

Push to `main`, then **Settings → Pages → Deploy from a branch → `main` / `root`**.
All asset paths are relative, so the site works from a subpath.

## Editing

Every number and quote on the page comes from Ferrite's own README and docs.
If a benchmark changes upstream, change it here too — the page's whole argument
is that the numbers are reproducible.
