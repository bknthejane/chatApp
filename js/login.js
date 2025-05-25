document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const userInput = document.getElementById('email').value.trim();
        const enteredPassword = document.getElementById('password').value;
        const savedUsers = JSON.parse(localStorage.getItem('users')) || [];

        const matchingUser = savedUsers.find(user =>
            (user.username && user.username.toLowerCase() === userInput.toLowerCase()) ||
            (user.email && user.email.toLowerCase() === userInput.toLowerCase())
        );

        if (!matchingUser || decryption(matchingUser.password) !== enteredPassword) {
            showError('Invalid email/username or password');
            return;
        }

        showSuccess(`Welcome back, ${matchingUser.username}! Redirecting...`);

        sessionStorage.setItem('loggedInUser', JSON.stringify(matchingUser));

        setTimeout(() => {
            window.location.href = '../pages/chat.html';
        }, 2000);
    });

    const decryption = (encrypted) => {
        let decrypted = '';

        for (let i = 0; i < encrypted.length; i++) {
            decrypted += String.fromCharCode(encrypted.charCodeAt(i) - 3);
        }

        return decrypted;
    }

    const showError = (message) => {
        let errorBox = document.querySelector('.error-message');
        if (!errorBox) {
            errorBox = document.createElement('div');
            errorBox.className = 'error-message';
            loginForm.insertBefore(errorBox, loginForm.querySelector('button'));
        }
        errorBox.textContent = message;
        errorBox.style.display = 'block';
        setTimeout(() => {
            errorBox.style.display = 'none';
        }, 3000);
    }

    const showSuccess = (message) => {
        let successBox = document.querySelector('.success-message');
        if (!successBox) {
            successBox = document.createElement('div');
            successBox.className = 'success-message';
            loginForm.insertBefore(successBox, loginForm.querySelector('button'));
        }
        successBox.textContent = message;
        successBox.style.display = 'block';
    }
});


