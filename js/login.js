// Run the script only after the entire HTML content has loaded
document.addEventListener('DOMContentLoaded', function () {
    // Reference the login form using its ID
    const loginForm = document.getElementById('login-form');

    // Handle login form submission
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form behavior

        // Get input values and trim any extra spaces
        const userInput = document.getElementById('email').value.trim();
        const enteredPassword = document.getElementById('password').value;

        // Retrieve saved users from localStorage (or use empty array if none exist)
        const savedUsers = JSON.parse(localStorage.getItem('users')) || [];

        // Try to find a user that matches the input (either by username or email)
        const matchingUser = savedUsers.find(user =>
            (user.username && user.username.toLowerCase() === userInput.toLowerCase()) ||
            (user.email && user.email.toLowerCase() === userInput.toLowerCase())
        );

        // If no matching user or password is incorrect, show an error
        if (!matchingUser || matchingUser.password !== enteredPassword) {
            showError('Invalid email/username or password');
            return;
        }

        // Login successful
        showSuccess(`Welcome back, ${matchingUser.username}! Redirecting...`);

        // Save logged-in user info
        sessionStorage.setItem('loggedInUser', JSON.stringify(matchingUser));

        // Redirect to chat page after short delay
        setTimeout(() => {
            window.location.href = '../pages/chat.html';
        }, 2000);
    });

    // Display an error message under the form
    function showError(message) {
        let errorBox = document.querySelector('.error-message');

        // Create error box if it doesn't exist
        if (!errorBox) {
            errorBox = document.createElement('div');
            errorBox.className = 'error-message';
            loginForm.insertBefore(errorBox, loginForm.querySelector('button'));
        }

        errorBox.textContent = message;
        errorBox.style.display = 'block';

        // Hide error message after 3 seconds
        setTimeout(() => {
            errorBox.style.display = 'none';
        }, 3000);
    }

    // Display a success message under the form
    function showSuccess(message) {
        let successBox = document.querySelector('.success-message');

        // Create success box if it doesn't exist
        if (!successBox) {
            successBox = document.createElement('div');
            successBox.className = 'success-message';
            loginForm.insertBefore(successBox, loginForm.querySelector('button'));
        }

        successBox.textContent = message;
        successBox.style.display = 'block';
    }
});
