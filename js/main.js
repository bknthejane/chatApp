// Run this code when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if a user is logged in and authenticated
    const loggedInUser = checkAuth();
    // If no user is logged in, stop further execution
    if (!loggedInUser) return;

    // Update the UI to show the logged-in user's profile info
    updateUserProfile(loggedInUser);
    // Set the logged-in user's status to 'online'
    updateUserStatus(loggedInUser.username, true);
    // Load the logged-in user's contacts list
    loadContacts();
    
    // Check for new incoming messages every 2 seconds
    setInterval(checkForNewMessages, 2000);
    // Periodically update the online/offline status of contacts every 5 seconds
    setInterval(updateContactStatuses, 5000);
    
    // Set up event listeners for UI interactions (e.g., buttons, inputs)
    setupEventListeners();

    // When the user is about to leave or close the page, set their status to 'offline'
    window.addEventListener('beforeunload', function() {
        updateUserStatus(loggedInUser.username, false);
    });
});
