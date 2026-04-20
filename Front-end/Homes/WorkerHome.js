
const taskImages = {}; 

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

document.addEventListener('DOMContentLoaded', () => {
    const workerId = localStorage.getItem('workerId');
    const workerName = localStorage.getItem('workerName');

    if (!workerId) {
        window.location.href = "../Login/Worker_login.html";
        return;
    }

    // Update Header
    document.querySelector('p.text-xs.font-bold').textContent = workerName || "Field Operative";

    loadMyAssignedTasks(workerId);
});

async function loadMyAssignedTasks(workerId) {
    try {
        const response = await fetch(`/api/reports/assigned/${workerId}`);
        let reports = await response.json();

        const container = document.getElementById('active-tasks-container');
        
        // Safety check to ensure the container exists
        if (!container) return;

        container.innerHTML = ''; 

        // Handle Empty State
        if (!reports || reports.length === 0) {
            container.innerHTML = `
                <section class="py-20 text-center border-2 border-dashed border-outline/20 rounded-3xl">
                    <span class="material-symbols-outlined text-5xl text-outline mb-4">task_alt</span>
                    <p class="text-on-surface-variant text-xs font-black uppercase tracking-[0.3em]">
                        Clear Ledger: No Active Assignments
                    </p>
                </section>`;
            return;
        }

        // SORTING LOGIC for priority: 1 (Critical) -> 2 (High) -> 3 (Routine)
        // This ensures the most urgent tasks appear at the top of the worker's feed
        reports.sort((a, b) => (a.Priority || 3) - (b.Priority || 3));

        // Render the Cards
        reports.forEach(report => {
            renderTaskCard(report, container);
        });

    } catch (err) {
        console.error("Critical failure loading worker ledger:", err);
        const container = document.getElementById('active-tasks-container');
        if (container) {
            container.innerHTML = `
                <article class="p-6 bg-red-500/10 border border-red-500/50 rounded-xl">
                    <p class="text-red-500 text-xs font-bold uppercase tracking-widest">
                        Sync Error: Unable to reach central command.
                    </p>
                </article>`;
        }
    }
}

//workers can accept tasks 
async function acceptTask(reportId) {
    try {
        const response = await fetch(`/api/reports/${reportId}/accept`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert("Task accepted! Starting work...");
            location.reload(); 
        }
    } catch (err) {
        console.error("Error accepting task:", err);
    }
}

//Renders an individual task card for the worker ledger.

function renderTaskCard(report, container) {
    // Map Priority numbers to visual labels for clear UI feedback
    const priorityLabels = {
        1: { text: 'Critical', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
        2: { text: 'High', class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
        3: { text: 'Routine', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
    };
    
    const priority = priorityLabels[report.Priority] || priorityLabels[3];

    // Determine the Task State (New vs In-Progress)
    // We check if the Progress string contains "Assigned" or "Pending" to toggle UI controls
    const isNewTask = report.Progress.toLowerCase().includes('assigned') || report.Progress.toLowerCase().includes('pending');
    
    // UI Logic: Yellow accent for new tasks, Primary theme color for active tasks
    const accentColor = isNewTask ? 'border-yellow-600/50' : 'border-primary/50';

    const html = `
        <article class="bg-surface-container-high p-8 rounded-2xl border-l-4 ${accentColor} relative mb-6 shadow-xl hover:bg-surface-container-highest transition-all group">
            
            <header class="flex justify-between items-start mb-6 cursor-pointer" onclick="showTaskDetails(${report.ReportID})">
                <hgroup>
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-[10px] font-bold uppercase tracking-widest text-primary/80">${report.Progress}</span>
                        <span class="px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-tighter ${priority.class}">
                            ${priority.text}
                        </span>
                    </div>
                    <h3 class="text-3xl font-black tracking-tight group-hover:text-primary transition-colors text-neutral-300">${report.Type}</h3>
                    <p class="text-zinc-400 text-sm mt-1 uppercase tracking-tighter font-medium">
                        Ward ${report.WardID} • ID: #${report.ReportID}
                    </p>
                </hgroup>
                <span class="material-symbols-outlined text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">open_in_new</span>
            </header>

            <nav class="flex flex-col gap-4" onclick="event.stopPropagation()">
                ${isNewTask ? `
                    <button onclick="acceptTask(${report.ReportID})" 
                            class="w-full bg-yellow-700/80 text-neutral-900 px-6 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-yellow-600 transition-all shadow-lg">
                        <span class="material-symbols-outlined text-base">play_arrow</span> Accept Task
                    </button>
                ` : `
                    <section class="flex flex-col gap-2 p-4 bg-black/20 rounded-xl border border-white/5" aria-label="Progress Update">
                        <div class="flex justify-between items-center">
                            <label for="progress-${report.ReportID}" class="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Update Progress</label>
                            <output class="text-[10px] font-mono text-primary/70">${report.Progress}</output>
                        </div>
                        <select id="progress-${report.ReportID}" 
                                onchange="updateProgress(${report.ReportID}, this.value)" 
                                class="bg-neutral-900 text-neutral-300 text-xs border border-white/10 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary outline-none">
                            <option value="" disabled selected>Update current stage...</option>
                            <option value="In Progress - 25%" ${report.Progress.includes('25%') ? 'selected' : ''}>25% - Excavation/Prep</option>
                            <option value="In Progress - 50%" ${report.Progress.includes('50%') ? 'selected' : ''}>50% - Active Repairs</option>
                            <option value="In Progress - 75%" ${report.Progress.includes('75%') ? 'selected' : ''}>75% - Quality Testing</option>
                        </select>

                        <div class="mt-3 border-t border-white/10 pt-3">
                            <label for="imageInput-${report.ReportID}" class="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase text-primary/80 hover:text-primary transition-colors w-fit">
                                <span class="material-symbols-outlined text-base">add_a_photo</span> Attach Proof of Work
                            </label>
                            <input type="file" id="imageInput-${report.ReportID}" multiple accept="image/*" class="hidden" onchange="handleImageSelect(event, ${report.ReportID})">
                            <div id="imagePreview-${report.ReportID}" class="grid grid-cols-4 gap-2 mt-3"></div>
                        </div>
                    </section>

                    <button onclick="resolveTask(${report.ReportID})" 
                            class="w-full bg-primary/80 text-neutral-900 px-6 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary transition-all shadow-lg">
                        <span class="material-symbols-outlined text-base">check_circle</span> Mark as Complete
                    </button>
                `}
                
                <button onclick="showTaskDetails(${report.ReportID})" 
                        class="w-full bg-neutral-800 text-neutral-400 px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-neutral-700 transition-all border border-white/5">
                    <span class="material-symbols-outlined text-base">info</span> View Briefing
                </button>
            </nav>
        </article>`;

    container.insertAdjacentHTML('beforeend', html);
}

//Moves task to final 'Resolved' state.Sends 'Fixed' status to trigger the backend logic for DateFulfilled.
async function resolveTask(reportId) {
    if(!confirm("Are you sure this job is finished?")) return;
    
    let base64Images = [];
    if (taskImages[reportId] && taskImages[reportId].length > 0) {
        base64Images = await Promise.all(taskImages[reportId].map(file => toBase64(file)));
    }

    try {
        const response = await fetch(`/api/reports/${reportId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            // Using 'Fixed' status to satisfy both DB logic and Jest tests
            body: JSON.stringify({ Status: 'Fixed', Progress: 'Resolved', images: base64Images }) 
        });

        if (response.ok) {
            alert("Job Marked as Resolved!");
            location.reload(); 
        }
    } catch (err) {
        console.error("Error resolving task:", err);
    }
}

async function showTaskDetails(reportId) {
    try {
        const response = await fetch(`/api/reports/${reportId}`);
        const report = await response.json();

        // Map database fields to the Modal IDs in your HTML
        document.getElementById('detail-type').textContent = report.Type;
        document.getElementById('detail-id').textContent = `Task Reference: #${report.ReportID}`;
        document.getElementById('detail-description').textContent = report.Description || "No additional briefing provided by the resident.";
        document.getElementById('detail-ward').textContent = `Ward ${report.WardID}`;
        
        // Use Progress here because that's where "Pending Allocation" is stored
        document.getElementById('detail-status').textContent = report.Progress;

        // Show the Modal
        document.getElementById('task-detail-modal').classList.remove('hidden');
    } catch (err) {
        console.error("Error showing details:", err);
    }
}

function closeModal() {
    document.getElementById('task-detail-modal').classList.add('hidden');
}

//This updates the 'Progress' field in the DB so Admins/Residents can see live status.

async function updateProgress(reportId, progressText) {
    try {
        const response = await fetch(`/api/reports/${reportId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                Progress: progressText,
                Status: 'In Progress' 
            })
        });

        if (response.ok) {
            console.log("Progress updated: " + progressText);
            // We don't reload the page here to keep the worker's scroll position,
            // but we update the UI label manually.
            const label = document.querySelector(`#progress-${reportId}`).previousElementSibling.querySelector('output');
            if (label) label.textContent = progressText;
        }
    } catch (err) {
        console.error("Failed to update progress:", err);
    }
}
// --- IMAGE LOGIC ---
window.handleImageSelect = (event, reportId) => {
    // Initialize array if it doesn't exist for this task
    if (!taskImages[reportId]) {
        taskImages[reportId] = [];
    }
    
    const newFiles = Array.from(event.target.files);
    taskImages[reportId] = taskImages[reportId].concat(newFiles);
    
    // Clear the input so you can select the same file again if needed
    event.target.value = ''; 
    
    renderPreviews(reportId);
};

window.removeImage = (reportId, index) => {
    taskImages[reportId].splice(index, 1);
    renderPreviews(reportId);
};

function renderPreviews(reportId) {
    const previewContainer = document.getElementById(`imagePreview-${reportId}`);
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    taskImages[reportId].forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const html = `
                <figure class="aspect-square bg-surface-container-low rounded-lg overflow-hidden relative m-0 border border-white/10">
                    <img src="${e.target.result}" class="w-full h-full object-cover" alt="Preview" />
                    <button type="button" onclick="removeImage(${reportId}, ${index})" class="absolute top-1 right-1 bg-red-500/80 p-0.5 rounded shadow-lg hover:bg-red-500 transition-colors">
                        <span class="material-symbols-outlined text-[10px] text-white">close</span>
                    </button>
                </figure>
            `;
            previewContainer.insertAdjacentHTML('beforeend', html);
        };
        reader.readAsDataURL(file);
    });
}