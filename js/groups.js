/* loadFriendsForGroup()

  - Retrieves the currently logged-in user from sessionStorage.
  - Loads the user's contacts from localStorage, defaulting to an empty array if none exist.
  - Clears the display container for group friends.
  - If no contacts are found, displays a message prompting the user to add friends.
  - Otherwise, creates a list of checkbox inputs for each contact to allow selecting friends for a group. */

const loadFriendsForGroup = () => {
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const contacts = JSON.parse(localStorage.getItem(`contacts_${currentUser.username}`)) || [];
    // Get the container element where the friends will be displayed
    const groupFriendsList = document.getElementById('groupFriendsList');

    groupFriendsList.innerHTML = '';

    // If no contacts exist, show a message and exit
    if (contacts.length === 0) {
        groupFriendsList.innerHTML = '<div class="no-friends-found">You need to add friends first</div>';
        return;
    }

    // Create a checkbox item for each contact to allow selection for the group
    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const friendItem = document.createElement('div');
        friendItem.className = 'friend-item';
        friendItem.innerHTML = `
        <div class="friend-info">
            <input type="checkbox" id="friend-${contact.username}" class="friend-checkbox" data-username="${contact.username}">
            <label for="friend-${contact.username}">${contact.username}</label>
        </div>
    `;
        groupFriendsList.appendChild(friendItem);
    }

}

/* createGroup()

  - Retrieves the logged-in user info.
  - Gets the group name input by the user, trimming whitespace.
  - Collects the usernames of friends selected via checked checkboxes.
  - Validates that a group name is entered and at least one friend is selected.
  - Generates a unique group ID.
  - Creates a new group object with an ID, name, creator, members (including current user), and creation timestamp.
  - Adds the new group to the current user's groups in localStorage.
  - Adds the new group to each selected friend's groups in localStorage.
  - Initializes a group chat with a system message announcing the group's creation.
  - Closes the create group modal, resets the input, and reloads contacts to reflect the new group. */

const createGroup = () => {
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const groupName = document.getElementById('groupNameInput').value.trim();
    // Get usernames of selected friends via checked checkboxes
    const checkedCheckboxes = document.querySelectorAll('.friend-checkbox:checked');
    const selectedFriends = [];

    for (let i = 0; i < checkedCheckboxes.length; i++) {
        selectedFriends.push(checkedCheckboxes[i].dataset.username);
    }

    if (!groupName) {
        alert('Please enter a group name');
        return;
    }

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
    for (let i = 0; i < selectedFriends.length; i++) {
        const friend = selectedFriends[i];
        const friendGroups = JSON.parse(localStorage.getItem(`groups_${friend}`)) || [];
        friendGroups.push(newGroup);
        localStorage.setItem(`groups_${friend}`, JSON.stringify(friendGroups));
    }


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

    loadContacts();
}

/* leaveGroup()

  - Retrieves the logged-in user info.
  - Gets the user's groups from localStorage and finds the group to leave.
  - Removes the current user from the group's members list.
  - If there are remaining members:
    - Updates all other members' stored groups to reflect the updated member list.
    - Adds a system message to the group's chat indicating the user has left.
  - Removes the group from the current user's groups entirely.
  - Saves the updated groups back to localStorage.
  - Reloads the contacts list to reflect changes.
  - If the user is currently viewing this group's chat, resets the chat area. */

const leaveGroup = (groupId) => {
    // Get the logged-in user info
    const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
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
            for (let i = 0; i < updatedMembers.length; i++) {
                const member = updatedMembers[i];
                const memberGroups = JSON.parse(localStorage.getItem(`groups_${member}`)) || [];
                const memberGroupIndex = memberGroups.findIndex(g => g.id === groupId);
                if (memberGroupIndex !== -1) {
                    // Update the members array in the member's copy of the group
                    memberGroups[memberGroupIndex].members = updatedMembers;
                    localStorage.setItem(`groups_${member}`, JSON.stringify(memberGroups));
                }
            }

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
