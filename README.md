# Earth–Moon Observatory

A responsive, interactive Earth–Moon explorer built with plain HTML, CSS, JavaScript, and Canvas. The globe, local lunar sky, distance, lunar phase, and date controls run without a build step. The current UTC sky clock and lunar position update locally; live ISS telemetry and Tiangong orbital elements are fetched separately when the browser can reach their public data services.

## Explore

- Rotate the globe by dragging or with the full 360° angle control. Its detailed country/coastline map identifies the selected country or ocean.
- Select a visible point to see its coordinates and the Moon's local altitude, azimuth, and phase.
- See an approximate Earth–Moon distance and lunar phase for the selected date and time.
- Follow the live UTC sky or use the slider and day-step controls to pause and explore up to one year in the past or future; select **Go live** to resume.
- See the ISS from its current public telemetry endpoint and Tiangong propagated from its latest CelesTrak orbital elements. If a data source is unavailable and has no cached valid elements, its marker is omitted rather than simulated.
- Open the crew snapshot to browse the original station-crew and mission-timeline information.

## Model and accuracy

Lunar equatorial coordinates and local altitude/azimuth use a compact, deterministic approximation based on the Moon's principal periodic terms and current UTC sidereal time. Distance uses an elliptical-orbit approximation with a 27.55-day anomalistic period and eccentricity 0.0549, centered on the 384,400 km mean distance; phase uses the 29.53-day synodic month. These calculations are for exploration, not navigation or precision ephemerides. The local Moon view includes an approximate topocentric parallax correction. World boundaries use the public-domain Natural Earth 1:110m Admin 0 countries dataset, simplified for rendering and included locally in `world-map.json`; the site does not call a map-tile server. Natural Earth data is public domain (naturalearthdata.com). If the file cannot load, a built-in outline map remains available. The Earth–Moon orbit graphic is schematic and not to scale. The included crew roster is a static snapshot, not live crew telemetry.

ISS position requests use the public `api.wheretheiss.at` endpoint. Tiangong's current orbital elements are refreshed from CelesTrak, then propagated locally with a two-body/J2 approximation between refreshes; the element epoch is shown so this marker is not mistaken for direct live telemetry. These public cross-origin services may be unavailable in some networks. Missing positions are omitted, not inferred from the Moon/Earth model. Satellite markers are hidden while the past/future slider is paused, because future or historical satellite positions are not calculated.

## Run locally

Open `index.html` directly in a modern browser, or serve this folder with any static HTTP server. No install or build command is needed.

## Deploy to GitHub Pages

Publish the repository root as a GitHub Pages site (for example, select **Deploy from a branch**, the `main` branch, and `/(root)` in the repository's Pages settings). The page uses relative `style.css` and `script.js` URLs, so it works both at a custom-domain root and under a project-site base path such as `/repository-name/`. No server-side routing or build tool is required.

Google Fonts are an optional visual enhancement; system font fallbacks are included if the font service is unavailable.

## Project files

- `index.html` — accessible page structure and controls
- `style.css` — responsive visual design
- `script.js` — orbital model, Canvas rendering, controls, and crew details
- `world-map.json` — simplified public-domain Natural Earth coastline and country geometry

## License

MIT License - Feel free to use and modify!

## Author

Created with ❤️ for space enthusiasts
