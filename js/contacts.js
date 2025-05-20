// Load and display the list of contacts and groups for the current user
function loadContacts() {
    // Get the currently logged-in user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));

    // Retrieve contacts and groups of the current user from localStorage
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];
    const groups = JSON.parse(localStorage.getItem(`groups_${currentUser.username}`)) || [];
    // Retrieve the online status of users from localStorage
    const userStatuses = JSON.parse(localStorage.getItem('userStatuses')) || {};

    // Get the container element where contacts will be displayed
    const contactsList = document.getElementById('contactsList');
    contactsList.innerHTML = ''; // Clear current contacts list

    // If no contacts and no groups, show a message and return early
    if (contacts.length === 0 && groups.length === 0) {
        contactsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No friends or groups added yet</div>';
        return;
    }

    // For each contact, gather their last message and status info
    const contactsWithLastMessage = contacts.map(contact => {
        // Construct chat keys for messages between current user and contact in both directions
        const chatKey = `chat_${currentUser.username}_${contact.username}`;
        const chatKeyReverse = `chat_${contact.username}_${currentUser.username}`;
        // Get messages sent by current user and by contact
        let messages = JSON.parse(localStorage.getItem(chatKey)) || [];
        const reverseMessages = JSON.parse(localStorage.getItem(chatKeyReverse)) || [];
        // Combine and sort all messages by timestamp ascending
        messages = [...messages, ...reverseMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        // Get the last message if exists
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        // Get the user's online status or default to offline with no last seen
        const status = userStatuses[contact.username] || { online: false, lastSeen: null };

        // Return contact object augmented with last message, status, and group flag
        return { ...contact, lastMessage, status, isGroup: false };
    });

    // For each group, get the last message in the group chat
    const groupsWithLastMessage = groups.map(group => {
        const groupChatKey = `group_chat_${group.id}`;
        const messages = JSON.parse(localStorage.getItem(groupChatKey)) || [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        // Return group object with last message and group flag true
        return { ...group, lastMessage, isGroup: true };
    });

    // Combine contacts and groups into one list
    const allContacts = [...contactsWithLastMessage, ...groupsWithLastMessage];
    // Sort combined list by most recent last message timestamp descending
    allContacts.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1; // contacts without last message go to bottom
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
    });

    // For each contact or group, create and append a UI element to display it
    allContacts.forEach(contact => {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';

        // Prepare the last message text to display
        let lastMessageText = 'No messages yet';
        if (contact.lastMessage) {
            // If current user sent the last message, display 'You', else show sender username
            const sender = contact.lastMessage.sender === currentUser.username ? 'You' : contact.lastMessage.sender;
            lastMessageText = `${sender}: ${contact.lastMessage.text}`;
        }

        if (contact.isGroup) {
            // For groups, display group name, last message, and member count
            contactItem.innerHTML = `
                <div class="contact-info">
                    <div class="contact-name">${contact.name} (Group)</div>
                    <div class="last-message">${lastMessageText}</div>
                    <div class="members-count">${contact.members.length} members</div>
                </div>
                <button class="remove-contact" data-group-id="${contact.id}">Leave</button>
            `;
            // Add click event to select the group chat when contact info is clicked
            contactItem.querySelector('.contact-info').addEventListener('click', () => selectGroup(contact));
            // Add click event to leave the group when 'Leave' button is clicked (stop event propagation)
            contactItem.querySelector('.remove-contact').addEventListener('click', function(e) {
                e.stopPropagation();
                leaveGroup(contact.id);
            });
        } else {
            // For individual contacts, show username with online/offline status indicator
            let lastSeenText = 'Never';
            if (contact.status.lastSeen) {
                lastSeenText = formatDate(contact.status.lastSeen);
            }

            contactItem.innerHTML = `
                <div class="contact-info">
                    <div class="contact-name">
                        ${contact.username}
                        <span class="status-indicator ${contact.status.online ? 'status-online' : 'status-offline'}"></span>
                    </div>
                    <div class="last-message">${lastMessageText}</div>
                    <div class="last-seen">${contact.status.online ? 'Online' : 'Last seen: ' + lastSeenText}</div>
                </div>
                <button class="remove-contact" data-username="${contact.username}">Remove</button>
            `;
            // Add click event to select individual contact chat on clicking contact info
            contactItem.querySelector('.contact-info').addEventListener('click', () => selectContact(contact));
            // Add click event to remove the contact when 'Remove' button clicked (stop event propagation)
            contactItem.querySelector('.remove-contact').addEventListener('click', function(e) {
                e.stopPropagation();
                removeContact(contact.username);
            });
        }

        // Append the contact or group element to the contacts list container
        contactsList.appendChild(contactItem);
    });
}

// Remove a contact by username and update storage and UI accordingly
function removeContact(username) {
    // Get current logged-in user
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Get current user's contacts
    let contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];
    // Filter out the contact to remove
    contacts = contacts.filter(contact => contact.username !== username);
    // Save updated contacts back to localStorage
    localStorage.setItem(`contacts_${currentUser.username}`, JSON.stringify(contacts));
    // Remove chat history with this contact from localStorage
    localStorage.removeItem(`chat_${currentUser.username}_${username}`);
    // Reload contacts to update UI
    loadContacts();

    // Clear chat area if the removed contact was currently open
    const chatArea = document.getElementById('chatArea');
    if (chatArea.dataset.currentContact === username && chatArea.dataset.isGroup !== 'true') {
        resetChatArea();
    }
}

// Add a new contact (friend) for the current user and reciprocally add current user to the other user's contacts
function addContact(user) {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Get current user's contacts
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];

    // Only add if the user is not already a contact
    if (!contacts.some(contact => contact.username === user.username)) {
        // Add new contact to current user's contact list
        contacts.push({ username: user.username, email: user.email });
        localStorage.setItem(`contacts_${currentUser.username}`, JSON.stringify(contacts));

        // Also add the current user to the new contact's contact list (reciprocal friendship)
        const userContacts = JSON.parse(localStorage.getItem(`contacts_${user.username}`)) || [];
        if (!userContacts.some(contact => contact.username === currentUser.username)) {
            userContacts.push({ username: currentUser.username, email: currentUser.email });
            localStorage.setItem(`contacts_${user.username}`, JSON.stringify(userContacts));
        }

        // Close the add friend modal and reload contacts list to update UI
        document.getElementById('addFriendModal').style.display = 'none';
        loadContacts();
    }
}

// Filter the user list based on a search term, excluding current user and existing contacts
function filterUsers(searchTerm) {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const allUsers = JSON.parse(localStorage.getItem('users')) || [];
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];
    searchTerm = searchTerm.toLowerCase();

    // Filter users to exclude current user and existing contacts,
    // and match search term against username or email (case insensitive)
    const filteredUsers = allUsers.filter(user =>
        user.username !== currentUser.username &&
        !contacts.some(contact => contact.username === user.username) &&
        (user.username.toLowerCase().includes(searchTerm) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)))
    );

    // Display the filtered list of users
    displayUserList(filteredUsers);
}

// Load the list of all users excluding current user and existing contacts, for adding new contacts
function loadUserList() {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const allUsers = JSON.parse(localStorage.getItem('users')) || [];
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];

    // Filter users excluding current user and existing contacts
    const availableUsers = allUsers.filter(user =>
        user.username !== currentUser.username &&
        !contacts.some(contact => contact.username === user.username)
    );

    // Display the filtered user list
    displayUserList(availableUsers);
}

// Render a list of user entries with an 'Add' button for each user
function displayUserList(users) {
    const userList = document.getElementById('userList');
    userList.innerHTML = ''; // Clear existing list

    // If no users found, display a message
    if (users.length === 0) {
        userList.innerHTML = '<div class="no-users-found">No users found</div>';
        return;
    }

    // For each user, create a user item element with username, email and Add button
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div>
                <div class="user-item-username"><strong>Username</strong>: ${user.username}</div>
                <div class="user-item-email"><strong>Email</strong>: ${user.email || 'No email'}</div>
            </div>
            <button class="add-user-btn" data-username="${user.username}">Add</button>
        `;
        // Add click listener on Add button to add this user as contact
        userItem.querySelector('.add-user-btn').addEventListener('click', function() {
            addContact(user);
        });
        userList.appendChild(userItem);
    });
}
