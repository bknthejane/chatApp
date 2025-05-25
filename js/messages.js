/* sendMessage()
  Sends a chat message either to a selected contact (one-on-one chat) or a group chat.
 
  Steps:
  1. Retrieve the message input from the user and trim whitespace.
  2. Identify the current chat target (contact or group) and check if it is a group chat.
  3. Get the currently logged-in user's info from sessionStorage.
  4. Validate that a contact/group is selected and the message is not empty.
  5. If it's a group chat:
     - Use a unique localStorage key for that group's messages.
     - Retrieve existing messages, add the new message with sender and timestamp.
     - Save updated messages and refresh the group chat UI.
  6. If it's a one-on-one chat:
     - Use a unique localStorage key based on both usernames.
     - Retrieve existing messages, add the new message with sender, receiver, timestamp, and read status.
     - Save updated messages and refresh the individual chat UI.
  7. Clear the message input box, update typing status, and scroll the chat area to show the new message. */

const sendMessage = () => {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    const chatArea = document.getElementById('chatArea');

    const contactUsername = chatArea.dataset.currentContact;

    const isGroup = chatArea.dataset.isGroup === 'true';

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

/* displayMessages()
  Displays one-on-one chat messages between the logged-in user and a selected contact.
 
  Steps:
  1. Retrieve messages stored in localStorage for both directions (user->contact and contact->user).
  2. Merge and sort messages chronologically.
  3. Clear the chat display area.
  4. If no messages exist, show a prompt to start the conversation.
  5. Otherwise, iterate through messages:
     - Insert date separators when the date changes between messages.
     - Render each message differently if sent or received.
     - For sent messages, show read status.
     - For received messages, mark them as read.
  6. Scroll the chat area to the bottom. */

const displayMessages = (contactUsername) => {
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
        for (let i = 0; i < allMessages.length; i++) {
            const msg = allMessages[i];
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
        }

    }
    // Scroll to bottom after rendering messages
    chatArea.scrollTop = chatArea.scrollHeight;
}

/* displayGroupMessages()
  Displays messages in a group chat.
 
  Steps:
  1. Retrieve all group messages from localStorage.
  2. Clear the chat display area.
  3. If no messages, show a system message indicating the group is empty.
  4. Otherwise, iterate through messages:
     - Insert date separators between days.
     - Display system messages with distinct styling.
     - Display user messages with sender name (if not current user).
     - Show message text and timestamp.
  5. Scroll the chat area to the bottom. */  

const displayGroupMessages = (groupId) => {
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
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
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
        }

    }
    // Scroll chat to bottom after loading messages
    chatArea.scrollTop = chatArea.scrollHeight;
}

/* markMessageAsRead()
  Marks a specific one-on-one chat message as read.
 
  Parameters:
  - senderUsername: the username of the sender of the message.
  - timestamp: the timestamp of the message to identify it uniquely.
 
  Steps:
  1. Retrieve messages sent by the sender to the current user.
  2. Find the message matching the timestamp and update its read status if not already read.
  3. Save the updated messages back to localStorage. */

const markMessageAsRead = (senderUsername, timestamp) => {
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const chatKey = `chat_${senderUsername}_${currentUser.username}`;

    const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
    let updated = false;

    // Find the message matching the timestamp and mark it as read if not already
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.timestamp === timestamp && !msg.read) {
            msg.read = true;
            updated = true;
        }
    }


    // Save back to localStorage only if something was updated
    if (updated) {
        localStorage.setItem(chatKey, JSON.stringify(messages));
    }
}

/* checkForNewMessages()
  Periodically checks for new messages in the currently open chat (one-on-one or group).
  If new messages are found (more than currently displayed), updates the chat display accordingly.
  Also triggers a refresh of the contacts list to update statuses or new message notifications. */

const checkForNewMessages = () => {
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
