/**
 * @jest-environment jsdom
 */

// Mocking external dependencies


global.L = {
    layerGroup: jest.fn().mockReturnValue({
        addTo: jest.fn().mockReturnThis(),
        clearLayers: jest.fn(),
    }),
    circleMarker: jest.fn().mockReturnValue({
        addTo: jest.fn(),
        bindTooltip: jest.fn(),
        on: jest.fn(),
    }),
};

global.CivicModal = jest.fn().mockImplementation(() => ({
    open: jest.fn(),
}));

global.CivicMap = jest.fn().mockImplementation(() => ({
    map: { removeLayer: jest.fn(), addLayer: jest.fn() },
    loadNewLayer: jest.fn(),
}));

global.DashboardExporter = jest.fn();

// Mock Fetch API
global.fetch = jest.fn();


const { 
    normalizeName, 
    getDateRange, 
    buildMunicipalityMap, 
    fetchAgingData, 
    updateAssignmentDurationLedger, 
    calculateBottleneckMetrics, 
    onMapClick, 
    renderUnassignedTable, 
    drawPinsOnMap 
} = require('../AgeReport.js');

describe('AgeReport.js Unit Tests', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup minimal DOM required for functions to run
        document.body.innerHTML = `
            <div id="map"></div>
            <button class="bg-primary-container">30 DAYS</button>
            <div id="unassigned-table-body"></div>
            <div id="water-unassigned-bar"></div>
            <div id="water-assigned-bar"></div>
            <article class="border-surface-variant"><p class="text-7xl"></p></article>
            <article class="border-primary-container"><p class="text-7xl"></p></article>
        `;
    });

    describe('Utility: normalizeName', () => {
        test('removes municipality suffixes and normalizes case', () => {
            expect(normalizeName("City of Cape Town Metropolitan Municipality")).toBe("city of cape town");
            expect(normalizeName("George Local Municipality")).toBe("george");
            expect(normalizeName("Garden-Route-District")).toBe("garden route district");
        });

        test('returns empty string for null/undefined', () => {
            expect(normalizeName(null)).toBe("");
        });
    });

    describe('Logic: calculateBottleneckMetrics', () => {
        test('calculates correct averages for unassigned and resolved tasks', () => {
            const now = new Date();
            const reports = [
                { 
                    CreatedAt: new Date(now - 10 * 60 * 60 * 1000).toISOString(), // 10h ago
                    AssignedAt: null 
                },
                { 
                    CreatedAt: new Date(now - 20 * 60 * 60 * 1000).toISOString(), // 20h ago
                    DateFulfilled: new Date(now - 10 * 60 * 60 * 1000).toISOString(), // took 10h to resolve
                    AssignedAt: new Date(now - 15 * 60 * 60 * 1000).toISOString()
                }
            ];

            calculateBottleneckMetrics(reports);

            const unassignedEl = document.querySelector('article.border-surface-variant p.text-7xl');
            const resolutionEl = document.querySelector('article.border-primary-container p.text-7xl');

            // Unassigned: 10 hours
            expect(unassignedEl.innerHTML).toContain('10.0');
            // Resolution: 10 hours
            expect(resolutionEl.innerHTML).toContain('10.0');
        });
    });

    describe('UI: renderUnassignedTable', () => {
        test('renders "No unassigned tasks" when reports list is empty', () => {
            renderUnassignedTable([]);
            const tbody = document.getElementById('unassigned-table-body');
            expect(tbody.innerHTML).toContain('No unassigned tasks found');
        });

        test('renders rows for unassigned reports only', () => {
            const reports = [
                { ReportID: 1, Type: 'Water', CreatedAt: new Date().toISOString(), AssignedAt: null },
                { ReportID: 2, Type: 'Power', CreatedAt: new Date().toISOString(), AssignedAt: '2023-01-01' }
            ];

            renderUnassignedTable(reports);
            const tbody = document.getElementById('unassigned-table-body');
            const rows = tbody.querySelectorAll('tr');
            
            expect(rows.length).toBe(1); // Only the unassigned one
            expect(rows[0].innerHTML.toUpperCase()).toContain('WATER');
        });
    });

    describe('Logic: updateAssignmentDurationLedger', () => {
        test('correctly calculates percentage widths for category bars', () => {
            const reports = [{
                Type: 'Water Leak',
                CreatedAt: new Date(Date.now() - 4000000).toISOString(),
                AssignedAt: new Date(Date.now() - 2000000).toISOString(), // 50/50 split
                DateFulfilled: new Date().toISOString()
            }];

            updateAssignmentDurationLedger(reports);

            const unassignedBar = document.getElementById('water-unassigned-bar');
            const assignedBar = document.getElementById('water-assigned-bar');

            expect(unassignedBar.style.width).toBe('50%');
            expect(assignedBar.style.width).toBe('50%');
        });
    });

    describe('API: fetchAgingData', () => {
        test('constructs correct URL for province selection', async () => {
            // Setup global state
            currentSelection = { type: 'province', ids: { provinceId: 1 } };
            
            // Mock successful response
            fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue([])
            });

            await fetchAgingData();

            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/sandbox/province/1'));
        });

        test('handles fetch errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            fetch.mockRejectedValue(new Error('Network Error'));

            await fetchAgingData();

            expect(consoleSpy).toHaveBeenCalledWith("Aging Data Fetch Error:", expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Logic: getDateRange', () => {
        test('returns 30 day range by default', () => {
            const range = getDateRange();
            const start = new Date(range.start);
            const end = new Date(range.end);
            
            const diffInDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
            expect(diffInDays).toBe(30);
        });
    });
});