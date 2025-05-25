/* checkAuth()
   - Checks if a user is currently logged in by looking for 'loggedInUser' in sessionStorage.
   - If no user is found, it replaces the main app container content with a message prompting login
     and returns false.
   - If a user is logged in, it returns the parsed user object. */

const checkAuth = () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
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

/* logout()
   - Logs out the current user by updating their status to offline via updateUserStatus(),
     removing 'loggedInUser' from sessionStorage, and redirecting to the login page. */

const logout = () => {
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (currentUser) {
        updateUserStatus(currentUser.username, false);
    }
    sessionStorage.removeItem('loggedInUser');
    window.location.href = './login.html';
}

/* updateUserProfile:
   - Updates the UI with the user's profile information:
     username, email, and profile initial displayed in specific DOM elements.*/

const updateUserProfile = (user) => {
    document.getElementById('usernameDisplay').textContent = user.username || 'User';
    document.getElementById('userEmailDisplay').textContent = user.email || '';
    const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';
    document.getElementById('profileInitial').textContent = initial;
}
