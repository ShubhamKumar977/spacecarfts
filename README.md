# 🌍 Live Spacecraft Tracker

An interactive 3D visualization of spacecraft orbiting Earth, showing real-time positions and crew information.

## Features

- **Interactive 3D Globe**: Drag to rotate Earth and view spacecraft from different angles
- **Real-time ISS Tracking**: Shows the International Space Station's actual position over Earth
- **Clickable Spacecraft**: Click on any spacecraft to view detailed information
- **Crew Information**: See all astronauts currently in space with links to their Wikipedia pages
- **Mission Timeline**: Historical events and milestones for each spacecraft with source links
- **Smooth Animations**: Realistic orbital mechanics and smooth Earth rotation

## How to Use

1. **Open `index.html`** in your web browser
2. **Drag the globe** to rotate and view different angles
3. **Click on spacecraft** to see:
   - Current crew members (click names to visit Wikipedia)
   - Real-time position (latitude/longitude)
   - Orbital information
   - Mission timeline (click events for more details)

## Technologies Used

- Pure JavaScript (Canvas API for 3D rendering)
- HTML5 Canvas
- CSS3 (Glassmorphism effects)
- Open Notify API (for live spacecraft data)

## API Information

The app attempts to fetch live data from:
- `http://api.open-notify.org/astros.json` - Current astronauts in space
- `http://api.open-notify.org/iss-now.json` - ISS position

If the API is unavailable, the app uses demo data with simulated ISS orbit.

## Project Structure

```
├── index.html      # Main HTML structure
├── style.css       # Styling and animations
├── script.js       # Canvas rendering and API logic
└── README.md       # Documentation
```

## Features in Detail

### Interactive Globe
- Mouse drag to rotate Earth
- Realistic 3D sphere with continents
- Starfield background
- Atmospheric glow effect

### Spacecraft Visualization
- Spacecraft appear at their actual lat/lon positions
- Only visible when on the front side of Earth (realistic occlusion)
- Animated solar panels and antennas
- Orbit paths shown as dashed circles

### Modal Information
- Crew count and names
- Current position coordinates
- Orbital altitude and speed
- Complete mission timeline with key events

## Demo Data

The app includes fallback data for 7 astronauts on the ISS, ensuring it works even without API access.

## Future Enhancements

- Add more spacecraft (Tiangong, future missions)
- Show satellite constellations
- Add day/night terminator line
- Real-time altitude visualization
- Spacecraft trajectory predictions

## License

MIT License - Feel free to use and modify!

## Author

Created with ❤️ for space enthusiasts
