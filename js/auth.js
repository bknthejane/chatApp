// Checks if a user is currently logged in by looking in localStorage
// If no user is found, it displays a message prompting to login and returns false
// Otherwise, returns the logged-in user object
function checkAuth() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        // Display message if user is not logged in
        document.getElementById('appContainer').innerHTML = `
            <div class="no-user">
                <h2>You're not logged in</h2>
                <p>Please <a href="./login.html">login</a> to continue.</p>
            </div>
        `;
        return false;
    }
    return loggedInUser;
}

// Logs out the current user by updating their status to offline,
// removing user info from localStorage, and redirecting to login page
function logout() {
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (currentUser) {
        updateUserStatus(currentUser.username, false); // Update user status to offline
    }
    sessionStorage.removeItem('loggedInUser'); // Remove user from localStorage
    window.location.href = './login.html'; // Redirect to login page
}

// Updates the user profile section in the UI with username, email, and profile initial
function updateUserProfile(user) {
    // Set displayed username or fallback to 'User'
    document.getElementById('usernameDisplay').textContent = user.username || 'User';
    // Set displayed email or leave blank if none
    document.getElementById('userEmailDisplay').textContent = user.email || '';
    // Display the first letter of username capitalized or 'U' if username missing
    const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';
    document.getElementById('profileInitial').textContent = initial;
}
