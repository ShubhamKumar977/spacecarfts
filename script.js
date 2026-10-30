const canvas = document.getElementById('globe');
const ctx = canvas.getContext('2d');

const MEAN_DISTANCE = 384400;
const ECCENTRICITY = 0.0549;
const ANOMALISTIC_MONTH = 27.55455;
const SYNODIC_MONTH = 29.530588853;
const J2000 = Date.UTC(2000, 0, 1, 12);
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const today = new Date();
today.setUTCHours(12, 0, 0, 0);
let selectedDate = new Date(today);
let rotation = 0;
let dragRotation = 0;
let isDragging = false;
let lastPointerX = 0;
let sceneWidth = 0;
let sceneHeight = 0;
let stars = [];

const fallbackData = {
    number: 13,
    people: [
        { name: 'Oleg Kononenko', craft: 'ISS' },
        { name: 'Nikolai Chub', craft: 'ISS' },
        { name: 'Tracy Caldwell Dyson', craft: 'ISS' },
        { name: 'Matthew Dominick', craft: 'ISS' },
        { name: 'Michael Barratt', craft: 'ISS' },
        { name: 'Jeanette Epps', craft: 'ISS' },
        { name: 'Alexander Grebenkin', craft: 'ISS' },
        { name: 'Butch Wilmore', craft: 'ISS' },
        { name: 'Sunita Williams', craft: 'ISS' },
        { name: 'Don Pettit', craft: 'ISS' },
        { name: 'Li Cong', craft: 'Tiangong' },
        { name: 'Li Guangsu', craft: 'Tiangong' },
        { name: 'Ye Guangfu', craft: 'Tiangong' }
    ]
};

const spacecraftDatabase = {
    ISS: {
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
    Tiangong: {
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

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    sceneWidth = rect.width;
    sceneHeight = rect.height;
    canvas.width = Math.round(rect.width * pixelRatio);
    canvas.height = Math.round(rect.height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    stars = Array.from({ length: Math.max(70, Math.round(rect.width / 3)) }, () => ({
        x: Math.random() * sceneWidth,
        y: Math.random() * sceneHeight,
        size: Math.random() * 1.3 + 0.35,
        alpha: Math.random() * 0.45 + 0.15,
        phase: Math.random() * Math.PI * 2
    }));
}

function daysFromJ2000(date) {
    return (date.getTime() - J2000) / 86400000;
}

function getOrbitalState(date) {
    const days = daysFromJ2000(date);
    const meanAnomaly = ((days / ANOMALISTIC_MONTH) * Math.PI * 2) % (Math.PI * 2);
    const trueAnomaly = meanAnomaly + 2 * ECCENTRICITY * Math.sin(meanAnomaly);
    const semiMajorAxis = MEAN_DISTANCE;
    const distance = semiMajorAxis * (1 - ECCENTRICITY * ECCENTRICITY) / (1 + ECCENTRICITY * Math.cos(trueAnomaly));
    const phaseAge = ((date.getTime() - KNOWN_NEW_MOON) / 86400000 % SYNODIC_MONTH + SYNODIC_MONTH) % SYNODIC_MONTH;
    const phase = phaseAge / SYNODIC_MONTH;
    const illumination = (1 - Math.cos(phase * Math.PI * 2)) / 2;
    const phaseNames = [
        'New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous',
        'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'
    ];
    const phaseName = phaseNames[Math.floor((phase * 8 + 0.5) % 8)];
    return { distance, angle: trueAnomaly, phase, illumination, phaseName };
}

function formatUTCDate(date) {
    return new Intl.DateTimeFormat('en', {
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
    }).format(date);
}

function updateExplorer() {
    const state = getOrbitalState(selectedDate);
    const dayOffset = Math.round((selectedDate - today) / 86400000);
    document.getElementById('selected-date').textContent = formatUTCDate(selectedDate);
    document.getElementById('distance').textContent = Math.round(state.distance).toLocaleString('en-US');
    document.getElementById('phase-name').textContent = state.phaseName;
    document.getElementById('illumination').textContent = `${Math.round(state.illumination * 100)}% lit`;
    document.getElementById('phase-icon').textContent = state.phaseName === 'Full moon' ? '●' :
        state.phaseName === 'New moon' ? '○' : state.phaseName.includes('Waxing') ? '◔' : '◑';
    const context = dayOffset === 0 ? 'Today' : `${Math.abs(dayOffset)} day${Math.abs(dayOffset) === 1 ? '' : 's'} ${dayOffset < 0 ? 'in the past' : 'in the future'}`;
    document.getElementById('date-context').textContent = context;
    document.getElementById('offset-label').textContent = dayOffset === 0 ? 'TODAY' : `${dayOffset > 0 ? '+' : ''}${dayOffset} DAYS`;
    document.getElementById('time-slider').value = dayOffset;
    const rangeProgress = Math.max(0, Math.min(1, (state.distance - 363300) / (405500 - 363300)));
    document.getElementById('distance-marker').style.left = `${rangeProgress * 100}%`;
    const distanceNote = state.distance < 370000 ? 'Near perigee · the Moon is closer than usual' :
        state.distance > 399000 ? 'Near apogee · the Moon is farther than usual' :
            'About 30 Earth diameters from our planet';
    document.getElementById('distance-note').textContent = distanceNote;
}

function setSelectedDate(offset) {
    const boundedOffset = Math.max(-365, Math.min(365, offset));
    selectedDate = new Date(today.getTime() + boundedOffset * 86400000);
    updateExplorer();
}

function setDateFromOffset(offset) {
    setSelectedDate(Number(offset));
}

document.getElementById('time-slider').addEventListener('input', event => setDateFromOffset(event.target.value));
document.getElementById('back-button').addEventListener('click', () => setSelectedDate(Number(document.getElementById('time-slider').value) - 1));
document.getElementById('forward-button').addEventListener('click', () => setSelectedDate(Number(document.getElementById('time-slider').value) + 1));
document.getElementById('today-button').addEventListener('click', () => setSelectedDate(0));
document.getElementById('count').textContent = fallbackData.number;

function drawEarth(x, y, radius, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const ocean = ctx.createRadialGradient(-radius * .35, -radius * .42, radius * .03, 0, 0, radius);
    ocean.addColorStop(0, '#67cbff');
    ocean.addColorStop(.34, '#267ac9');
    ocean.addColorStop(1, '#102c67');
    ctx.fillStyle = ocean;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius * .99, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#45bb95';
    const continents = [
        [-.37, -.22, .21, .29, -.4], [-.24, .20, .10, .28, -.16],
        [.04, -.35, .10, .09, .2], [.20, -.22, .31, .22, -.08],
        [.40, .14, .16, .11, -.16], [-.43, -.60, .24, .10, 0]
    ];
    continents.forEach(([cx, cy, w, h, rotation]) => {
        ctx.save();
        ctx.translate(cx * radius, cy * radius);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, w * radius, h * radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    for (let i = 0; i < 9; i++) {
        const cloudAngle = i * 2.4 + .4;
        const cloudRadius = radius * (.26 + (i % 3) * .17);
        ctx.beginPath();
        ctx.ellipse(Math.cos(cloudAngle) * cloudRadius, Math.sin(cloudAngle) * cloudRadius * .72,
            radius * .15, radius * .045, cloudAngle, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(136,213,255,.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 1, -1.15, 1.05);
    ctx.stroke();
    ctx.restore();
}

function drawScene(timestamp) {
    if (!sceneWidth || !sceneHeight) return;
    const width = sceneWidth;
    const height = sceneHeight;
    const centerX = width * .46;
    const centerY = height * .48;
    const scale = Math.min(width / 680, height / 420, 1.25);
    const earthRadius = Math.min(width * .18, height * .31, 120) * (width < 560 ? .9 : 1);
    const orbitRadiusX = Math.min(width * .39, height * .58, 245);
    const orbitRadiusY = Math.min(height * .34, width * .25, 140);
    const orbital = getOrbitalState(selectedDate);
    const orbitAngle = orbital.angle - Math.PI / 2;
    const moonX = centerX + Math.cos(orbitAngle) * orbitRadiusX;
    const moonY = centerY + Math.sin(orbitAngle) * orbitRadiusY;
    const moonRadius = Math.max(6, earthRadius * .105);

    ctx.clearRect(0, 0, width, height);
    const background = ctx.createRadialGradient(centerX, centerY, 8, centerX, centerY, Math.max(width, height) * .75);
    background.addColorStop(0, '#0f1b35');
    background.addColorStop(1, '#080d1b');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    stars.forEach(star => {
        ctx.fillStyle = `rgba(191,211,255,${star.alpha * (.75 + Math.sin(timestamp * .0007 + star.phase) * .25)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    const orbitGlow = ctx.createRadialGradient(centerX, centerY, orbitRadiusY * .78, centerX, centerY, orbitRadiusX + 25);
    orbitGlow.addColorStop(0, 'rgba(40,77,133,0)');
    orbitGlow.addColorStop(1, 'rgba(40,77,133,.08)');
    ctx.fillStyle = orbitGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = 'rgba(123,158,218,.44)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, orbitRadiusX, orbitRadiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const connector = ctx.createLinearGradient(centerX, centerY, moonX, moonY);
    connector.addColorStop(0, 'rgba(114,184,255,.05)');
    connector.addColorStop(.55, 'rgba(114,184,255,.6)');
    connector.addColorStop(1, 'rgba(221,233,255,.7)');
    ctx.strokeStyle = connector;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(moonX, moonY);
    ctx.stroke();
    ctx.setLineDash([]);

    const glow = ctx.createRadialGradient(centerX, centerY, earthRadius * .7, centerX, centerY, earthRadius * 1.55);
    glow.addColorStop(0, 'rgba(66,157,255,.18)');
    glow.addColorStop(1, 'rgba(66,157,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius * 1.55, 0, Math.PI * 2);
    ctx.fill();
    drawEarth(centerX, centerY, earthRadius, rotation + dragRotation);

    ctx.save();
    ctx.shadowColor = '#e0e6f7';
    ctx.shadowBlur = 18;
    const moonGradient = ctx.createRadialGradient(moonX - moonRadius * .3, moonY - moonRadius * .35, 1, moonX, moonY, moonRadius * 1.15);
    moonGradient.addColorStop(0, '#f4f4f0');
    moonGradient.addColorStop(.7, '#c6cbd8');
    moonGradient.addColorStop(1, '#7f889d');
    ctx.fillStyle = moonGradient;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(94,103,124,.28)';
    [[-.3, -.15, .16], [.2, -.38, .11], [.35, .2, .19], [-.18, .4, .1]].forEach(([cx, cy, r]) => {
        ctx.beginPath();
        ctx.arc(moonX + cx * moonRadius * 2, moonY + cy * moonRadius * 2, r * moonRadius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();

    const labelFont = Math.max(10, Math.min(12, 11 * scale));
    ctx.font = `${labelFont}px "DM Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#bcd0f6';
    ctx.fillText('EARTH', centerX, centerY + earthRadius + 20);
    ctx.fillStyle = '#d7dced';
    ctx.fillText('MOON', moonX, moonY + moonRadius + 17);
    ctx.font = `${Math.max(9, labelFont - 1)}px "DM Mono", monospace`;
    ctx.fillStyle = 'rgba(185,204,238,.84)';
    ctx.fillText(`${Math.round(orbital.distance).toLocaleString('en-US')} km`, (centerX + moonX) / 2, (centerY + moonY) / 2 - 9);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(130,152,192,.65)';
    ctx.font = '9px "DM Mono", monospace';
    ctx.fillText('SCHEMATIC · NOT TO SCALE', 18, 24);

    if (!isDragging) rotation += .00025;
    window.requestAnimationFrame(drawScene);
}

function openCrewDetails(craftName) {
    const astronauts = fallbackData.people.filter(person => person.craft === craftName).map(person => person.name);
    const craftInfo = spacecraftDatabase[craftName];
    const body = document.getElementById('modal-body');
    document.getElementById('modal-title').textContent = craftInfo.fullName;
    body.replaceChildren();

    const position = document.createElement('section');
    position.className = 'position-info';
    const heading = document.createElement('h3');
    heading.textContent = 'Orbital information';
    position.appendChild(heading);
    [craftInfo.orbit, `Speed: ${craftInfo.speed}`, `Launched: ${craftInfo.launched}`].forEach(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        position.appendChild(paragraph);
    });
    body.appendChild(position);

    const crewSection = document.createElement('section');
    crewSection.className = 'astronaut-section';
    const crewHeading = document.createElement('h3');
    crewHeading.textContent = `Crew (${astronauts.length})`;
    crewSection.appendChild(crewHeading);
    astronauts.forEach(name => {
        const link = document.createElement('a');
        link.className = 'astronaut-item astronaut-link';
        link.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = name;
        crewSection.appendChild(link);
    });
    body.appendChild(crewSection);

    const timeline = document.createElement('section');
    timeline.className = 'timeline';
    const timelineHeading = document.createElement('h3');
    timelineHeading.textContent = 'Mission timeline';
    timeline.appendChild(timelineHeading);
    craftInfo.timeline.forEach(item => {
        const wrapper = document.createElement(item.url ? 'a' : 'div');
        wrapper.className = item.url ? 'timeline-item timeline-link' : 'timeline-item';
        if (item.url) {
            wrapper.href = item.url;
            wrapper.target = '_blank';
            wrapper.rel = 'noopener noreferrer';
        }
        const date = document.createElement('div');
        date.className = 'timeline-date';
        date.textContent = item.date;
        const event = document.createElement('div');
        event.className = 'timeline-event';
        event.textContent = item.event;
        wrapper.append(date, event);
        timeline.appendChild(wrapper);
    });
    body.appendChild(timeline);
    const modal = document.getElementById('modal');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
}

document.getElementById('iss-crew-button').addEventListener('click', () => openCrewDetails('ISS'));
document.getElementById('tiangong-crew-button').addEventListener('click', () => openCrewDetails('Tiangong'));
document.querySelector('.close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', event => {
    if (event.target === event.currentTarget) closeModal();
});
window.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
});
canvas.addEventListener('pointerdown', event => {
    isDragging = true;
    lastPointerX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
    if (!isDragging) return;
    dragRotation += (event.clientX - lastPointerX) * .006;
    lastPointerX = event.clientX;
});
canvas.addEventListener('pointerup', () => { isDragging = false; });
canvas.addEventListener('pointercancel', () => { isDragging = false; });
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
updateExplorer();
window.requestAnimationFrame(drawScene);
