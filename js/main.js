document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = checkAuth();

    if (!loggedInUser) return;

    updateUserProfile(loggedInUser);
    updateUserStatus(loggedInUser.username, true);
    loadContacts();
    
    setInterval(checkForNewMessages, 2000);
    setInterval(updateContactStatuses, 5000);
    
    setupEventListeners();


    window.addEventListener('beforeunload', () => {
        updateUserStatus(loggedInUser.username, false);
    });
});
