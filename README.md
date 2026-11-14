# NEON//CORE

A responsive, static homepage for a growing collection of gaming, technology, and everyday digital tools. The first version uses plain HTML, CSS, and JavaScript so it can be explored without installing a framework or setting up a server.

## Run locally

Opening `index.html` is enough for a quick visual preview. For reliable cross-page LocalStorage testing, run the site from one local server origin because browsers handle storage for `file://` pages differently. Open PowerShell in this folder and run:

```powershell
py -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000). Press `Ctrl+C` in PowerShell to stop the server.

## Project structure

```text
NEON-CORE/
|-- index.html
|-- pricing.html
|-- css/
|   |-- style.css
|   |-- pricing.css
|   `-- tool-pages.css
|-- js/
|   |-- platform.js
|   |-- pricing.js
|   |-- script.js
|   `-- tools/
|       |-- aspect-ratio-calculator.js
|       |-- data-transfer-calculator.js
|       |-- download-time-calculator.js
|       |-- mouse-sensitivity-converter.js
|       |-- qr-code-generator.js
|       |-- refresh-rate-calculator.js
|       |-- storage-converter.js
|       `-- text-analyzer.js
|-- tools/
|   |-- aspect-ratio-calculator.html
|   |-- data-transfer-calculator.html
|   |-- download-time-calculator.html
|   |-- mouse-sensitivity-converter.html
|   |-- qr-code-generator.html
|   |-- refresh-rate-calculator.html
|   |-- storage-converter.html
|   `-- text-analyzer.html
|-- docs/
|   `-- monetization-architecture.md
|-- assets/
|   |-- icons/
|   `-- images/
`-- README.md
```

The tool list and its search and category filters are in `js/script.js`. The homepage lives in `index.html`; each working tool has its own page in `tools/` and calculation code in `js/tools/`. Shared tool-page layout styles live in `css/tool-pages.css`, alongside the design system in `css/style.css`.

The pricing concept is in `pricing.html`. Upgrade buttons open an informational preview only; payment processing and Premium access are not implemented. See [docs/monetization-architecture.md](docs/monetization-architecture.md) for the proposed free/premium boundary and the backend checks required before a future Stripe integration.

## Working tools

- **Storage Converter:** Converts between B, KB, MB, GB, and TB. Decimal uses powers of 1,000 (for example, 1 GB = 1,000 MB); binary uses powers of 1,024 and the IEC names Kibibytes (KiB), Mebibytes (MiB), Gibibytes (GiB), and Tebibytes (TiB). The conversion is `amount × base^(source unit power − target unit power)`.
- **Download Time Calculator:** Converts the file size to bytes, then divides by bytes per second. Mbps is megabits per second, so it is divided by 8 to get megabytes per second; MB/s already means megabytes per second. The estimate uses decimal file-size units and does not include network overhead.
- **Data Transfer Calculator:** Provides three modes. Data transferred is `speed (bytes/second) × duration (seconds)`; transfer duration is `data size (bytes) ÷ speed (bytes/second)`; required speed is `data size (bytes) ÷ duration (seconds)`. Kbps/Mbps/Gbps are decimal bit rates and are divided by 8 to convert to bytes per second; KB/s, MB/s, and GB/s are decimal byte rates. KB–TB use powers of 1,000, while KiB–TiB use powers of 1,024. The estimate assumes a steady ideal rate without protocol overhead.
- **Mouse Sensitivity Converter:** Calculates eDPI as `DPI × sensitivity`, equivalent destination sensitivity as `source DPI × source sensitivity × source yaw ÷ (destination DPI × destination yaw)`, and cm/360 as `360 × 2.54 ÷ (DPI × sensitivity × yaw)`. Built-in baselines are CS2 using the Source-family yaw default `0.022` and Overwatch using `0.0066`, as documented by [KovaaK's Sensitivity Matcher](https://www.kovaak.com/sensitivity-matcher/). These are version/config-dependent baselines, not guarantees; use custom yaw only when you have verified it. eDPI compares settings within one game's scale and should not be used to compare games directly.
- **QR Code Generator:** Creates QR codes for HTTP(S) URLs, plain text, email links, phone calls, Wi-Fi credentials, and SMS messages. It supports foreground/background colors, a maximum image size, and the four standard error-correction levels. It uses [`qrcode-generator` by Kazuhiko Arase](https://github.com/kazuhikoarase/qrcode-generator), version 2.0.4, loaded as a browser script from jsDelivr. The MIT-licensed library includes UTF-8 byte encoding and SVG generation; the tool draws the same QR matrix to canvas for its preview and PNG download. SMS uses the documented `sms:number:encoded-message` form, and Wi-Fi uses the common `WIFI:` configuration format. All user content is processed locally and is not sent to a service or saved in LocalStorage. The library script must load from the CDN, so QR generation needs an internet connection. Verify the downloaded code with a scanner before sharing it; scanner support for actionable QR formats can vary.
- **Aspect Ratio Calculator:** Simplifies integer dimensions by dividing width and height by their greatest common divisor. In missing-dimension mode, it rearranges the ratio: `height = width × ratio height ÷ ratio width`, or `width = height × ratio width ÷ ratio height`. The result is rounded to a whole pixel, with the exact calculated dimension also shown.
- **Text Analyzer:** Updates character, word, and paragraph counts as you type. Whitespace includes spaces, tabs, and line breaks; paragraphs are non-empty blocks separated by blank lines. It uses `Intl.Segmenter` when available for Unicode grapheme counting. Its dependency-free fallback groups combining marks, variation selectors, emoji modifiers, flag pairs, CRLF, and zero-width-joiner sequences. This fallback is not a complete implementation of Unicode grapheme-break rules; some script-specific clusters, such as Indic conjunct sequences, may count differently when `Intl.Segmenter` is unavailable.
- **Refresh Rate Calculator:** Calculates nominal frame duration with `milliseconds = 1,000 ÷ rate`. Hz and FPS both describe cycles per second, but refer to display refreshes and rendered frames respectively.

Each calculator listens for input changes and updates its result without a server. Invalid, negative, or zero values where disallowed are announced beside the affected control. The homepage cards for these eight tools open their corresponding utility pages. No user-entered QR content is persisted.

## Beginner JavaScript notes

Each tool script reads its controls with `document.querySelector()`, listens for `input` or `change` events, validates values before calculating, and writes results back into the page. A helper function keeps repeated work, such as formatting a duration or finding a greatest common divisor, in one named place. The calculations use regular JavaScript numbers and browser APIs only; there are no packages, APIs, or backend services to configure.

The display and mono fonts load from Google Fonts when online. The page uses fallback fonts if that service is unavailable.

## Platform preferences

`js/platform.js` is shared by the homepage and all utility pages. It saves the selected theme, favorite tool IDs, the five most recently opened tools, and the selected directory category in browser LocalStorage under `neon-core.preferences.v1`. Preferences belong to this browser profile; clearing site data resets them. No account or server is involved.

Use the star on any directory card to add or remove a favorite. The Favorites filter shows saved tools, and the Recently used row links back to tools you have opened. Use **Clear history** to remove recent tools without affecting favorites. The theme button and mobile menu are available on every page.

## Design system

Shared design tokens and components are at the top of `css/style.css`. Prefer these reusable values and classes when adding a tool instead of introducing new one-off colors or control styles.

- **Palette:** `--color-bg`, `--color-bg-raised`, `--color-surface`, `--color-primary` (cyan), `--color-secondary` (purple), `--color-accent` (magenta), and `--color-positive` (lime). Text and border roles use `--color-text`, `--color-text-secondary`, `--color-text-muted`, and `--color-border`.
- **Type:** use `--font-display` for interface headings and copy, `--font-mono` for compact system labels, and the `--font-size-*` tokens for display, section, card, and body hierarchy.
- **Components:** `.button` with `.button-primary`, `.button-secondary`, or `.button-quiet`; `.input-shell` for a grouped input or `.form-control` for a standalone field; `.surface-panel` and `.surface-card` for framed content; `.nav-link` for navigation; `.status-dot` with an optional color modifier; `.loading-indicator` and `.skeleton` for loading states.
- **Effects:** use `--border-default`, `--radius-control`, `--radius-card`, `--glow-primary`, `--glow-secondary`, and the `--motion-*` timing tokens. Hover, focus, and loading animations respect reduced-motion preferences.
- **Responsive layout:** the homepage tool grid changes from four columns to two at `900px`, then to one at `380px`; the hero stacks at `640px`. The shared navigation becomes a menu at `760px`, and calculator panels stack at `760px`. Pricing cards change from three columns to two at `900px` and one at `640px`. At `640px`, tool pages tighten their padding; paired calculator fields stack at `380px`.

For a future tool card, add its data entry in `js/script.js`; `createToolCard()` already applies `.surface-card` and `.tool-card`. For a separate tool screen, reuse classes such as `<button class="button button-secondary">...</button>`, `<input class="form-control" ...>`, or `<section class="surface-panel">...</section>`. Adjust the shared tokens first when you need to tune the site-wide look.