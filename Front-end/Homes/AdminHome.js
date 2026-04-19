document.addEventListener('DOMContentLoaded', () => {
    loadUnassignedReports();
    loadPendingWorkers();
    loadActiveWorkers();

    const editForm = document.getElementById('edit-report-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
});

// Separate the submission logic for clarity
async function handleEditSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('edit-report-id').value;
    const updatedData = {
        Type: document.getElementById('edit-type').value,
        Progress: document.getElementById('edit-description').value
    };

    if (!id) {
        alert("Error: Report ID is missing.");
        return;
    }

    try {
        const response = await fetch(`/api/reports/${id}/edit`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert("Report updated successfully!");
            closeEditModal();
            loadUnassignedReports(); // Refresh the table to see changes
        } else {
            const error = await response.json();
            alert("Failed to save: " + error.message);
        }
    } catch (err) {
        console.error("Save Error:", err);
        alert("Network error. Check server console.");
    }
}

// Ensure your openEditModal populates the hidden ID correctly
async function openEditModal(reportId) {
    try {
        const response = await fetch(`/api/reports/${reportId}`);
        const report = await response.json();

        // These IDs must match your HTML exactly
        document.getElementById('edit-report-id').value = report.ReportID;
        document.getElementById('edit-type').value = report.Type;
        document.getElementById('edit-description').value = report.Progress || '';
        
        document.getElementById('edit-report-modal').classList.remove('hidden');
    } catch (err) {
        console.error("Failed to load report data:", err);
    }
}

function closeEditModal() {
    document.getElementById('edit-report-modal').classList.add('hidden');
}

//loads all reports to be assigned by the admin
async function loadUnassignedReports() {
    try {
        const response = await fetch('/api/reports'); 
        const reports = await response.json();
        
        const tableBody = document.getElementById('unassigned-reports-body');
        tableBody.innerHTML = '';

        const pending = reports.filter(r => r.Progress && r.Progress.includes('Pending'));

        pending.forEach(report => {
    const row = `
    <tr class="border-b border-surface-variant hover:bg-surface-container-high transition-colors">
        <td class="p-4 font-mono text-primary-container">#${report.ReportID}</td>
        <td class="p-4 font-bold">${report.Type}</td>
        <td class="p-4 text-xs font-medium">Ward ${report.WardID}</td>
        <td class="p-4">
            <select onchange="updatePriority(${report.ReportID}, this.value)" 
                    class="bg-surface-container-lowest text-[10px] border border-outline/30 rounded px-2 py-1 focus:ring-primary text-on-surface uppercase font-black">
                <option value="1" ${report.Priority == 1 ? 'selected' : ''}>1 - Critical</option>
                <option value="2" ${report.Priority == 2 ? 'selected' : ''}>2 - High</option>
                <option value="3" ${report.Priority == 3 ? 'selected' : ''}>3 - Routine</option>
            </select>
        </td>
        <td class="p-4 text-right flex gap-2 justify-end">
            <button onclick="assignToWorker(${report.ReportID})" ...>Assign</button>
            <button onclick="openEditModal(${report.ReportID})" 
        class="bg-surface-container-highest text-on-surface px-4 py-2 rounded text-[10px] font-black uppercase hover:bg-primary transition-all">
    Edit
</button>
        </td>
    </tr>
`;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (err) {
        console.error("Failed to load admin ledger:", err);
    }
}

//allows for admins to set priority
async function updatePriority(reportId, priorityValue) {
    try {
        const response = await fetch(`/api/reports/${reportId}/priority`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Priority: priorityValue })
        });

        if (response.ok) {
            console.log(`Report #${reportId} set to Priority ${priorityValue}`);
        }
    } catch (err) {
        console.error("Failed to update priority:", err);
    }
}

async function assignToWorker(reportId) {
    // For testing, we manually enter the EmployeeID (e.g., 1)
    const employeeId = prompt("Enter Employee ID to assign to this task:");
    
    if (!employeeId) return;

    try {
        const response = await fetch(`/api/reports/${reportId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ EmployeeID: employeeId })
        });

        if (response.ok) {
            alert(`Report #${reportId} successfully assigned to Worker #${employeeId}`);
            loadUnassignedReports(); // Refresh table
        } else {
            alert("Assignment failed. Check if Employee ID exists.");
        }
    } catch (err) {
        console.error("Assignment error:", err);
    }
}

async function loadPendingWorkers() {
    try {
        const response = await fetch('/api/workers/pending');
        const workers = await response.json();

        const container = document.getElementById('pending-workers-list');
        container.innerHTML = ''; 

        if (workers.length === 0) {
            container.innerHTML = '<p class="text-xs text-on-surface-variant uppercase">No pending registrations.</p>';
            return;
        }

        workers.forEach(worker => {
            const html = `
                <div class="flex justify-between items-center p-4 bg-surface-container-high rounded-xl mb-2">
                    <div>
                        <p class="font-bold">${worker.FirstName} ${worker.LastName}</p>
                        <p class="text-[10px] text-on-surface-variant">${worker.Email}</p>
                    </div>
                    <button onclick="approveWorker(${worker.EmployeeID})" class="bg-primary text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase hover:bg-white transition-all">
                        Approve
                    </button>
                </div>`;
            container.insertAdjacentHTML('beforeend', html);
        });
    } catch (err) {
        console.error("Error loading workers:", err);
    }
}

async function approveWorker(employeeId) {
    try {
        const response = await fetch(`/api/workers/validate/${employeeId}`, {
            method: 'PUT'
        });

        if (response.ok) {
            alert("Worker Approved!");
            loadPendingWorkers(); // Refresh the list
        }
    } catch (err) {
        console.error("Validation error:", err);
    }
}

// delete reports
const handleDelete = async (reportId) => {
    const adminEmail = "2820314@students.wits.ac.za"; 

    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
        const response = await fetch(`http://18.170.126.9:8080/api/admin/delete-report/${reportId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminEmail })
        });

        const data = await response.json();

        if (data.success) {
            alert("Report deleted successfully");
            loadUnassignedReports(); 
        } else {
            alert("Failed to delete: " + data.message);
        }
    } catch (error) {
        console.error("Error deleting report:", error);
    }
};

async function invalidateWorker(employeeId) {
    const adminEmail = "2820314@students.wits.ac.za";

    if (!confirm("Are you sure you want to disable this account?")) return;

    try {
        const response = await fetch(`/api/workers/invalidate/${employeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminEmail })
        });

        if (response.ok) {
            alert("Account Disabled!");
            location.reload(); // Refresh to update the UI
        }
    } catch (err) {
        console.error("Invalidation error:", err);
    }
}

// --- LOAD ACTIVE WORKERS ---
async function loadActiveWorkers() {
    try {
        // We fetch workers who are already validated (active)
        const response = await fetch('/api/workers/active'); 
        const workers = await response.json();

        const container = document.getElementById('active-workers-list');
        if (!container) return;
        
        container.innerHTML = ''; 

        if (workers.length === 0) {
            container.innerHTML = '<p class="text-[10px] text-neutral-600 uppercase p-4">No active personnel found.</p>';
            return;
        }

        workers.forEach(worker => {
            const html = `
                <article class="flex items-center justify-between p-4 bg-surface hover:bg-surface-container-high transition-colors rounded-lg mb-1">
                    <section class="flex items-center gap-4">
                        <figure class="w-10 h-10 bg-neutral-800 rounded-sm overflow-hidden flex items-center justify-center">
                            <span class="material-symbols-outlined text-neutral-500">person</span>
                        </figure>
                        <section>
                            <h4 class="text-sm font-bold tracking-tight text-on-surface">${worker.FirstName} ${worker.LastName}</h4>
                            <p class="text-[10px] uppercase text-neutral-500">${worker.Email}</p>
                        </section>
                    </section>
                    <section class="flex items-center gap-4">
                        <span class="px-2 py-1 bg-primary-container/10 text-primary-container text-[10px] font-black uppercase tracking-widest">Active</span>
                        <button onclick="invalidateWorker(${worker.EmployeeID})" 
                                class="text-error hover:text-white hover:bg-error px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all">
                            Invalidate
                        </button>
                    </section>
                </article>`;
            container.insertAdjacentHTML('beforeend', html);
        });
    } catch (err) {
        console.error("Error loading active workers:", err);
    }
}

