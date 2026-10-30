const canvas = document.getElementById('globe');
const ctx = canvas.getContext('2d');
const moonCanvas = document.getElementById('moon-phase');
const moonCtx = moonCanvas.getContext('2d');

const MEAN_DISTANCE = 384400;
const ECCENTRICITY = 0.0549;
const ANOMALISTIC_MONTH = 27.55455;
const SYNODIC_MONTH = 29.530588853;
const J2000 = Date.UTC(2000, 0, 1, 12);
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
let selectedDate = new Date();
let liveMode = true;
let rotation = 0;
let dragRotation = 0;
let isDragging = false;
let manualRotation = false;
let pointerMoved = false;
let lastPointerX = 0;
let pointerStartX = 0;
let pointerStartY = 0;
let sceneWidth = 0;
let sceneHeight = 0;
let earthGeometry = null;
let stars = [];
let worldCountries = [];
let selectedLocation = { latitude: 51.48, longitude: 0, name: 'Greenwich, United Kingdom' };
let userSelectedLocation = false;
let satellites = [];
let telemetryState = 'connecting';
let tiangongElements = null;
let tiangongFetchTime = 0;

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

const continentOutlines = [
    [[72,-168],[68,-138],[60,-130],[57,-122],[49,-124],[42,-124],[33,-117],[27,-112],[23,-105],[18,-100],[15,-92],[19,-86],[24,-83],[29,-81],[31,-77],[36,-75],[40,-70],[45,-67],[49,-60],[54,-58],[58,-64],[61,-70],[69,-78],[73,-90],[71,-103],[75,-112],[72,-124],[74,-137],[72,-150],[72,-168]],
    [[12,-81],[8,-78],[4,-77],[-2,-80],[-7,-78],[-14,-75],[-20,-71],[-27,-70],[-34,-72],[-42,-73],[-51,-69],[-55,-66],[-52,-62],[-46,-65],[-39,-62],[-32,-58],[-25,-54],[-19,-50],[-12,-46],[-7,-39],[-2,-44],[2,-50],[6,-58],[9,-65],[11,-72],[12,-81]],
    [[36,-10],[43,-9],[48,-6],[51,2],[55,7],[59,6],[62,12],[69,18],[71,27],[67,33],[61,30],[57,24],[54,19],[50,15],[47,18],[44,14],[41,19],[38,27],[35,26],[36,19],[40,14],[43,8],[41,2],[38,-1],[36,-10]],
    [[36,-17],[33,-7],[36,10],[34,21],[31,31],[31,34],[28,34],[22,38],[15,43],[12,51],[6,50],[2,43],[-5,42],[-12,41],[-17,36],[-23,35],[-29,33],[-34,27],[-35,19],[-31,17],[-26,15],[-22,14],[-17,12],[-12,13],[-5,9],[0,9],[5,2],[5,-5],[10,-14],[16,-17],[22,-17],[28,-14],[33,-16],[36,-17]],
    [[70,30],[67,45],[60,54],[57,63],[55,73],[51,81],[54,92],[51,99],[49,108],[45,117],[41,121],[36,122],[31,121],[27,116],[22,113],[18,110],[14,108],[9,105],[5,102],[1,104],[-1,110],[5,116],[10,119],[17,123],[22,128],[30,130],[37,127],[43,133],[48,135],[53,143],[58,149],[61,160],[59,170],[64,179],[69,170],[67,157],[70,145],[72,130],[73,115],[72,100],[74,87],[72,72],[74,58],[71,45],[70,30]],
    [[-11,113],[-16,122],[-19,130],[-17,137],[-13,142],[-12,150],[-16,153],[-23,151],[-29,148],[-35,145],[-39,140],[-38,133],[-34,127],[-30,119],[-24,115],[-18,113],[-11,113]],
    [[60,-52],[64,-46],[70,-42],[76,-43],[81,-50],[83,-58],[80,-65],[75,-68],[69,-63],[64,-58],[60,-52]]
];

const countryBorders = [
    [[49,-123],[49,-110],[49,-102],[49,-95],[49,-90],[49,-83]],
    [[46,-123],[42,-117],[39,-120],[35,-114],[32,-111]],
    [[32,-117],[32,-110],[31,-106],[29,-103],[26,-99]],
    [[25,-107],[23,-105],[21,-102],[19,-99],[17,-95],[16,-91]],
    [[15,-92],[14,-89],[15,-87],[16,-84],[15,-83]],
    [[8,-77],[7,-75],[5,-74],[2,-73],[-1,-70],[-4,-70]],
    [[-4,-70],[-8,-70],[-13,-69],[-17,-69],[-22,-68],[-27,-69]],
    [[-22,-58],[-23,-55],[-25,-54],[-28,-55],[-31,-58]],
    [[-5,-74],[-9,-72],[-12,-74],[-16,-73],[-20,-70]],
    [[-18,47],[-22,44],[-25,47],[-23,49],[-18,47]],
    [[-3,30],[2,30],[5,30],[9,30],[12,31]],
    [[5,2],[9,3],[11,8],[13,13],[15,15]],
    [[-5,12],[-7,20],[-10,22],[-13,24],[-17,24]],
    [[-17,24],[-22,25],[-25,25],[-29,24],[-30,28]],
    [[22,25],[23,30],[22,33],[20,35]],
    [[30,32],[29,34],[27,34],[25,34]],
    [[42,28],[41,33],[40,36],[40,40],[41,44]],
    [[46,24],[47,28],[46,30],[45,33],[44,36]],
    [[48,17],[49,22],[50,24],[51,26],[53,25]],
    [[50,-1],[51,1],[52,4],[53,7],[54,8]],
    [[55,12],[56,15],[57,17],[58,20],[60,22]],
    [[35,68],[34,70],[33,72],[31,74],[29,76]],
    [[29,80],[27,83],[25,85],[23,88],[21,91]],
    [[28,88],[27,91],[26,94],[25,97],[22,99]],
    [[24,104],[22,106],[20,108],[18,109],[16,108]],
    [[47,87],[45,93],[44,100],[43,105],[41,111]],
    [[38,74],[37,78],[39,82],[40,87],[42,92]],
    [[34,104],[33,108],[31,111],[29,114],[27,118]],
    [[60,100],[58,110],[56,120],[55,130],[53,140]],
    [[-26,123],[-28,128],[-30,133],[-31,138],[-33,141]]
];

const islandOutlines = [
    [[50,-5],[51,-4],[52,-4],[54,-3],[55,-2],[56,-3],[58,-5],[57,-6],[55,-6],[54,-8],[52,-7],[51,-6],[50,-5]],
    [[36,-10],[38,-9],[40,-8],[42,-8],[43,-6],[41,-2],[39,-1],[37,-3],[36,-7],[36,-10]],
    [[40,7],[42,10],[44,12],[46,13],[45,16],[43,15],[41,13],[40,11],[40,7]],
    [[34,11],[36,12],[38,14],[40,16],[41,18],[39,19],[37,17],[35,15],[34,11]],
    [[31,129],[33,130],[35,132],[37,135],[39,139],[41,141],[43,144],[45,146],[44,141],[42,139],[40,136],[38,135],[36,134],[34,132],[33,130],[31,129]],
    [[-6,106],[-5,108],[-5,111],[-6,114],[-8,114],[-9,112],[-8,109],[-7,107],[-6,106]],
    [[-3,118],[-4,121],[-3,124],[-2,127],[-4,129],[-5,126],[-5,123],[-4,120],[-3,118]],
    [[-8,130],[-8,134],[-6,137],[-5,141],[-7,144],[-9,142],[-10,138],[-9,134],[-8,130]],
    [[-10,149],[-8,148],[-6,147],[-5,150],[-6,153],[-8,154],[-10,152],[-10,149]],
    [[19,-71],[20,-73],[21,-75],[20,-77],[19,-78],[18,-76],[18,-73],[19,-71]],
    [[12,-70],[13,-72],[15,-74],[17,-76],[18,-74],[17,-72],[15,-70],[13,-69],[12,-70]],
    [[-54,-38],[-52,-36],[-50,-37],[-49,-40],[-50,-43],[-52,-42],[-54,-40],[-54,-38]]
];

function drawWorldCountries(centerX, centerY, radius) {
    ctx.fillStyle = 'rgba(77,157,104,.97)';
    ctx.strokeStyle = 'rgba(135,207,158,.95)';
    ctx.lineWidth = .55;
    worldCountries.forEach(country => country.rings.forEach(ring => {
        ctx.beginPath();
        let drawing = false;
        ring.forEach(([longitude, latitude]) => {
            const point = projectLocation(latitude, longitude, radius, centerX, centerY);
            if (point.depth > 0) {
                if (!drawing) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
                drawing = true;
            } else if (drawing) {
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                drawing = false;
            }
        });
        if (drawing) {
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }));
    ctx.strokeStyle = 'rgba(19,81,82,.7)';
    ctx.lineWidth = .45;
    worldCountries.forEach(country => country.rings.forEach(ring => drawProjectedLine(
        ring.map(([longitude, latitude]) => [latitude, longitude]), centerX, centerY, radius, false
    )));
}

function findCountryAt(latitude, longitude) {
    for (const country of worldCountries) {
        for (const ring of country.rings) {
            let inside = false;
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                const [xi, yi] = ring[i];
                const [xj, yj] = ring[j];
                const crossesLatitude = (yi > latitude) !== (yj > latitude);
                const crossingLongitude = ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
                if (crossesLatitude && longitude < crossingLongitude) inside = !inside;
            }
            if (inside) return country.name;
        }
    }
    if (latitude > 75) return 'Arctic Ocean';
    if (latitude < -55) return 'Southern Ocean';
    if (longitude < -70 || longitude > 100) return 'Pacific Ocean';
    if (longitude >= -70 && longitude < 20) return 'Atlantic Ocean';
    return 'Indian Ocean';
}

async function loadWorldMap() {
    try {
        const response = await fetch('world-map.json');
        if (!response.ok) throw new Error(`World map data responded ${response.status}`);
        const map = await response.json();
        if (!Array.isArray(map.countries) || map.countries.length < 100) {
            throw new Error('World map data is incomplete');
        }
        worldCountries = map.countries;
        const country = findCountryAt(selectedLocation.latitude, selectedLocation.longitude);
        selectedLocation.name = userSelectedLocation ? country : `${country} · Greenwich`;
        updateExplorer();
    } catch (error) {
        console.warn('Detailed world map unavailable; showing the built-in outline map.', error);
    }
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    sceneWidth = rect.width;
    sceneHeight = rect.height;
    canvas.width = Math.round(rect.width * pixelRatio);
    canvas.height = Math.round(rect.height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    earthGeometry = getEarthGeometry();
    stars = Array.from({ length: Math.max(70, Math.round(rect.width / 3)) }, () => ({
        x: Math.random() * sceneWidth,
        y: Math.random() * sceneHeight,
        size: Math.random() * 1.3 + 0.35,
        alpha: Math.random() * 0.45 + 0.15,
        phase: Math.random() * Math.PI * 2
    }));
}

function getEarthGeometry() {
    const width = sceneWidth;
    const height = sceneHeight;
    return {
        x: width * .46,
        y: height * .48,
        radius: Math.min(width * .18, height * .31, 120) * (width < 560 ? .9 : 1)
    };
}

function daysFromJ2000(date) {
    return (date.getTime() - J2000) / 86400000;
}

function getOrbitalState(date) {
    const days = daysFromJ2000(date);
    const meanAnomaly = ((days / ANOMALISTIC_MONTH) * Math.PI * 2) % (Math.PI * 2);
    const trueAnomaly = meanAnomaly + 2 * ECCENTRICITY * Math.sin(meanAnomaly);
    const distance = MEAN_DISTANCE * (1 - ECCENTRICITY * ECCENTRICITY) / (1 + ECCENTRICITY * Math.cos(trueAnomaly));
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

function getMoonSkyPosition(date, latitude, longitude) {
    const days = daysFromJ2000(date);
    const degrees = Math.PI / 180;
    const sin = value => Math.sin(value * degrees);
    const cos = value => Math.cos(value * degrees);
    const meanElongation = 297.8501921 + 12.19074912 * days;
    const solarAnomaly = 357.5291092 + .98560028 * days;
    const lunarAnomaly = 134.9633964 + 13.06499295 * days;
    const argumentLatitude = 93.272095 + 13.22935024 * days;
    const eclipticLongitude = 218.3164477 + 13.17639648 * days +
        6.289 * sin(lunarAnomaly) + 1.274 * sin(2 * meanElongation - lunarAnomaly) +
        .658 * sin(2 * meanElongation) + .214 * sin(2 * lunarAnomaly) -
        .186 * sin(solarAnomaly) - .114 * sin(2 * argumentLatitude);
    const eclipticLatitude = 5.128 * sin(argumentLatitude) + .28 * sin(lunarAnomaly + argumentLatitude) +
        .277 * sin(lunarAnomaly - argumentLatitude) + .173 * sin(2 * meanElongation - argumentLatitude);
    const obliquity = 23.4393 - .0000004 * days;
    const rightAscension = Math.atan2(
        sin(eclipticLongitude) * cos(obliquity) - Math.tan(eclipticLatitude * degrees) * sin(obliquity),
        cos(eclipticLongitude)
    );
    const declination = Math.asin(
        sin(eclipticLatitude) * cos(obliquity) + cos(eclipticLatitude) * sin(obliquity) * sin(eclipticLongitude)
    );
    const julianDate = date.getTime() / 86400000 + 2440587.5;
    const centuries = (julianDate - 2451545) / 36525;
    const siderealDegrees = 280.46061837 + 360.98564736629 * (julianDate - 2451545) +
        .000387933 * centuries * centuries - centuries * centuries * centuries / 38710000;
    const hourAngle = ((siderealDegrees + longitude) * degrees - rightAscension + Math.PI) % (2 * Math.PI) - Math.PI;
    const observerLatitude = latitude * degrees;
    const horizontalParallax = Math.asin(6378.14 / getOrbitalState(date).distance);
    const deltaRightAscension = Math.atan2(
        -Math.cos(observerLatitude) * Math.sin(horizontalParallax) * Math.sin(hourAngle),
        Math.cos(declination) - Math.cos(observerLatitude) * Math.sin(horizontalParallax) * Math.cos(hourAngle)
    );
    const topocentricDeclination = Math.atan2(
        (Math.sin(declination) - Math.sin(observerLatitude) * Math.sin(horizontalParallax)) *
            Math.cos(deltaRightAscension),
        Math.cos(declination) - Math.cos(observerLatitude) * Math.sin(horizontalParallax) * Math.cos(hourAngle)
    );
    const topocentricHourAngle = hourAngle - deltaRightAscension;
    const altitude = Math.asin(
        Math.sin(observerLatitude) * Math.sin(topocentricDeclination) +
        Math.cos(observerLatitude) * Math.cos(topocentricDeclination) * Math.cos(topocentricHourAngle)
    );
    const azimuth = Math.atan2(
        -Math.sin(topocentricHourAngle) * Math.cos(topocentricDeclination),
        Math.sin(topocentricDeclination) * Math.cos(observerLatitude) -
        Math.cos(topocentricDeclination) * Math.sin(observerLatitude) * Math.cos(topocentricHourAngle)
    );
    return {
        altitude: altitude / degrees,
        azimuth: (azimuth / degrees + 360) % 360,
        orientation: Math.atan2(
            Math.sin(topocentricHourAngle),
            Math.tan(observerLatitude) * Math.cos(topocentricDeclination) -
            Math.sin(topocentricDeclination) * Math.cos(topocentricHourAngle)
        )
    };
}

function formatUTCDate(date) {
    return new Intl.DateTimeFormat('en', {
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
    }).format(date);
}

function formatUTCClock(date) {
    return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC', hour12: false
    }).format(date);
}

function getTelemetryLabel() {
    return satellites.map(satellite =>
        satellite.source === 'live' ? `ISS · ${formatUTCClock(new Date(satellite.timestamp * 1000))} UTC` :
            `TIANGONG ${satellite.stale ? '· STALE' : 'TLE'} · ${formatUTCClock(new Date(satellite.epoch))} UTC`
    ).join(' · ');
}

function updateExplorer() {
    const state = getOrbitalState(selectedDate);
    const dayOffset = Math.round((selectedDate - today) / 86400000);
    const moonSky = getMoonSkyPosition(selectedDate, selectedLocation.latitude, selectedLocation.longitude);
    document.getElementById('selected-date').textContent = `${formatUTCDate(selectedDate)} · ${formatUTCClock(selectedDate)}`;
    document.getElementById('utc-clock').textContent = formatUTCClock(new Date());
    document.getElementById('distance').textContent = Math.round(state.distance).toLocaleString('en-US');
    document.getElementById('phase-name').textContent = state.phaseName;
    document.getElementById('illumination').textContent = `${Math.round(state.illumination * 100)}% lit`;
    document.getElementById('phase-icon').textContent = state.phaseName === 'Full moon' ? '●' :
        state.phaseName === 'New moon' ? '○' : state.phaseName.includes('Waxing') ? '◔' : '◑';
    const context = liveMode ? 'LIVE · updating every second' : dayOffset === 0 ? 'Today · paused' :
        `${Math.abs(dayOffset)} day${Math.abs(dayOffset) === 1 ? '' : 's'} ${dayOffset < 0 ? 'in the past' : 'in the future'} · paused`;
    document.getElementById('date-context').textContent = context;
    document.getElementById('today-button').textContent = liveMode ? 'LIVE NOW' : 'RETURN TO LIVE';
    document.getElementById('offset-label').textContent = liveMode ? 'LIVE' : `${dayOffset > 0 ? '+' : ''}${dayOffset} DAYS`;
    document.getElementById('time-slider').value = dayOffset;
    const rangeProgress = Math.max(0, Math.min(1, (state.distance - 363300) / (405500 - 363300)));
    document.getElementById('distance-marker').style.left = `${rangeProgress * 100}%`;
    const distanceNote = state.distance < 370000 ? 'Near perigee · the Moon is closer than usual' :
        state.distance > 399000 ? 'Near apogee · the Moon is farther than usual' :
            'About 30 Earth diameters from our planet';
    document.getElementById('distance-note').textContent = distanceNote;
    document.getElementById('location-name').textContent = selectedLocation.name;
    document.getElementById('location-coordinates').textContent =
        `${Math.abs(selectedLocation.latitude).toFixed(2)}° ${selectedLocation.latitude >= 0 ? 'N' : 'S'}, ` +
        `${Math.abs(selectedLocation.longitude).toFixed(2)}° ${selectedLocation.longitude >= 0 ? 'E' : 'W'}`;
    const compassPoint = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(moonSky.azimuth / 45) % 8];
    document.getElementById('moon-altitude').textContent =
        `Altitude ${moonSky.altitude.toFixed(1)}° · ${compassPoint} ${moonSky.azimuth.toFixed(0)}°`;
    document.getElementById('moon-visibility').textContent = moonSky.altitude >= 0 ? 'ABOVE HORIZON' : 'BELOW HORIZON';
    document.getElementById('moon-visibility').classList.toggle('is-visible', moonSky.altitude >= 0);
    document.getElementById('moon-time-mode').textContent = liveMode ? 'LIVE UTC' : dayOffset === 0 ? 'TODAY · PAUSED' :
        `${dayOffset < 0 ? 'PAST' : 'FUTURE'} · PAUSED`;
    if (!liveMode && telemetryState === 'live') {
        document.getElementById('telemetry-status').textContent = 'LIVE ISS MARKER HIDDEN · TIME-TRAVEL VIEW';
    } else if (liveMode && telemetryState === 'live' && satellites.length) {
        document.getElementById('telemetry-status').textContent = `LIVE TRACKING · ${getTelemetryLabel()}`;
    }
    drawMoonPhase(state, moonSky.orientation);
}

function updateRotationControl() {
    const degrees = ((rotation + dragRotation) * 180 / Math.PI % 360 + 360) % 360;
    const control = document.getElementById('globe-rotation');
    const displayDegrees = manualRotation && Math.round(degrees) === 0 && Number(control.value) === 360
        ? 360
        : Math.round(degrees);
    control.value = displayDegrees;
    document.getElementById('rotation-value').value = `${displayDegrees}°`;
    document.getElementById('rotation-value').textContent = `${displayDegrees}°`;
}

document.getElementById('globe-rotation').addEventListener('input', event => {
    rotation = 0;
    dragRotation = Number(event.target.value) * Math.PI / 180;
    manualRotation = true;
    updateRotationControl();
});
document.getElementById('rotation-reset').addEventListener('click', () => {
    rotation = 0;
    dragRotation = 0;
    manualRotation = false;
    updateRotationControl();
});

function setSelectedDate(offset, returnToLive = false) {
    const boundedOffset = Math.max(-365, Math.min(365, offset));
    liveMode = returnToLive;
    if (liveMode) {
        selectedDate = new Date();
    } else {
        selectedDate = new Date(today.getTime() + boundedOffset * 86400000 + (new Date().getTime() % 86400000));
    }
    updateExplorer();
}

document.getElementById('time-slider').addEventListener('input', event => setSelectedDate(Number(event.target.value)));
document.getElementById('back-button').addEventListener('click', () => setSelectedDate(Number(document.getElementById('time-slider').value) - 1));
document.getElementById('forward-button').addEventListener('click', () => setSelectedDate(Number(document.getElementById('time-slider').value) + 1));
document.getElementById('today-button').addEventListener('click', () => setSelectedDate(0, true));
document.getElementById('count').textContent = fallbackData.number;

function drawMoonPhase(state, orientation) {
    const width = moonCanvas.width;
    const height = moonCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 24;
    moonCtx.clearRect(0, 0, width, height);
    moonCtx.save();
    moonCtx.translate(centerX, centerY);
    moonCtx.rotate(orientation);
    moonCtx.beginPath();
    moonCtx.arc(0, 0, radius, 0, Math.PI * 2);
    moonCtx.clip();
    moonCtx.fillStyle = '#30394d';
    moonCtx.fillRect(-radius, -radius, radius * 2, radius * 2);
    const waxing = state.phase < .5;
    const angle = state.phase * Math.PI * 2;
    const terminatorCenter = radius * Math.cos(angle) * (waxing ? 1 : -1);
    const terminatorWidth = radius * Math.abs(Math.cos(angle));
    moonCtx.fillStyle = '#eef1ff';
    moonCtx.beginPath();
    if (waxing) {
        moonCtx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2);
        moonCtx.ellipse(terminatorCenter, 0, terminatorWidth, radius, 0, Math.PI / 2, -Math.PI / 2, true);
    } else {
        moonCtx.arc(0, 0, radius, Math.PI / 2, -Math.PI / 2);
        moonCtx.ellipse(terminatorCenter, 0, terminatorWidth, radius, 0, -Math.PI / 2, Math.PI / 2, true);
    }
    moonCtx.closePath();
    moonCtx.fill();
    moonCtx.restore();
}

function projectLocation(latitude, longitude, radius, centerX, centerY) {
    const lat = latitude * Math.PI / 180;
    const lon = longitude * Math.PI / 180 + rotation + dragRotation;
    const depth = Math.cos(lat) * Math.cos(lon);
    return {
        x: centerX + radius * Math.cos(lat) * Math.sin(lon),
        y: centerY - radius * Math.sin(lat),
        depth
    };
}

function drawEarth(x, y, radius) {
    ctx.save();
    const ocean = ctx.createRadialGradient(x - radius * .35, y - radius * .42, radius * .03, x, y, radius);
    ocean.addColorStop(0, '#67cbff');
    ocean.addColorStop(.34, '#267ac9');
    ocean.addColorStop(1, '#102c67');
    ctx.fillStyle = ocean;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius * .99, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(147,201,245,.17)';
    ctx.lineWidth = .7;
    for (let latitude = -60; latitude <= 60; latitude += 30) {
        const points = [];
        for (let longitude = -180; longitude <= 180; longitude += 5) points.push([latitude, longitude]);
        drawProjectedLine(points, x, y, radius, false);
    }
    for (let longitude = -180; longitude < 180; longitude += 30) {
        const points = [];
        for (let latitude = -90; latitude <= 90; latitude += 5) points.push([latitude, longitude]);
        drawProjectedLine(points, x, y, radius, false);
    }
    const terrain = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    terrain.addColorStop(0, 'rgba(128,197,135,.95)');
    terrain.addColorStop(.5, 'rgba(91,169,116,.97)');
    terrain.addColorStop(1, 'rgba(46,125,94,.98)');
    if (worldCountries.length) {
        drawWorldCountries(x, y, radius);
    } else {
        ctx.strokeStyle = 'rgba(101,228,190,.92)';
        ctx.lineWidth = 1;
        [...continentOutlines, ...islandOutlines].forEach(outline => {
            const visible = outline.map(([latitude, longitude]) => projectLocation(latitude, longitude, radius, x, y));
            ctx.beginPath();
            let drawing = false;
            visible.forEach(point => {
                if (point.depth > 0) {
                    if (!drawing) ctx.moveTo(point.x, point.y);
                    else ctx.lineTo(point.x, point.y);
                    drawing = true;
                } else {
                    if (drawing) {
                        ctx.closePath();
                        ctx.fillStyle = terrain;
                        ctx.fill();
                        ctx.stroke();
                        ctx.beginPath();
                    }
                    drawing = false;
                }
            });
            if (drawing) {
                ctx.closePath();
                ctx.fillStyle = terrain;
                ctx.fill();
            }
            ctx.stroke();
        });
        ctx.strokeStyle = 'rgba(15,76,79,.78)';
        ctx.lineWidth = .8;
        countryBorders.forEach(border => drawProjectedLine(border, x, y, radius, false));
    }
    ctx.fillStyle = 'rgba(235,247,255,.62)';
    ctx.beginPath();
    ctx.ellipse(x, y - radius * .9, radius * .45, radius * .075, 0, 0, Math.PI * 2);
    ctx.ellipse(x, y + radius * .9, radius * .4, radius * .065, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    (liveMode ? satellites : []).forEach(satellite => {
        const point = projectLocation(satellite.latitude, satellite.longitude, radius, x, y);
        if (point.depth <= 0) return;
        ctx.save();
        ctx.shadowColor = '#ffd36e';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffd36e';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = '#fff0c2';
        ctx.textAlign = 'center';
        ctx.fillText(satellite.name, point.x, point.y - 8);
        ctx.restore();
    });

    const selected = projectLocation(selectedLocation.latitude, selectedLocation.longitude, radius, x, y);
    if (selected.depth > 0) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(selected.x, selected.y, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#65e4ee';
        ctx.beginPath();
        ctx.arc(selected.x, selected.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = 'rgba(136,213,255,.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius + 1, -1.15, 1.05);
    ctx.stroke();
}

function drawProjectedLine(points, centerX, centerY, radius, close) {
    const coordinates = close ? [...points, points[0]] : points;
    ctx.beginPath();
    let drawing = false;
    coordinates.forEach(([latitude, longitude]) => {
        const point = projectLocation(latitude, longitude, radius, centerX, centerY);
        if (point.depth > 0) {
            if (!drawing) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
            drawing = true;
        } else {
            drawing = false;
        }
    });
    ctx.stroke();
}

function drawScene(timestamp) {
    if (!sceneWidth || !sceneHeight) return;
    const width = sceneWidth;
    const height = sceneHeight;
    const { x: centerX, y: centerY, radius: earthRadius } = earthGeometry;
    const orbital = getOrbitalState(selectedDate);
    const orbitRadiusX = Math.min(width * .39, height * .58, 245);
    const orbitRadiusY = Math.min(height * .34, width * .25, 140);
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
    drawEarth(centerX, centerY, earthRadius);

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
    ctx.restore();

    ctx.font = '10px "DM Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#bcd0f6';
    ctx.fillText('EARTH', centerX, centerY + earthRadius + 20);
    ctx.fillStyle = '#d7dced';
    ctx.fillText('MOON', moonX, moonY + moonRadius + 17);
    ctx.fillStyle = 'rgba(185,204,238,.84)';
    ctx.fillText(`${Math.round(orbital.distance).toLocaleString('en-US')} km`, (centerX + moonX) / 2, (centerY + moonY) / 2 - 9);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(130,152,192,.65)';
    ctx.font = '9px "DM Mono", monospace';
    ctx.fillText('ORBIT & DISTANCE SCHEMATIC · CLICK GLOBE FOR LOCAL SKY', 18, 24);
    if (!isDragging && !manualRotation) rotation += .00025;
    updateRotationControl();
    window.requestAnimationFrame(drawScene);
}

function selectGlobeLocation(pointerX, pointerY) {
    const { x, y, radius } = earthGeometry;
    const normalizedX = (pointerX - x) / radius;
    const normalizedY = -(pointerY - y) / radius;
    const radiusSquared = normalizedX * normalizedX + normalizedY * normalizedY;
    if (radiusSquared > 1) return;
    const latitude = Math.asin(normalizedY) * 180 / Math.PI;
    const longitude = Math.asin(normalizedX / Math.sqrt(1 - normalizedY * normalizedY)) * 180 / Math.PI -
        (rotation + dragRotation) * 180 / Math.PI;
    const normalizedLongitude = ((longitude + 540) % 360) - 180;
    const latLabel = latitude >= 0 ? 'N' : 'S';
    const lonLabel = normalizedLongitude >= 0 ? 'E' : 'W';
    selectedLocation = {
        latitude,
        longitude: normalizedLongitude,
        name: `${worldCountries.length ? findCountryAt(latitude, normalizedLongitude) : 'Selected location'}`
    };
    userSelectedLocation = true;
    updateExplorer();
}

async function getIssPosition() {
    const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544', { cache: 'no-store' });
    if (!response.ok) throw new Error(`ISS service responded ${response.status}`);
    const position = await response.json();
    if (!Number.isFinite(position.latitude) || !Number.isFinite(position.longitude) || !Number.isFinite(position.timestamp)) {
        throw new Error('ISS service returned an invalid position');
    }
    return { name: 'ISS', latitude: position.latitude, longitude: position.longitude, timestamp: position.timestamp, source: 'live' };
}

function propagateTiangong(date, elements) {
    const degrees = Math.PI / 180;
    const secondsSinceEpoch = (date.getTime() - elements.epoch) / 1000;
    const meanMotion = elements.meanMotion * 2 * Math.PI / 86400;
    const semiMajorAxis = Math.cbrt(398600.4418 / (meanMotion * meanMotion));
    const inclination = elements.inclination * degrees;
    const p = semiMajorAxis * (1 - elements.eccentricity * elements.eccentricity);
    const j2 = 1.08262668e-3;
    const earthRadius = 6378.137;
    const ratio = j2 * (earthRadius / p) ** 2 * meanMotion;
    const nodeRate = -1.5 * ratio * Math.cos(inclination);
    const perigeeRate = .75 * ratio * (5 * Math.cos(inclination) ** 2 - 1);
    const meanRate = meanMotion + .75 * ratio * Math.sqrt(1 - elements.eccentricity ** 2) *
        (3 * Math.cos(inclination) ** 2 - 1);
    const node = elements.node + nodeRate * secondsSinceEpoch;
    const argumentOfPerigee = elements.perigee + perigeeRate * secondsSinceEpoch;
    const meanAnomaly = elements.meanAnomaly + meanRate * secondsSinceEpoch;
    let eccentricAnomaly = meanAnomaly;
    for (let iteration = 0; iteration < 8; iteration++) {
        eccentricAnomaly -= (eccentricAnomaly - elements.eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
            (1 - elements.eccentricity * Math.cos(eccentricAnomaly));
    }
    const trueAnomaly = Math.atan2(
        Math.sqrt(1 - elements.eccentricity ** 2) * Math.sin(eccentricAnomaly),
        Math.cos(eccentricAnomaly) - elements.eccentricity
    );
    const radius = semiMajorAxis * (1 - elements.eccentricity * Math.cos(eccentricAnomaly));
    const argument = argumentOfPerigee + trueAnomaly;
    const eciX = radius * (Math.cos(node) * Math.cos(argument) - Math.sin(node) * Math.sin(argument) * Math.cos(inclination));
    const eciY = radius * (Math.sin(node) * Math.cos(argument) + Math.cos(node) * Math.sin(argument) * Math.cos(inclination));
    const eciZ = radius * Math.sin(argument) * Math.sin(inclination);
    const julianDate = date.getTime() / 86400000 + 2440587.5;
    const centuries = (julianDate - 2451545) / 36525;
    const sidereal = (280.46061837 + 360.98564736629 * (julianDate - 2451545) +
        .000387933 * centuries * centuries - centuries * centuries * centuries / 38710000) * degrees;
    const ecefX = Math.cos(sidereal) * eciX + Math.sin(sidereal) * eciY;
    const ecefY = -Math.sin(sidereal) * eciX + Math.cos(sidereal) * eciY;
    return {
        name: 'Tiangong',
        latitude: Math.atan2(eciZ, Math.hypot(ecefX, ecefY)) / degrees,
        longitude: Math.atan2(ecefY, ecefX) / degrees,
        source: 'tle',
        epoch: elements.epoch
    };
}

async function getTiangongPosition(date) {
    const now = date.getTime();
    let stale = false;
    if (!tiangongElements || now - tiangongFetchTime > 30 * 60 * 1000) {
        try {
            const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=48274&FORMAT=json', { cache: 'no-store' });
            if (!response.ok) throw new Error(`CelesTrak responded ${response.status}`);
            const [element] = await response.json();
            if (!element || element.OBJECT_NAME !== 'CSS (TIANHE)' ||
                !Number.isFinite(element.MEAN_MOTION) || !Number.isFinite(element.ECCENTRICITY) ||
                !Number.isFinite(element.INCLINATION) || !Number.isFinite(element.RA_OF_ASC_NODE) ||
                !Number.isFinite(element.ARG_OF_PERICENTER) || !Number.isFinite(element.MEAN_ANOMALY)) {
                throw new Error('CelesTrak returned invalid Tiangong orbital elements');
            }
            tiangongElements = {
                epoch: Date.parse(`${element.EPOCH}Z`),
                meanMotion: element.MEAN_MOTION,
                eccentricity: element.ECCENTRICITY,
                inclination: element.INCLINATION,
                node: element.RA_OF_ASC_NODE * Math.PI / 180,
                perigee: element.ARG_OF_PERICENTER * Math.PI / 180,
                meanAnomaly: element.MEAN_ANOMALY * Math.PI / 180
            };
            if (!Number.isFinite(tiangongElements.epoch)) throw new Error('Tiangong element epoch was invalid');
            tiangongFetchTime = now;
        } catch (error) {
            if (!tiangongElements) throw error;
            stale = true;
            tiangongFetchTime = now;
            console.warn('Tiangong orbital element refresh failed; propagating the last valid elements.', error);
        }
    }
    return { ...propagateTiangong(date, tiangongElements), stale };
}

async function updateSatelliteTelemetry() {
    const results = await Promise.allSettled([getIssPosition(), getTiangongPosition(new Date())]);
    satellites = results.filter(result => result.status === 'fulfilled').map(result => result.value);
    const failures = results.filter(result => result.status === 'rejected').map(result => result.reason);
    telemetryState = satellites.length ? 'live' : 'unavailable';
    document.getElementById('telemetry-status').textContent = satellites.length
        ? liveMode ? `LIVE TRACKING · ${getTelemetryLabel()}` :
            `LIVE FEEDS · MARKERS HIDDEN IN TIME-TRAVEL VIEW · ${getTelemetryLabel()}`
        : 'LIVE SATELLITE DATA UNAVAILABLE · NO SIMULATED MARKERS';
    failures.forEach(error => console.warn('A live satellite position could not be updated.', error));
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
    pointerMoved = false;
    lastPointerX = event.clientX;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
    if (!isDragging) return;
    const dx = event.clientX - lastPointerX;
    if (Math.abs(event.clientX - pointerStartX) + Math.abs(event.clientY - pointerStartY) > 3) pointerMoved = true;
    if (dx) manualRotation = true;
    dragRotation += dx * .012;
    lastPointerX = event.clientX;
});
canvas.addEventListener('pointerup', event => {
    isDragging = false;
    if (!pointerMoved) {
        const rect = canvas.getBoundingClientRect();
        selectGlobeLocation(event.clientX - rect.left, event.clientY - rect.top);
    }
});
canvas.addEventListener('pointercancel', () => { isDragging = false; });
canvas.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
        const rect = canvas.getBoundingClientRect();
        selectGlobeLocation(rect.width * .46, rect.height * .48);
        event.preventDefault();
    }
});
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
updateExplorer();
updateRotationControl();
window.requestAnimationFrame(drawScene);
loadWorldMap().then(() => updateExplorer());
updateSatelliteTelemetry();
window.setInterval(() => {
    if (liveMode) {
        selectedDate = new Date();
        updateExplorer();
    } else {
        document.getElementById('utc-clock').textContent = formatUTCClock(new Date());
    }
}, 1000);
window.setInterval(updateSatelliteTelemetry, 10000);
