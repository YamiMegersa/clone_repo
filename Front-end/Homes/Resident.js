// Global variable to store loaded reports for modal access
let loadedReports = [];

document.addEventListener('DOMContentLoaded', () => {
    // For testing, replace '1' with your actual logic to get the logged-in user's ID
    const residentId = localStorage.getItem('residentId');
    if (!residentId) {
        // Kick them back to the login screen
        window.location.href = '/'; 
        return; // Stop running any more code
    }
    renderSubscribedWards(residentId);
});

async function renderSubscribedWards(residentId) {
    const wardsGrid = document.getElementById('wards-grid');
    const addButton = wardsGrid.lastElementChild; // Keep the "Track New Ward" button

    try {
        const response = await fetch(`/api/residents/${residentId}/subscriptions`);
        
        if (!response.ok) throw new Error('Failed to fetch wards');

        const wards = await response.json();

        // 1. Clear everything EXCEPT the last element (the "Add" button)
        while (wardsGrid.children.length > 1) {
            wardsGrid.removeChild(wardsGrid.firstChild);
        }

        // 2. Map through the array and create cards
        wards.forEach( async (ward) => {
            totalIssues=0;
            // Array of municipal-themed Material Symbols
            const wardIcons = [
                'location_city', 
                'domain', 
                'holiday_village', 
                'apartment', 
                'account_balance', 
                'corporate_fare', 
                'foundation', 
                'gite', 
                'villa',
                'cottage'
            ];

            function getRandomIcon() {
                const randomIndex = Math.floor(Math.random() * wardIcons.length);
                return wardIcons[randomIndex];
            }
            const card = document.createElement('article');
            //card.className = "group bg-surface-container-low p-8 relative overflow-hidden transition-all duration-300 hover:bg-surface-container-high cursor-pointer";
            card.className = "group bg-surface-container-low p-8 relative transition-all duration-300 hover:bg-surface-container-high cursor-pointer";
            // Note: Update 'ward.district' and 'ward.number' to match your SQL column names
            const muniResponse = await fetch(`/api/geography/municipalities/${ward.MunicipalityID}`);
            const municipalityData = await muniResponse.json();
            const MunicipalityName=municipalityData.MunicipalityName.toUpperCase();
            card.innerHTML = `
            <nav aria-label="Ward management options" class="absolute top-6 right-6 z-20">
                <button aria-haspopup="menu" aria-expanded="false" aria-controls="menu-${ward.WardID}" class="menu-btn text-on-surface-variant hover:text-primary transition-colors" data-ward="${ward.WardID}">
                    <i aria-hidden="true" class="material-symbols-outlined pointer-events-none">more_vert</i>
                    <span class="sr-only">Open options for Ward ${ward.WardID}</span> 
                </button>
                
                <menu id="menu-${ward.WardID}" role="menu" class="dropdown-menu hidden absolute right-0 mt-2 w-48 bg-surface-container-high border border-outline-variant rounded-md shadow-2xl z-50 overflow-hidden p-0 m-0">
                    <li role="none">
                        <button role="menuitem" onclick="manageNotifications(${ward.WardID})" class="w-full text-left px-4 py-3 hover:bg-primary/10 text-on-background transition-colors flex items-center gap-3 font-bold text-sm">
                            <i aria-hidden="true" class="material-symbols-outlined text-[18px]">notifications</i>
                            Manage Alerts
                        </button>
                    </li>
                    <li role="none">
                        <button role="menuitem" onclick="unsubscribeWard(${ward.WardID})" class="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-400 transition-colors flex items-center gap-3 border-t border-outline-variant font-bold text-sm">
                            <i aria-hidden="true" class="material-symbols-outlined text-[18px]">delete</i>
                            Remove Ward
                        </button>
                    </li>
                </menu>
            </nav>

            <header>
                <p class="label-md block text-orange-500 font-black tracking-[0.2em] mb-4">${(MunicipalityName || 'Yoh FUck').toUpperCase()}</p>
                <h3 class="text-4xl font-black mb-8">WARD ${ward.WardID}</h3>
            </header>

            <dl class="flex items-end justify-between m-0">
                <div class="flex flex-col">
                    <dt class="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Councillor</dt>
                    <dd class="text-3xl font-black text-primary m-0">${ward.WardCouncillor}</dd>
                </div>
                <dd class="m-0" aria-hidden="true">
                    <i class="material-symbols-outlined text-orange-600/20 text-6xl translate-y-4 group-hover:text-orange-600 transition-colors">
                        ${getRandomIcon()}
                    </i>
                </dd>
            </dl>

            <footer aria-hidden="true" class="absolute bottom-0 left-0 h-1 w-0 bg-primary-container transition-all duration-500 group-hover:w-full"></footer>
        `;

        

            // Insert BEFORE the "Add New Ward" button
        card.addEventListener('click', (event) => {
            // 1. Check if the click happened inside the three-dots menu or dropdown
            const clickedMenu = event.target.closest('nav[aria-label="Ward management options"]');
            
            // 2. If they clicked the menu, do nothing and let the menu open
            if (clickedMenu) {
                return; 
            }

            // 3. Otherwise, redirect to the Ward Page and pass the ID in the URL
            window.location.href = `/NittyGritty/WardPage.html?wardId=${ward.WardID}`;
        });
            wardsGrid.insertBefore(card, addButton);
        });

    } catch (error) {
        console.error('Error populating wards:', error);
    }
}


document.addEventListener('click', (event) => {
    // 1. Check if we clicked a three-dots button
    const isMenuButton = event.target.closest('.menu-btn');
    
    // 2. Close ALL open menus first
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.add('hidden');
    });

    // 3. If we clicked a button, open its specific menu
    if (isMenuButton) {
        const wardId = isMenuButton.getAttribute('data-ward');
        const targetMenu = document.getElementById(`menu-${wardId}`);
        
        if (targetMenu) {
            event.stopPropagation(); // Stop the click from immediately hiding the menu
            targetMenu.classList.remove('hidden');
        }
    }
});

// Placeholder functions for your buttons
function manageNotifications(wardId) {
    console.log(`Managing notifications for Ward ${wardId}`);
    // Add your routing logic here
}

// ==========================================
// MENU ACTIONS
// ==========================================
// ==========================================
// CUSTOM MODAL CONTROLLER
// ==========================================
function showModal(title, message, type = 'alert') {
    return new Promise((resolve) => {
        const dialog = document.getElementById('custom-modal');
        const titleEl = document.getElementById('modal-title');
        const messageEl = document.getElementById('modal-message');
        const actionsEl = document.getElementById('modal-actions');

        // Set the text
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        // Reset styling and content
        actionsEl.innerHTML = ''; 
        titleEl.className = 'text-xl font-black tracking-widest mb-2 uppercase ';

        if (type === 'confirm') {
            titleEl.className += 'text-red-400'; // Make confirm titles red for warnings
            actionsEl.innerHTML = `
                <button id="modal-cancel" class="px-5 py-2 rounded-md text-on-surface-variant hover:text-on-background hover:bg-white/5 transition-colors font-bold text-sm">Cancel</button>
                <button id="modal-confirm" class="px-5 py-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors font-bold text-sm">Remove Ward</button>
            `;

            // Handle Clicks
            document.getElementById('modal-cancel').onclick = () => {
                dialog.close();
                resolve(false); // Returns false, just like clicking 'Cancel' on a native confirm
            };
            document.getElementById('modal-confirm').onclick = () => {
                dialog.close();
                resolve(true); // Returns true, just like clicking 'OK' on a native confirm
            };
        } else {
            // Default Alert Styling
            titleEl.className += title.toLowerCase() === 'error' ? 'text-red-500' : 'text-primary';
            actionsEl.innerHTML = `
                <button id="modal-ok" class="px-5 py-2 rounded-md bg-primary-container/10 text-primary hover:bg-primary-container/20 border border-primary/20 transition-colors font-bold text-sm">Got it</button>
            `;
            
            document.getElementById('modal-ok').onclick = () => {
                dialog.close();
                resolve(true); //resolves the promise
            };
        }

        // Show the modal
        dialog.showModal();
    });
}

async function unsubscribeWard(wardId) {
    // 1. Use the custom modal instead of 'confirm()'
    const confirmDelete = await showModal(
        'Remove Ward', 
        `Are you sure you want to stop tracking Ward ${wardId}? You will no longer receive alerts for this area.`, 
        'confirm'
    ); //resolves or does not resolve the promise
    
    if (confirmDelete) {
        try {
            const residentId = localStorage.getItem('residentId') || '1'; 

            const response = await fetch('/api/residents/unsubscribe', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ResidentID: residentId,
                    WardID: wardId
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Success Modal
                await showModal('Success', `Ward ${wardId} has been successfully removed from your dashboard.`, 'alert');
                await renderSubscribedWards(residentId);
            } else {
                // Error Modal
                await showModal('Error', data.error || data.message, 'alert');
            }

        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            await showModal('Network Error', 'A network error occurred while trying to remove the ward. Please try again later.', 'alert');
        }
    }
}

// ==========================================
// ADD WARD SELECTION MODAL CONTROLLER (Native Dialog)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const addWardModal = document.getElementById('add-ward-modal');
    const addWardForm = document.getElementById('add-ward-form');
    const closeAddWardIcon = document.getElementById('close-add-ward-icon');
    const closeAddWardBtn = document.getElementById('close-add-ward-btn');

    // 1. Function to Close Dialog safely
    const closeAddModal = () => {
        addWardModal.close(); // Native HTML5 close method
        addWardForm.reset();  // Clear the dropdowns
    };

    // 2. Global click listener to open the modal
    document.addEventListener('click', (event) => {
        const openBtn = event.target.closest('#open-add-ward-btn');
        if (openBtn) {
            addWardModal.showModal(); // Native HTML5 open method
        }
        
        // Close modal if clicking directly on the backdrop
        if (event.target === addWardModal) {
            closeAddModal();
        }
    });

    // 3. Attach Close Events
    if (closeAddWardIcon) closeAddWardIcon.addEventListener('click', closeAddModal);
    if (closeAddWardBtn) closeAddWardBtn.addEventListener('click', closeAddModal);

    // 4. Handle the Form Submission
  // 4. Handle the Form Submission
    if (addWardForm) {
        addWardForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const formData = new FormData(addWardForm);
            const selectedWardId = formData.get('ward');
            const residentId = localStorage.getItem('residentId') || '1';//fallback to big Fakir

            try {
                // 1. Send the POST request to your backend
                // (Ensure this URL matches exactly where you mounted the route in server.js)
                const response = await fetch('/api/residents/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ResidentID: residentId,
                        WardID: selectedWardId
                    })
                });

                const data = await response.json();

                // 2. Handle the server's response
                if (response.ok) {
                    // Success (201 Created)! 
                    closeAddModal(); // Hide the modal
                    await renderSubscribedWards(residentId); // Refresh the cards to show the new ward
                    
                    
                } else {
                    // This catches your 400 (duplicate subscription) and 404 errors
                    await showModal('Notice', data.message || data.error, 'alert');
                }

            } catch (error) {
                // This catches network drops or server crashes
                console.error('Failed to subscribe:', error);
                await showModal('Network Error', 'Could not connect to the server to add the ward.', 'alert');
            }
        });
    }
});
// ==========================================
// CASCADING DROPDOWNS CONTROLLER FOR WARD SUBSCRIPTIONS
// ==========================================
const provinceSelect = document.getElementById('province');
const municipalitySelect = document.getElementById('municipality');
const wardSelect = document.getElementById('ward');

// Helper to clear and reset a dropdown
const resetDropdown = (selectElement, defaultText) => {
    selectElement.innerHTML = `<option disabled selected value="">${defaultText}</option>`;
};

// 1. Initial Load: Fetch all Provinces
async function loadProvinces() {
    try {
        const response = await fetch('/api/geography/provinces');
        if (response.ok) {
            const provinces = await response.json();
            provinces.forEach(prov => {
                const option = document.createElement('option');
                option.value = prov.ProvinceID;
                option.textContent = prov.ProvinceName;
                provinceSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading provinces:', error);
    }
}

// 2. Listen for Province Change -> Load Municipalities
provinceSelect.addEventListener('change', async (e) => {
    const provinceId = e.target.value;
    
    // Reset downstream dropdowns
    resetDropdown(municipalitySelect, 'Choose a municipality');
    resetDropdown(wardSelect, 'Choose a ward');

    try {
        const response = await fetch(`/api/geography/provinces/${provinceId}/municipalities`);
        if (response.ok) {
            const municipalities = await response.json();
            municipalities.forEach(muni => {
                const option = document.createElement('option');
                option.value = muni.MunicipalityID;
                option.textContent = muni.MunicipalityName;
                municipalitySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading municipalities:', error);
    }
});

// 3. Listen for Municipality Change -> Load Wards
municipalitySelect.addEventListener('change', async (e) => {
    const municipalityId = e.target.value;
    
    // Reset downstream dropdown
    resetDropdown(wardSelect, 'Choose a ward');

    try {
        const response = await fetch(`/api/geography/municipalities/${municipalityId}/wards`);
        if (response.ok) {
            const wards = await response.json();
            wards.forEach(ward => {
                const option = document.createElement('option');
                option.value = ward.WardID;
                option.textContent = `Ward ${ward.WardID} (${ward.WardCouncillor || 'No Councillor listed'})`;
                wardSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading wards:', error);
    }
});

// Trigger the initial load of provinces when the script runs
loadProvinces();

//notifications

// timestamps

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "Y AGO";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "MO AGO";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "D AGO";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "H AGO";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "M AGO";
    
    return "JUST NOW";
}

// --- Render Single Alert HTML ---
// Updated to use the Notification model (Title, Message) and flag unread state
const createAlertHTML = (notif) => {
    // Check for both casing styles just in case your ORM returns isRead or IsRead
    const isUnread = notif.IsRead === false || notif.isRead === false;
    
    return `
    <li class="group cursor-pointer p-3 -mx-3 rounded-lg transition-colors ${isUnread ? 'bg-white/5' : 'hover:bg-white/5'}" 
        onclick="handleNotificationClick(${notif.NotificationID}, ${notif.ReportID || 'null'})">
        <article class="space-y-2 pointer-events-none"> 
            <header class="flex justify-between items-start">
                <span class="${isUnread ? 'text-orange-500' : 'text-gray-400'} font-black tracking-widest text-[10px] uppercase">
                ${notif.Title || 'SYSTEM ALERT'}
                </span>
                <span class="text-[9px] opacity-40 uppercase">${getTimeAgo(notif.CreatedAt)}</span>
            </header>
            <p class="text-sm font-bold leading-snug transition-colors ${isUnread ? 'text-white group-hover:text-primary' : 'text-gray-400 group-hover:text-gray-200'}">
                ${notif.Message || 'No details provided.'}
            </p>
            <footer class="h-px w-8 bg-outline-variant group-hover:w-full transition-all"></footer>
        </article>
    </li>
    `;
};

//show notifs
function renderAlerts(notifications) {
    const listContainer = document.getElementById('alerts-list-container');
    const emptyMessage = document.getElementById('empty-alerts-message');
    const pulseIndicator = document.getElementById('alert-pulse-indicator');

    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (!notifications || notifications.length === 0) {
        emptyMessage.classList.remove('hidden');
        pulseIndicator.classList.remove('animate-pulse');
        pulseIndicator.classList.add('opacity-30');
    } else {
        emptyMessage.classList.add('hidden');

        //pulse for unread notif
        const hasUnread = notifications.some(notif => notif.IsRead === false || notif.isRead === false);

        if (hasUnread) {
            pulseIndicator.classList.add('animate-pulse');
            pulseIndicator.classList.remove('opacity-30');
        } else {
            pulseIndicator.classList.remove('animate-pulse');
            pulseIndicator.classList.add('opacity-30');
        }

        const alertsHTML = notifications.map(notif => createAlertHTML(notif)).join('');
        listContainer.innerHTML = alertsHTML;
    }
}

//Mark read and such
async function handleNotificationClick(notificationId, reportId) {
    const currentResidentId = localStorage.getItem('residentId') || 1;
    
    try {
        //Mark the notification as read using your new route
        await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
        
        //Refresh the notification list to clear the unread styling
        loadResidentNotifications(currentResidentId);

        //If the notification is linked to a report, fetch and display it
        if (reportId) {
            openReportModal(reportId);
        }
    } catch (error) {
        console.error('Failed to handle notification click:', error);
    }
}

async function openReportModal(reportId) {
    const modal = document.getElementById('report-modal');
    const modalContent = document.getElementById('modal-content');
    
    // Show modal immediately with a loading state
    modal.classList.remove('hidden');
    modalContent.innerHTML = `<p class="text-xs uppercase tracking-widest opacity-50 text-center py-4">Loading report data...</p>`;

    try {
        // Fetch fresh report data from the backend
        const res = await fetch(`/api/reports/${reportId}`);
        if (!res.ok) throw new Error('Failed to fetch report details');
        const report = await res.json();

        modalContent.innerHTML = `
            <div class="space-y-3">
                <div class="flex justify-between items-center border-b border-white/10 pb-2">
                    <span class="text-xs uppercase tracking-widest opacity-50">Ward</span>
                    <span class="font-bold">${report.WardID || 'N/A'}</span>
                </div>
                <div class="flex justify-between items-center border-b border-white/10 pb-2">
                    <span class="text-xs uppercase tracking-widest opacity-50">Type</span>
                    <span class="font-bold">${report.Type || 'System Alert'}</span>
                </div>
                <div class="flex justify-between items-center border-b border-white/10 pb-2">
                    <span class="text-xs uppercase tracking-widest opacity-50">Date Logged</span>
                    <span class="font-bold">${report.CreatedAt ? new Date(report.CreatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                
                <div class="mt-6 pt-4">
                    <span class="text-xs uppercase tracking-widest opacity-50 block mb-2">Latest Progress / Details</span>
                    <div class="bg-black/20 p-4 rounded-lg text-sm font-medium leading-relaxed">
                        ${report.Progress || report.Description || 'No further details have been provided for this report.'}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching report for modal:', error);
        modalContent.innerHTML = `<p class="text-sm text-red-500 py-4 text-center">Failed to load report details.</p>`;
    }
}

function closeReportModal() {
    document.getElementById('report-modal').classList.add('hidden');
}

async function loadResidentNotifications(residentId) {
    try {
        const resNotif = await fetch(`/api/notifications/${residentId}`);
        if (!resNotif.ok) throw new Error('Failed to fetch notifications');

        const notifications = await resNotif.json();
        renderAlerts(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);   
        const listContainer = document.getElementById('alerts-list-container');  
        if (listContainer) {
            listContainer.innerHTML = `<li class="text-sm text-red-500 px-3">Failed to load alerts.</li>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const currentResidentId = localStorage.getItem('residentId') || 1;
    
    // Load every 30 seconds
    loadResidentNotifications(currentResidentId);
    const pollingInterval = setInterval(() => loadResidentNotifications(currentResidentId), 30000);

    // Clear All Button
    const clearAllBtn = document.getElementById('clear-alerts-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) return;
            
            try {        
                const response = await fetch(`/api/notifications/${currentResidentId}/clear-all`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                
                if (data.success) {
                    renderAlerts([]); 
                } else {
                    console.error('Failed to clear notifications:', data.error);
                }
            } catch (error) {
                console.error('Error clearing notifications:', error);
            }
        });
    }

    // Modal Close Triggers
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeReportModal);

    const modal = document.getElementById('report-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeReportModal();
        });
    }

    //Notification Settings Logic (Mute Modal)
    const bellBtn = document.getElementById('notification-bell-btn');
    const muteModal = document.getElementById('mute-settings-modal');
    const closeMuteIcon = document.getElementById('close-mute-modal-icon');
    const closeMuteBtn = document.getElementById('close-mute-modal-btn');
    const muteForm = document.getElementById('mute-settings-form');
    const muteAllCheckbox = document.getElementById('mute-all');
    const specificWardsFieldset = document.getElementById('specific-wards-fieldset');
    const muteWardSelect = document.getElementById('mute-ward-select');

    if (bellBtn) {
        bellBtn.addEventListener('click', async () => {
            const residentId = localStorage.getItem('residentId');
            if (!residentId) return;

            try {
                const response = await fetch(`/api/residents/${residentId}/subscriptions`);
                if (!response.ok) throw new Error('Failed to fetch subscriptions');

                const wards = await response.json();
                muteWardSelect.innerHTML = '';

                wards.forEach(ward => {
                    const option = document.createElement('option');
                    option.value = ward.WardID;
                    option.textContent = `Ward ${ward.WardID}`;
                    muteWardSelect.appendChild(option);
                });

                muteModal.showModal();
            } catch (error) {
                console.error('Error loading wards for mute settings:', error);
            }
        });
    }

    const closeMuteModal = () => muteModal.close();
    if (closeMuteIcon) closeMuteIcon.addEventListener('click', closeMuteModal);
    if (closeMuteBtn) closeMuteBtn.addEventListener('click', closeMuteModal);

    if (muteModal) {
        muteModal.addEventListener('click', (e) => {
            if (e.target === muteModal) closeMuteModal();
        });
    }

    if (muteAllCheckbox) {
        muteAllCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                muteWardSelect.disabled = true;
                specificWardsFieldset.classList.add('opacity-30', 'pointer-events-none');
            } else {
                muteWardSelect.disabled = false;
                specificWardsFieldset.classList.remove('opacity-30', 'pointer-events-none');
            }
        });
    }

    if (muteForm) {
        muteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isMutedAll = muteAllCheckbox.checked;
            const mutedWards = Array.from(muteWardSelect.selectedOptions).map(opt => opt.value);

            const notificationPreferences = {
                muteAll: isMutedAll,
                mutedWards: isMutedAll ? [] : mutedWards 
            };

            try {
                // Future PUT request here
                alert("Alert preferences saved successfully!");
                closeMuteModal();
            } catch (error) {
                console.error("Error saving notification settings:", error);
                alert("Failed to save settings. Please try again.");
            }
        });
    }
});

// Closes account dropdown when clicking outside
document.addEventListener('click', (event) => {
    const detailsElement = document.querySelector('nav details');
    if (detailsElement && !detailsElement.contains(event.target)) {
        detailsElement.removeAttribute('open');
    }
});