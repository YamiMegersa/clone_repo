// 1. Initialize the map (starts at a fallback location)
const map = L.map('map').setView([0, 0], 13);

// 2. Add a tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 3. Access device location
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 4. Center map and add a marker
        map.setView([lat, lng], 15);
        L.marker([lat, lng]).addTo(map)
            .bindPopup('You are here!')
            .openPopup();
    }, (error) => {
        console.error("Error getting location: ", error.message);
    });
} else {
    alert("Geolocation is not supported by your browser.");
}