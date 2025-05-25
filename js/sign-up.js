document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');

    !localStorage.getItem('users') ? localStorage.setItem('users', JSON.stringify([])) : localStorage.getItem('users');

    signupForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();


        if (password !== confirmPassword) {
            showError('Passwords do not match.');
            return;
        }

        const existingUsers = JSON.parse(localStorage.getItem('users'));
        const usernameTaken = existingUsers.some(user => user.username.toLowerCase() === username.toLowerCase());


        if (usernameTaken) {
            showError('Username already exists. Please choose a different one.');
            return;
        }

        const newUser = {
            fullName,
            email,
            username,
            password: encryption(password),
            profilePic: '',
            online: false,
            createdAt: new Date().toISOString()
        };

        existingUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(existingUsers));

        localStorage.setItem(`messages_${username}`, JSON.stringify({ group: [], private: {} }));

        showSuccess('Account created successfully! Redirecting to login...');

        setTimeout(() => {
            window.location.href = '../pages/login.html';
        }, 2000);
    });

    const encryption = (password) => {
        let encrypted = '';
        for (let i = 0; i < password.length; i++) {
            encrypted += String.fromCharCode(password.charCodeAt(i) + 3);
        }

        return encrypted;
    }


    const showError = (message) => {
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

    const showSuccess = (message) => {
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

