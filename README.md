# Earth–Moon Observatory

A responsive, interactive Earth–Moon explorer built with plain HTML, CSS, JavaScript, and Canvas. The orbit visualization, distance readout, lunar phase, and date controls work offline without API keys or a build step.

## Explore

- View an animated, schematic Earth–Moon orbit and drag to rotate the Earth.
- See an approximate Earth–Moon distance and lunar phase for the selected date.
- Use the slider or day-step controls to explore up to one year in the past or future; reset to today at any time.
- Open the crew snapshot to browse the original station-crew and mission-timeline information.

## Model and accuracy

The Moon's distance uses a deterministic elliptical-orbit approximation with a 27.55-day anomalistic period and eccentricity 0.0549, centered on the 384,400 km mean distance. Lunar phase uses the 29.53-day synodic period. These simplified calculations are intended for exploration, not navigation or precise ephemerides. The orbit drawing is schematic and not to scale. The included crew roster is a static snapshot inherited from the original demo, not live crew telemetry.

## Run locally

Open `index.html` directly in a modern browser, or serve this folder with any static HTTP server. No install or build command is needed.

## Deploy to GitHub Pages

Publish the repository root as a GitHub Pages site (for example, select **Deploy from a branch**, the `main` branch, and `/(root)` in the repository's Pages settings). The page uses relative `style.css` and `script.js` URLs, so it works both at a custom-domain root and under a project-site base path such as `/repository-name/`. No external API or server-side routing is required.

Google Fonts are an optional visual enhancement; system font fallbacks are included if the font service is unavailable.

## Project files

- `index.html` — accessible page structure and controls
- `style.css` — responsive visual design
- `script.js` — orbital model, Canvas rendering, controls, and crew details

## License

MIT License - Feel free to use and modify!

## Author

Created with ❤️ for space enthusiasts
