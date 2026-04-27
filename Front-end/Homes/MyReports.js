// --- START GLOBAL STATE ---
let currentRating = 0; 
let activeReportId = null;

// Function must be attached to 'window' so the button's onclick can find it
window.openFeedbackModal = (reportId) => {
    activeReportId = reportId;
    const modal = document.getElementById('feedback-modal');
    resetStars(); 
    if (modal) modal.showModal();
};

function updateStarUI(rating) {
    const stars = document.querySelectorAll('.star-btn span');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            // Force Orange Color and Filled state
            star.style.color = '#ffb77d'; // Your 'primary' orange color
            star.style.fontVariationSettings = "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24";
            star.classList.remove('text-white/20');
        } else {
            // Return to Dimmed White and Outlined state
            star.style.color = 'rgba(255, 255, 255, 0.2)'; // text-white/20
            star.style.fontVariationSettings = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
        }
    });
}

function resetStars() {
    currentRating = 0;
    updateStarUI(0);
}
// --- END GLOBAL STATE ---

document.addEventListener('DOMContentLoaded', async () => {
    const residentId = localStorage.getItem('residentId');
    const grid = document.getElementById('reports-grid');

    // --- START MODAL LISTENERS ---
    const modal = document.getElementById('feedback-modal');
    const closeXBtn = document.getElementById('close-feedback-x');
    const submitBtn = document.getElementById('submit-feedback');
    const stars = document.querySelectorAll('.star-btn');

    // Handle X Button Click
    if (closeXBtn) {
        closeXBtn.addEventListener('click', () => {
            modal.close();
        });
    }

    // Handle Submit Button Click
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            if (currentRating === 0) {
                alert("Please select a rating before submitting.");
                return;
            }
            
            // Change button state to show it's working
            submitBtn.disabled = true;
            submitBtn.innerText = "Submitting...";

            try {
                const response = await fetch(`/api/reports/${activeReportId}/rating`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating: currentRating })
                });

                const result = await response.json();

                if (response.ok) {
                    alert("Thank you for your feedback!");
                    modal.close();
                    // Optional: You could reload the page or update the UI to hide the feedback button
                    location.reload(); 
                } else {
                    throw new Error(result.error || "Failed to submit rating");
                }
            } catch (err) {
                console.error("Submit Error:", err);
                alert("Error submitting feedback. Please try again.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = "Submit Feedback";
            }
        });
    }

    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            // Use e.currentTarget to safely get the button value
            const ratingValue = parseInt(e.currentTarget.getAttribute('data-value'));
            currentRating = ratingValue;
            if (typeof updateStarUI === "function") updateStarUI(ratingValue);
            console.log(`Rating captured: ${currentRating}`);
            });
    });
    // --- END MODAL LISTENERS ---

    if (!residentId) {
        grid.innerHTML = `<p class="col-span-full text-center text-error">User Session Not Found.</p>`;
        return;
    }

    try {
        // GET: Fetch all reports for a SPECIFIC Resident
        const response = await fetch(`/api/reports/resident/${residentId}`);
        if (!response.ok) throw new Error('Failed to fetch reports');
        
        const reports = await response.json();
        
        if (reports.length === 0) {
            grid.innerHTML = `<p class="col-span-full text-center py-20 opacity-50 uppercase tracking-widest text-xs">No reports logged yet.</p>`;
            return;
        }

        grid.innerHTML = ''; // Clear loading state

        reports.forEach(report => {
            const card = document.createElement('article');
            // Card style with better contrast
            card.className = "group bg-surface-container-low border border-white/5 p-6 transition-all hover:bg-surface-container-high relative overflow-hidden";
            
            // Match exact casing from your reports.js (Status, Type, CreatedAt)
            //const statusColor = report.Status === 'Fixed' ? 'text-green-500' : 'text-orange-500';
            const isResolved = report.Progress === 'Resolved';
            const statusColor = isResolved ? 'text-green-500' : 'text-orange-500';

            const feedbackButton = isResolved 
            ? `<button onclick="openFeedbackModal(${report.ReportID})" class="ml-4 px-3 py-1 bg-transparent border border-[#FF8C00] text-white text-[9px] font-black uppercase tracking-widest rounded hover:bg-primary hover:text-on-primary transition-all active:scale-95">Feedback</button>` 
            : '';

            card.innerHTML = `
                <div class="flex justify-between items-start mb-6">
                    <header>
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] ${statusColor}">Report ID: </span>
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] ${statusColor}">${report.ReportID || 'USER'}</span>
                        <h3 class="text-xl font-black uppercase italic mt-1 text-white">${report.Type || 'ISSUE'}</h3>
                        ${feedbackButton}
                    </header>
                    <span class="text-[10px] font-mono text-white/40">${report.CreatedAt ? new Date(report.CreatedAt).toLocaleDateString() : 'RECENT'}</span>
                </div>
                
                <p class="text-sm text-white/90 line-clamp-2 mb-6 font-medium leading-relaxed">
                    ${report.Brief || 'No description provided.'}
                </p>

                <footer class="flex items-center justify-between pt-4 border-t border-white/5">
                    <aside class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-primary">analytics</span>
                        <span class="text-[10px] font-bold uppercase tracking-widest text-white/60">Progress: ${report.Progress || '0%'}</span>
                    </aside>
                    <aside class="flex items-center gap-1 text-primary">
                        <span class="text-lg font-black">${report.Frequency || 0}</span>
                        <span class="text-[8px] font-bold uppercase opacity-60">Bumps</span>
                    </aside>
                </footer>
            `;
            grid.appendChild(card);
        });

    } catch (err) {
        console.error('Error:', err);
        grid.innerHTML = `<p class="col-span-full text-center text-error">Error connecting to database.</p>`;
    }
});