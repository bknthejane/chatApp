// Function to send a message either to a contact or a group chat
function sendMessage() {
    // Get the input element where the user types the message
    const messageInput = document.getElementById('messageInput');
    // Get the trimmed message text
    const message = messageInput.value.trim();
    // Get the chat display area element
    const chatArea = document.getElementById('chatArea');
    // Get the username of the currently selected contact or group from the chat area data attribute
    const contactUsername = chatArea.dataset.currentContact;
    // Determine if the chat is a group chat (string 'true' converted to boolean)
    const isGroup = chatArea.dataset.isGroup === 'true';
    // Get the current logged-in user info from sessionStorage
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    // If no contact is selected, alert the user and stop
    if (!contactUsername) {
        alert('Please select a contact first');
        return;
    }

    // If message is empty, do nothing
    if (!message) return;

    if (isGroup) {
        // For group chat, prepare a unique localStorage key for this group
        const groupChatKey = `group_chat_${contactUsername}`;
        // Get existing group messages or start with an empty array
        const messages = JSON.parse(localStorage.getItem(groupChatKey)) || [];
        // Create a new message object with sender, text, and timestamp
        const newMessage = {
            sender: currentUser.username,
            text: message,
            timestamp: new Date().toISOString()
        };
        // Add the new message to the array
        messages.push(newMessage);
        // Save the updated messages back to localStorage
        localStorage.setItem(groupChatKey, JSON.stringify(messages));
        // Update the UI to show the latest group messages
        displayGroupMessages(contactUsername);
    } else {
        // For one-on-one chat, prepare a unique localStorage key based on usernames
        const chatKey = `chat_${currentUser.username}_${contactUsername}`;
        // Get existing messages or start with empty array
        const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
        // Create a new message object with sender, receiver, text, timestamp, and read status
        const newMessage = {
            sender: currentUser.username,
            receiver: contactUsername,
            text: message,
            timestamp: new Date().toISOString(),
            read: false
        };
        // Add the new message
        messages.push(newMessage);
        // Save updated messages to localStorage
        localStorage.setItem(chatKey, JSON.stringify(messages));
        // Update the UI with the latest messages
        displayMessages(contactUsername);
    }

    // Clear the input box after sending the message
    messageInput.value = '';
    // Update typing status to false (user stopped typing)
    updateTypingStatus(currentUser.username, contactUsername, false);
    // Scroll chat to the bottom to show the newest message
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Function to display one-on-one chat messages with a contact
function displayMessages(contactUsername) {
    // Get current logged-in user
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    // Construct keys for both directions of conversation
    const chatKey = `chat_${currentUser.username}_${contactUsername}`;
    const chatKeyReverse = `chat_${contactUsername}_${currentUser.username}`;
    // Get messages sent by current user and by contact
    let messages = JSON.parse(localStorage.getItem(chatKey)) || [];
    const reverseMessages = JSON.parse(localStorage.getItem(chatKeyReverse)) || [];
    // Combine both sets of messages and sort chronologically by timestamp
    const allMessages = [...messages, ...reverseMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Get chat area element
    const chatArea = document.getElementById('chatArea');
    // Clear existing messages from UI
    chatArea.innerHTML = '';

    if (allMessages.length === 0) {
        // If no messages exist, show a prompt to start conversation
        chatArea.innerHTML = `<div class="message received">Start a conversation with ${contactUsername}...</div>`;
    } else {
        let lastDate = null;
        allMessages.forEach(msg => {
            const msgDate = new Date(msg.timestamp);
            const msgDateStr = msgDate.toDateString();

            // Add a date separator if the message date differs from the last message date
            if (!lastDate || msgDateStr !== lastDate) {
                const dateSeparator = document.createElement('div');
                dateSeparator.style.textAlign = 'center';
                dateSeparator.style.margin = '10px 0';
                dateSeparator.style.fontSize = '12px';
                dateSeparator.style.color = '#888';
                dateSeparator.textContent = formatDate(msg.timestamp).split(' at')[0]; // Show only date part
                chatArea.appendChild(dateSeparator);
                lastDate = msgDateStr;
            }

            // Create message container div with different styles for sent vs received messages
            const messageElement = document.createElement('div');
            messageElement.className = `message ${msg.sender === currentUser.username ? 'sent' : 'received'}`;

            // Create and append message text content
            const messageContent = document.createElement('div');
            messageContent.textContent = msg.text;
            messageElement.appendChild(messageContent);

            // Create and append message timestamp
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = formatMessageTime(msg.timestamp);
            messageElement.appendChild(messageTime);

            if (msg.sender === currentUser.username) {
                // For sent messages, show status (Read or Sent)
                const messageStatus = document.createElement('div');
                messageStatus.className = 'message-status';
                messageStatus.textContent = msg.read ? 'Read' : 'Sent';
                messageElement.appendChild(messageStatus);
            } else {
                // For received messages, mark as read
                markMessageAsRead(contactUsername, msg.timestamp);
            }

            // Append the message to the chat area
            chatArea.appendChild(messageElement);
        });
    }
    // Scroll to bottom after rendering messages
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Function to display group chat messages
function displayGroupMessages(groupId) {
    // Get current user
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    // Get the group chat messages key
    const groupChatKey = `group_chat_${groupId}`;
    // Retrieve group messages or start with empty array
    const messages = JSON.parse(localStorage.getItem(groupChatKey)) || [];
    // Get chat area element and clear it
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '';

    if (messages.length === 0) {
        // If no messages, show system message indicating empty group
        chatArea.innerHTML = `<div class="message system">No messages in this group yet</div>`;
    } else {
        let lastDate = null;
        messages.forEach(msg => {
            const msgDate = new Date(msg.timestamp);
            const msgDateStr = msgDate.toDateString();

            // Insert date separator if needed
            if (!lastDate || msgDateStr !== lastDate) {
                const dateSeparator = document.createElement('div');
                dateSeparator.style.textAlign = 'center';
                dateSeparator.style.margin = '10px 0';
                dateSeparator.style.fontSize = '12px';
                dateSeparator.style.color = '#888';
                dateSeparator.textContent = formatDate(msg.timestamp).split(' at')[0];
                chatArea.appendChild(dateSeparator);
                lastDate = msgDateStr;
            }

            if (msg.isSystem) {
                // System messages (e.g. notifications) have a distinct style
                const messageElement = document.createElement('div');
                messageElement.className = 'message system';
                messageElement.textContent = msg.text;
                chatArea.appendChild(messageElement);
            } else {
                // Regular user messages in group chat
                const messageElement = document.createElement('div');
                messageElement.className = `message ${msg.sender === currentUser.username ? 'sent' : 'received'}`;

                if (msg.sender !== currentUser.username) {
                    // For received messages, show sender's name
                    const messageSender = document.createElement('div');
                    messageSender.className = 'message-sender';
                    messageSender.textContent = msg.sender;
                    messageElement.appendChild(messageSender);
                }

                // Append message text
                const messageContent = document.createElement('div');
                messageContent.textContent = msg.text;
                messageElement.appendChild(messageContent);

                // Append message timestamp
                const messageTime = document.createElement('div');
                messageTime.className = 'message-time';
                messageTime.textContent = formatMessageTime(msg.timestamp);
                messageElement.appendChild(messageTime);

                // Append the message to chat area
                chatArea.appendChild(messageElement);
            }
        });
    }
    // Scroll chat to bottom after loading messages
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Function to mark a message as read for one-on-one chats
function markMessageAsRead(senderUsername, timestamp) {
    // Get current logged-in user
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    // Construct chat key for messages from sender to current user
    const chatKey = `chat_${senderUsername}_${currentUser.username}`;
    // Get messages or empty array
    const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
    let updated = false;

    // Find the message matching the timestamp and mark it as read if not already
    messages.forEach(msg => {
        if (msg.timestamp === timestamp && !msg.read) {
            msg.read = true;
            updated = true;
        }
    });

    // Save back to localStorage only if something was updated
    if (updated) {
        localStorage.setItem(chatKey, JSON.stringify(messages));
    }
}

// Function to check periodically for new messages and update the chat display if needed
function checkForNewMessages() {
    // Get current user info
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!currentUser) return;

    // Get chat area and current contact/group info
    const chatArea = document.getElementById('chatArea');
    const currentContact = chatArea.dataset.currentContact;
    const isGroup = chatArea.dataset.isGroup === 'true';

    if (currentContact) {
        let allMessages = [];
        if (isGroup) {
            // For group chats, get group messages
            const groupChatKey = `group_chat_${currentContact}`;
            allMessages = JSON.parse(localStorage.getItem(groupChatKey)) || [];
        } else {
            // For 1:1 chats, get messages from both sides
            const chatKey = `chat_${currentUser.username}_${currentContact}`;
            const chatKeyReverse = `chat_${currentContact}_${currentUser.username}`;
            let messages = JSON.parse(localStorage.getItem(chatKey)) || [];
            const reverseMessages = JSON.parse(localStorage.getItem(chatKeyReverse)) || [];
            allMessages = [...messages, ...reverseMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        // Get how many messages are currently displayed
        const messageElements = chatArea.querySelectorAll('.message');
        // If there are more messages than currently displayed, update the chat display
        if (allMessages.length > messageElements.length) {
            if (isGroup) {
                displayGroupMessages(currentContact);
            } else {
                displayMessages(currentContact);
            }
        }
    }
    // Refresh contacts list (to update statuses, new messages, etc.)
    loadContacts();
}
