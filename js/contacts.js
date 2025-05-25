/* loadContacts()
  
  - Retrieves the logged-in user's contacts, groups, and user status from localStorage.
  - For each contact and group, retrieves the latest message and status.
  - Merges contacts and groups, sorting them by latest message timestamp.
  - Dynamically creates HTML elements for each contact/group with options to remove or leave.
  - Handles both individual users and group contacts separately for display.
  - If no contacts/groups exist, a message is shown to inform the user. */

const loadContacts = () => {
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];
    const groups = JSON.parse(localStorage.getItem(`groups_${currentUser.username}`)) || [];

    const userStatuses = JSON.parse(localStorage.getItem('userStatuses')) || {};


    const contactsList = document.getElementById('contactsList');
    contactsList.innerHTML = '';

    if (contacts.length === 0 && groups.length === 0) {
        contactsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No friends or groups added yet</div>';
        return;
    }

    const contactsWithLastMessage = [];

    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];

        const chatKey = `chat_${currentUser.username}_${contact.username}`;
        const chatKeyReverse = `chat_${contact.username}_${currentUser.username}`;

        let messages = JSON.parse(localStorage.getItem(chatKey)) || [];
        const reverseMessages = JSON.parse(localStorage.getItem(chatKeyReverse)) || [];

        messages = messages.concat(reverseMessages).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Get the last message if it exists
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

        // Get online status info
        const status = userStatuses[contact.username] || { online: false, lastSeen: null };

        // Push the result into the new array
        contactsWithLastMessage.push({
            ...contact,
            lastMessage,
            status,
            isGroup: false
        });
    }

    const groupsWithLastMessage = [];

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const groupChatKey = `group_chat_${group.id}`;
        const messages = JSON.parse(localStorage.getItem(groupChatKey)) || [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

        groupsWithLastMessage.push({
            ...group,
            lastMessage,
            isGroup: true
        });
    }


    // Merge contacts and groups, then sort by latest message timestamp
    const allContacts = [...contactsWithLastMessage, ...groupsWithLastMessage].sort((a, b) => {
        const timeA = a.lastMessage?.timestamp || 0;
        const timeB = b.lastMessage?.timestamp || 0;
        return new Date(timeB) - new Date(timeA);
    });

    for (let i = 0; i < allContacts.length; i++) {
        const contact = allContacts[i];
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';

        const lastMessage = contact.lastMessage;
        const sender = lastMessage?.sender === currentUser.username ? 'You' : lastMessage?.sender;
        const lastMessageText = lastMessage ? `${sender}: ${lastMessage.text}` : 'No messages yet';

        if (contact.isGroup) {
            contactItem.innerHTML = `
            <div class="contact-info">
                <div class="contact-name">${contact.name} (Group)</div>
                <div class="last-message">${lastMessageText}</div>
                <div class="members-count">${contact.members.length} members</div>
            </div>
            <button class="remove-contact" data-group-id="${contact.id}">Leave</button>
        `;
            contactItem.querySelector('.contact-info').onclick = () => selectGroup(contact);
            contactItem.querySelector('.remove-contact').onclick = (event) => {
                event.stopPropagation();
                leaveGroup(contact.id);
            };
        } else {
            const lastSeenText = contact.status.lastSeen ? formatDate(contact.status.lastSeen) : 'Never';
            const statusText = contact.status.online ? 'Online' : `Last seen: ${lastSeenText}`;

            contactItem.innerHTML = `
            <div class="contact-info">
                <div class="contact-name">
                    ${contact.username}
                    <span class="status-indicator ${contact.status.online ? 'status-online' : 'status-offline'}"></span>
                </div>
                <div class="last-message">${lastMessageText}</div>
                <div class="last-seen">${statusText}</div>
            </div>
            <button class="remove-contact" data-username="${contact.username}">Remove</button>
        `;
            contactItem.querySelector('.contact-info').onclick = () => selectContact(contact);
            contactItem.querySelector('.remove-contact').onclick = (event) => {
                event.stopPropagation();
                removeContact(contact.username);
            };
        }

        contactsList.appendChild(contactItem);
    }

}

/* removeContact()
  
  - Updates the contact list in localStorage by removing the selected contact.
  - Deletes associated chat messages from localStorage.
  - Removes the contact's HTML element from the UI.
  - If the removed contact was currently selected in chat, the chat area is cleared. */

const removeContact = (username) => {
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    let contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];

    // Filter out the contact
    contacts = contacts.filter(contact => contact.username !== username);

    // Save back to localStorage
    localStorage.setItem(`contacts_${currentUser.username}`, JSON.stringify(contacts));
    localStorage.removeItem(`chat_${currentUser.username}_${username}`);

    // Remove the DOM element for this contact
    const button = document.querySelector(`.remove-contact[data-username="${username}"]`);
    if (button) {
        const contactItem = button.closest('.contact-item');
        if (contactItem) contactItem.remove();
    }

    // Clear chat area if the removed contact was currently open
    const chatArea = document.getElementById('chatArea');
    if (chatArea.dataset.currentContact === username && chatArea.dataset.isGroup !== 'true') {
        resetChatArea();
    }
}


/* addContact()
  
  - Checks if the contact already exists; if not, adds them.
  - Updates both users' contact lists for a mutual (reciprocal) friendship.
  - Closes the "Add Friend" modal and refreshes the contact list UI. */

const addContact = (user) => {
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
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

/* filterUsers()
  
  - Excludes the currently logged-in user and already-added contacts.
  - Performs a case-insensitive search on usernames and emails.
  - Passes the filtered list to `displayUserList()` for rendering in the UI. */

const filterUsers = (searchTerm) => {
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

    displayUserList(filteredUsers);
}

/* loadUserList()
  
  - Filters out the current user and their existing contacts.
  - Passes the available users to `displayUserList()` for UI display. */

const loadUserList = () => {
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const allUsers = JSON.parse(localStorage.getItem('users')) || [];
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];

    const availableUsers = allUsers.filter(user =>
        user.username !== currentUser.username &&
        !contacts.some(contact => contact.username === user.username)
    );

    displayUserList(availableUsers);
}

/* displayUserList()
  
  - Displays a message if no users are found.
  - Creates user cards dynamically and appends them to the DOM.
  - Each user card includes username, email, and an "Add" button.
  - Clicking the button invokes `addContact()` for that user. */

const displayUserList = (users) => {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';

    if (users.length === 0) {
        userList.innerHTML = '<div class="no-users-found">No users found</div>';
        return;
    }

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userItem = document.createElement('div');
        userItem.className = 'user-item';

        userItem.innerHTML = `
        <div>
            <div class="user-item-username"><strong>Username</strong>: ${user.username}</div>
            <div class="user-item-email"><strong>Email</strong>: ${user.email || 'No email'}</div>
        </div>
        <button class="add-user-btn" data-username="${user.username}">Add</button>
    `;

        userItem.querySelector('.add-user-btn').addEventListener('click', () => {
            addContact(user);
        });

        userList.appendChild(userItem);
    }

}


