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

        // 1. Handle Empty State
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

        // 2. SORTING LOGIC: 1 (Critical) -> 2 (High) -> 3 (Routine)
        // This ensures the most urgent tasks appear at the top of the worker's feed
        reports.sort((a, b) => (a.Priority || 3) - (b.Priority || 3));

        // 3. Render the Cards
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
// Modify your renderTaskCard function
function renderTaskCard(report, container) {
    // 1. Map Priority numbers to visual labels
    const priorityLabels = {
        1: { text: 'Critical', class: 'bg-red-500/20 text-red-500 border-red-500/50' },
        2: { text: 'High', class: 'bg-orange-500/20 text-orange-500 border-orange-500/50' },
        3: { text: 'Routine', class: 'bg-blue-500/20 text-blue-500 border-blue-500/50' }
    };
    
    const priority = priorityLabels[report.Priority] || priorityLabels[3];

    // 2. Determine the Task State (New vs In-Progress)
    // We check if the Progress string contains "Assigned" or "Pending"
    const isNewTask = report.Progress.includes('Assigned') || report.Progress.includes('Pending');
    const accentColor = isNewTask ? 'border-yellow-500' : 'border-primary';

    const html = `
        <article class="bg-surface-container-high p-8 rounded-2xl border-l-4 ${accentColor} relative mb-6 shadow-xl hover:bg-surface-container-highest transition-all group">
            
            <header class="flex justify-between items-start mb-6 cursor-pointer" onclick="showTaskDetails(${report.ReportID})">
                <section>
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-[10px] font-bold uppercase tracking-widest text-primary">${report.Progress}</span>
                        <span class="px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-tighter ${priority.class}">
                            ${priority.text}
                        </span>
                    </div>
                    <h3 class="text-3xl font-black tracking-tight group-hover:text-primary transition-colors">${report.Type}</h3>
                    <p class="text-on-surface-variant text-sm mt-1 uppercase tracking-tighter font-medium">
                        Ward ${report.WardID} • ID: #${report.ReportID}
                    </p>
                </section>
                <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
            </header>

            <nav class="flex flex-wrap gap-4" onclick="event.stopPropagation()">
                ${isNewTask ? `
                    <button onclick="acceptTask(${report.ReportID})" 
                            class="flex-1 bg-yellow-600 text-black px-6 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-900/20">
                        <span class="material-symbols-outlined text-base">play_arrow</span> Accept Task
                    </button>
                ` : `
                    <button onclick="resolveTask(${report.ReportID})" 
                            class="flex-1 bg-primary text-black px-6 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg shadow-primary/20">
                        <span class="material-symbols-outlined text-base">check_circle</span> Mark as Complete
                    </button>
                `}
                
                <button onclick="showTaskDetails(${report.ReportID})" 
                        class="bg-surface-container-low text-on-surface px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-surface-container transition-all border border-outline/50">
                    <span class="material-symbols-outlined text-base">info</span> View Briefing
                </button>
            </nav>
        </article>`;

    container.insertAdjacentHTML('beforeend', html);
}

async function resolveTask(reportId) {
    if(!confirm("Are you sure this job is finished?")) return;
    
    try {
        const response = await fetch(`/api/reports/${reportId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            // changes progress to resolved
            body: JSON.stringify({ Progress: 'Resolved' }) 
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