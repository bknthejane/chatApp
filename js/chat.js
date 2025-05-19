document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        // If no user is logged in, show a message and redirect
        document.getElementById('appContainer').innerHTML = `
                    <div class="no-user">
                        <h2>You're not logged in</h2>
                        <p>Please <a href="./login.html">login</a> to continue.</p>
                    </div>
                `;
        return;
    }

    // Update user profile in sidebar
    updateUserProfile(loggedInUser);

    // Update user's online status
    updateUserStatus(loggedInUser.username, true);

    // Load user's contacts
    loadContacts();

    // Set up polling for new messages and status updates
    setInterval(checkForNewMessages, 2000);
    setInterval(updateContactStatuses, 5000);

    // Set up event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Add typing indicator logic
    const messageInput = document.getElementById('messageInput');
    let typingTimeout = null;

    messageInput.addEventListener('input', function () {
        const chatArea = document.getElementById('chatArea');
        const contactUsername = chatArea.dataset.currentContact;

        if (contactUsername) {
            // Update typing status
            updateTypingStatus(loggedInUser.username, contactUsername, true);

            // Clear existing timeout
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }

            // Set new timeout
            typingTimeout = setTimeout(() => {
                updateTypingStatus(loggedInUser.username, contactUsername, false);
            }, 2000);
        }
    });

    // Add Friend modal functionality
    const modal = document.getElementById('addFriendModal');
    const addFriendBtn = document.getElementById('addFriendBtn');
    const closeModal = document.getElementById('closeModal');
    const searchInput = document.getElementById('searchUsers');

    addFriendBtn.addEventListener('click', function () {
        modal.style.display = 'block';
        loadUserList();
        searchInput.value = '';
    });

    closeModal.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', function () {
        filterUsers(this.value);
    });

    // Set up beforeunload event to update status when user leaves
    window.addEventListener('beforeunload', function () {
        updateUserStatus(loggedInUser.username, false);
    });
});

// Update user profile in sidebar
function updateUserProfile(user) {
    document.getElementById('usernameDisplay').textContent = user.username || 'User';
    document.getElementById('userEmailDisplay').textContent = user.email || '';

    // Set profile initial
    const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';
    document.getElementById('profileInitial').textContent = initial;
}

// Update user's online status
function updateUserStatus(username, isOnline) {
    const userStatuses = JSON.parse(localStorage.getItem('userStatuses')) || {};

    userStatuses[username] = {
        online: isOnline,
        lastSeen: new Date().toISOString()
    };

    localStorage.setItem('userStatuses', JSON.stringify(userStatuses));
}

// Update typing status
function updateTypingStatus(senderUsername, receiverUsername, isTyping) {
    const typingStatuses = JSON.parse(localStorage.getItem('typingStatuses')) || {};
    const typingKey = `${senderUsername}_${receiverUsername}`;

    typingStatuses[typingKey] = {
        isTyping: isTyping,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('typingStatuses', JSON.stringify(typingStatuses));
}

// Check for typing status
function checkTypingStatus(senderUsername, receiverUsername) {
    const typingStatuses = JSON.parse(localStorage.getItem('typingStatuses')) || {};
    const typingKey = `${senderUsername}_${receiverUsername}`;

    const status = typingStatuses[typingKey];

    if (status && status.isTyping) {
        // Check if status is recent (within last 3 seconds)
        const typingTime = new Date(status.timestamp);
        const currentTime = new Date();
        const timeDiff = (currentTime - typingTime) / 1000; // in seconds

        if (timeDiff < 3) {
            return true;
        }
    }

    return false;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date >= today;
    const isYesterday = date >= yesterday && date < today;

    if (isToday) {
        return `Today at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (isYesterday) {
        return `Yesterday at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
}

// Format time for message timestamps
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Load user's contacts from localStorage with additional information
function loadContacts() {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];
    const userStatuses = JSON.parse(localStorage.getItem('userStatuses')) || {};

    const contactsList = document.getElementById('contactsList');
    contactsList.innerHTML = '';

    if (contacts.length === 0) {
        contactsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No friends added yet</div>';
        return;
    }

    // Get last messages for all contacts
    const contactsWithLastMessage = contacts.map(contact => {
        const chatKey = `chat_${currentUser.username}_${contact.username}`;
        const chatKeyReverse = `chat_${contact.username}_${currentUser.username}`;

        // Check both directions for messages
        let messages = JSON.parse(localStorage.getItem(chatKey)) || [];
        const reverseMessages = JSON.parse(localStorage.getItem(chatKeyReverse)) || [];

        // Combine and sort messages
        messages = [...messages, ...reverseMessages].sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

        // Get online status
        const status = userStatuses[contact.username] || { online: false, lastSeen: null };

        return {
            ...contact,
            lastMessage,
            status
        };
    });

    // Sort contacts by last message time if available
    contactsWithLastMessage.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;

        return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
    });

    contactsWithLastMessage.forEach(contact => {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';

        // Format last seen time
        let lastSeenText = 'Never';
        if (contact.status.lastSeen) {
            lastSeenText = formatDate(contact.status.lastSeen);
        }

        let lastMessageText = 'No messages yet';
        if (contact.lastMessage) {
            lastMessageText = `${contact.lastMessage.sender === currentUser.username ? 'You: ' : ''}${contact.lastMessage.text}`;
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

        contactItem.querySelector('.contact-info').addEventListener('click', () => selectContact(contact));
        contactItem.querySelector('.remove-contact').addEventListener('click', function (e) {
            e.stopPropagation();
            removeContact(contact.username);
        });

        contactsList.appendChild(contactItem);
    });
}

// Update contact statuses
function updateContactStatuses() {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!currentUser) return;

    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];
    const userStatuses = JSON.parse(localStorage.getItem('userStatuses')) || {};

    // Update current user's status
    updateUserStatus(currentUser.username, true);

    // Check if we're in an active chat
    const chatArea = document.getElementById('chatArea');
    const currentContact = chatArea.dataset.currentContact;

    if (currentContact) {
        const contactStatus = userStatuses[currentContact] || { online: false, lastSeen: null };

        // Update the contact's status in the chat header
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

        // Check typing status
        const typingIndicator = document.getElementById('typingIndicator');
        const isTyping = checkTypingStatus(currentContact, currentUser.username);

        typingIndicator.style.display = isTyping ? 'block' : 'none';
    }

    // Refresh the contacts list to show updated statuses
    loadContacts();
}

// Check for new messages
function checkForNewMessages() {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!currentUser) return;

    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];

    // Check if we're in an active chat
    const chatArea = document.getElementById('chatArea');
    const currentContact = chatArea.dataset.currentContact;

    if (currentContact) {
        // We're in an active chat, check for new messages in this chat
        const chatKey = `chat_${currentUser.username}_${currentContact}`;
        const chatKeyReverse = `chat_${currentContact}_${currentUser.username}`;

        let messages = JSON.parse(localStorage.getItem(chatKey)) || [];
        const reverseMessages = JSON.parse(localStorage.getItem(chatKeyReverse)) || [];

        // Combine all messages
        const allMessages = [...messages, ...reverseMessages].sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        // Count current messages in chat area
        const messageElements = chatArea.querySelectorAll('.message');

        // If there are new messages, refresh the chat area
        if (allMessages.length > messageElements.length) {
            displayMessages(currentContact);
        }
    }

    // Refresh contacts to show new message previews
    loadContacts();
}

// Remove a contact
function removeContact(username) {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    let contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];

    contacts = contacts.filter(contact => contact.username !== username);
    localStorage.setItem(`contacts_${currentUser.username}`, JSON.stringify(contacts));

    // Also clear chat history
    localStorage.removeItem(`chat_${currentUser.username}_${username}`);

    loadContacts();

    // If the removed contact was the active chat, reset the chat area
    const chatArea = document.getElementById('chatArea');
    if (chatArea.dataset.currentContact === username) {
        document.getElementById('welcomeMessage').style.display = 'flex';
        document.getElementById('chatArea').style.display = 'none';
        document.getElementById('messageInputArea').style.display = 'none';
        document.getElementById('chatHeader').style.display = 'none';
        document.getElementById('typingIndicator').style.display = 'none';
        chatArea.innerHTML = '';
        chatArea.dataset.currentContact = '';
    }
}

// Load all users for the Add Friend modal
function loadUserList() {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const allUsers = JSON.parse(localStorage.getItem('users')) || [];
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];

    // Filter out current user and already added contacts
    const availableUsers = allUsers.filter(user =>
        user.username !== currentUser.username &&
        !contacts.some(contact => contact.username === user.username)
    );

    displayUserList(availableUsers);
}

// Display filtered users in the modal
function displayUserList(users) {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';

    if (users.length === 0) {
        userList.innerHTML = '<div class="no-users-found">No users found</div>';
        return;
    }

    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
                    <div>
                        <div class="user-item-username">${user.username}</div>
                        <div class="user-item-email">${user.email || 'No email'}</div>
                    </div>
                    <button class="add-user-btn" data-username="${user.username}">Add</button>
                `;

        userItem.querySelector('.add-user-btn').addEventListener('click', function () {
            addContact(user);
        });

        userList.appendChild(userItem);
    });
}

// Filter users based on search input
function filterUsers(searchTerm) {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const allUsers = JSON.parse(localStorage.getItem('users')) || [];
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];

    searchTerm = searchTerm.toLowerCase();

    // Filter users based on search term, excluding current user and existing contacts
    const filteredUsers = allUsers.filter(user =>
        user.username !== currentUser.username &&
        !contacts.some(contact => contact.username === user.username) &&
        (user.username.toLowerCase().includes(searchTerm) ||
            (user.email && user.email.toLowerCase().includes(searchTerm)))
    );

    displayUserList(filteredUsers);
}

// Add a contact
function addContact(user) {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];

    // Check if user is already a contact
    if (!contacts.some(contact => contact.username === user.username)) {
        contacts.push({
            username: user.username,
            email: user.email
        });

        localStorage.setItem(`contacts_${currentUser.username}`, JSON.stringify(contacts));

        // Also add current user as a contact for the added user
        // This makes the friendship bidirectional
        const userContacts = JSON.parse(localStorage.getItem(`contacts_${user.username}`)) || [];

        if (!userContacts.some(contact => contact.username === currentUser.username)) {
            userContacts.push({
                username: currentUser.username,
                email: currentUser.email
            });

            localStorage.setItem(`contacts_${user.username}`, JSON.stringify(userContacts));
        }

        // Close modal and reload contacts
        document.getElementById('addFriendModal').style.display = 'none';
        loadContacts();
    }
}

// Display messages for a conversation
function displayMessages(contactUsername) {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const chatKey = `chat_${currentUser.username}_${contactUsername}`;
    const chatKeyReverse = `chat_${contactUsername}_${currentUser.username}`;

    // Get messages from both directions
    let messages = JSON.parse(localStorage.getItem(chatKey)) || [];
    const reverseMessages = JSON.parse(localStorage.getItem(chatKeyReverse)) || [];

    // Combine and sort messages by timestamp
    const allMessages = [...messages, ...reverseMessages].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });

    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '';

    if (allMessages.length === 0) {
        chatArea.innerHTML = `<div class="message received">Start a conversation with ${contactUsername}...</div>`;
    } else {
        let lastDate = null;

        allMessages.forEach(msg => {
            // Check if we need to add a date separator
            const msgDate = new Date(msg.timestamp);
            const msgDateStr = msgDate.toDateString();

            if (!lastDate || msgDateStr !== lastDate) {
                // Add date separator
                const dateSeparator = document.createElement('div');
                dateSeparator.style.textAlign = 'center';
                dateSeparator.style.margin = '10px 0';
                dateSeparator.style.fontSize = '12px';
                dateSeparator.style.color = '#888';
                dateSeparator.textContent = formatDate(msg.timestamp).split(' at')[0]; // Just the date part
                chatArea.appendChild(dateSeparator);
                lastDate = msgDateStr;
            }

            const messageElement = document.createElement('div');
            messageElement.className = `message ${msg.sender === currentUser.username ? 'sent' : 'received'}`;

            // Message content
            const messageContent = document.createElement('div');
            messageContent.textContent = msg.text;
            messageElement.appendChild(messageContent);

            // Message time
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = formatMessageTime(msg.timestamp);
            messageElement.appendChild(messageTime);

            // Message status (for sent messages)
            if (msg.sender === currentUser.username) {
                const messageStatus = document.createElement('div');
                messageStatus.className = 'message-status';
                messageStatus.textContent = msg.read ? 'Read' : 'Sent';
                messageElement.appendChild(messageStatus);
            } else {
                // Mark received messages as read
                markMessageAsRead(contactUsername, msg.timestamp);
            }

            chatArea.appendChild(messageElement);
        });
    }

    // Auto scroll to the bottom
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Mark a message as read
function markMessageAsRead(senderUsername, timestamp) {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const chatKey = `chat_${senderUsername}_${currentUser.username}`;
    const messages = JSON.parse(localStorage.getItem(chatKey)) || [];

    // Find the message and mark it as read
    let updated = false;
    messages.forEach(msg => {
        if (msg.timestamp === timestamp && !msg.read) {
            msg.read = true;
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem(chatKey, JSON.stringify(messages));
    }
}

// Select a contact to chat with
function selectContact(contact) {
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('chatArea').style.display = 'flex';
    document.getElementById('chatArea').style.flexDirection = 'column';
    document.getElementById('messageInputArea').style.display = 'flex';
    document.getElementById('chatHeader').style.display = 'flex';

    // Set contact name and status in header
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

    // Display messages
    displayMessages(contact.username);

    // Store the current contact for sending messages
    const chatArea = document.getElementById('chatArea');
    chatArea.dataset.currentContact = contact.username;

    // Auto scroll to the bottom
    chatArea.scrollTop = chatArea.scrollHeight;

    // Hide typing indicator initially
    document.getElementById('typingIndicator').style.display = 'none';
}

// Send a message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    const chatArea = document.getElementById('chatArea');
    const contactUsername = chatArea.dataset.currentContact;

    if (!contactUsername) {
        alert('Please select a contact first');
        return;
    }

    if (message) {
        const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const chatKey = `chat_${currentUser.username}_${contactUsername}`;
        const messages = JSON.parse(localStorage.getItem(chatKey)) || [];

        // Create new message object
        const newMessage = {
            sender: currentUser.username,
            receiver: contactUsername,
            text: message,
            timestamp: new Date().toISOString(),
            read: false
        };

        // Add message to chat area
        const messageElement = document.createElement('div');
        messageElement.className = 'message sent';

        // Message content
        const messageContent = document.createElement('div');
        messageContent.textContent = message;
        messageElement.appendChild(messageContent);

        // Message time
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = formatMessageTime(newMessage.timestamp);
        messageElement.appendChild(messageTime);

        // Message status
        const messageStatus = document.createElement('div');
        messageStatus.className = 'message-status';
        messageStatus.textContent = 'Sent';
        messageElement.appendChild(messageStatus);

        chatArea.appendChild(messageElement);
        messageInput.value = '';

        // Save message to localStorage
        messages.push(newMessage);
        localStorage.setItem(chatKey, JSON.stringify(messages));

        // Auto scroll to the bottom
        chatArea.scrollTop = chatArea.scrollHeight;

        // Clear typing status
        updateTypingStatus(currentUser.username, contactUsername, false);
    }
}

// Logout function
function logout() {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));

    // Update user's online status to offline
    if (currentUser) {
        updateUserStatus(currentUser.username, false);
    }

    localStorage.removeItem('loggedInUser');
    window.location.href = './login.html'; // Redirect to login page
}