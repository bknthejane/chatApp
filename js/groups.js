// Loads the current user's friends (contacts) for selection when creating a group
function loadFriendsForGroup() {
    // Get the logged-in user info from localStorage
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    // Retrieve the user's contacts from localStorage or default to empty array
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];
    // Get the container element where the friends will be displayed
    const groupFriendsList = document.getElementById('groupFriendsList');

    // Clear any existing content
    groupFriendsList.innerHTML = '';

    // If no contacts exist, show a message and exit
    if (contacts.length === 0) {
        groupFriendsList.innerHTML = '<div class="no-friends-found">You need to add friends first</div>';
        return;
    }

    // Create a checkbox item for each contact to allow selection for the group
    contacts.forEach(contact => {
        const friendItem = document.createElement('div');
        friendItem.className = 'friend-item';
        friendItem.innerHTML = `
            <div class="friend-info">
                <input type="checkbox" id="friend-${contact.username}" class="friend-checkbox" data-username="${contact.username}">
                <label for="friend-${contact.username}">${contact.username}</label>
            </div>
        `;
        groupFriendsList.appendChild(friendItem);
    });
}

// Creates a new group chat with the selected friends and group name
function createGroup() {
    // Get the logged-in user info
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    // Get the group name entered by the user and trim whitespace
    const groupName = document.getElementById('groupNameInput').value.trim();
    // Get usernames of selected friends via checked checkboxes
    const selectedFriends = Array.from(document.querySelectorAll('.friend-checkbox:checked')).map(checkbox => checkbox.dataset.username);

    // Validate that a group name is entered
    if (!groupName) {
        alert('Please enter a group name');
        return;
    }

    // Validate that at least one friend is selected
    if (selectedFriends.length === 0) {
        alert('Please select at least one friend for your group');
        return;
    }

    // Generate a unique group ID based on current timestamp
    const groupId = 'group_' + Date.now();
    // Create an array of group members, including the current user
    const groupMembers = [currentUser.username, ...selectedFriends];
    // Create the new group object with details
    const newGroup = {
        id: groupId,
        name: groupName,
        creator: currentUser.username,
        members: groupMembers,
        createdAt: new Date().toISOString()
    };

    // Retrieve the current user's groups, or empty array if none exist
    const userGroups = JSON.parse(localStorage.getItem(`groups_${currentUser.username}`)) || [];
    // Add the new group to the current user's groups and save to localStorage
    userGroups.push(newGroup);
    localStorage.setItem(`groups_${currentUser.username}`, JSON.stringify(userGroups));

    // Add the new group to each selected friend's groups as well
    selectedFriends.forEach(friend => {
        const friendGroups = JSON.parse(localStorage.getItem(`groups_${friend}`)) || [];
        friendGroups.push(newGroup);
        localStorage.setItem(`groups_${friend}`, JSON.stringify(friendGroups));
    });

    // Initialize the group chat with a system message announcing the group's creation
    const groupChatKey = `group_chat_${groupId}`;
    const initialMessage = {
        sender: 'System',
        text: `Group "${groupName}" created by ${currentUser.username}`,
        timestamp: new Date().toISOString(),
        isSystem: true
    };
    localStorage.setItem(groupChatKey, JSON.stringify([initialMessage]));

    // Close the create group modal and reset input
    document.getElementById('createGroupModal').style.display = 'none';
    document.getElementById('groupNameInput').value = '';
    // Reload the contacts list to reflect the new group
    loadContacts();
}

// Allows the current user to leave a group
function leaveGroup(groupId) {
    // Get the logged-in user info
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Retrieve the current user's groups
    let groups = JSON.parse(localStorage.getItem(`groups_${currentUser.username}`)) || [];
    // Find the index of the group to leave
    const groupIndex = groups.findIndex(group => group.id === groupId);

    if (groupIndex !== -1) {
        // Get the group object
        const group = groups[groupIndex];
        // Remove current user from the group's members list
        const updatedMembers = group.members.filter(member => member !== currentUser.username);

        if (updatedMembers.length > 0) {
            // Update all other members' groups data to reflect the new member list
            updatedMembers.forEach(member => {
                const memberGroups = JSON.parse(localStorage.getItem(`groups_${member}`)) || [];
                const memberGroupIndex = memberGroups.findIndex(g => g.id === groupId);
                if (memberGroupIndex !== -1) {
                    // Update the members array in the member's copy of the group
                    memberGroups[memberGroupIndex].members = updatedMembers;
                    localStorage.setItem(`groups_${member}`, JSON.stringify(memberGroups));
                }
            });

            // Add a system message in the group chat indicating the user has left
            const groupChatKey = `group_chat_${groupId}`;
            const groupMessages = JSON.parse(localStorage.getItem(groupChatKey)) || [];
            groupMessages.push({
                sender: 'System',
                text: `${currentUser.username} has left the group`,
                timestamp: new Date().toISOString(),
                isSystem: true
            });
            localStorage.setItem(groupChatKey, JSON.stringify(groupMessages));
        }
    }

    // Remove the group from the current user's group list entirely
    groups = groups.filter(group => group.id !== groupId);
    localStorage.setItem(`groups_${currentUser.username}`, JSON.stringify(groups));
    // Reload contacts list to reflect changes
    loadContacts();

    // If the current chat area is showing this group, reset the chat area
    const chatArea = document.getElementById('chatArea');
    if (chatArea.dataset.currentContact === groupId && chatArea.dataset.isGroup === 'true') {
        resetChatArea();
    }
}
