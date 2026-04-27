document.addEventListener('DOMContentLoaded', async () => {
    const residentId = localStorage.getItem('residentId');
    const grid = document.getElementById('reports-grid');

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
            const statusColor = report.Status === 'Fixed' ? 'text-green-500' : 'text-orange-500';

            card.innerHTML = `
                <div class="flex justify-between items-start mb-6">
                    <header>
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] ${statusColor}">Report ID: </span>
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] ${statusColor}">${report.ReportID || 'USER'}</span>
                        <h3 class="text-xl font-black uppercase italic mt-1 text-white">${report.Type || 'ISSUE'}</h3>
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