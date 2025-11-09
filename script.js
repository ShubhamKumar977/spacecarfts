const ASTROS_API = 'http://api.open-notify.org/astros.json';
const ISS_POSITION_API = 'http://api.open-notify.org/iss-now.json';
const CORS_PROXY = 'https://corsproxy.io/?';
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

// Fallback data in case API is unavailable
const fallbackData = {
    number: 7,
    people: [
        { name: "Jasmin Moghbeli", craft: "ISS" },
        { name: "Andreas Mogensen", craft: "ISS" },
        { name: "Satoshi Furukawa", craft: "ISS" },
        { name: "Konstantin Borisov", craft: "ISS" },
        { name: "Oleg Kononenko", craft: "ISS" },
        { name: "Nikolai Chub", craft: "ISS" },
        { name: "Loral O'Hara", craft: "ISS" }
    ]
};

// Spacecraft database with timeline information
const spacecraftDatabase = {
    'ISS': {
        fullName: 'International Space Station',
        launched: '1998-11-20',
        timeline: [
            { date: '1998-11-20', event: 'First module (Zarya) launched', url: 'https://en.wikipedia.org/wiki/Zarya' },
            { date: '2000-11-02', event: 'First crew arrived (Expedition 1)', url: 'https://en.wikipedia.org/wiki/Expedition_1' },
            { date: '2011-07-21', event: 'Space Shuttle program ended', url: 'https://en.wikipedia.org/wiki/Space_Shuttle_program' },
            { date: '2020-05-30', event: 'First SpaceX Crew Dragon mission', url: 'https://en.wikipedia.org/wiki/Crew_Dragon_Demo-2' },
            { date: '2023-09-27', event: 'Crew-7 mission launched', url: 'https://en.wikipedia.org/wiki/SpaceX_Crew-7' }
        ],
        orbit: 'Low Earth Orbit (~420 km altitude)',
        speed: '~7.66 km/s (27,600 km/h)'
    },
    'Tiangong': {
        fullName: 'Tiangong Space Station',
        launched: '2021-04-29',
        timeline: [
            { date: '2021-04-29', event: 'Core module Tianhe launched', url: 'https://en.wikipedia.org/wiki/Tianhe_(module)' },
            { date: '2021-06-17', event: 'First crew arrived (Shenzhou 12)', url: 'https://en.wikipedia.org/wiki/Shenzhou_12' },
            { date: '2022-07-24', event: 'Wentian lab module added', url: 'https://en.wikipedia.org/wiki/Wentian' },
            { date: '2022-10-31', event: 'Mengtian lab module completed station', url: 'https://en.wikipedia.org/wiki/Mengtian' }
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

// Fetch astronaut data with fallback
async function fetchAstronauts() {
    try {
        // Try direct API first
        let response = await fetch(ASTROS_API, { mode: 'cors' });
        if (!response.ok) {
            // Try with CORS proxy
            response = await fetch(CORS_PROXY + encodeURIComponent(ASTROS_API));
        }
        const data = await response.json();
        astronautData = data;
        updateCount(data);
        console.log('✓ Astronaut data loaded successfully');
    } catch (error) {
        console.warn('Using fallback astronaut data:', error.message);
        astronautData = fallbackData;
        updateCount(fallbackData);
    }
}

// Fetch ISS position with fallback to simulated orbit
async function fetchISSPosition() {
    try {
        // Try direct API first
        let response = await fetch(ISS_POSITION_API, { mode: 'cors' });
        if (!response.ok) {
            // Try with CORS proxy
            response = await fetch(CORS_PROXY + encodeURIComponent(ISS_POSITION_API));
        }
        const data = await response.json();
        if (data.iss_position) {
            spacecraftPositions['ISS'] = {
                latitude: parseFloat(data.iss_position.latitude),
                longitude: parseFloat(data.iss_position.longitude),
                timestamp: data.timestamp
            };
            console.log('✓ ISS position updated');
        }
    } catch (error) {
        console.warn('Using simulated ISS orbit:', error.message);
        // Simulate ISS orbit (51.6° inclination, moving west to east)
        issOrbitAngle += 0.001;
        const lat = 51.6 * Math.sin(issOrbitAngle * 3);
        const lon = (issOrbitAngle * 180 / Math.PI * 10) % 360 - 180;
        spacecraftPositions['ISS'] = {
            latitude: lat,
            longitude: lon,
            timestamp: Date.now() / 1000
        };
    }
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
    
    // Draw stars
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (Math.random() * 0.5 + 0.5) + ')';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw Earth shadow/glow
    const gradient = ctx.createRadialGradient(centerX, centerY, earthRadius * 0.8, centerX, centerY, earthRadius * 1.3);
    gradient.addColorStop(0, 'rgba(100, 181, 246, 0)');
    gradient.addColorStop(1, 'rgba(100, 181, 246, 0.3)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw Earth
    const earthGradient = ctx.createRadialGradient(
        centerX - earthRadius * 0.3, 
        centerY - earthRadius * 0.3, 
        earthRadius * 0.1,
        centerX, 
        centerY, 
        earthRadius
    );
    earthGradient.addColorStop(0, '#4fc3f7');
    earthGradient.addColorStop(0.5, '#2196f3');
    earthGradient.addColorStop(1, '#0d47a1');
    
    ctx.fillStyle = earthGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw continents (simplified)
    ctx.fillStyle = '#1b5e20';
    ctx.globalAlpha = 0.6;
    
    drawContinent(centerX - 50, centerY - 30, 40, 50, rotation + dragRotation);
    drawContinent(centerX + 20, centerY + 10, 50, 40, rotation + dragRotation);
    drawContinent(centerX - 30, centerY + 40, 35, 30, rotation + dragRotation);
    
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

function drawContinent(x, y, width, height, rotation) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    ctx.beginPath();
    ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
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

// Update data periodically
setInterval(fetchAstronauts, 30000);
setInterval(fetchISSPosition, 5000); // ISS position updates more frequently
