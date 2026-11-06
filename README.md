# PDF editor (PdfCraft web)

This site hosts the web build of [PdfCraft](https://github.com/storytold/pdfcraft) v0.18.2,
a PDF workbench that runs entirely in the browser via WebAssembly. Documents never leave the
user's machine; there is no server-side code.

- `public/` is the unmodified `pdfcraft-web-0.18.2.zip` release (licenses in `public/LICENSE-*` and `public/NOTICE`).
- `vercel.json` serves it as a static site (no build step) with the headers from `HOSTING.md`.

## Updating to a newer PdfCraft

1. Download `pdfcraft-web-<version>.zip` from https://github.com/storytold/pdfcraft/releases
2. Replace the contents of `public/` with the zip's `pdfcraft-web-<version>/` folder
   (drop `.htaccess`, `_headers` and `README.md`), then commit and push to `main`.

## Previous app

The earlier Next.js PDF editor and webshop are kept on the `backup/nextjs-app` branch.
