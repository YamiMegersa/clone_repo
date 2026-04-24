/**
 * @jest-environment jsdom
 */

const { renderStats, renderTable, fetchWardDetails } = require('./PublicWardView'); 

describe('Public Ward View Controller', () => {
// 

    beforeEach(() => {
        // Setup the fake HTML environment
        document.body.innerHTML = `
            <h1 id="ward-title">Loading...</h1>
            <p id="councillor-label"></p>
            <p id="active-count"></p>
            <p id="resolved-count"></p>
            <table>
                <tbody id="reports-table-body"></tbody>
            </table>
            <div id="ward-map"></div>
        `;

        const fakeMapInstance = {
            fitBounds: jest.fn()
        };
        // Make setView return the map instance itself so mainMap doesn't become undefined!
        fakeMapInstance.setView = jest.fn(() => fakeMapInstance);

        // Mock the Leaflet Library (L) since we don't need real maps for testing logic
        global.L = {
            map: jest.fn(() => ({ setView: jest.fn() })),
            tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
            circleMarker: jest.fn(() => ({ addTo: jest.fn(() => ({ bindPopup: jest.fn() })) })),
            latLngBounds: jest.fn(() => ({ extend: jest.fn() }))
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // TEST 1: Check if math logic works
    test('renderStats correctly filters active vs resolved reports', () => {
        // ARRANGE: Create some fake test data
        const fakeReports = [
            { Progress: 'Resolved' },
            { Progress: 'Fixed' },
            { Progress: 'Pending' }
        ];

        // ACT: Run the render function
        renderStats(fakeReports);

        // ASSERT: 1 active (Pending) and 2 completed (Resolved/Fixed)
        expect(document.getElementById('active-count').textContent).toBe('1');
        expect(document.getElementById('resolved-count').textContent).toBe('2');
    });

    // TEST 2: Check if HTML table generation works
    test('renderTable generates the correct number of rows and badges', () => {
        const fakeReports = [
            { ReportID: 101, Type: 'Pothole', Progress: 'Resolved', CreatedAt: '2026-04-20T10:00:00.000Z' }
        ];

        renderTable(fakeReports);

        const tbody = document.getElementById('reports-table-body');
        
        // Assert that 1 row was created
        expect(tbody.children.length).toBe(1);
        
        // Assert that the HTML contains the word "Pothole"
        expect(tbody.innerHTML).toContain('Pothole');
        
        // Assert that because it is resolved, it generated the green/dark "Resolved" badge
        expect(tbody.innerHTML).toContain('Resolved');
    });

    // TEST 3: Testing the API Fetch logic directly
    test('fetchWardDetails updates the councillor label upon successful fetch', async () => {
        // Mock the fetch to pretend the server replied with Councillor Fakir
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ WardCouncillor: 'Mr. Fakir' }),
            })
        );

        // Call the function
        await fetchWardDetails(7);

        // Verify the HTML updated with the fake data!
        expect(document.getElementById('councillor-label').textContent).toBe('Councillor: Mr. Fakir');
    });
    // Setup for <dialog> elements in JSDOM
    beforeAll(() => {
        window.HTMLDialogElement.prototype.showModal = jest.fn();
        window.HTMLDialogElement.prototype.close = jest.fn();
    });

    test('renderTable shows empty message when there are no reports', () => {
        const { renderTable } = require('./PublicWardView');
        renderTable([]); // Pass an empty array
        expect(document.getElementById('reports-table-body').innerHTML).toContain('No public issues reported');
    });
    // TEST: Map Markers
    test('renderMapMarkers plots pins and expands bounds', () => {
        // 1. Create a single, trackable mock for 'extend' so it doesn't get lost
        const mockExtend = jest.fn();
        const mockBounds = { extend: mockExtend };
        
        // 2. Build a bulletproof fake Leaflet map that returns itself perfectly
        const fakeMapInstance = { fitBounds: jest.fn() };
        fakeMapInstance.setView = jest.fn(() => fakeMapInstance);

        global.L = {
            map: jest.fn(() => fakeMapInstance),
            tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
            circleMarker: jest.fn(() => ({ addTo: jest.fn(() => ({ bindPopup: jest.fn() })) })),
            latLngBounds: jest.fn(() => mockBounds) // Returns our trackable mock!
        };

        // 3. Import and initialize the map using our new bulletproof mock
        const { renderMapMarkers, initMap } = require('./PublicWardView');
        initMap(); 

        // 4. Inject test data (Valid, Null, and Zeroed coordinates)
        const fakeReports = [
            { Latitude: -26.2, Longitude: 28.0, Progress: 'Resolved' },
            { Latitude: -26.3, Longitude: 28.1, Progress: 'Pending' },
            { Latitude: 0, Longitude: 0 }, 
            { Latitude: null, Longitude: null } 
        ];

        renderMapMarkers(fakeReports);

        // 5. Verify the results!
        expect(global.L.circleMarker).toHaveBeenCalledTimes(2);
        expect(mockExtend).toHaveBeenCalledTimes(2); // Tracks our dedicated mock variable
    });

    // TEST: API Error Catching
    // TEST: API Error Catching
    test('fetchWardReports shows error message in table if API fails', async () => {
        // 1. Temporarily mute the console so the expected server error doesn't print
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const { fetchWardReports } = require('./PublicWardView');

        // Force the fetch to throw a 500 Server Error
        global.fetch = jest.fn(() => Promise.reject(new Error('Server crash')));

        await fetchWardReports(7);

        const tbody = document.getElementById('reports-table-body');
        // Verify the user gets a friendly error message instead of an empty screen
        expect(tbody.innerHTML).toContain('Failed to load reports');

        // 2. Turn the console back on!
        consoleSpy.mockRestore();
    });

    // TEST: Modal Opening
    test('openIssueModal populates the dialog box correctly', () => {
        // We need to add the modal HTML to our fake DOM
        document.body.innerHTML += `
            <dialog id="issue-modal"></dialog>
            <h2 id="modal-title"></h2>
            <dd id="modal-status"></dd>
            <dd id="modal-date"></dd>
            <span id="modal-frequency"></span>
            <ul id="modal-carousel"></ul>
            <aside id="modal-mini-map"></aside>
        `;

        // 1. Manually set the global 'currentReports' array inside your JS file using your exports
        const script = require('./PublicWardView');
        // You might need to add a setter function to your exports in PublicWardView.js like:
        // setCurrentReports: (reports) => { currentReports = reports; }
        if(script.setCurrentReports) {
            script.setCurrentReports([{ 
                ReportID: 99, 
                Type: 'Water Leak', 
                Progress: 'Resolved', 
                Frequency: 5,
                Latitude: -26.2, 
                Longitude: 28.0 
            }]);
        }

        // 2. Trigger the modal
        if(script.openIssueModal) script.openIssueModal(99);

        // 3. Verify it populated!
        expect(document.getElementById('modal-title').textContent).toBe('Water Leak');
        expect(document.getElementById('modal-frequency').textContent).toBe('5');
        expect(document.getElementById('modal-status').innerHTML).toContain('Resolved');
        expect(window.HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
});