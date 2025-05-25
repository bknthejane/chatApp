/* updateUserStatus()

  Updates the online status and last seen timestamp of a user in localStorage.
 
  Parameters:
  - username: the username of the user whose status is being updated.
  - isOnline: boolean indicating whether the user is currently online.
 
  Steps:
  1. Retrieve the current `userStatuses` object from localStorage or initialize an empty one.
  2. Update the entry for the given username with:
     - `online`: current online status.
     - `lastSeen`: current timestamp in ISO format.
  3. Save the updated object back to localStorage.*/

const updateUserStatus = (username, isOnline) => {
    const userStatuses = JSON.parse(localStorage.getItem('userStatuses')) || {};
    userStatuses[username] = {
        online: isOnline,
        lastSeen: new Date().toISOString()
    };
    localStorage.setItem('userStatuses', JSON.stringify(userStatuses));
};

/* updateTypingStatus()

  Updates the typing status of a sender to a specific receiver in localStorage.
 
  Parameters:
  - senderUsername: the username of the user who is typing.
  - receiverUsername: the intended recipient of the message.
  - isTyping: boolean indicating if the sender is currently typing.
 
  Steps:
  1. Retrieve the current `typingStatuses` object from sessionStorage or initialize an empty one.
  2. Construct a unique key based on sender and receiver usernames.
  3. Update the status for this key with:
     - `isTyping`: current typing status.
     - `timestamp`: time of last typing activity.
  4. Save the updated statuses to localStorage. */

const updateTypingStatus = (senderUsername, receiverUsername, isTyping) => {
    const typingStatuses = JSON.parse(sessionStorage.getItem('typingStatuses')) || {};
    const typingKey = `${senderUsername}_${receiverUsername}`;
    typingStatuses[typingKey] = {
        isTyping: isTyping,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('typingStatuses', JSON.stringify(typingStatuses));
};

/* checkTypingStatus()

  Checks if a sender is currently typing a message to a receiver.
 
  Parameters:
  - senderUsername: the username of the sender.
  - receiverUsername: the intended recipient of the message.
 
  Returns:
  - true if the sender is typing within the last 3 seconds, otherwise false.
 
  Steps:
  1. Retrieve typing statuses from localStorage.
  2. Construct a key using the sender and receiver usernames.
  3. If a typing entry exists and isTyping is true:
     - Compare the timestamp to the current time.
     - Return true if the difference is less than 3 seconds.
  4. Return false if no recent typing activity is found. */

const checkTypingStatus = (senderUsername, receiverUsername) => {
    const typingStatuses = JSON.parse(localStorage.getItem('typingStatuses')) || {};
    const typingKey = `${senderUsername}_${receiverUsername}`;
    const status = typingStatuses[typingKey];
    if (status && status.isTyping) {
        const typingTime = new Date(status.timestamp);
        const currentTime = new Date();
        const timeDiff = (currentTime - typingTime) / 1000;
        return timeDiff < 3;
    }
    return false;
};

/* formatDate()

  Converts a date string into a human-readable format for display.
 
  Parameters:
  - dateString: the input date string to format.
 
  Returns:
  - A formatted string depending on how recent the date is:
    - "Today at HH:MM" if from today.
    - "Yesterday at HH:MM" if from yesterday.
    - "DD/MM/YYYY HH:MM" for older dates.
 
  Steps:
  1. Parse the input date and current date.
  2. Calculate today and yesterday's boundaries at midnight.
  3. Compare input date to determine if it's today, yesterday, or older.
  4. Return appropriate formatted string. */

const formatDate = (dateString) => {
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
};

/* formatMessageTime()

  Converts a date string into a simple HH:MM time format for chat messages.
 
  Parameters:
  - dateString: the input date string to format.
 
  Returns:
  - A string representing only the hour and minute in "HH:MM" format.
 
  Steps:
  1. Parse the input date.
  2. Return the time portion formatted with leading zeros. */
  
const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};
