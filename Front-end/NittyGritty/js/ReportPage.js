document.addEventListener('DOMContentLoaded', () =>{
    const form=document.querySelector('form');
    const imageInput=document.getElementById('imageInput');
    const preview=document.getElementById('imagePreview');

    let selectedImages=[]; //Store Filelist
    // Preview images on select
    const renderPreviews=() => {
        preview.innerHTML = '';
        selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
        // Using <figure> as the image container
            const figureBox = document.createElement('figure');
            figureBox.className = 'aspect-square bg-surface-container-low rounded-xl overflow-hidden relative m-0';
            figureBox.innerHTML = `
                <img src="${e.target.result}" class="w-full h-full object-cover" alt="Report evidence preview" />
                <button type="button" onclick="removeImage(${index})" class="absolute top-2 right-2 bg-error-container/80 p-1 rounded-md">
                    <span class="material-symbols-outlined text-sm text-on-error-container" data-icon="close">close</span>
                </button>
        `;
        preview.appendChild(figureBox);
      };
      reader.readAsDataURL(file);
    });
};
imageInput.addEventListener('change', (e) => {
    //Add the new files to our running array
    const newFiles = Array.from(e.target.files);
    selectedImages = selectedImages.concat(newFiles);

    //Clear the HTML input so you can select the same file twice if needed
    imageInput.value = '';
    renderPreviews();
});
    //Global remove function (for onclick)
    window.removeImage=(index)=>{
        selectedImages.splice(index,1); //Remove from array
        //Re-render previews
        imageInput.dispatchEvent(new Event('change')); //Trigger change to update previews
    };
        

    //Form submit:Post report first, then images
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

    //1. Collect form data
        const formData={
            WardID: parseInt(document.getElementById('ward-select').value),
            ResidentID: 123, //Placeholder, replace with actual user ID from login/session
            Lattitude:window.mapLat || 0, //Fallback to 0 if not set
            Longitude:window.mapLng || 0,
            Status:'Pending',
            Date: new Date().toISOString(),
            Type: document.getElementById('pothole-type').value,
            Progress:'0%',
            Frequency : document.getElementById('frequency').value,
            Description: document.getElementById('description').value
        };

        try {
            //2. POST report
            const reportRes=await fetch('/api/reports', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify(formData)
            }); 
            const {report}=await reportRes.json();

        //3. Upload each image
            for (const file of selectedImages){
                const reader=new FileReader();
                reader.readAsDataURL(file);
                reader.onload=async()=>{
                    const imageData={Image:reader.result.split(',')[1]}; //Get base64 string without prefix
                    await fetch(`/api/report-images/report/${report.ReportID}`, {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body: JSON.stringify(imageData)
                    });
                };
            }
        alert('Report submitted successfully!');
        form.reset();
        selectedImages=[]; //Clear selected images
        renderPreviews(); //Clear the screen
        
    } catch (error){
        console.error('Submit failed:', error);
        alert('Error submitting report');
    }
        
    });
});