// Function to toggle the user menu on the Home page
function toggleUserMenu(user) {
    const existingMenu = document.getElementById('user-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const userMenu = document.createElement('div');
    userMenu.id = 'user-menu';
    
    userMenu.innerHTML = `
        <div>${user.username}</div>
        <div>${user.email}</div>
        <hr>
        <div onclick="navigateToProfile()">Profile</div>
        <div onclick="logout()">Logout</div>
    `;
    
    document.body.appendChild(userMenu);
    
    // Close the menu when clicking outside of it
    document.addEventListener('click', function closeMenu(e) {
        if (!userMenu.contains(e.target) && e.target !== document.querySelector('.nav-right .btn-secondary')) {
            userMenu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Navigation functions for the user menu
function navigateToProfile() {
    // Adjust the destination as needed
    window.location.href = '../../../../pages/page5/index.html';
}

function logout() {
    localStorage.removeItem('currentUser');
    // Optionally, redirect to the login page
    window.location.href = '../../../../index.html';
}

// Function to update the header for a logged-in user
function updateHeaderForLoggedInUser(user) {
    const navRight = document.querySelector('.nav-right');
    navRight.innerHTML = ''; // Clear default buttons

    // Create "Post" button
    const postButton = document.createElement('button');
    postButton.className = 'btn btn-primary';
    postButton.textContent = 'Post';
    postButton.onclick = function() {
        // Navigate to your post creation page (adjust the URL as needed)
        window.location.href = '../../../../pages/page4/index.html';
    };

    // Create user icon button with click event to toggle the user menu
    const userButton = document.createElement('button');
    userButton.className = 'btn btn-secondary';
    userButton.innerHTML = '<i class="fas fa-user"></i>';
    userButton.onclick = function(e) {
        // Stop event propagation to avoid closing the menu immediately
        e.stopPropagation();
        toggleUserMenu(user);
    };

    navRight.appendChild(postButton);
    navRight.appendChild(userButton);
}

// Check if a user is logged in and update the header accordingly
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (currentUser) {
    updateHeaderForLoggedInUser(currentUser);
}

// Function to format date to Month Day, Year format (e.g., April 3, 2025)
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Function to load the profile information
function loadProfileInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        // Get the profile info elements
        const profileName = document.querySelector('.profile-info h1');
        const profileJoinDate = document.querySelector('.profile-info p');
        
        // Update the username
        if (profileName) {
            profileName.textContent = currentUser.username;
        }
        
        // Update the join date
        if (profileJoinDate) {
            if (currentUser.createdAt) {
                // Use the stored creation date
                const joinDate = new Date(currentUser.createdAt);
                const formattedDate = formatDate(joinDate);
                profileJoinDate.innerHTML = `📅 Joined ${formattedDate}`;
            } else {
                // If no createdAt date is available, use current date
                const currentDate = new Date();
                const formattedDate = formatDate(currentDate);
                profileJoinDate.innerHTML = `📅 Joined ${formattedDate}`;
                
                // Store the current date as createdAt for future reference
                currentUser.createdAt = currentDate.toISOString();
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
        }
    } else {
        // If not logged in, redirect to login page
        window.location.href = '../../../../pages/page2/index.html';
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadProfileInfo();
    
    // Check if a user is logged in and update the header accordingly
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        updateHeaderForLoggedInUser(currentUser);
    }
});