// Selects a single contact to chat with and updates the UI accordingly
function selectContact(contact) {
    // Hide welcome message and show chat UI elements
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('chatArea').style.display = 'flex';
    document.getElementById('chatArea').style.flexDirection = 'column';
    document.getElementById('messageInputArea').style.display = 'flex';
    document.getElementById('chatHeader').style.display = 'flex';

    // Set the current contact's name in the chat header
    document.getElementById('currentContactName').textContent = contact.username;

    // Update the contact's online/offline status indicator
    const statusIndicator = document.getElementById('contactStatusIndicator');
    statusIndicator.className = `status-indicator ${contact.status && contact.status.online ? 'status-online' : 'status-offline'}`;

    // Update the last seen text based on the contact's status
    const lastSeenElement = document.getElementById('contactLastSeen');
    if (contact.status && contact.status.online) {
        lastSeenElement.textContent = 'Online';
    } else if (contact.status && contact.status.lastSeen) {
        lastSeenElement.textContent = `Last seen: ${formatDate(contact.status.lastSeen)}`;
    } else {
        lastSeenElement.textContent = 'Last seen: Never';
    }

    // Load and display chat messages for this contact
    displayMessages(contact.username);

    // Store current contact info on chatArea element dataset for reference
    const chatArea = document.getElementById('chatArea');
    chatArea.dataset.currentContact = contact.username;
    chatArea.dataset.isGroup = 'false';

    // Scroll chat to bottom to show latest messages
    chatArea.scrollTop = chatArea.scrollHeight;

    // Hide typing indicator initially
    document.getElementById('typingIndicator').style.display = 'none';
}

// Selects a group chat and updates the UI accordingly
function selectGroup(group) {
    // Hide welcome message and show chat UI elements
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('chatArea').style.display = 'flex';
    document.getElementById('chatArea').style.flexDirection = 'column';
    document.getElementById('messageInputArea').style.display = 'flex';
    document.getElementById('chatHeader').style.display = 'flex';

    // Hide the individual contact status indicator (not applicable to groups)
    document.getElementById('typingIndicator').style.display = 'none';
    document.getElementById('contactStatusIndicator').style.display = 'none';

    // Show group name with (Group) label and display number of members
    document.getElementById('currentContactName').textContent = `${group.name} (Group)`;
    document.getElementById('contactLastSeen').textContent = `${group.members.length} members`;

    // Load and display group chat messages
    displayGroupMessages(group.id);

    // Store current group info on chatArea element dataset for reference
    const chatArea = document.getElementById('chatArea');
    chatArea.dataset.currentContact = group.id;
    chatArea.dataset.isGroup = 'true';

    // Scroll chat to bottom to show latest messages
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Resets the chat area UI back to its initial state (no contact/group selected)
function resetChatArea() {
    // Show welcome message and hide chat UI elements
    document.getElementById('welcomeMessage').style.display = 'flex';
    document.getElementById('chatArea').style.display = 'none';
    document.getElementById('messageInputArea').style.display = 'none';
    document.getElementById('chatHeader').style.display = 'none';
    document.getElementById('typingIndicator').style.display = 'none';

    // Clear chat messages and reset dataset attributes
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '';
    chatArea.dataset.currentContact = '';
    chatArea.dataset.isGroup = 'false';
}

// Updates the statuses of contacts and the UI accordingly
function updateContactStatuses() {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!currentUser) return; // Exit if no user logged in

    // Load contacts and global user statuses from localStorage
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];
    const userStatuses = JSON.parse(localStorage.getItem('userStatuses')) || {};

    // Update the logged-in user's status to online
    updateUserStatus(currentUser.username, true);

    const chatArea = document.getElementById('chatArea');
    const currentContact = chatArea.dataset.currentContact;
    const isGroup = chatArea.dataset.isGroup === 'true';

    // If a contact (not group) is currently selected, update their status indicator and last seen info
    if (currentContact && !isGroup) {
        const contactStatus = userStatuses[currentContact] || { online: false, lastSeen: null };
        const statusIndicator = document.getElementById('contactStatusIndicator');
        statusIndicator.className = `status-indicator ${contactStatus.online ? 'status-online' : 'status-offline'}`;

        const lastSeenElement = document.getElementById('contactLastSeen');
        if (contactStatus.online) {
            lastSeenElement.textContent = 'Online';
        } else if (contactStatus.lastSeen) {
            lastSeenElement.textContent = `Last seen: ${formatDate(contactStatus.lastSeen)}`;
        } else {
            lastSeenElement.textContent = 'Last seen: Never';
        }

        // Show or hide typing indicator based on whether the contact is typing
        const typingIndicator = document.getElementById('typingIndicator');
        const isTyping = checkTypingStatus(currentContact, currentUser.username);
        typingIndicator.style.display = isTyping ? 'block' : 'none';
    }

    // Reload the contact list UI to reflect updated statuses
    loadContacts();
}

// Sets up all event listeners for UI interactions such as buttons, inputs, and modals
function setupEventListeners() {
    // Logout button triggers logout function
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Send button triggers sending a message
    document.getElementById('sendButton').addEventListener('click', sendMessage);

    // Pressing Enter in the message input sends the message
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });

    // Handle typing status updates with debounce
    const messageInput = document.getElementById('messageInput');
    let typingTimeout = null;
    messageInput.addEventListener('input', function() {
        const chatArea = document.getElementById('chatArea');
        const contactUsername = chatArea.dataset.currentContact;
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

        if (contactUsername) {
            // Notify system that the user started typing
            updateTypingStatus(loggedInUser.username, contactUsername, true);

            // Clear previous timeout and set a new one to signal typing stopped after 2 seconds of inactivity
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                updateTypingStatus(loggedInUser.username, contactUsername, false);
            }, 2000);
        }
    });

    // Add Friend Modal - open modal and prepare list when button clicked
    const addFriendModal = document.getElementById('addFriendModal');
    const addFriendBtn = document.getElementById('addFriendBtn');
    const closeModal = document.getElementById('closeModal');
    const searchInput = document.getElementById('searchUsers');

    addFriendBtn.addEventListener('click', function() {
        addFriendModal.style.display = 'block';
        loadUserList();
        searchInput.value = ''; // Clear search field on open
    });

    // Close add friend modal on close button click
    closeModal.addEventListener('click', function() {
        addFriendModal.style.display = 'none';
    });

    // Close add friend modal if clicking outside the modal content area
    window.addEventListener('click', function(event) {
        if (event.target === addFriendModal) {
            addFriendModal.style.display = 'none';
        }
    });

    // Filter user list as input is typed in the search box
    searchInput.addEventListener('input', function() {
        filterUsers(this.value);
    });

    // Create Group Modal elements and event listeners
    const createGroupModal = document.getElementById('createGroupModal');
    const createGroupBtn = document.getElementById('createGroupBtn');
    const closeGroupModal = document.getElementById('closeGroupModal');
    const createGroupConfirmBtn = document.getElementById('createGroupConfirmBtn');

    // Show create group modal and load friends for selection
    createGroupBtn.addEventListener('click', function() {
        createGroupModal.style.display = 'block';
        loadFriendsForGroup();
    });

    // Close create group modal on close button click
    closeGroupModal.addEventListener('click', function() {
        createGroupModal.style.display = 'none';
    });

    // Close create group modal if clicking outside the modal content area
    window.addEventListener('click', function(event) {
        if (event.target === createGroupModal) {
            createGroupModal.style.display = 'none';
        }
    });

    // Create the group when confirmation button is clicked
    createGroupConfirmBtn.addEventListener('click', createGroup);
}
