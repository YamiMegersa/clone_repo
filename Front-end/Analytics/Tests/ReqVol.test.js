/**
 * @jest-environment jsdom
 */



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

global.CivicMap = jest.fn().mockImplementation(() => ({
    map: { removeLayer: jest.fn(), addLayer: jest.fn() },
    loadNewLayer: jest.fn(),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
}));

global.CivicModal = jest.fn().mockImplementation(() => ({
    open: jest.fn(),
}));

global.DashboardExporter = jest.fn();
global.fetch = jest.fn();

// --- 2. LOAD & INJECT SCRIPT ---
const { 
    onMapClick, 
    getDateRange, 
    fetchDashboardData, 
    updateUI, 
    updateBarCharts, 
    formatNumber, 
    normalizeName, 
    buildMunicipalityMap, 
    renderLedgerTable, 
    openIssueModal, 
    drawPinsOnMap 
} = require('../ReqVol.js');

describe('ReqVol.js Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup the complex DOM structure ReqVol requires
        document.body.innerHTML = `
            <input type="radio" name="timeframe" checked> <span>30 Days</span>
            <div id="req-volume-count">0</div>
            <div id="res-volume-count">0</div>
            <div id="res-rate-text">0%</div>
            <svg><circle id="res-rate-circle" style="stroke-dashoffset: 0"></circle></svg>
            
            <div id="req-chart-container"></div>
            <div id="res-chart-container"></div>
            
            <table><tbody id="ledger-table-body"></tbody></table>
            <dialog id="ledger-modal">
                <button id="view-ledger-btn"></button>
                <button id="close-ledger-btn"></button>
            </dialog>

            <button id="zoom-in-btn"></button>
            <button id="zoom-out-btn"></button>
        `;
        
        // Mock modal methods not supported by JSDOM
        HTMLDialogElement.prototype.showModal = jest.fn();
        HTMLDialogElement.prototype.close = jest.fn();
    });

    describe('Utility Functions', () => {
        test('normalizeName cleans municipal strings correctly', () => {
            expect(normalizeName("CITY-OF-JOHANNESBURG Metropolitan Municipality")).toBe("city of johannesburg");
        });

        test('formatNumber handles thousands with k suffix', () => {
            expect(formatNumber(1200)).toBe("1.2k");
            expect(formatNumber(500)).toBe(500);
        });
    });

    describe('Logic: getDateRange', () => {
        test('calculates correct 30-day window', () => {
            const range = getDateRange();
            const start = new Date(range.start);
            const end = new Date(range.end);
            const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
            expect(diffDays).toBe(30);
        });
    });

    describe('UI Updates: updateUI', () => {
        const mockReports = [
            { CreatedAt: new Date().toISOString(), Progress: 'Active' },
            { CreatedAt: new Date().toISOString(), DateFulfilled: new Date().toISOString(), Progress: 'Resolved' }
        ];

        test('calculates and displays 50% resolution rate for 2 reports (1 resolved)', () => {
            const start = new Date(Date.now() - 86400000).toISOString();
            const end = new Date().toISOString();

            updateUI(mockReports, start, end);

            expect(document.getElementById('req-volume-count').textContent).toBe("2");
            expect(document.getElementById('res-volume-count').textContent).toBe("1");
            expect(document.getElementById('res-rate-text').textContent).toBe("50%");
        });

        test('handles zero requests without division by zero error', () => {
            updateUI([], new Date().toISOString(), new Date().toISOString());
            expect(document.getElementById('res-rate-text').textContent).toBe("0%");
        });
    });

    describe('Component: renderLedgerTable', () => {
        test('renders empty state message when no reports exist', () => {
            renderLedgerTable([]);
            const tbody = document.getElementById('ledger-table-body');
            expect(tbody.innerHTML).toContain('No issues found');
        });

        test('renders a table row with correct icon for pothole', () => {
            const reports = [{ Type: 'pothole', Description: 'Big hole', CreatedAt: '2026-05-01', ReportID: 123 }];
            renderLedgerTable(reports);

            const tbody = document.getElementById('ledger-table-body');
            expect(tbody.innerHTML).toContain('road'); // Icon name for potholes
            expect(tbody.innerHTML).toContain('Big hole');
        });
    });
});