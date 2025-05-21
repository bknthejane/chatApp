// Update the online status and last seen timestamp of a user in localStorage
function updateUserStatus(username, isOnline) {
    // Retrieve current user statuses or initialize an empty object
    const userStatuses = JSON.parse(localStorage.getItem('userStatuses')) || {};
    
    // Update the status for the given username
    userStatuses[username] = {
        online: isOnline, // true if user is online, false otherwise
        lastSeen: new Date().toISOString() // current timestamp in ISO format
    };
    
    // Save the updated statuses back to localStorage
    localStorage.setItem('userStatuses', JSON.stringify(userStatuses));
}

// Update the typing status between sender and receiver in localStorage
function updateTypingStatus(senderUsername, receiverUsername, isTyping) {
    // Retrieve current typing statuses or initialize an empty object
    const typingStatuses = JSON.parse(sessionStorage.getItem('typingStatuses')) || {};
    
    // Create a unique key for the typing status between sender and receiver
    const typingKey = `${senderUsername}_${receiverUsername}`;
    
    // Update the typing status with current flag and timestamp
    typingStatuses[typingKey] = {
        isTyping: isTyping, // true if sender is currently typing
        timestamp: new Date().toISOString() // timestamp of last typing activity
    };
    
    // Save the updated typing statuses back to localStorage
    localStorage.setItem('typingStatuses', JSON.stringify(typingStatuses));
}

// Check if a sender is currently typing to a receiver (returns boolean)
function checkTypingStatus(senderUsername, receiverUsername) {
    // Retrieve typing statuses from localStorage
    const typingStatuses = JSON.parse(localStorage.getItem('typingStatuses')) || {};
    
    // Construct the unique key for this typing status
    const typingKey = `${senderUsername}_${receiverUsername}`;
    const status = typingStatuses[typingKey];
    
    // If typing status exists and sender is typing
    if (status && status.isTyping) {
        const typingTime = new Date(status.timestamp);
        const currentTime = new Date();
        
        // Calculate the difference in seconds between now and last typing timestamp
        const timeDiff = (currentTime - typingTime) / 1000;
        
        // Consider sender as typing only if last typing was less than 3 seconds ago
        return timeDiff < 3;
    }
    
    // Otherwise, sender is not typing
    return false;
}

// Format a date string into a user-friendly display string
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    
    // Define today and yesterday at midnight for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date >= today;
    const isYesterday = date >= yesterday && date < today;
    
    // Format based on whether the date is today, yesterday, or older
    if (isToday) {
        // Return time as "Today at HH:MM"
        return `Today at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (isYesterday) {
        // Return time as "Yesterday at HH:MM"
        return `Yesterday at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
        // Return full date and time as "DD/MM/YYYY HH:MM"
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
}

// Format a date string to show only the time in HH:MM format
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}
