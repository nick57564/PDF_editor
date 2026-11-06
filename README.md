# Plume — PDF editor

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
| `.github/workflows/build.yml` | GitHub Actions: fetch that release, apply the patches, run the tests (incl. an end-to-end check on a real OCR PDF), build the WebAssembly app and push it to the `preview` branch |
| `public/` | The built static site (generated, don't edit by hand) |
| `vercel.json` | Vercel serves `public/` as a static site, no build step |

A push that changes `patches/`, `UPSTREAM_VERSION` or the workflow starts a build (about
15–30 minutes). It lands on the `preview` branch; after testing, release it with
`git push origin origin/preview:main`, which deploys on Vercel. You can also start it by hand
under **Actions › Build PDF Editor › Run workflow**.

## Our changes

- **Fix:** editing text in PDFs made of page images with an invisible text layer (slides
  exported as images, scans) showed black boxes. The hidden layer uses an outline-free
  "Glyphless" font; the editor now redraws such text in a real font, with colours sampled
  from the image. Covered by a regression test that the build proves fails without the fix.
- **No external links:** the Discord button, the community card, the Help-menu links to
  PdfCraft/ArtCraft/GitHub, "Check for updates" and the ArtCraft logo are removed; the app
  is called "Plume".
- **OCR in the browser:** the upstream web build has no text recognition (its models are
  looked for on disk). The models are now served from `public/models/` (CC BY-SA 4.0, see
  `public/models/ATTRIBUTION.txt`) and fetched the first time Scan & OCR is opened (about
  12 MB, cached by the browser). Milestone codes ("M10") on unfinished tools read "Soon".
- **Design:** a refreshed light and dark theme (violet accent, deeper neutrals, rounder
  corners, pill tabs), a new Home with a hero, an "Open a PDF" action and a bento grid of
  tools, the Plume icon and a loading screen.

## Updating to a newer PdfCraft

Change `UPSTREAM_VERSION`, push, and check the workflow run. If a patch no longer applies,
re-create it against the new release.

## Previous app

The earlier Next.js PDF editor and webshop are kept on the `backup/nextjs-app` branch.
