document.addEventListener('DOMContentLoaded', () => {
    loadUnassignedReports();
    loadPendingWorkers();
});

async function loadUnassignedReports() {
    try {
        // Fetching reports where Status is 'Pending'
        const response = await fetch('/api/reports'); 
        const reports = await response.json();
        
        const tableBody = document.getElementById('unassigned-reports-body');
        tableBody.innerHTML = '';

        // Filter for Pending only (or handle this in the backend route)
        const pending = reports.filter(r => r.Status === 'Pending');

        pending.forEach(report => {
            const row = `
                <tr class="border-b border-surface-variant hover:bg-surface-container-high transition-colors">
                    <td class="p-4 font-mono text-primary-container">#${report.ReportID}</td>
                    <td class="p-4 font-bold">${report.Type}</td>
                    <td class="p-4 text-xs font-medium">Ward ${report.WardID}</td>
                    <td class="p-4 text-[10px] font-black uppercase tracking-tighter text-orange-400">${report.Status}</td>
                    <td class="p-4 text-right">
                        <button onclick="assignToWorker(${report.ReportID})" 
                                class="bg-primary-container text-on-primary px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
                            Assign Personnel
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