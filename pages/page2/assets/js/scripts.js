// Store user data in localStorage
let users = JSON.parse(localStorage.getItem('users')) || [];

// Function to toggle between sign-in and sign-up panels
function togglePanel() {
    const container = document.getElementById('container');
    container.classList.toggle('right-panel-active');
}

// Function to validate email format
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Function to validate registration form
function validateRegistration() {
    const username = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    if (!validateEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    if (users.some(user => user.email === email)) {
        alert('Email already registered. Please use a different email.');
        return;
    }

    const newUser = { username, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Reset form fields
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';

    alert('Registration successful! You can now sign in.');
    togglePanel(); // Switch to the login panel
}

// Function to validate login
function validateLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    const user = users.find(user => user.email === email && user.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUIAfterLogin(user);
        alert('Login successful! Welcome back, ' + user.username);
        // Redirect to Home page after login
        window.location.href = '../../index.html';
    } else {
        alert('Invalid email or password');
    }
}

// Function to update UI after login
function updateUIAfterLogin(user) {
    const navRight = document.querySelector('.nav-right');
    navRight.innerHTML = ''; // Clear default buttons

    // Create "Post" button
    const postButton = document.createElement('button');
    postButton.className = 'btn btn-primary';
    postButton.textContent = 'Post';
    postButton.onclick = function() {
        // Redirect to post creation page (adjust URL as needed)
        window.location.href = '../../../../pages/page4/index.html';
    };
    
    // Create user icon button to toggle the user menu
    const userButton = document.createElement('button');
    userButton.className = 'btn btn-secondary';
    userButton.innerHTML = '<i class="fas fa-user"></i>';
    userButton.onclick = function(e) {
        e.stopPropagation(); // Prevent closing the menu immediately
        toggleUserMenu(user);
    };
    
    navRight.appendChild(postButton);
    navRight.appendChild(userButton);
}

// Function to toggle the user menu
function toggleUserMenu(user) {
    const existingMenu = document.getElementById('user-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const userMenu = document.createElement('div');
    userMenu.id = 'user-menu';
    userMenu.style.position = 'absolute';
    userMenu.style.top = '80px';
    userMenu.style.right = '20px';
    userMenu.style.backgroundColor = '#fff';
    userMenu.style.borderRadius = '8px';
    userMenu.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    userMenu.style.padding = '10px';
    userMenu.style.zIndex = '1000';
    
    userMenu.innerHTML = `
        <div style="padding: 8px 16px; font-weight: bold;">${user.username}</div>
        <div style="padding: 8px 16px; color: #666;">${user.email}</div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 5px 0;">
        <div style="padding: 8px 16px; cursor: pointer;" onclick="navigateToProfile()">Profile</div>
        <div style="padding: 8px 16px; cursor: pointer; color: #ff7043;" onclick="logout()">Logout</div>
    `;
    
    document.body.appendChild(userMenu);
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!userMenu.contains(e.target) && e.target !== document.querySelector('.nav-right .btn-secondary')) {
            userMenu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Navigation functions for the user menu
function navigateToProfile() {
    // Redirect to profile page (adjust URL as needed)
    window.location.href = '../../../../pages/page5/index.html';
}

// Function to handle logout and restore header buttons
function logout() {
    localStorage.removeItem('currentUser');
    
    const navRight = document.querySelector('.nav-right');
    navRight.innerHTML = `
        <button class="btn btn-secondary">Sign In</button>
        <button class="btn btn-primary">Sign Up</button>
    `;
    attachAuthEventListeners();
    alert('You have been logged out');
}

// Helper function to attach event listeners to header auth buttons
function attachAuthEventListeners() {
    const navRight = document.querySelector('.nav-right');
    const signInBtn = navRight.querySelector('.btn.btn-secondary');
    const signUpBtn = navRight.querySelector('.btn.btn-primary');
    
    if (signInBtn) {
        signInBtn.addEventListener('click', function() {
            document.querySelector('.main-content').style.display = 'flex';
            const container = document.getElementById('container');
            container.classList.remove('right-panel-active');
        });
    }
    
    if (signUpBtn) {
        signUpBtn.addEventListener('click', function() {
            document.querySelector('.main-content').style.display = 'flex';
            const container = document.getElementById('container');
            container.classList.add('right-panel-active');
        });
    }
}

// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        updateUIAfterLogin(currentUser);
        // Hide the login/signup container when logged in
        document.querySelector('.main-content').style.display = 'none';
    } else {
        attachAuthEventListeners();
    }
});