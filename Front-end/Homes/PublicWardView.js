// ==========================================
// 1. GLOBAL STATE
// ==========================================
// Variables declared at the top level so they can be accessed and modified 
// by any function inside this file.
let currentReports = []; // Stores the master list of reports so we don't have to keep asking the database.
let activeReportId = null; // Remembers which issue the user clicked on for the modal.
let mainMap = null; // Holds the main Leaflet map object so we can add pins to it later.
let modalMap = null; // Holds the smaller mini-map inside the issue details modal.

// ==========================================
// 2. PAGE INITIALISATION
// ==========================================
// 'DOMContentLoaded' waits for the raw HTML to finish loading before running this script.
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Extract Ward ID from the URL
    // URLSearchParams is a built-in browser tool that reads the URL (e.g., website.com/page?wardId=7)
    // and lets us easily grab the value attached to 'wardId'.
    const urlParams = new URLSearchParams(window.location.search);
    const wardId = urlParams.get('wardId');

    // 2. Security / UX Redirect
    // If a guest tries to open this page directly without a wardId in the URL,
    // we immediately bounce them back to the dashboard.
    if (!wardId) {
        window.location.href = 'GuestDashboard.html';
        return; // Stops the rest of the script from crashing.
    }

    // 3. Update UI Headers
    // Dynamically inject the Ward ID into the massive H1 tag at the top of the page.
    document.getElementById('ward-title').textContent = `WARD ${wardId}`;

    // 4. Initialise the Leaflet Map
    // We must draw the empty map container on the screen BEFORE we try to put pins on it.
    initMap();

    // 5. Fetch Data from PUBLIC endpoints
    // Fire off the asynchronous requests to grab the reports and the councillor details.
    fetchWardReports(wardId);
    fetchWardDetails(wardId);

    // ==========================================
    // MODAL & CAROUSEL EVENT LISTENERS
    // ==========================================
    const dialog = document.getElementById('issue-modal');
    
    // Closes the modal when the 'X' button is clicked.
    document.getElementById('close-issue-modal').addEventListener('click', () => dialog.close());
    
    // Closes the modal if the user clicks the dark blurred background outside the modal box.
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close(); 
    });

    // --- Image Carousel Logic ---
    const carousel = document.getElementById('modal-carousel');
    const btnPrev = document.getElementById('carousel-prev');
    const btnNext = document.getElementById('carousel-next');

    // Safety check: Only attach these click listeners if the HTML elements actually exist.
    if (btnPrev && btnNext && carousel) {
        btnNext.addEventListener('click', () => {
            // clientWidth gets the exact pixel width of the visible box.
            // scrollBy smoothly slides the images over by exactly one image width.
            carousel.scrollBy({ left: carousel.clientWidth, behavior: 'smooth' });
        });

        btnPrev.addEventListener('click', () => {
            // Negative width scrolls it backward to the left.
            carousel.scrollBy({ left: -carousel.clientWidth, behavior: 'smooth' });
        });
    }
});

// ==========================================
// 3. MAP CONTROLLER (Leaflet.js)
// ==========================================
function initMap() {
    // L.map() targets the HTML element with id="ward-map".
    // .setView([Latitude, Longitude], ZoomLevel) centers the map over Johannesburg initially.
    mainMap = L.map('ward-map').setView([-26.2041, 28.0473], 13);

    // Leaflet doesn't have its own map images; it loads them from third parties called "Tile Layers".
    // Here we are requesting the 'dark_all' theme from CartoDB to match the UI's dark aesthetic.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19 // Prevents users from zooming in so close the map breaks.
    }).addTo(mainMap);
}

function renderMapMarkers(reports) {
    if (!mainMap) return; // Safety check.

    // A 'LatLngBounds' object acts like an invisible bounding box. 
    // We will stretch this box to wrap around every pin we place on the map.
    let bounds = L.latLngBounds(); 
    let validMarkers = 0;

    // Loop through every report the database gave us.
    reports.forEach(report => {
        // Robust check: Grab the coordinate whether it is uppercase or lowercase
        const lat = report.Latitude || report.latitude;
        const lng = report.Longitude || report.longitude;

        // Only plot a pin if the report actually contains valid GPS coordinates.
        if (lat && lng && parseFloat(lat) !== 0) {
            
            // Determine marker color based on the report's progress.
            const progressStr = (report.Progress || '').toLowerCase();
            const isResolved = progressStr === 'resolved' || progressStr === 'fixed';
            const markerColor = isResolved ? '#22c55e' : '#ef4444'; // Tailwind Green-500 or Red-500

            // Create a custom circle marker at the specific coordinates.
            const marker = L.circleMarker([report.Latitude, report.Longitude], {
                radius: 8,
                fillColor: markerColor,
                color: '#ffffff', // White border around the circle
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(mainMap); // Drop it onto the map.

            // bindPopup creates a tiny HTML tooltip that appears when a user clicks the pin.
            marker.bindPopup(`
                <b style="color: #000;">${report.Type || 'Issue'}</b><br>
                <span style="color: #333;">${report.Progress || 'Pending'}</span>
            `);

            // Stretch our invisible bounding box to include these new coordinates.
            bounds.extend([report.Latitude, report.Longitude]);
            validMarkers++;
        }
    });

    // If we actually plotted any pins, auto-zoom and pan the camera 
    // so that every single pin fits perfectly inside the screen at once.
    if (validMarkers > 0) {
        mainMap.fitBounds(bounds, { padding: [50, 50] });
    }
}

// ==========================================
// 4. API FETCH FUNCTIONS
// ==========================================
async function fetchWardReports(wardId) {
    try {
        // Await pauses the function until the server replies with the data.
        const response = await fetch(`/api/public/reports/ward/${wardId}`);
        if (!response.ok) throw new Error('Failed to fetch reports');
        
        // Save the raw database array to our global variable.
        currentReports = await response.json(); 
        
        // Pass that array to the functions that draw the UI.
        renderStats(currentReports);
        renderTable(currentReports);
        renderMapMarkers(currentReports); 

    } catch (error) {
        console.error('Error fetching ward data:', error);
        // If the server crashes, inject a friendly error message into the table.
        document.getElementById('reports-table-body').innerHTML = `
            <tr><td colspan="4" class="px-8 py-6 text-center text-red-400 font-bold">Failed to load reports. Please try again later.</td></tr>
        `;
    }
}

async function fetchWardDetails(wardId) {
    try {
        const response = await fetch(`/api/public/geography/wards/${wardId}`);
        if (!response.ok) throw new Error('Failed to fetch ward details');
        
        const ward = await response.json();
        // If the ward has no councillor assigned in the DB, default to 'Unassigned'.
        const councillorName = ward.WardCouncillor ? ward.WardCouncillor : 'Unassigned'; 
        document.getElementById('councillor-label').textContent = `Councillor: ${councillorName}`;

    /* istanbul ignore next */
    } catch (error) {
        console.error('Error fetching ward details:', error);
        // Fallback text if the fetch fails so the UI doesn't look broken.
        document.getElementById('councillor-label').textContent = 'Civic Transparency View';
    }
}

// ==========================================
// 5. RENDER FUNCTIONS
// ==========================================
function renderStats(reports) {
    // Array.filter() creates a new list containing only items that match our condition.
    const activeReports = reports.filter(r => {
        const p = (r.Progress || '').toLowerCase();
        // Keep it if it's NOT resolved or fixed.
        return p !== 'resolved' && p !== 'fixed';
    });
    
    const resolvedReports = reports.filter(r => {
        const p = (r.Progress || '').toLowerCase();
        // Keep it if it IS resolved or fixed.
        return p === 'resolved' || p === 'fixed';
    });

    // Inject the final counts into the big stats blocks at the top of the page.
    document.getElementById('active-count').textContent = activeReports.length;
    document.getElementById('resolved-count').textContent = resolvedReports.length;
}

function renderTable(reports) {
    const tbody = document.getElementById('reports-table-body');
    tbody.innerHTML = ''; // Clear out the old rows.

    // Handle the edge case where a ward has zero reports entirely.
    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-8 py-6 text-center text-on-surface-variant font-bold">No public issues reported for this ward.</td></tr>`;
        return; // Stop running the function.
    }

    // Generate an HTML table row for every report in the array.
    reports.forEach(report => {
        let statusBadge = ''; 
        const progressStr = (report.Progress || '').toLowerCase(); 
        
        // Logic tree to assign the correct colored pill badge based on DB status.
        if (progressStr === 'resolved' || progressStr === 'fixed') {
            statusBadge = `<span class="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-black uppercase rounded-full">Resolved</span>`;
        } else if (progressStr === 'in progress' || progressStr === 'assigned to field staff') {
            statusBadge = `<span class="px-3 py-1 bg-[#FF8C00]/20 text-[#FF8C00] border border-[#FF8C00]/40 text-[10px] font-black uppercase rounded-full">In Progress</span>`;
        } else {
            statusBadge = `<span class="px-3 py-1 bg-[#FF8C00] text-on-primary text-[10px] font-black uppercase rounded-full">Active</span>`;
        }

        // A dictionary mapping our database 'Type' string to specific Material Symbol icons.
        const iconMap = {
            'pothole': 'road',
            'water leak': 'water_drop',
            'street light': 'lightbulb',
            'illegal dumping': 'delete',
            'electricity': 'bolt',
            'sanitation': 'recycling'
        };
        const typeStr = (report.Type || '').toLowerCase();
        // Grab the matching icon, or default to a warning triangle ('report_problem') if it's something weird.
        const icon = iconMap[typeStr] || 'report_problem'; 

        // Convert the nasty database timestamp (2026-04-20T10:00:00.000Z) into a clean date (2026-04-20)
        const formattedDate = report.CreatedAt ? new Date(report.CreatedAt).toISOString().split('T')[0] : 'Unknown';

        // Physically construct the row and inject all our formatted variables.
        const tr = document.createElement('tr'); 
        tr.className = 'hover:bg-surface-container-high transition-colors group cursor-pointer';
        tr.innerHTML = `
            <td class="px-8 py-6">
                <span class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-[#FF8C00]" style="font-variation-settings: 'FILL' 1;">${icon}</span>
                    <span class="font-bold text-white uppercase tracking-tight">${report.Type || 'General'}</span>
                </span>
            </td>
            
            <td class="px-8 py-6 text-center">${statusBadge}</td>
            <td class="px-8 py-6 text-right font-mono text-on-surface-variant text-sm">${formattedDate}</td>
        `;
        
        // Attach an 'onclick' event directly to the row so clicking anywhere on the row opens the modal.
        tr.onclick = () => openIssueModal(report.ReportID);
        
        // Append the finished row to the table body.
        tbody.appendChild(tr);
    });
}

// ==========================================
// 6. MODAL CONTROLLER
// ==========================================
function openIssueModal(reportId) {
    // Search our global master list for the specific report the user just clicked.
    const report = currentReports.find(r => r.ReportID === reportId);
    

    activeReportId = reportId;
    const dialog = document.getElementById('issue-modal');

    // Populate the text fields inside the modal pop-up.
    document.getElementById('modal-title').textContent = report.Type || 'General Issue';
    
    document.getElementById('modal-date').textContent = report.CreatedAt ? new Date(report.CreatedAt).toISOString().split('T')[0] : 'Unknown';
    document.getElementById('modal-frequency').textContent = report.Frequency || 0;
    
    // Exact same badge generation logic as the main table.
    let statusBadge = ''; 
    const progressStr = (report.Progress || '').toLowerCase(); 
    
    if (progressStr === 'resolved' || progressStr === 'fixed') {
        statusBadge = `<span class="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-black uppercase rounded-full">Resolved</span>`;
    } else if (progressStr === 'in progress' || progressStr === 'assigned to field staff') {
        statusBadge = `<span class="px-3 py-1 bg-[#FF8C00]/20 text-[#FF8C00] border border-[#FF8C00]/40 text-[10px] font-black uppercase rounded-full">In Progress</span>`;
    } else {
        statusBadge = `<span class="px-3 py-1 bg-[#FF8C00] text-on-primary text-[10px] font-black uppercase rounded-full">Active</span>`;
    }
    document.getElementById('modal-status').innerHTML = statusBadge;

    // --- CAROUSEL LOGIC ---
    const carousel = document.getElementById('modal-carousel');
    carousel.innerHTML = ''; 
    
    // Using an external image service (picsum) as a placeholder for testing.
    // In production, this would be an API fetch to the ReportImages table.
    for(let i=1; i<=3; i++) {
        const imgUrl = `https://picsum.photos/seed/${reportId + i}/800/600`;
        carousel.innerHTML += `
            <li class="snap-center shrink-0 w-full h-full relative p-0 m-0 list-none">
                <img src="${imgUrl}" alt="Issue Photo ${i}" class="w-full h-full object-cover" />
            </li>
        `;
    }

    // Open the native HTML <dialog> over the rest of the UI.
    dialog.showModal();

    // --- MODAL MINI-MAP LOGIC ---
   
    // Leaflet calculates its width/height when it is initialised. If initialised while 
    // hidden inside a closed modal, it thinks its size is 0x0 pixels, causing gray rendering bugs.
    // We use setTimeout to wait 10 milliseconds *after* the modal opens so Leaflet can see the actual pixel dimensions.


    /* istanbul ignore next */
    setTimeout(() => {
        const miniMapContainer = document.getElementById('modal-mini-map');
        
        // Destroy the old map instance if it exists so we don't layer maps on top of each other.
        if (modalMap) {
            modalMap.remove();
            modalMap = null; // Clean up the old map object completely
        }

        // Remove the loading text.
        miniMapContainer.innerHTML = '';
        // Robust check for the modal map
        const lat = report.Latitude || report.latitude;
        const lng = report.Longitude || report.longitude;

        if (lat && lng && parseFloat(lat) !== 0) {
            // Draw the map and center it perfectly on the issue.
            modalMap = L.map('modal-mini-map').setView([lat,lng], 15);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(modalMap);
            L.marker([lat,lng]).addTo(modalMap);
            
            // This is the magic command that forces Leaflet to recalculate its dimensions!
            modalMap.invalidateSize();
        } else {
            // Graceful fallback if a user submitted a report without GPS enabled.
            miniMapContainer.innerHTML = '<span class="text-gray-300 font-bold text-sm tracking-widest uppercase">No GPS Data Available</span>';
        }
    }, 10);
}

// EXPORTS FOR JEST TESTING
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fetchWardReports, fetchWardDetails, renderStats, renderTable, renderMapMarkers, openIssueModal,initMap, setCurrentReports:(fakeData)=>{currentReports=fakeData;} };
}