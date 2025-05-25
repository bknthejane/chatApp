/* selectContact(contact)
   - Prepares the chat UI to show a one-on-one conversation with the selected contact.
   - Hides the welcome message, shows chat area and message input.
   - Updates contact name, online/offline status indicator, last seen info.
   - Loads and displays the contact's messages.
   - Marks the chat area as a personal chat (not group). */

const selectContact = (contact) => {
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('chatArea').style.display = 'flex';
    document.getElementById('chatArea').style.flexDirection = 'column';
    document.getElementById('messageInputArea').style.display = 'flex';
    document.getElementById('chatHeader').style.display = 'flex';

    document.getElementById('currentContactName').textContent = contact.username;

    const statusIndicator = document.getElementById('contactStatusIndicator');
    statusIndicator.className = `status-indicator ${contact.status && contact.status.online ? 'status-online' : 'status-offline'}`;

    const lastSeenElement = document.getElementById('contactLastSeen');
    if (contact.status && contact.status.online) {
        lastSeenElement.textContent = 'Online';
    } else if (contact.status && contact.status.lastSeen) {
        lastSeenElement.textContent = `Last seen: ${formatDate(contact.status.lastSeen)}`;
    } else {
        lastSeenElement.textContent = 'Last seen: Never';
    }

    displayMessages(contact.username);

    const chatArea = document.getElementById('chatArea');
    chatArea.dataset.currentContact = contact.username;
    chatArea.dataset.isGroup = 'false';

    chatArea.scrollTop = chatArea.scrollHeight;

    document.getElementById('typingIndicator').style.display = 'none';
}

/* selectGroup(group)
   - Prepares the chat UI for a group conversation.
   - Hides welcome message and contact status indicator, shows chat area and message input.
   - Displays group name with member count.
   - Loads and displays group messages.
   - Marks the chat area as a group chat. */

const selectGroup = (group) => {
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('chatArea').style.display = 'flex';
    document.getElementById('chatArea').style.flexDirection = 'column';
    document.getElementById('messageInputArea').style.display = 'flex';
    document.getElementById('chatHeader').style.display = 'flex';

    document.getElementById('typingIndicator').style.display = 'none';
    document.getElementById('contactStatusIndicator').style.display = 'none';

    document.getElementById('currentContactName').textContent = `${group.name} (Group)`;
    document.getElementById('contactLastSeen').textContent = `${group.members.length} members`;

    displayGroupMessages(group.id);

    const chatArea = document.getElementById('chatArea');
    chatArea.dataset.currentContact = group.id;
    chatArea.dataset.isGroup = 'true';

    chatArea.scrollTop = chatArea.scrollHeight;
}

/* resetChatArea()
   - Resets the chat UI to initial state.
   - Shows welcome message and hides chat area, input, header, and typing indicator.
   - Clears chat content and resets dataset attributes. */

const resetChatArea = () => {
    document.getElementById('welcomeMessage').style.display = 'flex';
    document.getElementById('chatArea').style.display = 'none';
    document.getElementById('messageInputArea').style.display = 'none';
    document.getElementById('chatHeader').style.display = 'none';
    document.getElementById('typingIndicator').style.display = 'none';

    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '';
    chatArea.dataset.currentContact = '';
    chatArea.dataset.isGroup = 'false';
}

/* updateContactStatuses()
   - Updates the status of the logged-in user to online.
   - Fetches and updates the online/offline status and last seen info of the currently selected contact.
   - Shows or hides typing indicator based on whether the contact is currently typing.
   - Refreshes the contacts list display. */

const updateContactStatuses = () => {
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!currentUser) return;

    const userStatuses = JSON.parse(localStorage.getItem('userStatuses')) || {};

    updateUserStatus(currentUser.username, true);

    const chatArea = document.getElementById('chatArea');
    const currentContact = chatArea.dataset.currentContact;
    const isGroup = chatArea.dataset.isGroup === 'true';

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

        const typingIndicator = document.getElementById('typingIndicator');
        const isTyping = checkTypingStatus(currentContact, currentUser.username);
        typingIndicator.style.display = isTyping ? 'block' : 'none';
    }

    loadContacts();
}

/* setupEventListeners():
   - Sets up event listeners for:
       - Logout button
       - Sending messages (button click and Enter key)
       - Typing status updates with debounce
       - Opening and closing modals for adding friends and creating groups
       - Searching/filtering users
       - Creating groups confirmation
   - Manages UI display toggling for modals and updates user lists accordingly.*/

const setupEventListeners = () => {
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    const messageInput = document.getElementById('messageInput');
    let typingTimeout = null;
    messageInput.addEventListener('input', () => {
        const chatArea = document.getElementById('chatArea');
        const contactUsername = chatArea.dataset.currentContact;
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

        if (contactUsername) {
            updateTypingStatus(loggedInUser.username, contactUsername, true);

            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                updateTypingStatus(loggedInUser.username, contactUsername, false);
            }, 2000);
        }
    });

    const addFriendModal = document.getElementById('addFriendModal');
    const addFriendBtn = document.getElementById('addFriendBtn');
    const closeModal = document.getElementById('closeModal');
    const searchInput = document.getElementById('searchUsers');

    addFriendBtn.addEventListener('click', () => {
        addFriendModal.style.display = 'block';
        loadUserList();
        searchInput.value = '';
    });

    closeModal.addEventListener('click', () => {
        addFriendModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === addFriendModal) {
            addFriendModal.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', () => {
        filterUsers(this.value);
    });

    const createGroupModal = document.getElementById('createGroupModal');
    const createGroupBtn = document.getElementById('createGroupBtn');
    const closeGroupModal = document.getElementById('closeGroupModal');
    const createGroupConfirmBtn = document.getElementById('createGroupConfirmBtn');

    createGroupBtn.addEventListener('click', () => {
        createGroupModal.style.display = 'block';
        loadFriendsForGroup();
    });

    closeGroupModal.addEventListener('click', () => {
        createGroupModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === createGroupModal) {
            createGroupModal.style.display = 'none';
        }
    });

    createGroupConfirmBtn.addEventListener('click', createGroup);
}
