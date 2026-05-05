// // GuestDashboard.test.js

// beforeEach(() => {
//     document.body.innerHTML = `
//         <select id="province"><option value="">Choose a province...</option></select>
//         <select id="municipality"><option value="">Choose a municipality...</option></select>
//         <select id="ward"><option value="">Choose a ward...</option></select>
//         <button id="submit-btn" disabled>Submit</button>
        
//         <p id="global-open-issues"></p>
//         <p id="global-resolved-issues"></p>
//         <h2 class="uppercase font-black tracking-widest">GLOBAL</h2>
//     `;

//     global.fetch = jest.fn();

//     // Mock the HTML dialog methods so JSDOM doesn't crash
//     HTMLDialogElement.prototype.showModal = jest.fn();
//     HTMLDialogElement.prototype.close = jest.fn();
// });

// afterEach(() => {
//     jest.clearAllMocks();
// });

// const { loadProvinces, fetchWardStats, showModal } = require('./GuestDashboard.js');

// describe('GuestDashboard Tests', () => {

//     test('loadProvinces populates the province dropdown on success', async () => {
//         global.fetch.mockResolvedValueOnce({
//             ok: true,
//             json: async () => [
//                 { ProvinceID: 1, ProvinceName: 'Gauteng' },
//                 { ProvinceID: 2, ProvinceName: 'Western Cape' }
//             ]
//         });

//         await loadProvinces();

//         const provinceSelect = document.getElementById('province');
//         // 1 placeholder + 2 fetched options = 3
//         expect(provinceSelect.children.length).toBe(3);
//         expect(provinceSelect.children[1].textContent).toBe('Gauteng');
//         expect(provinceSelect.children[2].value).toBe('2');
//     });

//     test('fetchWardStats calculates and updates the UI correctly', async () => {
//         // Mock 3 active, 2 resolved
//         const mockReports = [
//             { Progress: 'Pending' },
//             { Progress: 'Assigned' },
//             { Progress: 'In Progress' },
//             { Progress: 'Resolved' },
//             { Progress: 'Fixed' }
//         ];

//         global.fetch.mockResolvedValueOnce({
//             ok: true,
//             json: async () => mockReports
//         });

//         await fetchWardStats(118);

//         expect(global.fetch).toHaveBeenCalledWith('/api/public/reports/ward/118');
//         expect(document.getElementById('global-open-issues').textContent).toBe('3');
//         expect(document.getElementById('global-resolved-issues').textContent).toBe('2');
        
//         // Checks the UI trick that replaces "GLOBAL" with "WARD 118"
//         expect(document.querySelector('h2').textContent).toBe('WARD 118');
//     });

//     test('fetchWardStats handles API failures gracefully', async () => {
//         global.fetch.mockRejectedValueOnce(new Error('Server Down'));

//         await fetchWardStats(118);

//         expect(document.getElementById('global-open-issues').textContent).toBe('--');
//         expect(document.getElementById('global-resolved-issues').textContent).toBe('--');
//     });
// });