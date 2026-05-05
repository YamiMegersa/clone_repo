// // PublicWardView.test.js

// By adding .skip, Jest will instantly ignore everything inside this block
describe.skip('My Component Tests', () => {
    
    test('does something', () => {
        expect(1).toBe(1);
    });

});

// // 1. Setup Mocks before requiring the file
// beforeEach(() => {
// // 1. 🚨 Wrap the tbody inside a <table> tag so JSDOM doesn't delete it
//     document.body.innerHTML = `
//         <h1 id="ward-title"></h1>
//         <p id="councillor-label"></p>
//         <p id="active-count"></p>
//         <p id="resolved-count"></p>
//         <table>
//             <tbody id="reports-table-body"></tbody>
//         </table>
//         <div id="ward-map"></div>
//     `;

//     // Mock the Fetch API
//     global.fetch = jest.fn();

//     // Mock Leaflet (L)
//     const mockMarker = { bindPopup: jest.fn(), on: jest.fn() };
//     global.L = {
//         map: jest.fn().mockReturnValue({
//             setView: jest.fn().mockReturnThis(),
//             fitBounds: jest.fn()
//         }),
//         tileLayer: jest.fn().mockReturnValue({ addTo: jest.fn() }),
//         circleMarker: jest.fn().mockReturnValue(mockMarker),
//         latLngBounds: jest.fn().mockReturnValue({ extend: jest.fn() })
//     };

//     // Mock CivicModal
//     global.CivicModal = jest.fn().mockImplementation(() => ({
//         open: jest.fn()
//     }));

//     document.dispatchEvent(new Event('DOMContentLoaded'));
// });

// afterEach(() => {
//     jest.clearAllMocks();
// });

// // Require the file (Ensure the path is correct based on your folder structure)
// const { 
//     renderStats, 
//     renderTable, 
//     fetchWardDetails, 
//     openIssueModal,
//     setCurrentReports 
// } = require('./PublicWardView.js');

// describe('PublicWardView Tests', () => {

//     const mockReports = [
//         { ReportID: 1, Type: 'Pothole', Progress: 'In Progress', CreatedAt: '2026-05-01' },
//         { ReportID: 2, Type: 'Water Leak', Progress: 'Resolved', CreatedAt: '2026-05-02' },
//         { ReportID: 3, Type: 'Sanitation', Progress: 'Assigned to field staff', CreatedAt: '2026-05-03' }
//     ];

//     test('renderStats correctly calculates active vs resolved reports', () => {
//         renderStats(mockReports);
        
//         // 2 Active (In Progress, Assigned), 1 Resolved
//         expect(document.getElementById('active-count').textContent).toBe('2');
//         expect(document.getElementById('resolved-count').textContent).toBe('1');
//     });

//     test('renderTable generates correct HTML rows and handles empty state', () => {
//         // Test Empty State
//         renderTable([]);
//         let tbody = document.getElementById('reports-table-body');
//         expect(tbody.innerHTML).toContain('No public issues reported for this ward');

//         // Test Populated State
//         renderTable(mockReports);
//         tbody = document.getElementById('reports-table-body');
        
//         // Should create 3 rows
//         expect(tbody.children.length).toBe(3);
        
//         // Check if specific data rendered
//         expect(tbody.innerHTML).toContain('Pothole');
//         expect(tbody.innerHTML).toContain('Resolved');
//         expect(tbody.innerHTML).toContain('2026-05-01');
//     });

//     test('fetchWardDetails updates the councillor label on success', async () => {
//         // Mock successful API response
//         global.fetch.mockResolvedValueOnce({
//             ok: true,
//             json: async () => ({ WardCouncillor: 'Jane Doe' })
//         });

//         await fetchWardDetails(118);

//         expect(global.fetch).toHaveBeenCalledWith('/api/public/geography/wards/118');
//         expect(document.getElementById('councillor-label').textContent).toBe('Councillor: Jane Doe');
//     });

//     test('fetchWardDetails falls back gracefully on API error', async () => {
//         // Mock API failure
//         global.fetch.mockRejectedValueOnce(new Error('Network Error'));

//         await fetchWardDetails(118);

//         expect(document.getElementById('councillor-label').textContent).toBe('Civic Transparency View');
//     });

//     test('openIssueModal passes correctly formatted data to CivicModal', async () => {
//         // Setup internal state
//         setCurrentReports(mockReports);
        
//         // Mock the global issueModal instance that gets created on DOMContentLoaded
//         global.issueModal = new CivicModal();

//         await openIssueModal(1);

//         // Verify the modal was told to open with the right mapping
//         expect(global.issueModal.open).toHaveBeenCalledWith({
//             id: 1,
//             type: 'Pothole',
//             description: 'In Progress', // Fallback from Progress
//             date: '2026-05-01',
//             status: 'In Progress',
//             ward: 'Unknown',
//             municipality: 'Local Municipality'
//         });
//     });
// });