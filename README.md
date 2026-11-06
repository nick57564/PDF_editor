# PDF Editor

A PDF editor that runs entirely in the browser (WebAssembly): edit text and images, sign,
fill forms, combine, split, convert, OCR, redact and more. Documents never leave the user's
device; there is no server-side code.

It is built from the open-source [PdfCraft](https://github.com/storytold/pdfcraft) (MIT OR
Apache-2.0) with our own changes on top. The licenses are served with the site
(`public/LICENSE-MIT`, `public/LICENSE-APACHE`, `public/NOTICE`).

## How it is built

| Path | What it is |
|---|---|
| `UPSTREAM_VERSION` | The PdfCraft release the app is built from |
| `patches/pdf-editor.patch` | Our changes (see below) |
| `.github/workflows/build.yml` | GitHub Actions: fetch that release, apply the patches, run the tests, build the WebAssembly app and commit it to `public/` |
| `public/` | The built static site (generated, don't edit by hand) |
| `vercel.json` | Vercel serves `public/` as a static site, no build step |

A push that changes `patches/`, `UPSTREAM_VERSION` or the workflow starts a build (about
15–30 minutes); its commit to `public/` then deploys on Vercel. You can also start it by hand
under **Actions › Build PDF Editor › Run workflow**.

## Our changes

- **Fix:** editing text in PDFs made of page images with an invisible text layer (slides
  exported as images, scans) showed black boxes. The hidden layer uses an outline-free
  "Glyphless" font; the editor now redraws such text in a real font, with colours sampled
  from the image. Covered by a regression test that the build proves fails without the fix.
- **No external links:** the Discord button, the community card, the Help-menu links to
  PdfCraft/ArtCraft/GitHub, "Check for updates" and the ArtCraft logo are removed; the app
  is called "PDF Editor".
- **Design:** a refreshed light and dark theme (violet accent, deeper neutrals, rounder
  corners), a new Home hero with an "Open a PDF" action, an app icon and a loading screen.

## Updating to a newer PdfCraft

Change `UPSTREAM_VERSION`, push, and check the workflow run. If a patch no longer applies,
re-create it against the new release.

## Previous app

The earlier Next.js PDF editor and webshop are kept on the `backup/nextjs-app` branch.
