
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        updateHeaderForLoggedInUser(currentUser);
    }

    // Get all published projects from localStorage
    loadProjects();

    // Add event listeners to category links
    setupCategoryFilters();
});

// Function to toggle the user menu
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
    window.location.href = '../../../../pages/page5/index.html';
}

function logout() {
    localStorage.removeItem('currentUser');
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
        window.location.href = '../../../../pages/page4/index.html';
    };

    // Create user icon button with click event to toggle the user menu
    const userButton = document.createElement('button');
    userButton.className = 'btn btn-secondary';
    userButton.innerHTML = '<i class="fas fa-user"></i>';
    userButton.onclick = function(e) {
        e.stopPropagation();
        toggleUserMenu(user);
    };

    navRight.appendChild(postButton);
    navRight.appendChild(userButton);
}

// Function to load projects from localStorage
function loadProjects() {
    const projectsContainer = document.querySelector('.projects-container');
    const savedProjects = JSON.parse(localStorage.getItem('publishedProjects')) || [];

    // Keep existing hardcoded projects, only add new ones from localStorage
    const existingProjects = projectsContainer.querySelectorAll('.project-card');
    const existingTitles = new Set([...existingProjects].map(proj => proj.querySelector('.project-title').textContent));

    // Then load saved projects from localStorage
    savedProjects.forEach(project => {
        if (!existingTitles.has(project.title)) {
            createProjectCard(project, projectsContainer);
        }
    });

    // After loading, setup filters again
    setupCategoryFilters();
}

// Function to create a project card
function createProjectCard(project, container) {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.dataset.category = project.category || 'uncategorized'; // Ensure there's always a category
    
    projectCard.innerHTML = `
        <div class="project-image">
            <img src="../../../../assets/img/PinoyFix-logo.png" alt="${project.title}">
        </div>
        <div class="project-info">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-author">${project.author || 'Anonymous'}</p>
        </div>
    `;
    
    projectCard.addEventListener('click', function() {
        window.location.href = `../../../../pages/page6/index.html?id=${project.id}`;
    });
    
    container.appendChild(projectCard);
}

// Get the current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Setup category filters
function setupCategoryFilters() {
    const categoryLinks = document.querySelectorAll('.category-link');
    const projectCards = document.querySelectorAll('.project-card');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            categoryLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get the category to filter by
            const category = this.textContent.trim();
            
            // Map display text to actual category values
            const categoryMap = {
                'All': 'all',
                'Renovation': 'renovation',
                'Furniture': 'furniture',
                'Electrical & Lighting': 'electrical-lighting'
            };
            
            const filterValue = categoryMap[category] || 'all';
            
            // Show/hide projects based on category
            projectCards.forEach(card => {
                if (filterValue === 'all' || card.dataset.category === filterValue) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Function to handle the publish event from create post page
window.addEventListener('storage', function(e) {
    // Check if the published project data was updated
    if (e.key === 'publishedProjects') {
        loadProjects();
    }
});