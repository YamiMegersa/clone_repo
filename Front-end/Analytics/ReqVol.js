// ==========================================
// 1. GLOBAL STATE
// ==========================================
let currentSelection = { type: 'province', ids: { provinceId: 1 } }; 

// ==========================================
// 2. THE MAP CLICK HANDLER
// ==========================================
function onMapClick(type, ids) {
    currentSelection = { type, ids };
    
    const radios = document.querySelectorAll('input[name="granularity"]');
    radios.forEach(radio => {
        // Updated to handle "Provincial" vs "province"
        const label = radio.nextElementSibling.textContent.trim().toLowerCase();
        if (label.includes(type.substring(0, 4))) radio.checked = true;
    });

    fetchDashboardData();
}

// ==========================================
// 3. TIMEFRAME & FETCH LOGIC
// ==========================================
function getDateRange() {
    const selectedTime = document.querySelector('input[name="timeframe"]:checked').nextElementSibling.textContent.trim();
    const endDate = new Date();
    const startDate = new Date();

    if (selectedTime === '24h') {
        startDate.setHours(startDate.getHours() - 24);
    } else if (selectedTime === '7 Days') {
        startDate.setDate(startDate.getDate() - 7);
    } else if (selectedTime === '30 Days') {
        startDate.setDate(startDate.getDate() - 30);
    }

    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

async function fetchDashboardData() {
    const { start, end } = getDateRange();
    const { type, ids } = currentSelection;
    let url = '';

// Route selection based on map click
    if (type === 'ward') {
        url = `/api/sandbox/ward/${ids.municipalityId}/${ids.wardId}?startDate=${start}&endDate=${end}`;
    } else if (type === 'municipality') {
        url = `/api/sandbox/municipality/${ids.municipalityId}?startDate=${start}&endDate=${end}`;
    } else if (type === 'province') {
        url = `/api/sandbox/province/${ids.provinceId}?startDate=${start}&endDate=${end}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const reports = await response.json();
        updateUI(reports);
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Show error in UI
        document.getElementById('req-volume-count').textContent = "Error";
        document.getElementById('res-volume-count').textContent = "Error";
    }
}

// ==========================================
// 4. UI UPDATER
// ==========================================
function updateUI(reports) {
    const totalRequests = reports.length;
    const resolvedRequests = reports.filter(r => (r.Progress || '').toLowerCase() === 'resolved').length;
    const resolutionRate = totalRequests === 0 ? 0 : Math.round((resolvedRequests / totalRequests) * 100);

    document.getElementById('req-volume-count').textContent = formatNumber(totalRequests);
    document.getElementById('res-volume-count').textContent = formatNumber(resolvedRequests);
    document.getElementById('res-rate-text').textContent = `${resolutionRate}%`;

    const circle = document.getElementById('res-rate-circle');
    const dashOffset = 402.12 - ((402.12 * resolutionRate) / 100);
    circle.style.strokeDashoffset = dashOffset;
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num;
}

// ==========================================
// 5. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const timeRadios = document.querySelectorAll('input[name="timeframe"]');
    timeRadios.forEach(radio => {
        radio.addEventListener('change', fetchDashboardData);
    });

    // Force an initial load
    fetchDashboardData(); 
});