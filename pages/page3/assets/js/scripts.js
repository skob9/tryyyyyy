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
    
    // Setup search functionality
    setupSearch();
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
    window.location.href = '../../pages/page5/index.html';
}

function logout() {
    localStorage.removeItem('currentUser');
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
        window.location.href = '../../pages/page4/index.html';
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

// Function to load projects from API only
async function loadProjects() {
    const projectsContainer = document.querySelector('.projects-container');
    
    // Clear the existing projects container first
    projectsContainer.innerHTML = '';
    
    try {
        // Fetch projects from the API
        const apiProjects = await fetchDIYPostsFromAPI();
        
        if (apiProjects.length === 0) {
            // Show a message if no projects are found
            projectsContainer.innerHTML = '<p class="no-projects">No projects found. Be the first to create one!</p>';
            return;
        }
        
        // Add API projects
        apiProjects.forEach(project => {
            const mappedProject = {
                id: project.id,
                title: project.title,
                author: extractAuthorFromContent(project.content) || 'Anonymous',
                category: mapApiCategoryToLocal(project.category),
                content: project.content
            };
            
            createProjectCard(mappedProject, projectsContainer);
        });
    } catch (error) {
        console.error('Error loading API projects:', error);
        projectsContainer.innerHTML = '<p class="no-projects">Error loading projects. Please try again later.</p>';
    }
    
    // After loading all projects, setup filters
    setupCategoryFilters();
}

// Function to map API categories to local category format
function mapApiCategoryToLocal(category) {
    // Map API category names to our local category values
    const categoryMap = {
        'Renovation': 'renovation',
        'Furniture': 'furniture',
        'Woodworking': 'furniture',
        'Electrical': 'electrical-lighting',
        'Lighting': 'electrical-lighting'
    };
    
    return categoryMap[category] || 'uncategorized';
}

// Function to fetch DIY posts from the API
async function fetchDIYPostsFromAPI() {
    try {
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        const data = await response.json();
        if (response.ok) {
            return data; // Return the API data
        }
        return []; // Return empty array if response not OK
    } catch (error) {
        console.error('Error fetching DIY Posts:', error);
        return []; // Return empty array on error
    }
}

// Function to create a project card
function createProjectCard(project, container) {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.dataset.category = project.category || 'uncategorized'; // Ensure there's always a category
    
    projectCard.innerHTML = `
        <div class="project-image">
        </div>
        <div class="project-info">
            <div class="title-row">
                <h3 class="project-title">${project.title}</h3>
                <div class="delete-icon">
                    <i class="fas fa-trash"></i>
                </div>
            </div>
            <p class="project-author">${project.author || 'Anonymous'}</p>
        </div>
    `;
    
    // Add click event for viewing the project
    projectCard.addEventListener('click', function(e) {
        // Don't navigate if clicking the delete icon
        if (!e.target.closest('.delete-icon')) {
            // Store the current project data in sessionStorage for page6 to use
            sessionStorage.setItem('currentViewedProject', JSON.stringify({
                id: project.id,
                title: project.title,
                content: project.content,
                category: project.category,
                author: project.author || 'Anonymous'
            }));
            
            // Navigate to the project details page
            window.location.href = `../../../../pages/page6/index.html?id=${project.id}`;
        }
    });
    
    // Add delete functionality
    const deleteIcon = projectCard.querySelector('.delete-icon');
    deleteIcon.addEventListener('click', async function(e) {
        e.stopPropagation(); // Prevent navigation
        
        if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
            try {
                await deletePost(project.id);
                projectCard.remove(); // Remove from DOM after successful deletion
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Failed to delete the post. Please try again.');
            }
        }
    });
    
    container.appendChild(projectCard);
}

// Function to delete a post using the API
async function deletePost(postId) {
    try {
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete post. Status: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
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

// Function to extract author from content if available
function extractAuthorFromContent(content) {
    if (!content) return null;
    
    // Look for author information in content
    const authorMatch = content.match(/Author:\s*([^\n]+)/);
    if (authorMatch && authorMatch[1]) {
        return authorMatch[1].trim();
    }
    
    return null;
}

// Function to setup search functionality
function setupSearch() {
    const searchInput = document.querySelector('.search-container input');
    const searchButton = document.querySelector('.search-container button');
    
    // Update placeholder to indicate ID search capability
    searchInput.placeholder = "Search by post ID";
    
    // Event listener for search button click
    searchButton.addEventListener('click', function(e) {
        e.preventDefault();
        performSearch();
    });
    
    // Event listener for Enter key press in search input
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
}

// Function to perform the search
async function performSearch() {
    const searchInput = document.querySelector('.search-container input');
    const searchId = searchInput.value.trim();
    
    if (!searchId) {
        // If search is empty, load all projects
        loadProjects();
        return;
    }
    
    try {
        // Clear existing projects
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.innerHTML = '<p class="loading">Searching...</p>';
        
        // Fetch the specific post by ID
        const post = await fetchPostById(searchId);
        
        // Clear loading message
        projectsContainer.innerHTML = '';
        
        if (post) {
            // Map API project structure to our local format
            const mappedProject = {
                id: post.id,
                title: post.title,
                author: extractAuthorFromContent(post.content) || 'Anonymous',
                category: mapApiCategoryToLocal(post.category),
                content: post.content
            };
            
            // Display the single post
            createProjectCard(mappedProject, projectsContainer);
            
            // Show success message
            showNotification(`Found post with ID: ${searchId}`);
        } else {
            // Show no results message
            projectsContainer.innerHTML = `<p class="no-projects">No post found with ID: ${searchId}</p>`;
            showNotification(`No post found with ID: ${searchId}`);
        }
    } catch (error) {
        console.error('Error searching for post:', error);
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.innerHTML = '<p class="no-projects">Error searching for post. Please try again.</p>';
    }
}

// Function to fetch a specific post by ID
async function fetchPostById(postId) {
    try {
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts/${postId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return null; // Post not found
            }
            throw new Error(`Failed to fetch post. Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        return null;
    }
}

// Function to show notification
function showNotification(message) {
    // Remove any existing notification
    const existingNotification = document.getElementById('search-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create and show a notification
    const notification = document.createElement('div');
    notification.id = 'search-notification';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4B5320';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS for search results
document.addEventListener('DOMContentLoaded', function() {
    // Add styles for search results
    const style = document.createElement('style');
    style.textContent = `
        .loading, .no-projects {
            text-align: center;
            padding: 50px;
            font-size: 18px;
            color: #666;
        }
        
        .loading {
            font-style: italic;
        }
        
        #search-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #4B5320;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
});