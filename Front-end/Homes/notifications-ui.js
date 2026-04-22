
(() => {
    // ─── Config ──────────────────────────────────────────────────────────────
    const POLL_INTERVAL_MS = 30_000; // Poll every 30 seconds
    let pollTimer = null;
    let isPaused = false;
    let currentRecipientId = null;

    // ─── Bootstrap: runs after DOM is ready ──────────────────────────────────
    function init() {
        // Detect role & ID
        const role = localStorage.getItem('role'); // 'admin' or 'worker'
        const workerId = localStorage.getItem('workerId');
      
            // Strictly check role first, ignore workerId if role is admin
    if (role === 'admin') {
        currentRecipientId = 'admin';
    } else if (role === 'worker' && workerId) {
        currentRecipientId = workerId;
    } else {
        // Role is missing or unrecognised — don't load anything
        console.warn('[Notifications] No valid role found in localStorage. Not initialising.');
        return;
    }

    console.log('[Notifications] Starting for:', currentRecipientId);

        injectStyles();
        renderNotificationShell();
        fetchAndRender();
        startPolling();
    }

    // ─── Polling ─────────────────────────────────────────────────────────────
    function startPolling() {
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(() => {
            if (!isPaused) fetchAndRender();
        }, POLL_INTERVAL_MS);
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    // ─── Fetch notifications from backend ────────────────────────────────────
    async function fetchAndRender() {
        try {
            const res = await fetch(`/api/notifications/${currentRecipientId}`);
            if (!res.ok) return;
            const notifications = await res.json();
            renderList(notifications);
            updateBadge(notifications.filter(n => !n.IsRead).length);
        } catch (err) {
            console.warn('[Notifications] Fetch failed:', err.message);
        }
    }

    // ─── Render the notification list ────────────────────────────────────────
    function renderList(notifications) {
        const list = document.getElementById('notif-list');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = `
                <li class="notif-empty">
                    <span class="notif-empty-icon">◎</span>
                    <p>All clear — no alerts</p>
                </li>`;
            return;
        }

        list.innerHTML = notifications.map(n => {
            const time = formatTime(n.CreatedAt);
            const unreadClass = n.IsRead ? '' : 'notif-unread';
            const icon = typeIcon(n.Type);
            const accentClass = typeAccent(n.Type);

            return `
            <li class="notif-item ${unreadClass}" data-id="${n.NotificationID}">
                <div class="notif-accent ${accentClass}"></div>
                <div class="notif-icon-wrap ${accentClass}">
                    <span>${icon}</span>
                </div>
                <div class="notif-body" onclick="window._notifModule.markRead(${n.NotificationID})">
                    <p class="notif-title">${escHtml(n.Title)}</p>
                    <p class="notif-msg">${escHtml(n.Message)}</p>
                    <p class="notif-time">${time}</p>
                </div>
                <button class="notif-delete-btn" 
                        onclick="window._notifModule.deleteOne(${n.NotificationID})"
                        title="Dismiss">✕</button>
            </li>`;
        }).join('');
    }

    // ─── Badge count ─────────────────────────────────────────────────────────
    function updateBadge(count) {
        const badge = document.getElementById('notif-badge');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('notif-badge-hidden');
        } else {
            badge.classList.add('notif-badge-hidden');
        }
    }

    // ─── Toggle panel open/close ─────────────────────────────────────────────
    function togglePanel() {
        const panel = document.getElementById('notif-panel');
        if (!panel) return;
        const isOpen = panel.classList.toggle('notif-panel-open');

        if (isOpen) {
            fetchAndRender(); // Always fresh when opened
            // Close when clicking outside
            setTimeout(() => {
                document.addEventListener('click', outsideClickClose, { once: true });
            }, 0);
        }
    }

    function outsideClickClose(e) {
        const panel = document.getElementById('notif-panel');
        const bell = document.getElementById('notif-bell');
        if (panel && !panel.contains(e.target) && e.target !== bell) {
            panel.classList.remove('notif-panel-open');
        }
    }

    // ─── Mark single as read ─────────────────────────────────────────────────
    async function markRead(notifId) {
        try {
            await fetch(`/api/notifications/${notifId}/read`, { method: 'PUT' });
            const item = document.querySelector(`[data-id="${notifId}"]`);
            if (item) item.classList.remove('notif-unread');
            const unreadCount = document.querySelectorAll('.notif-unread').length;
            updateBadge(unreadCount);
        } catch (err) {
            console.warn('[Notifications] markRead failed:', err);
        }
    }

    // ─── Mark all read ───────────────────────────────────────────────────────
    async function markAllRead() {
        try {
            await fetch(`/api/notifications/${currentRecipientId}/read-all`, { method: 'PUT' });
            document.querySelectorAll('.notif-unread').forEach(el => el.classList.remove('notif-unread'));
            updateBadge(0);
        } catch (err) {
            console.warn('[Notifications] markAllRead failed:', err);
        }
    }

    // ─── Delete one notification ──────────────────────────────────────────────
    async function deleteOne(notifId) {
        try {
            await fetch(`/api/notifications/${notifId}`, { method: 'DELETE' });
            const item = document.querySelector(`[data-id="${notifId}"]`);
            if (item) {
                item.classList.add('notif-item-exit');
                setTimeout(() => {
                    item.remove();
                    const remaining = document.querySelectorAll('.notif-item').length;
                    if (remaining === 0) renderList([]);
                    const unread = document.querySelectorAll('.notif-unread').length;
                    updateBadge(unread);
                }, 280);
            }
        } catch (err) {
            console.warn('[Notifications] deleteOne failed:', err);
        }
    }

    // ─── Clear all notifications ──────────────────────────────────────────────
    async function clearAll() {
        if (!confirm('Clear all notifications? This cannot be undone.')) return;
        try {
            await fetch(`/api/notifications/${currentRecipientId}/clear-all`, { method: 'DELETE' });
            renderList([]);
            updateBadge(0);
        } catch (err) {
            console.warn('[Notifications] clearAll failed:', err);
        }
    }

    // ─── Pause / Resume polling ───────────────────────────────────────────────
    function togglePause() {
        isPaused = !isPaused;
        const btn = document.getElementById('notif-pause-btn');
        if (btn) {
            btn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
            btn.title = isPaused ? 'Resume live alerts' : 'Pause live alerts';
        }
        const indicator = document.getElementById('notif-live-dot');
        if (indicator) indicator.classList.toggle('notif-dot-paused', isPaused);
    }

  function renderNotificationShell() {
    // Remove old notification elements if present
    const oldDropdown = document.getElementById('notification-dropdown');
    if (oldDropdown) oldDropdown.remove();
    const oldBell = document.querySelector('button[onclick="toggleNotifications()"]');
    if (oldBell) oldBell.remove();

    // Inject the panel into the existing #notif-shell anchor in the HTML
    const anchor = document.getElementById('notif-shell');
    if (!anchor) {
        console.warn('[Notifications] No #notif-shell element found in HTML.');
        return;
    }

    anchor.innerHTML = `
        <button id="notif-bell" class="notif-bell-btn" onclick="window._notifModule.toggle()" 
                title="Notifications" aria-label="Open notifications">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span id="notif-badge" class="notif-badge notif-badge-hidden">0</span>
        </button>

        <div id="notif-panel" class="notif-panel" role="dialog" aria-label="Notifications">
            <header class="notif-header">
                <div class="notif-header-left">
                    <span id="notif-live-dot" class="notif-live-dot" title="Live alerts active"></span>
                    <h3 class="notif-heading">Alerts</h3>
                </div>
                <div class="notif-header-actions">
                    <button id="notif-pause-btn" class="notif-action-btn" 
                            onclick="window._notifModule.togglePause()" title="Pause live alerts">
                        ⏸ Pause
                    </button>
                    <button class="notif-action-btn" 
                            onclick="window._notifModule.markAllRead()" title="Mark all as read">
                        ✓ Read all
                    </button>
                    <button class="notif-action-btn notif-danger-btn" 
                            onclick="window._notifModule.clearAll()" title="Delete all">
                        ✕ Clear all
                    </button>
                </div>
            </header>

            <ul id="notif-list" class="notif-list">
                <li class="notif-empty">
                    <span class="notif-empty-icon">◎</span>
                    <p>Loading alerts...</p>
                </li>
            </ul>

            <footer class="notif-footer">
                <span class="notif-footer-text">Syncing every 30s</span>
            </footer>
        </div>
    `;
}

    // ─── CSS injection ────────────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('notif-styles')) return;
        const style = document.createElement('style');
        style.id = 'notif-styles';
        style.textContent = `
            /* ── Shell & Bell ── */
            .notif-shell {
                position: relative;
                display: flex;
                align-items: center;
            }

            .notif-bell-btn {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.07);
                background: rgba(255,255,255,0.04);
                color: #a3a3a3;
                cursor: pointer;
                transition: background 0.2s, color 0.2s, border-color 0.2s;
            }
            .notif-bell-btn:hover {
                background: rgba(255,183,125,0.12);
                color: #ffb77d;
                border-color: rgba(255,183,125,0.3);
            }

            /* ── Unread Badge ── */
            .notif-badge {
                position: absolute;
                top: 4px;
                right: 4px;
                min-width: 16px;
                height: 16px;
                padding: 0 4px;
                border-radius: 99px;
                background: #ff8c00;
                color: #000;
                font-size: 9px;
                font-weight: 900;
                line-height: 16px;
                text-align: center;
                border: 2px solid #131313;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .notif-badge-hidden {
                transform: scale(0);
                pointer-events: none;
            }

            /* ── Panel ── */
            .notif-panel {
                position: absolute;
                top: calc(100% + 12px);
                right: 0;
                width: 380px;
                max-height: 520px;
                background: #1a1a1a;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,183,125,0.06);
                overflow: hidden;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                opacity: 0;
                transform: translateY(-8px) scale(0.97);
                pointer-events: none;
                transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                transform-origin: top right;
            }
            .notif-panel-open {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: all;
            }

            /* ── Header ── */
            .notif-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 16px 10px;
                border-bottom: 1px solid rgba(255,255,255,0.06);
                background: rgba(255,255,255,0.02);
                gap: 8px;
                flex-wrap: wrap;
            }
            .notif-header-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .notif-heading {
                font-size: 11px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.15em;
                color: #e2e2e2;
                margin: 0;
            }

            /* ── Live dot ── */
            .notif-live-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #4ade80;
                box-shadow: 0 0 6px #4ade80;
                animation: notif-pulse 2s ease-in-out infinite;
                flex-shrink: 0;
            }
            .notif-dot-paused {
                background: #6b7280;
                box-shadow: none;
                animation: none;
            }
            @keyframes notif-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }

            /* ── Header action buttons ── */
            .notif-header-actions {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }
            .notif-action-btn {
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                padding: 4px 8px;
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.04);
                color: #a3a3a3;
                cursor: pointer;
                transition: all 0.15s;
                white-space: nowrap;
            }
            .notif-action-btn:hover {
                background: rgba(255,255,255,0.1);
                color: #e2e2e2;
                border-color: rgba(255,255,255,0.15);
            }
            .notif-danger-btn:hover {
                background: rgba(220, 38, 38, 0.2);
                color: #fca5a5;
                border-color: rgba(220,38,38,0.4);
            }

            /* ── List ── */
            .notif-list {
                list-style: none;
                margin: 0;
                padding: 6px;
                overflow-y: auto;
                flex: 1;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.1) transparent;
            }

            /* ── Empty state ── */
            .notif-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 48px 24px;
                gap: 10px;
                color: #4b5563;
            }
            .notif-empty-icon {
                font-size: 28px;
                opacity: 0.4;
            }
            .notif-empty p {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.15em;
                margin: 0;
            }

            /* ── Individual item ── */
            .notif-item {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 10px 10px 10px 6px;
                border-radius: 10px;
                margin-bottom: 3px;
                position: relative;
                cursor: default;
                transition: background 0.15s;
                overflow: hidden;
            }
            .notif-item:hover {
                background: rgba(255,255,255,0.04);
            }
            .notif-unread {
                background: rgba(255,183,125,0.05);
            }
            .notif-unread .notif-title {
                color: #ffb77d !important;
            }

            /* Exit animation */
            .notif-item-exit {
                animation: notif-exit 0.28s ease forwards;
            }
            @keyframes notif-exit {
                to { opacity: 0; transform: translateX(20px); max-height: 0; margin: 0; padding: 0; }
            }

            /* ── Left accent bar ── */
            .notif-accent {
                position: absolute;
                left: 0;
                top: 8px;
                bottom: 8px;
                width: 2px;
                border-radius: 2px;
            }

            /* ── Type icon ── */
            .notif-icon-wrap {
                width: 30px;
                height: 30px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                flex-shrink: 0;
                margin-left: 8px;
            }

            /* ── Accent colours by type ── */
            .notif-accent-declined { background: #ef4444; }
            .notif-accent-new-report { background: #ff8c00; }
            .notif-accent-assigned { background: #22d3ee; }
            .notif-accent-default { background: #6b7280; }

            .notif-icon-declined { background: rgba(239,68,68,0.12); color: #fca5a5; }
            .notif-icon-new-report { background: rgba(255,140,0,0.12); color: #ffb77d; }
            .notif-icon-assigned { background: rgba(34,211,238,0.12); color: #7dd3fc; }
            .notif-icon-default { background: rgba(107,114,128,0.12); color: #9ca3af; }

            /* ── Body text ── */
            .notif-body {
                flex: 1;
                min-width: 0;
                cursor: pointer;
            }
            .notif-title {
                font-size: 11px;
                font-weight: 800;
                color: #d4d4d4;
                margin: 0 0 3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .notif-msg {
                font-size: 10px;
                color: #737373;
                margin: 0 0 4px;
                line-height: 1.5;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .notif-time {
                font-size: 9px;
                color: #4b5563;
                margin: 0;
                font-weight: 600;
                letter-spacing: 0.05em;
                text-transform: uppercase;
            }

            /* ── Delete button ── */
            .notif-delete-btn {
                flex-shrink: 0;
                width: 22px;
                height: 22px;
                border-radius: 6px;
                border: 1px solid transparent;
                background: transparent;
                color: #4b5563;
                font-size: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s;
                margin-top: 2px;
            }
            .notif-delete-btn:hover {
                background: rgba(220,38,38,0.15);
                color: #fca5a5;
                border-color: rgba(220,38,38,0.3);
            }

            /* ── Footer ── */
            .notif-footer {
                padding: 8px 16px;
                border-top: 1px solid rgba(255,255,255,0.05);
                background: rgba(0,0,0,0.2);
            }
            .notif-footer-text {
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #374151;
            }

            /* ── Toast popup (fires on new notification) ── */
            .notif-toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 320px;
                background: #1f1f1f;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 14px;
                padding: 14px 16px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                box-shadow: 0 16px 40px rgba(0,0,0,0.6);
                z-index: 99999;
                animation: notif-toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .notif-toast-exit {
                animation: notif-toast-out 0.3s ease forwards;
            }
            @keyframes notif-toast-in {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes notif-toast-out {
                to { opacity: 0; transform: translateY(10px); }
            }
            .notif-toast-icon {
                font-size: 18px;
                flex-shrink: 0;
                margin-top: 1px;
            }
            .notif-toast-title {
                font-size: 11px;
                font-weight: 800;
                color: #e2e2e2;
                margin: 0 0 3px;
            }
            .notif-toast-msg {
                font-size: 10px;
                color: #737373;
                margin: 0;
                line-height: 1.4;
            }
            .notif-toast-close {
                position: absolute;
                top: 10px;
                right: 12px;
                background: none;
                border: none;
                color: #4b5563;
                font-size: 12px;
                cursor: pointer;
                padding: 2px;
            }
            .notif-toast-close:hover { color: #e2e2e2; }
        `;
        document.head.appendChild(style);
    }

    // ─── Toast popup for real-time feel ──────────────────────────────────────
    let lastKnownIds = new Set();
    let isFirstFetch = true;

    async function fetchAndRender() {
        try {
            const res = await fetch(`/api/notifications/${currentRecipientId}`);
            if (!res.ok) return;
            const notifications = await res.json();

            // Show toast for any brand-new notification since last poll
            if (!isFirstFetch && !isPaused) {
                notifications.forEach(n => {
                    if (!lastKnownIds.has(n.NotificationID) && !n.IsRead) {
                        showToast(n);
                    }
                });
            }
            lastKnownIds = new Set(notifications.map(n => n.NotificationID));
            isFirstFetch = false;

            renderList(notifications);
            updateBadge(notifications.filter(n => !n.IsRead).length);
        } catch (err) {
            console.warn('[Notifications] Fetch failed:', err.message);
        }
    }

    function showToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'notif-toast';
        toast.innerHTML = `
            <div class="notif-toast-icon">${typeIcon(notification.Type)}</div>
            <div>
                <p class="notif-toast-title">${escHtml(notification.Title)}</p>
                <p class="notif-toast-msg">${escHtml(notification.Message)}</p>
            </div>
            <button class="notif-toast-close" onclick="this.closest('.notif-toast').remove()">✕</button>
        `;
        document.body.appendChild(toast);

        // Auto-dismiss after 6 seconds
        setTimeout(() => {
            toast.classList.add('notif-toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 6000);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────
    function typeIcon(type) {
        const icons = {
            'TASK_DECLINED': '⚠',
            'NEW_REPORT':    '📋',
            'TASK_ASSIGNED': '📌',
        };
        return icons[type] || '🔔';
    }

    function typeAccent(type) {
        const map = {
            'TASK_DECLINED': 'notif-accent-declined notif-icon-declined',
            'NEW_REPORT':    'notif-accent-new-report notif-icon-new-report',
            'TASK_ASSIGNED': 'notif-accent-assigned notif-icon-assigned',
        };
        return map[type] || 'notif-accent-default notif-icon-default';
    }

    function formatTime(iso) {
        if (!iso) return '';
        const date = new Date(iso);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        return date.toLocaleDateString();
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ─── Public API ───────────────────────────────────────────────────────────
    window._notifModule = {
        toggle: togglePanel,
        markRead,
        markAllRead,
        deleteOne,
        clearAll,
        togglePause,
        refresh: fetchAndRender,
        stop: stopPolling
    };

    // ─── Start ────────────────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();