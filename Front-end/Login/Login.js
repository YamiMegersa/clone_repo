const loginForm = document.getElementById('ResidentLoginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessage=document.getElementById('error');

loginForm.addEventListener('submit', async function(event) {
    // No refresh
    event.preventDefault();

    // 4. Get the values from the inputs
    const username = usernameInput.value.trim();//trim removes spaces from end
    const password = passwordInput.value;
    if((!username||!password)){
        errorMessage.textContent="Please enter username and password";
        errorMessage.classList.remove('hidden');
        return;
    }
    // 5. Do something with the data
    try {
        // This is where you send the ID and Password to your server
        // which then talks to Google's API
        const response = await fetch('</api/login>', {//Change once db runs
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            //displayMessage("Success! Redirecting...", "success");
            window.location.href = "/<ResidentPage>";
        } else {
            errorMessage.textContent="Incorrect username or password";
            errorMessage.classList.remove('hidden');
        }
    } catch (err) {
        errorMessage.textContent = "Something has gone terribly wrong.";
        errorMessage.classList.remove('hidden');
    }   
});