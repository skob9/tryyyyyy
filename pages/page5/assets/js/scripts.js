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
    window.location.href = '././index.html';
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
        window.location.href = '../../pages/page4/index.html';
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

    const username = document.getElementById('username');
const usernameInput = document.getElementById('username-input');
const editBtn = document.getElementById('edit-btn');
const saveBtn = document.getElementById('save-btn');

// Edit button click event
editBtn.addEventListener('click', function() {
    username.style.display = 'none';
    usernameInput.style.display = 'block';
    usernameInput.value = username.textContent;
    editBtn.style.display = 'none';
    saveBtn.style.display = 'block';
    usernameInput.focus();
});

// Save button click event
saveBtn.addEventListener('click', function() {
    const newUsername = usernameInput.value.trim();
    if (newUsername) {
        username.textContent = newUsername;
    }
    username.style.display = 'block';
    usernameInput.style.display = 'none';
    editBtn.style.display = 'block';
    saveBtn.style.display = 'none';
    
    // You could add an API call here to save the username to a database
    const users = JSON.parse(localStorage.getItem('currentUser'));
    users.username = newUsername;
    localStorage.setItem('currentUser', JSON.stringify(users));
    updateUserDatabase(users.id, newUsername);
});

// Also save when pressing Enter key
usernameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        saveBtn.click();
    }
});
});

async function updateUserDatabase (id,name){
    try {
        const response = await fetch('https://demo-api-skills.vercel.app/api/DIYHomes/users/'+id , {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name
          })
        });
  
        const data = await response.json();
        if (response.ok){
            alert('Rename Successfully!, ' + data.name);
        }
      } catch (error) {
        alert('Error creating user:', error);
      }
}