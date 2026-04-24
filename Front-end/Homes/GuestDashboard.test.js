/**
 * @jest-environment jsdom
 */

// 1. SETUP THE ENTIRE DOM ONCE AT THE VERY TOP
document.body.innerHTML = `
    <form id="guest-ward-form"></form>
    <select id="province"></select>
    <select id="municipality"></select>
    <select id="ward"></select>
    <button id="submit-btn"></button>
    <div id="global-open-issues"></div>
    <div id="global-resolved-issues"></div>
    <span class="uppercase font-black tracking-widest">GLOBAL</span>
`;

// 2. NOW REQUIRE THE FILE
const { fetchWardStats, showModal } = require('./GuestDashboard'); 

describe('Guest Dashboard Public Analytics', () => {
    
    
    

    beforeEach(() => {
        // Just mock the fetch here, DO NOT overwrite document.body.innerHTML!
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    { Progress: 'Pending' }, 
                    { Progress: 'In Progress' }, 
                    { Progress: 'Resolved' }, 
                    { Progress: 'Fixed' } 
                ]),
            })
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('fetchWardStats calculates open and resolved issues correctly', async () => {
        await fetchWardStats(7);
        expect(document.getElementById('global-open-issues').textContent).toBe('2');
        expect(document.getElementById('global-resolved-issues').textContent).toBe('2');
        expect(document.querySelector('.uppercase').textContent).toBe('WARD 7');
    });

    test('Selecting a province loads municipalities and unlocks next dropdown', async () => {
        const provinceSelect = document.getElementById('province');
        const municipalitySelect = document.getElementById('municipality');

        provinceSelect.value = '1';
        provinceSelect.dispatchEvent(new Event('change'));
        await new Promise(process.nextTick);

        expect(municipalitySelect.disabled).toBe(false);
    });

    test('Submitting the form runs the redirect logic', () => {
        // 1. Temporarily mute the console so JSDOM's navigation error is ignored
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const form = document.getElementById('guest-ward-form');
        const wardSelect = document.getElementById('ward');
        
        wardSelect.innerHTML = '<option value="7">Ward 7</option>';
        wardSelect.value = '7';

        const submitEvent = new Event('submit');
        submitEvent.preventDefault = jest.fn();

        form.dispatchEvent(submitEvent);

        expect(submitEvent.preventDefault).toHaveBeenCalled();

        // 2. Turn the console back on!
        consoleSpy.mockRestore();
    });
    test('Selecting a municipality loads wards and unlocks next dropdown', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ WardID: 7, WardCouncillor: 'Mr. Fakir' }]),
            })
        );

        const municipalitySelect = document.getElementById('municipality');
        const wardSelect = document.getElementById('ward');

        // Simulate user picking a municipality
        municipalitySelect.value = '1';
        municipalitySelect.dispatchEvent(new Event('change'));
        
        await new Promise(process.nextTick);

        expect(wardSelect.disabled).toBe(false);
        expect(wardSelect.innerHTML).toContain('Ward 7');
    });

    // ---------------------------------------------------------
    // NEW TEST: Ward Selection (Boosts Coverage)
    // ---------------------------------------------------------
    test('Selecting a ward enables the submit button', () => {
        const wardSelect = document.getElementById('ward');
        const submitBtn = document.getElementById('submit-btn');

        // Simulate user picking a ward
        wardSelect.value = '7';
        wardSelect.dispatchEvent(new Event('change'));

        // Verify the "View Ward Dashboard" button is unlocked!
        expect(submitBtn.disabled).toBe(false);
    });

    test('showModal displays the custom error dialog', () => {
        window.HTMLDialogElement.prototype.showModal = jest.fn();
        
        document.body.innerHTML += `
            <dialog id="custom-modal">
                <h3 id="modal-title"></h3>
                <p id="modal-message"></p>
            </dialog>
        `;
        
        showModal('Error Fetching', 'Server is down');

        expect(document.getElementById('modal-title').textContent).toBe('Error Fetching');
        expect(window.HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
});