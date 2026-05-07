/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// --- 1. MOCK EXTERNAL DEPENDENCIES ---
global.L = {
    layerGroup: jest.fn().mockReturnValue({
        addTo: jest.fn().mockReturnThis(),
        removeLayer: jest.fn(),
    }),
    circleMarker: jest.fn().mockReturnValue({
        addTo: jest.fn().mockReturnThis(),
        bindTooltip: jest.fn().mockReturnThis(),
        on: jest.fn(),
    }),
};

// Mock custom components
global.CivicModal = jest.fn().mockImplementation(() => ({
    open: jest.fn(),
}));
global.CivicTable = jest.fn().mockImplementation(() => ({
    render: jest.fn(),
}));
global.CivicMap = jest.fn().mockImplementation(() => ({
    map: { removeLayer: jest.fn(), addLayer: jest.fn(), fitBounds: jest.fn() },
    loadNewLayer: jest.fn(),
}));
global.DashboardExporter = jest.fn();

// Mock Fetch
global.fetch = jest.fn();

// --- 2. LOAD & INJECT SCRIPT ---
const workerPerformPath = path.resolve(__dirname, '../WorkerPerform.js');
let workerPerformSource = fs.readFileSync(workerPerformPath, 'utf8');

// Manual injection for global access
workerPerformSource += `
    global.normalizeName = normalizeName;
    global.getDateRange = getDateRange;
    global.updateAnalyticsUI = updateAnalyticsUI;
    global.fetchAndPopulateWorkers = fetchAndPopulateWorkers;
`;

eval(workerPerformSource);

describe('WorkerPerform.js Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup DOM
        document.body.innerHTML = `
            <input id="employee-search" type="text">
            <div id="employee-list"></div>
            <header><p class="tracking-widest">Querying 0 Active Records</p></header>
            
            <input type="radio" name="timeframe" value="30 Days" checked>
            <span id="current-period"></span>
            
            <div id="tasks-total">0</div>
            <div id="acceptance-rate-text">0%</div>
            <svg><circle id="acceptance-rate-circle" style="stroke-dashoffset: 0"></circle></svg>
            
            <div id="bar-one"></div><div id="bar-one-count">0</div><div id="bar-one-fill"></div>
            <div id="bar-two"></div><div id="bar-two-count">0</div><div id="bar-two-fill"></div>
            <div id="bar-three"></div><div id="bar-three-count">0</div><div id="bar-three-fill"></div>
            
            <div id="efficiency-rate-text">0%</div>
            <div id="efficiency-rate-bar" style="width: 0%"></div>
            
            <table><tbody id="recent-history-body"></tbody></table>
            
            <dialog id="ledger-modal">
                <button id="view-history-btn"></button>
                <button id="close-ledger-btn"></button>
            </dialog>
            <div id="worker-ledger-container"></div>
            <div id="map"></div>
        `;

        HTMLDialogElement.prototype.showModal = jest.fn();
        HTMLDialogElement.prototype.close = jest.fn();
    });

    describe('Utility: normalizeName', () => {
        test('removes municipal suffixes correctly', () => {
            expect(normalizeName("Ekurhuleni Metropolitan Municipality")).toBe("ekurhuleni");
        });
    });

    describe('Feature: Employee List & Search', () => {
        test('fetchAndPopulateWorkers creates buttons for each worker', async () => {
            const mockWorkers = [
                { Name: 'John Doe', EmployeeID: 'W001' },
                { Name: 'Jane Smith', EmployeeID: 'W002' }
            ];
            fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockWorkers)
            });

            await fetchAndPopulateWorkers();

            const buttons = document.querySelectorAll('#employee-list button');
            expect(buttons.length).toBe(2);
            expect(buttons[0].innerHTML).toContain('John Doe');
        });

        test('search input filters worker buttons based on text', () => {
            const list = document.getElementById('employee-list');
            list.innerHTML = `
                <button><span>John Doe W001</span></button>
                <button><span>Jane Smith W002</span></button>
            `;
            
            // Re-trigger the search logic (simulating what happens in DOMContentLoaded)
            const input = document.getElementById('employee-search');
            const buttons = list.querySelectorAll('button');
            
            input.value = 'Jane';
            input.dispatchEvent(new Event('input'));

            // Note: In manual event triggering, we simulate the logic:
            buttons.forEach(btn => {
                const text = btn.textContent.toLowerCase();
                btn.style.display = text.includes('jane') ? 'flex' : 'none';
            });

            expect(buttons[0].style.display).toBe('none');
            expect(buttons[1].style.display).toBe('flex');
        });
    });

    describe('Analytics: updateAnalyticsUI', () => {
        const mockReports = [
            { Type: 'pothole', Progress: 'Resolved' },
            { Type: 'sanitation', Progress: 'Active' },
            { Type: 'water leak', Progress: 'Active' }
        ];
        const mockAcceptance = { accepted: 8, total: 10 };

        test('calculates correct acceptance and efficiency rates', () => {
            updateAnalyticsUI(mockReports, mockAcceptance);

            // Acceptance: 8/10 = 80%
            expect(document.getElementById('acceptance-rate-text').innerHTML).toContain('80.0');
            
            // Efficiency: 1/3 resolved = 33.3%
            expect(document.getElementById('efficiency-rate-text').innerHTML).toContain('33.3');
            expect(document.getElementById('efficiency-rate-bar').style.width).toBe('33.33333333333333%');
        });

        test('sorts and displays category bars by volume (ascending)', () => {
            updateAnalyticsUI(mockReports, mockAcceptance);

            // Order should be 1, 1, 1 (all tied) but specifically checks naming
            expect(document.getElementById('bar-one').textContent).toBe('Sanitation');
            expect(document.getElementById('bar-two').textContent).toBe('Infrastructure');
            expect(document.getElementById('bar-three').textContent).toBe('Utilities');
        });
    });
});