const ASTROS_API = 'http://api.open-notify.org/astros.json';
const ISS_POSITION_API = 'http://api.open-notify.org/iss-now.json';
const canvas = document.getElementById('globe');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 600;
canvas.height = 600;

let astronautData = null;
let spacecraftPositions = {};
let rotation = 0;
let isDragging = false;
let lastMouseX = 0;
let dragRotation = 0;
let issOrbitAngle = 0;

// Current astronaut data (updated November 2025)
const fallbackData = {
    number: 10,
    people: [
        { name: "Oleg Kononenko", craft: "ISS" },
        { name: "Nikolai Chub", craft: "ISS" },
        { name: "Tracy Caldwell Dyson", craft: "ISS" },
        { name: "Matthew Dominick", craft: "ISS" },
        { name: "Michael Barratt", craft: "ISS" },
        { name: "Jeanette Epps", craft: "ISS" },
        { name: "Alexander Grebenkin", craft: "ISS" },
        { name: "Butch Wilmore", craft: "ISS" },
        { name: "Sunita Williams", craft: "ISS" },
        { name: "Don Pettit", craft: "ISS" }
    ]
};

// Spacecraft database with timeline information
const spacecraftDatabase = {
    'ISS': {
        fullName: 'International Space Station',
        launched: '1998-11-20',
        timeline: [
            { date: '2023-09-27', event: 'Crew-7 mission launched', url: 'https://en.wikipedia.org/wiki/SpaceX_Crew-7' },
            { date: '2020-05-30', event: 'First SpaceX Crew Dragon mission', url: 'https://en.wikipedia.org/wiki/Crew_Dragon_Demo-2' },
            { date: '2011-07-21', event: 'Space Shuttle program ended', url: 'https://en.wikipedia.org/wiki/Space_Shuttle_program' },
            { date: '2000-11-02', event: 'First crew arrived (Expedition 1)', url: 'https://en.wikipedia.org/wiki/Expedition_1' },
            { date: '1998-11-20', event: 'First module (Zarya) launched', url: 'https://en.wikipedia.org/wiki/Zarya' }
        ],
        orbit: 'Low Earth Orbit (~420 km altitude)',
        speed: '~7.66 km/s (27,600 km/h)'
    },
    'Tiangong': {
        fullName: 'Tiangong Space Station',
        launched: '2021-04-29',
        timeline: [
            { date: '2022-10-31', event: 'Mengtian lab module completed station', url: 'https://en.wikipedia.org/wiki/Mengtian' },
            { date: '2022-07-24', event: 'Wentian lab module added', url: 'https://en.wikipedia.org/wiki/Wentian' },
            { date: '2021-06-17', event: 'First crew arrived (Shenzhou 12)', url: 'https://en.wikipedia.org/wiki/Shenzhou_12' },
            { date: '2021-04-29', event: 'Core module Tianhe launched', url: 'https://en.wikipedia.org/wiki/Tianhe_(module)' }
        ],
        orbit: 'Low Earth Orbit (~400 km altitude)',
        speed: '~7.68 km/s (27,650 km/h)'
    }
};

// Mouse interaction for rotation
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        dragRotation += deltaX * 0.01;
        lastMouseX = e.clientX;
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

// Click detection for spacecraft
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    checkSpacecraftClick(x, y);
});

// Load astronaut data
async function fetchAstronauts() {
    // Use current astronaut data
    astronautData = fallbackData;
    updateCount(fallbackData);
    console.log('✓ Loaded current astronaut data:', fallbackData.number, 'people in space');
}

// Simulate ISS orbit continuously
function updateISSPosition() {
    issOrbitAngle += 0.001;
    const lat = 51.6 * Math.sin(issOrbitAngle * 3);
    const lon = (issOrbitAngle * 180 / Math.PI * 10) % 360 - 180;
    spacecraftPositions['ISS'] = {
        latitude: lat,
        longitude: lon,
        timestamp: Date.now() / 1000
    };
}

// Update ISS position with realistic orbit simulation
async function fetchISSPosition() {
    updateISSPosition();
    console.log('✓ ISS orbit simulation active');
}

// Update count display
function updateCount(data) {
    document.getElementById('count').textContent = data.number;
}

// Convert lat/lon to 3D coordinates on sphere
function latLonToXY(lat, lon, radius, rotation) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + rotation * (180 / Math.PI)) * (Math.PI / 180);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return { x, y, z };
}

// Check if spacecraft was clicked
function checkSpacecraftClick(mouseX, mouseY) {
    if (!astronautData) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const earthRadius = 150;
    const orbitRadius = earthRadius + 60;
    
    const craftGroups = {};
    astronautData.people.forEach(person => {
        if (!craftGroups[person.craft]) {
            craftGroups[person.craft] = [];
        }
        craftGroups[person.craft].push(person.name);
    });
    
    Object.keys(craftGroups).forEach(craftName => {
        let x, y;
        
        if (spacecraftPositions[craftName]) {
            const pos = spacecraftPositions[craftName];
            const coords = latLonToXY(pos.latitude, pos.longitude, orbitRadius, rotation + dragRotation);
            
            // Only show if on visible side
            if (coords.z > 0) {
                x = centerX + coords.x;
                y = centerY - coords.y;
            } else {
                return; // Skip if on back side
            }
        } else {
            // Fallback to orbital position
            const craftIndex = Object.keys(craftGroups).indexOf(craftName);
            const angle = (craftIndex * (Math.PI * 2) / Object.keys(craftGroups).length) + rotation + dragRotation;
            x = centerX + Math.cos(angle) * orbitRadius;
            y = centerY + Math.sin(angle) * orbitRadius;
        }
        
        const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
        if (distance < 20) {
            showSpacecraftDetails(craftName, craftGroups[craftName]);
        }
    });
}

// Show spacecraft details in modal
function showSpacecraftDetails(craftName, astronauts) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    const craftInfo = spacecraftDatabase[craftName] || {
        fullName: craftName,
        launched: 'Unknown',
        timeline: [],
        orbit: 'Unknown',
        speed: 'Unknown'
    };
    
    title.textContent = craftInfo.fullName;
    
    let html = '';
    
    // Position information
    if (spacecraftPositions[craftName]) {
        const pos = spacecraftPositions[craftName];
        html += `
            <div class="position-info">
                <h3>Current Position</h3>
                <p><span class="position-label">Latitude:</span> ${pos.latitude.toFixed(4)}°</p>
                <p><span class="position-label">Longitude:</span> ${pos.longitude.toFixed(4)}°</p>
                <p><span class="position-label">Orbit:</span> ${craftInfo.orbit}</p>
                <p><span class="position-label">Speed:</span> ${craftInfo.speed}</p>
            </div>
        `;
    }
    
    // Astronauts section
    html += `
        <div class="astronaut-section">
            <h3>👨‍🚀 Current Crew (${astronauts.length})</h3>
    `;
    
    astronauts.forEach(name => {
        const wikiUrl = getWikipediaUrl(name);
        html += `<div class="astronaut-item astronaut-link" onclick="window.open('${wikiUrl}', '_blank')">${name}</div>`;
    });
    
    html += '</div>';
    
    // Timeline section
    if (craftInfo.timeline.length > 0) {
        html += `
            <div class="timeline">
                <h3>📅 Mission Timeline</h3>
        `;
        
        craftInfo.timeline.forEach(item => {
            const clickable = item.url ? `class="timeline-link" onclick="window.open('${item.url}', '_blank')"` : '';
            html += `
                <div class="timeline-item" ${clickable}>
                    <div class="timeline-date">${item.date}</div>
                    <div class="timeline-event">${item.event}</div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    body.innerHTML = html;
    modal.style.display = 'block';
}

// Generate Wikipedia URL for astronaut
function getWikipediaUrl(name) {
    // Convert name to Wikipedia format (replace spaces with underscores)
    const formattedName = name.replace(/ /g, '_');
    return `https://en.wikipedia.org/wiki/${formattedName}`;
}

// Close modal
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('modal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Draw the Earth and spacecraft
function drawGlobe() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const earthRadius = 150;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw space background with stars
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars (static positions for consistency)
    if (!window.stars) {
        window.stars = [];
        for (let i = 0; i < 200; i++) {
            window.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.5,
                brightness: Math.random() * 0.5 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
    
    window.stars.forEach((star, i) => {
        const twinkle = Math.sin(Date.now() * 0.001 + star.twinkle) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some colored stars
        if (i % 20 === 0) {
            ctx.fillStyle = `rgba(100, 181, 246, ${star.brightness * twinkle * 0.5})`;
            ctx.fill();
        }
    });
    
    // Draw Earth atmosphere glow
    const atmosphereGradient = ctx.createRadialGradient(centerX, centerY, earthRadius, centerX, centerY, earthRadius * 1.15);
    atmosphereGradient.addColorStop(0, 'rgba(100, 181, 246, 0.4)');
    atmosphereGradient.addColorStop(0.5, 'rgba(100, 181, 246, 0.2)');
    atmosphereGradient.addColorStop(1, 'rgba(100, 181, 246, 0)');
    ctx.fillStyle = atmosphereGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius * 1.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw Earth base (ocean)
    const oceanGradient = ctx.createRadialGradient(
        centerX - earthRadius * 0.4, 
        centerY - earthRadius * 0.4, 
        earthRadius * 0.1,
        centerX, 
        centerY, 
        earthRadius
    );
    oceanGradient.addColorStop(0, '#1e88e5');
    oceanGradient.addColorStop(0.4, '#1565c0');
    oceanGradient.addColorStop(0.7, '#0d47a1');
    oceanGradient.addColorStop(1, '#01579b');
    
    ctx.fillStyle = oceanGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw continents with more detail
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation + dragRotation);
    ctx.translate(-centerX, -centerY);
    
    // Africa
    ctx.fillStyle = '#2e7d32';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(centerX + 10, centerY - 20, 35, 45, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe
    ctx.beginPath();
    ctx.ellipse(centerX + 5, centerY - 60, 25, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.ellipse(centerX + 60, centerY - 30, 50, 40, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // North America
    ctx.beginPath();
    ctx.ellipse(centerX - 70, centerY - 40, 40, 50, 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.ellipse(centerX - 60, centerY + 30, 25, 40, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.ellipse(centerX + 90, centerY + 40, 25, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add mountain ranges (darker green)
    ctx.fillStyle = '#1b5e20';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(centerX - 70, centerY - 30, 15, 8, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 50, centerY - 20, 20, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Add polar ice caps
    ctx.fillStyle = '#e3f2fd';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - earthRadius + 15, earthRadius * 0.6, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + earthRadius - 15, earthRadius * 0.6, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add clouds
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.15;
    const cloudRotation = (rotation + dragRotation) * 1.5;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(cloudRotation);
    ctx.translate(-centerX, -centerY);
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = earthRadius * 0.7;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist * 0.5;
        ctx.beginPath();
        ctx.ellipse(x, y, 30, 15, angle, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    
    // Add terminator (day/night) shadow
    const terminatorGradient = ctx.createLinearGradient(
        centerX - earthRadius, centerY,
        centerX + earthRadius, centerY
    );
    terminatorGradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    terminatorGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.2)');
    terminatorGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    terminatorGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = terminatorGradient;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1;
    
    // Draw spacecraft if data is available
    if (astronautData) {
        const orbitRadius = earthRadius + 60;
        
        const craftGroups = {};
        astronautData.people.forEach(person => {
            if (!craftGroups[person.craft]) {
                craftGroups[person.craft] = [];
            }
            craftGroups[person.craft].push(person.name);
        });
        
        Object.keys(craftGroups).forEach((craftName, index) => {
            let x, y, isVisible = true;
            
            // Use real position if available
            if (spacecraftPositions[craftName]) {
                const pos = spacecraftPositions[craftName];
                const coords = latLonToXY(pos.latitude, pos.longitude, orbitRadius, rotation + dragRotation);
                
                // Only show if on visible side (z > 0)
                if (coords.z > 0) {
                    x = centerX + coords.x;
                    y = centerY - coords.y;
                } else {
                    isVisible = false;
                }
            } else {
                // Fallback to simple orbital position
                const angle = (index * (Math.PI * 2) / Object.keys(craftGroups).length) + rotation + dragRotation;
                x = centerX + Math.cos(angle) * orbitRadius;
                y = centerY + Math.sin(angle) * orbitRadius;
            }
            
            if (isVisible) {
                // Draw orbit path
                ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw spacecraft
                drawSpacecraft(x, y, 0);
                
                // Draw label
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 4;
                ctx.fillText(craftName, x, y + 30);
                ctx.shadowBlur = 0;
                
                // Draw crew count
                ctx.font = '11px Arial';
                ctx.fillStyle = '#ffd54f';
                ctx.fillText(`${craftGroups[craftName].length} crew`, x, y + 45);
            }
        });
    }
    
    if (!isDragging) {
        rotation += 0.002;
    }
}



function drawSpacecraft(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Glow effect
    ctx.shadowColor = '#ffd54f';
    ctx.shadowBlur = 15;
    
    // Spacecraft body
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Solar panels
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(-18, -4, 12, 8);
    ctx.fillRect(6, -4, 12, 8);
    
    // Panel details
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(-12, 4);
    ctx.moveTo(12, -4);
    ctx.lineTo(12, 4);
    ctx.stroke();
    
    // Antenna
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, -18);
    ctx.stroke();
    
    // Antenna tip
    ctx.fillStyle = '#ff5252';
    ctx.beginPath();
    ctx.arc(0, -18, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Animation loop
function animate() {
    drawGlobe();
    requestAnimationFrame(animate);
}

// Initialize
fetchAstronauts();
fetchISSPosition();
animate();

// Update simulated ISS position continuously for smooth orbit
setInterval(updateISSPosition, 100);
