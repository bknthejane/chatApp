function encryption(password) {
    let encrypted = '';

    for (let i = 0; i < password.length; i++) {
        encrypted += String.fromCharCode(password.charCodeAt(i) + 3);
    }

    return encrypted;
}

// Run the script only after the entire HTML content has loaded
document.addEventListener('DOMContentLoaded', function () {
    // Reference the signup form using its ID
    const signupForm = document.getElementById('signupForm');

    // Initialize the user list in localStorage if it doesn't already exist
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([])); // localStorage only stores strings
    }

    // Handle form submission manually (prevent page reload)
    signupForm.addEventListener('submit', function (event) {
        event.preventDefault();

        // Retrieve values from form fields and trim whitespace
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Ensure all fields are filled in
        if (!fullName || !email || !username || !password || !confirmPassword) {
            showError('All fields are required.');
            return;
        }

        // Basic email format validation using a regular expression
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        // Check for password confirmation mismatch
        if (password !== confirmPassword) {
            showError('Passwords do not match.');
            return;
        }

        // Enforce minimum password length
        if (password.length < 6) {
            showError('Password must be at least 6 characters long.');
            return;
        }

        // Retrieve existing users from localStorage and check if username is already taken
        const existingUsers = JSON.parse(localStorage.getItem('users'));
        const usernameTaken = existingUsers.some(user => user.username.toLowerCase() === username.toLowerCase());

        if (usernameTaken) {
            showError('Username already exists. Please choose a different one.');
            return;
        }

        // Create new user object
        const newUser = {
            fullName,
            email,
            username,
            password: encryption(password),
            profilePic: '',
            online: false,
            createdAt: new Date().toISOString()
        };

        // Save the new user to localStorage
        existingUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(existingUsers));

        // Initialize an empty message structure for the user
        localStorage.setItem(`messages_${username}`, JSON.stringify({ group: [], private: {} }));

        // Display success message and redirect to login page
        showSuccess('Account created successfully! Redirecting to login...');

        setTimeout(() => {
            window.location.href = '../pages/login.html';
        }, 2000);
    });

    // Show a temporary error message under the form
    function showError(message) {
        let errorBox = document.querySelector('.error-message');

        if (!errorBox) {
            errorBox = document.createElement('div');
            errorBox.className = 'error-message';
            signupForm.insertBefore(errorBox, signupForm.querySelector('button'));
        }

        errorBox.textContent = message;
        errorBox.style.display = 'block';

        setTimeout(() => {
            errorBox.style.display = 'none';
        }, 3000);
    }

    // Show a success message under the form
    function showSuccess(message) {
        let successBox = document.querySelector('.success-message');

        if (!successBox) {
            successBox = document.createElement('div');
            successBox.className = 'success-message';
            signupForm.insertBefore(successBox, signupForm.querySelector('button'));
        }

        successBox.textContent = message;
        successBox.style.display = 'block';
    }
});
