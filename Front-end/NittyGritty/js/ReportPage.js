document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const imageInput = document.getElementById('imageInput');
    const preview = document.getElementById('imagePreview');

    let selectedImages = []; // Store File objects

    // Helper: Convert File to Base64 String
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // Preview images on select
    const renderPreviews = () => {
        preview.innerHTML = '';
        selectedImages.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const figureBox = document.createElement('figure');
                figureBox.className = 'aspect-square bg-surface-container-low rounded-xl overflow-hidden relative m-0';
                figureBox.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-full object-cover" alt="Preview" />
                    <button type="button" onclick="removeImage(${index})" class="absolute top-2 right-2 bg-error-container/80 p-1 rounded-md">
                        <span class="material-symbols-outlined text-sm text-on-error-container">close</span>
                    </button>
                `;
                preview.appendChild(figureBox);
            };
            reader.readAsDataURL(file);
        });
    };

    imageInput.addEventListener('change', (e) => {
        const newFiles = Array.from(e.target.files);
        selectedImages = selectedImages.concat(newFiles);
        imageInput.value = '';
        renderPreviews();
    });

    window.removeImage = (index) => {
        selectedImages.splice(index, 1);
        renderPreviews(); // Simplified re-render
    };

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Process all images into an array of Base64 strings
        const imagePromises = selectedImages.map(file => toBase64(file));
        const base64Array = await Promise.all(imagePromises);

        // 2. Collect all form data into one object
        const finalReport = {
            province_val: document.getElementById('province-select').value,
            municipality_val: document.getElementById('municipality-select').value,
            WardID: parseInt(document.getElementById('ward-select').value),
            ResidentID: localStorage.getItem('residentId'),
            Lattitude: window.mapLat || 0,
            Longitude: window.mapLng || 0,
            Status: 'Pending',
            Date: new Date().toISOString(),
            Type: document.getElementById('pothole-type').value,
            // Progress: '0%',
            Frequency: document.getElementById('frequency').value,
            Description: document.getElementById('description').value,
            Images: base64Array // Your images are now bundled in the JSON!
        };

        try {
            const response = await fetch('/api/reports', { // Ensure this matches your server's base path
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(finalReport) // This becomes 'req.body' in your Express route
            });

            const result = await response.json();

            if (response.ok) {
                console.log(result.message); // "Report logged successfully"
                alert('Report submitted to database!');
                form.reset();
                selectedImages = [];
                renderPreviews();
            } else {
                throw new Error(result.error || 'Failed to log report');
            }
            
        } catch (error) {
            console.error('Submit failed:', error);
            // PWA logic: Store in LocalStorage if the internet failed
            localStorage.setItem('cachedReport', JSON.stringify(finalReport));
            alert('Offline or Error: Report saved to device and will sync later.');
        }
    });
});


