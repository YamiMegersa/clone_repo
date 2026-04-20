/**
 * @jest-environment jsdom
 */



 /* 
 * * DESCRIPTION:
 * This test suite validates the frontend logic of the ReportPage.html interface.
 * Because ReportPage.js does not export standalone functions and relies heavily on 
 * DOM manipulation and event listeners, we test it by simulating real user interactions 
 * (like selecting files and clicking submit) in a virtual DOM environment provided by Jest.
 */

// Inside ReportPage.test.js
document.body.innerHTML = `<select id="province-select"><option value="GT">Gauteng</option></select>`;
require('./ReportPage.js'); // Now import it
describe('ReportPage.js Code Coverage Suite', () => {
    // Variables to hold references to our DOM elements and mock data
    let form, imageInput, preview;
    let domContentLoadedCallbacks = [];
    let mockFiles = [];

    beforeAll(() => {
        // =====================================================================
        // INTERCEPTOR: Prevent 'DOMContentLoaded' memory leaks across tests
        // =====================================================================
        // Jest runs all tests in the same global window. If we trigger DOMContentLoaded 
        // multiple times, ReportPage.js will attach multiple duplicate 'submit' listeners.
        // We intercept the listener attachment here so we can control exactly when it fires.
        const originalAddEventListener = document.addEventListener;
        document.addEventListener = function(event, callback) {
            if (event === 'DOMContentLoaded') {
                domContentLoadedCallbacks.push(callback); // Store it instead of running it immediately
            } else {
                originalAddEventListener.apply(this, arguments); // Let other listeners act normally
            }
        };
    });

    beforeEach(() => {
        // =====================================================================
        // 1. SETUP MOCK DOM
        // =====================================================================
        // We inject a simplified version of ReportPage.html into Jest's virtual document.
        // This gives ReportPage.js the elements it needs to attach events to.
        document.body.innerHTML = `
            <form>
                <select id="ward-Select"><option value="7">Ward 7</option></select>
                <select id="pothole-type"><option value="Pothole">Pothole</option></select>
                <select id="frequency"><option value="First time observed">First time observed</option></select>
                <textarea id="description">Deep pothole reported</textarea>
                
                <input type="file" id="imageInput" multiple />
                <output id="imagePreview"></output>
                
                <button type="submit">Submit</button>
            </form>
        `;

        // =====================================================================
        // 2. MOCK GLOBAL APIs
        // =====================================================================
        // Replace native browser functions with Jest "spies" so we can track if they were called.
        global.fetch = jest.fn(); // Stops real network requests to the backend
        global.alert = jest.fn(); // Stops browser popups from halting the test
        delete window.mapLat;     // Clear map coordinates before each test
        delete window.mapLng;
        mockFiles = [];           // Reset selected files array

        // =====================================================================
        // 3. ASYNC MOCK FILEREADER
        // =====================================================================
        // Node.js doesn't have a real FileReader. We build a fake one that mimics 
        // the asynchronous behavior of reading an image and converting it to base64.
        global.FileReader = jest.fn(function() {
            this.readAsDataURL = jest.fn(function() {
                this.result = 'data:image/png;base64,mockBase64String';
                // Use setTimeout to mimic the slight delay of a real file reader
                setTimeout(() => {
                    if (this.onload) this.onload({ target: { result: this.result } });
                }, 0);
            });
        });

        // =====================================================================
        // 4. LOAD SCRIPT SAFELY
        // =====================================================================
        // isolateModules ensures we get a fresh execution of the script for every test.
        domContentLoadedCallbacks = [];
        jest.isolateModules(() => {
            require('./ReportPage.js');
        });
        // Manually trigger the callback we intercepted earlier
        domContentLoadedCallbacks.forEach(cb => cb());

        // =====================================================================
        // 5. GRAB DOM ELEMENTS FOR TESTING
        // =====================================================================
        form = document.querySelector('form');
        imageInput = document.getElementById('imageInput');
        preview = document.getElementById('imagePreview');

        // =====================================================================
        // 6. DYNAMIC MOCK FOR FILE INPUT
        // =====================================================================
        // HTML file inputs are strictly read-only in code for security reasons.
        // We override this rule in the test environment so we can force files into it.
        Object.defineProperty(imageInput, 'files', { get: () => mockFiles });
    });

    afterEach(() => {
        // Clean up everything after a test finishes to ensure a blank slate for the next one
        jest.clearAllMocks();
        delete window.removeImage; 
    });

    // =====================================================================
    // TEST 1: IMAGE SELECTION LOGIC
    // =====================================================================
    test('renders image previews when files are selected', async () => {
        // ARRANGE: Create a fake image file and load it into our input
        mockFiles = [new File(['dummy content'], 'test.png', { type: 'image/png' })];
        
        // ACT: Simulate the user selecting the file (triggers the 'change' event)
        imageInput.dispatchEvent(new Event('change'));

        // Wait for our asynchronous FileReader mock to finish processing
        await new Promise(r => setTimeout(r, 10));

        // ASSERT: Check the DOM to ensure the image thumbnail was generated
        const figures = preview.querySelectorAll('figure');
        expect(figures.length).toBe(1);
        expect(figures[0].innerHTML).toContain('mockBase64String');
    });

    // =====================================================================
    // TEST 2: IMAGE REMOVAL LOGIC
    // =====================================================================
    test('removes image from preview when close button is clicked', async () => {
        // ARRANGE: Set up the preview with an image first
        mockFiles = [new File(['dummy content'], 'test.png', { type: 'image/png' })];
        imageInput.dispatchEvent(new Event('change'));
        await new Promise(r => setTimeout(r, 10)); 
        expect(preview.querySelectorAll('figure').length).toBe(1); // Verify it exists

        // ACT: Simulate the browser clearing the file input, then click the close button
        mockFiles = [];
        window.removeImage(0); // Call the global remove function defined in ReportPage.js

        // ASSERT: The preview container should now be completely empty
        expect(preview.querySelectorAll('figure').length).toBe(0);
    });

    // =====================================================================
    // TEST 3: FORM SUBMISSION - SUCCESS PATH
    // =====================================================================
    test('submits report and images to the API successfully', async () => {
        // ARRANGE: Simulate user interacting with the map
        window.mapLat = -30.5595;
        window.mapLng = 22.9375;

        // Mock the backend responses for BOTH network calls
        global.fetch
            .mockResolvedValueOnce({ json: async () => ({ report: { ReportID: 42 } }) }) // 1st Call: POST Report
            .mockResolvedValueOnce({ ok: true }); // 2nd Call: POST Image

        // Simulate user selecting an image
        mockFiles = [new File(['dummy content'], 'test.png', { type: 'image/png' })];
        imageInput.dispatchEvent(new Event('change'));
        await new Promise(r => setTimeout(r, 10));

        // ACT: Simulate clicking the submit button
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(r => setTimeout(r, 10)); // Wait for the async API calls to finish

        // ASSERT 1: Verify fetch was called exactly twice
        expect(global.fetch).toHaveBeenCalledTimes(2);
        
        // ASSERT 2: Verify the JSON payload sent to the Report API endpoint
        const reportPayload = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(reportPayload.Lattitude).toBe(-30.5595);
        expect(reportPayload.Type).toBe('Pothole');

        // ASSERT 3: Verify the JSON payload sent to the Image API endpoint
        const imagePayload = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(imagePayload.Image).toBe('mockBase64String'); 

        // ASSERT 4: Verify the UI successfully reset itself
        expect(global.alert).toHaveBeenCalledWith('Report submitted successfully!');
        expect(preview.querySelectorAll('figure').length).toBe(0);
    });

    // =====================================================================
    // TEST 4: FORM SUBMISSION - FALLBACK LOGIC
    // =====================================================================
    test('submits with fallback coordinates of 0 if map is not clicked', async () => {
        // ARRANGE: Set up a successful API response, but DO NOT set map coordinates
        global.fetch.mockResolvedValueOnce({ json: async () => ({ report: { ReportID: 42 } }) });

        // ACT: Submit the form
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(process.nextTick);

        // ASSERT: Ensure the code caught the missing coordinates and defaulted to 0,0
        const reportPayload = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(reportPayload.Lattitude).toBe(0);
        expect(reportPayload.Longitude).toBe(0);
    });

    // =====================================================================
    // TEST 5: FORM SUBMISSION - ERROR HANDLING
    // =====================================================================
    test('alerts the user if the API submission fails', async () => {
        // ARRANGE: Temporarily mute console.error so our test output stays clean
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Force the mock backend to crash/return an error
        global.fetch.mockRejectedValueOnce(new Error('500 Internal Server Error'));

        // ACT: Submit the form
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await new Promise(process.nextTick);

        // ASSERT: Ensure the catch block executed and alerted the user
        expect(global.alert).toHaveBeenCalledWith('Error submitting report');
        
        // Clean up the console spy
        consoleSpy.mockRestore();
    });
});