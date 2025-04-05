document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        updateHeaderForLoggedInUser(currentUser);
    }
    
    // Get project ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (projectId) {
        loadProjectDetails(projectId);
        // Load comments for this project
        loadComments(projectId);
        // Load project reviews
        loadProjectReviews(projectId);
    }
    
    // Set up favorite and "I made it" buttons
    setupActionButtons();
    
    // Set up comment submission
    setupCommentSubmission(projectId);
    
    // Setup edit functionality
    // setupEditFunctionality(projectId);

    // Setup star rating
    setupStarRating(projectId);
});

// Store the current project globally for editing
let currentProject = null;

// Global variable to store selected rating
let selectedReviewRating = 0;

// Global function to select rating (called directly from HTML)
function selectRating(rating) {
    selectedReviewRating = rating;
    
    // Update stars visual state
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        if (starRating <= rating) {
            star.className = 'fas fa-star'; // Filled star
        } else {
            star.className = 'far fa-star'; // Empty star
        }
    });
    
    console.log('Selected rating:', rating);
}

// Global function to select a star rating
function selectStar(rating) {
    // Store the selected rating in a way that's guaranteed to work
    window.selectedRating = rating;
    document.getElementById('selected-rating-value').value = rating;
    
    // Update the stars visually
    const starBtns = document.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
        const btnRating = parseInt(btn.getAttribute('data-rating'));
        const starIcon = btn.querySelector('i');
        
        if (btnRating <= rating) {
            starIcon.className = 'fas fa-star'; // filled star
        } else {
            starIcon.className = 'far fa-star'; // empty star
        }
    });
    
    console.log("Selected rating:", rating);
}

async function loadProjectDetails(projectId) {
    // First, check if project data was passed from page3 via sessionStorage
    let project = null;
    const sessionProject = sessionStorage.getItem('currentViewedProject');
    
    if (sessionProject) {
        project = JSON.parse(sessionProject);
        // Clear from session storage after retrieving
        sessionStorage.removeItem('currentViewedProject');
    }
    
    // If not found in sessionStorage, try to fetch it from the API
    if (!project) {
        try {
            project = await fetchPostById(projectId);
            
            if (!project) {
                // If not found in API, check localStorage as a fallback (for older projects)
                const publishedProjects = JSON.parse(localStorage.getItem('publishedProjects')) || [];
                project = publishedProjects.find(p => p.id === projectId);
            }
        } catch (error) {
            console.error('Error fetching project details:', error);
        }
    }
    
    // If project still not found, redirect back to projects page
    if (!project) {
        alert('Project not found.');
        window.location.href = '../../../../pages/page3/index.html';
        return;
    }
    
    // Store the current project for editing
    currentProject = project;
    
    // Add Edit and Delete buttons if user is logged in
    addActionButtons();
    
    // Update project header
    document.getElementById('project-title').textContent = project.title;
    document.getElementById('project-author').textContent = `By ${project.author || extractAuthorFromContent(project.content) || 'Anonymous'}`;
    
    // Process the content field (for API data)
    if (project.content) {
        // Extract introduction
        const introElement = document.getElementById('project-introduction');
        introElement.textContent = extractIntroductionFromContent(project.content) || 
            'No introduction available for this project.';
        
        // Extract supplies/materials
        const suppliesContainer = document.getElementById('project-supplies');
        const supplies = extractSuppliesFromContent(project.content);
        
        if (supplies && supplies.length > 0) {
            const suppliesList = document.createElement('ul');
            supplies.forEach(item => {
                if (item.trim()) {
                    const li = document.createElement('li');
                    li.textContent = item.trim();
                    suppliesList.appendChild(li);
                }
            });
            suppliesContainer.innerHTML = '';
            suppliesContainer.appendChild(suppliesList);
        } else {
            suppliesContainer.innerHTML = '<p>No materials list available.</p>';
        }
        
        // Extract steps
        const stepsContainer = document.getElementById('project-steps');
        stepsContainer.innerHTML = '';
        
        const steps = extractStepsFromContent(project.content);
        if (steps && steps.length > 0) {
            steps.forEach((step, index) => {
                const stepElement = document.createElement('div');
                stepElement.className = 'step';
                
                stepElement.innerHTML = `
                    <h2>STEP ${index + 1}: ${step.title || 'Step ' + (index + 1)}</h2>
                    <p>${step.description}</p>
                `;
                
                stepsContainer.appendChild(stepElement);
            });
        } else {
            stepsContainer.innerHTML = '<p>No steps available for this project.</p>';
        }
    } else if (project.introduction) {
        // Handle legacy format (from localStorage)
        document.getElementById('project-introduction').textContent = project.introduction;
        
        // Update supplies section from localStorage format
        const suppliesContainer = document.getElementById('project-supplies');
        if (project.supplies) {
            // Convert supplies text to list items
            const suppliesList = document.createElement('ul');
            project.supplies.split('\n').forEach(item => {
                if (item.trim()) {
                    const li = document.createElement('li');
                    li.textContent = item.trim();
                    suppliesList.appendChild(li);
                }
            });
            suppliesContainer.innerHTML = '';
            suppliesContainer.appendChild(suppliesList);
        }
        
        // Update project steps from localStorage format
        const stepsContainer = document.getElementById('project-steps');
        stepsContainer.innerHTML = '';
        
        if (project.steps && project.steps.length > 0) {
            project.steps.forEach(step => {
                const stepElement = document.createElement('div');
                stepElement.className = 'step';
                
                stepElement.innerHTML = `
                    <h2>STEP ${step.number}: ${step.title}</h2>
                    <p>${step.description}</p>
                `;
                
                stepsContainer.appendChild(stepElement);
            });
        }
    }
}

// Function to fetch a post by ID from the API
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

// Helper functions to extract structured data from API content
function extractAuthorFromContent(content) {
    if (!content) return null;
    
    const authorMatch = content.match(/Author:\s*([^\n]+)/);
    if (authorMatch && authorMatch[1]) {
        return authorMatch[1].trim();
    }
    
    return null;
}

function extractIntroductionFromContent(content) {
    if (!content) return null;
    
    // Look for Introduction section
    const introMatch = content.match(/Introduction:\s*([^]*?)(?=Supplies:|Steps:|$)/);
    if (introMatch && introMatch[1]) {
        return introMatch[1].trim();
    }
    
    // If no Introduction section, use the first paragraph
    const firstParagraph = content.split('\n\n')[0];
    if (firstParagraph && !firstParagraph.includes('Step') && !firstParagraph.includes('Supplies:')) {
        return firstParagraph.trim();
    }
    
    return null;
}

function extractSuppliesFromContent(content) {
    if (!content) return [];
    
    const suppliesMatch = content.match(/Supplies:\s*([^]*?)(?=Steps:|$)/);
    if (suppliesMatch && suppliesMatch[1]) {
        return suppliesMatch[1].trim().split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }
    
    return [];
}

function extractStepsFromContent(content) {
    if (!content) return [];
    
    const stepsMatch = content.match(/Steps:\s*([^]*?)(?=Author:|$)/);
    if (!stepsMatch || !stepsMatch[1]) {
        return [];
    }
    
    const stepsContent = stepsMatch[1].trim();
    
    // Try to match step format: "Step X: Title\nDescription"
    const stepRegex = /Step\s+(\d+):\s*(.*?)(?:\n([\s\S]*?)(?=Step\s+\d+:|$))/g;
    const steps = [];
    let match;
    
    while ((match = stepRegex.exec(stepsContent)) !== null) {
        steps.push({
            number: match[1],
            title: match[2].trim(),
            description: match[3].trim()
        });
    }
    
    // If no steps were found using the regex pattern, fallback to simple parsing
    if (steps.length === 0) {
        const paragraphs = stepsContent.split('\n\n');
        paragraphs.forEach((paragraph, index) => {
            if (paragraph.trim()) {
                steps.push({
                    number: index + 1,
                    title: `Step ${index + 1}`,
                    description: paragraph.trim()
                });
            }
        });
    }
    
    return steps;
}

function loadComments(projectId) {
    const commentsList = document.getElementById('comments-list');
    
    // Get all comments from localStorage
    const allComments = JSON.parse(localStorage.getItem('projectComments')) || {};
    
    // Get comments for this specific project
    const projectComments = allComments[projectId] || [];
    
    // Clear current comments display
    commentsList.innerHTML = '';
    
    if (projectComments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        return;
    }
    
    // Display each comment
    projectComments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        
        commentDiv.innerHTML = `
            <div class="comment-info">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${comment.date}</span>
            </div>
            <div class="comment-content">${comment.text}</div>
        `;
        
        commentsList.appendChild(commentDiv);
    });
}

// Updated setupActionButtons function with Like API integration
function setupActionButtons() {
    const favoriteButton = document.querySelector('.favorite-btn');
    const madeItButton = document.querySelector('.made-it-btn');
    const projectId = new URLSearchParams(window.location.search).get('id');
    
    // Load the like status from localStorage to initialize the button state
    if (madeItButton && projectId) {
        // Check if user is logged in
        const currentUser = getCurrentUser();
        if (currentUser) {
            // Check if project is already liked
            const likedProjects = JSON.parse(localStorage.getItem('likedProjects') || '{}');
            const hasLiked = likedProjects[projectId] === true;
            
            // Set initial state based on liked status
            const icon = madeItButton.querySelector('i');
            if (hasLiked) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                madeItButton.style.color = '#FB8143';
            }
            
            // Add click event with API integration
            madeItButton.addEventListener('click', async function() {
                if (!currentUser) {
                    alert('Please sign in to like this project');
                    return;
                }
                
                try {
                    const icon = this.querySelector('i');
                    const isCurrentlyLiked = icon.classList.contains('fa-solid');
                    
                    if (!isCurrentlyLiked) {
                        // Make API call to like the post
                        const result = await likePost(projectId, currentUser.id || currentUser.username);
                        
                        if (result) {
                            // Update UI
                            icon.classList.remove('fa-regular');
                            icon.classList.add('fa-solid');
                            this.style.color = '#FB8143';
                            
                            // Save liked state to localStorage
                            const likedProjects = JSON.parse(localStorage.getItem('likedProjects') || '{}');
                            likedProjects[projectId] = true;
                            localStorage.setItem('likedProjects', JSON.stringify(likedProjects));
                            
                            // Show success message
                            showNotification('Project liked successfully!');
                        }
                    } else {
                        // If already liked, we could implement an unlike API call here in the future
                        // For now, just toggle the visual state
                        icon.classList.remove('fa-solid');
                        icon.classList.add('fa-regular');
                        this.style.color = '#666';
                        
                        // Save unliked state to localStorage
                        const likedProjects = JSON.parse(localStorage.getItem('likedProjects') || '{}');
                        delete likedProjects[projectId];
                        localStorage.setItem('likedProjects', JSON.stringify(likedProjects));
                        
                        showNotification('Project unliked');
                    }
                } catch (error) {
                    console.error('Error liking project:', error);
                    showNotification('Error: ' + error.message, 'error');
                }
            });
        } else {
            // Not logged in, add a prompt to login
            madeItButton.addEventListener('click', function() {
                alert('Please sign in to like this project');
            });
        }
    }
    
    if (favoriteButton) {
        // Check if this project is already bookmarked
        const bookmarkedProjects = JSON.parse(localStorage.getItem('bookmarkedProjects') || '{}');
        const isBookmarked = bookmarkedProjects[projectId];
        
        // Set initial state if already bookmarked
        if (isBookmarked) {
            const icon = favoriteButton.querySelector('i');
            icon.classList.remove('fa-regular');
            icon.classList.add('fa-solid');
            favoriteButton.style.color = '#FB8143';
        }
        
        favoriteButton.addEventListener('click', async function() {
            const icon = this.querySelector('i');
            const currentUser = getCurrentUser();
            
            if (currentUser) {
                try {
                    const isCurrentlyBookmarked = icon.classList.contains('fa-solid');
                    
                    if (!isCurrentlyBookmarked) {
                        // Call API to bookmark
                        const result = await bookmarkPost(projectId, currentUser.id);
                        
                        // Update UI
                        icon.classList.remove('fa-regular');
                        icon.classList.add('fa-solid');
                        this.style.color = '#FB8143';
                        
                        // Save bookmarked state to localStorage
                        const bookmarkedProjects = JSON.parse(localStorage.getItem('bookmarkedProjects') || '{}');
                        bookmarkedProjects[projectId] = true;
                        localStorage.setItem('bookmarkedProjects', JSON.stringify(bookmarkedProjects));
                        
                        showNotification('Project bookmarked');
                    } else {
                        // Remove bookmark via API
                        const result = await removeBookmark(projectId, currentUser.id);
                        
                        // Update UI
                        icon.classList.remove('fa-solid');
                        icon.classList.add('fa-regular');
                        this.style.color = '#666';
                        
                        // Save unbookmarked state to localStorage
                        const bookmarkedProjects = JSON.parse(localStorage.getItem('bookmarkedProjects') || '{}');
                        delete bookmarkedProjects[projectId];
                        localStorage.setItem('bookmarkedProjects', JSON.stringify(bookmarkedProjects));
                        
                        showNotification('Project removed from bookmarks');
                    }
                } catch (error) {
                    console.error('Error managing bookmark:', error);
                    showNotification('Error: ' + error.message, 'error');
                }
            } else {
                // Not logged in
                alert('Please sign in to bookmark this project');
            }
        });
    } else {
        // Not logged in, add a prompt to login
        favoriteButton.addEventListener('click', function() {
            alert('Please sign in to bookmark this project');
        });
    }
}

// Function to like a post via API
async function likePost(postId, userId) {
    try {
        if (!postId || !userId) {
            throw new Error('Missing post ID or user ID');
        }
        
        console.log(`Liking post ${postId} by user ${userId}`);
        
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_id: postId,
                userId: userId
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to like post. Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error liking post:', error);
        throw error;
    }
}

// Function to bookmark a post via API
async function bookmarkPost(postId, userId) {
    try {
        if (!postId || !userId) {
            throw new Error('Missing post ID or user ID');
        }
        
        console.log(`Bookmarking post ${postId} by user ${userId}`);
        
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts/${postId}/bookmark`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_id: postId,
                userId: userId
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to bookmark post. Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error bookmarking post:', error);
        throw error;
    }
}

// Function to remove bookmark via API
async function removeBookmark(postId, userId) {
    try {
        if (!postId || !userId) {
            throw new Error('Missing post ID or user ID');
        }
        
        console.log(`Removing bookmark for post ${postId} by user ${userId}`);
        
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts/${postId}/bookmark`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_id: postId,
                userId: userId  // Note: Using just userId, not post_id
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to remove bookmark. Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error removing bookmark:', error);
        throw error;
    }
}

// Function to show a notification
function showNotification(message, type = 'success') {
    // Remove any existing notification
    const existingNotification = document.getElementById('notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create and show a notification
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Helper function to get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function setupCommentSubmission(projectId) {
    const commentForm = document.querySelector('.comment-input-area');
    
    if (commentForm && projectId) {
        const submitButton = commentForm.querySelector('.comment-btn');
        const textarea = commentForm.querySelector('textarea');
        
        // Function to submit the comment
        const submitComment = function() {
            const commentText = textarea.value.trim();
            
            if (commentText) {
                // Get current user
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                const username = currentUser ? currentUser.username : 'Anonymous';
                const date = new Date().toLocaleDateString();
                
                // Create new comment object
                const newComment = {
                    author: username,
                    date: date,
                    text: commentText
                };
                
                // Add comment to localStorage
                saveComment(projectId, newComment);
                
                // Reload comments to display the new one
                loadComments(projectId);
                
                // Clear textarea
                textarea.value = '';
            }
        };
        
        // Submit when clicking the button
        submitButton.addEventListener('click', submitComment);
        
        // Submit when pressing Enter (without Shift)
        textarea.addEventListener('keydown', function(e) {
            // Check if Enter was pressed without Shift
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default behavior (newline)
                submitComment();
            }
        });
    }
}

function saveComment(projectId, comment) {
    // Get current comments
    const allComments = JSON.parse(localStorage.getItem('projectComments')) || {};
    
    // Initialize array for this project if it doesn't exist
    if (!allComments[projectId]) {
        allComments[projectId] = [];
    }
    
    // Add new comment
    allComments[projectId].push(comment);
    
    // Save back to localStorage
    localStorage.setItem('projectComments', JSON.stringify(allComments));
}

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

    // Create user icon button
    const userButton = document.createElement('button');
    userButton.className = 'btn btn-secondary';
    userButton.innerHTML = '<i class="fas fa-user"></i>';
    userButton.onclick = function() {
        toggleUserMenu(user);
    };

    navRight.appendChild(postButton);
    navRight.appendChild(userButton);
}

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
    window.location.href = '../../index.html';
}

// Function to add edit and delete buttons
function addActionButtons() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return; // Only show buttons to logged in users
    
    const articleMeta = document.querySelector('.article-meta');
    const actionsDiv = articleMeta.querySelector('.article-actions');
    
    // Create buttons container if it doesn't exist
    let adminActionsDiv = document.getElementById('admin-actions');
    if (!adminActionsDiv) {
        adminActionsDiv = document.createElement('div');
        adminActionsDiv.id = 'admin-actions';
        adminActionsDiv.className = 'admin-actions';
        articleMeta.insertBefore(adminActionsDiv, actionsDiv);
    } else {
        adminActionsDiv.innerHTML = ''; // Clear existing buttons
    }
    
    // Add edit button
    const editButton = document.createElement('button');
    editButton.id = 'edit-project-btn';
    editButton.className = 'admin-btn edit-btn';
    editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
    editButton.addEventListener('click', toggleEditMode);
    
    // Add delete button
    const deleteButton = document.createElement('button');
    deleteButton.id = 'delete-project-btn';
    deleteButton.className = 'admin-btn delete-btn';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
    deleteButton.addEventListener('click', confirmDeleteProject);
    
    // Add buttons to container
    adminActionsDiv.appendChild(editButton);
    adminActionsDiv.appendChild(deleteButton);
}

// Function to confirm and delete project
async function confirmDeleteProject() {
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (!projectId || !currentProject) return;
    
    if (confirm(`Are you sure you want to delete "${currentProject.title}"? This action cannot be undone.`)) {
        try {
            const success = await deletePost(projectId);
            if (success) {
                showNotification('Project deleted successfully!');
                // Redirect back to projects page after a short delay
                setTimeout(() => {
                    window.location.href = '../../../../pages/page3/index.html';
                }, 1500);
            } else {
                showNotification('Failed to delete project. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            showNotification('Error: ' + error.message, 'error');
        }
    }
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

// Function to toggle edit mode
function toggleEditMode() {
    const isEditing = document.body.classList.toggle('editing-mode');
    const editBtn = document.getElementById('edit-project-btn');
    
    if (isEditing) {
        // Switch to editing mode
        editBtn.innerHTML = '<i class="fas fa-save"></i> Save';
        createEditingInterface();
    } else {
        // Save changes
        saveProjectChanges();
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
    }
}

// Function to create editing interface
function createEditingInterface() {
    // 1. Make title editable
    const titleElement = document.getElementById('project-title');
    const originalTitle = titleElement.textContent;
    titleElement.innerHTML = `
        <input type="text" id="edit-title" value="${originalTitle}" class="edit-field">
    `;
    
    // 2. Make introduction editable
    const introElement = document.getElementById('project-introduction');
    const originalIntro = introElement.textContent;
    introElement.innerHTML = `
        <textarea id="edit-introduction" class="edit-field">${originalIntro}</textarea>
    `;
    
    // 3. Make supplies editable
    const suppliesContainer = document.getElementById('project-supplies');
    let suppliesContent = "";
    
    // Get current supplies
    const suppliesItems = suppliesContainer.querySelectorAll('li');
    suppliesItems.forEach(item => {
        suppliesContent += item.textContent + '\n';
    });
    
    suppliesContainer.innerHTML = `
        <textarea id="edit-supplies" class="edit-field" placeholder="Enter supplies, one per line">${suppliesContent}</textarea>
    `;
    
    // 4. Make steps editable
    const stepsContainer = document.getElementById('project-steps');
    const steps = stepsContainer.querySelectorAll('.step');
    stepsContainer.innerHTML = '';
    
    // Create container for steps
    const stepsEditor = document.createElement('div');
    stepsEditor.id = 'steps-editor';
    
    // Add each step as editable fields
    steps.forEach((step, index) => {
        const stepTitle = step.querySelector('h2').textContent.replace(`STEP ${index + 1}: `, '');
        const stepDescription = step.querySelector('p').textContent;
        
        const stepEditor = document.createElement('div');
        stepEditor.className = 'step-edit';
        stepEditor.innerHTML = `
            <div class="step-header">
                <span class="step-number">STEP ${index + 1}</span>
                <input type="text" class="edit-step-title" value="${stepTitle}" placeholder="Step Title">
            </div>
            <textarea class="edit-step-description">${stepDescription}</textarea>
        `;
        
        stepsEditor.appendChild(stepEditor);
    });
    
    // Add button to add new step
    const addStepBtn = document.createElement('button');
    addStepBtn.id = 'add-step-btn';
    addStepBtn.innerHTML = '<i class="fas fa-plus"></i> Add Step';
    addStepBtn.addEventListener('click', function() {
        const newStepIndex = stepsEditor.querySelectorAll('.step-edit').length + 1;
        
        const newStep = document.createElement('div');
        newStep.className = 'step-edit';
        newStep.innerHTML = `
            <div class="step-header">
                <span class="step-number">STEP ${newStepIndex}</span>
                <input type="text" class="edit-step-title" placeholder="Step Title">
            </div>
            <textarea class="edit-step-description" placeholder="Step Description"></textarea>
        `;
        
        stepsEditor.insertBefore(newStep, addStepBtn);
    });
    
    stepsEditor.appendChild(addStepBtn);
    stepsContainer.appendChild(stepsEditor);
    
    // Add editing styles
    const style = document.createElement('style');
    style.textContent = `
        .editing-mode .edit-field {
            width: 100%;
            padding: 8px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        
        .editing-mode textarea.edit-field {
            min-height: 100px;
        }
        
        .editing-mode #edit-title {
            font-size: 24px;
            font-weight: bold;
        }
        
        .editing-mode .step-edit {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
        }
        
        .editing-mode .step-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .editing-mode .step-number {
            font-weight: bold;
            margin-right: 10px;
            min-width: 60px;
        }
        
        .editing-mode .edit-step-title {
            flex: 1;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        
        .editing-mode .edit-step-description {
            width: 100%;
            min-height: 80px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        
        #add-step-btn {
            background-color: #4B5320;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        
        #add-step-btn:hover {
            background-color: #5d6829;
        }
    `;
    
    if (!document.getElementById('edit-styles')) {
        style.id = 'edit-styles';
        document.head.appendChild(style);
    }
}

// Function to save project changes
async function saveProjectChanges() {
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (!projectId || !currentProject) return;
    
    // Collect edited data
    const newTitle = document.getElementById('edit-title').value.trim();
    const newIntroduction = document.getElementById('edit-introduction').value.trim();
    const newSupplies = document.getElementById('edit-supplies').value.trim();
    
    // Collect steps
    const stepEditors = document.querySelectorAll('.step-edit');
    const steps = [];
    
    stepEditors.forEach((stepEditor, index) => {
        const title = stepEditor.querySelector('.edit-step-title').value.trim();
        const description = stepEditor.querySelector('.edit-step-description').value.trim();
        
        if (title || description) {
            steps.push({
                number: index + 1,
                title: title || `Step ${index + 1}`,
                description: description
            });
        }
    });
    
    // Format the content for API update
    let content = `Introduction:
${newIntroduction}

Supplies:
${newSupplies}

Steps:
`;

    steps.forEach(step => {
        content += `Step ${step.number}: ${step.title}
${step.description}

`;
    });
    
    // Add author if it exists in the original content
    const originalAuthor = extractAuthorFromContent(currentProject.content);
    if (originalAuthor) {
        content += `Author: ${originalAuthor}`;
    }
    
    // Update the project
    try {
        const success = await updatePost(projectId, newTitle, content);
        if (success) {
            // Update global currentProject with new data
            currentProject.title = newTitle;
            currentProject.content = content;
            
            // Reload the project details to display the updated content
            loadProjectDetails(projectId);
            showNotification('Project updated successfully!');
        } else {
            showNotification('Failed to update project. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error updating project:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Function to update a post using the API
async function updatePost(postId, title, content) {
    try {
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update post. Status: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error updating post:', error);
        throw error;
    }
}

// Add notification and admin button styles
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .notification.success {
            background-color: #4CAF50;
        }
        
        .notification.error {
            background-color: #F44336;
        }
        
        .admin-actions {
            display: flex;
            margin-right: 15px;
        }
        
        .admin-btn {
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            display: flex;
            align-items: center;
            font-weight: 500;
        }
        
        .admin-btn i {
            margin-right: 5px;
        }
        
        .edit-btn {
            background-color: #4B5320;
            color: white;
        }
        
        .edit-btn:hover {
            background-color: #5d6829;
        }
        
        .delete-btn {
            background-color: #F44336;
            color: white;
        }
        
        .delete-btn:hover {
            background-color: #d32f2f;
        }
    `;
    
    document.head.appendChild(style);
});

// Function to load project reviews with edit option for user's own reviews
async function loadProjectReviews(projectId) {
    const reviewsList = document.getElementById('reviews-list');
    const avgRatingElement = document.getElementById('avg-rating');
    const reviewCountElement = document.getElementById('review-count');
    const starsContainer = document.querySelector('.avg-rating .stars');
    
    try {
        // Fetch reviews for this project
        const reviews = await fetchProjectReviews(projectId);
        
        // Clear current reviews display
        reviewsList.innerHTML = '';
        
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review!</p>';
            return;
        }
        
        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = (totalRating / reviews.length).toFixed(1);
        
        // Update average rating display
        if (avgRatingElement) avgRatingElement.textContent = avgRating;
        if (reviewCountElement) reviewCountElement.textContent = `(${reviews.length} review${reviews.length !== 1 ? 's' : ''})`;
        
        // Update star display
        if (starsContainer) updateStarDisplay(starsContainer, avgRating);
        
        // Get current user ID to check for own reviews
        const currentUserId = getUserId();
        
        // Display each review
        reviews.forEach(review => {
            // Check if this is the user's own review
            const isOwnReview = currentUserId && (review.userId === currentUserId);
            
            const reviewElement = createReviewElement(review, isOwnReview);
            reviewsList.appendChild(reviewElement);
        });
    } catch (error) {
        console.error('Error loading reviews:', error);
        if (reviewsList) {
            reviewsList.innerHTML = '<p class="no-reviews">Error loading reviews. Please try again later.</p>';
        }
    }
}

// Function to create a review element with edit option for own reviews
function createReviewElement(review, isOwnReview) {
    const reviewDiv = document.createElement('div');
    reviewDiv.className = 'review-item';
    reviewDiv.dataset.reviewId = review.id;
    
    // Format date nicely
    const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Create rating stars HTML
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="${i <= review.rating ? 'fas' : 'far'} fa-star"></i>`;
    }
    
    // Create review header with edit button for own reviews
    let reviewHeader = `
        <div class="review-header">
            <span class="review-author">${review.userId}</span>
            <span class="review-date">${reviewDate}</span>`;
    
    if (isOwnReview) {
        reviewHeader += `
            <div class="review-actions">
                <button onclick="startEditReview('${review.id}')" class="edit-review-btn">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="confirmDeleteReview('${review.id}')" class="delete-review-btn">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>`;
    }
    
    reviewHeader += `</div>`;
    
    reviewDiv.innerHTML = `
        ${reviewHeader}
        <div class="review-rating">
            ${starsHtml}
        </div>
        <div class="review-comment">${review.comment}</div>
        
        <!-- Edit form will be shown when editing -->
        <div class="edit-review-form" id="edit-form-${review.id}" style="display:none;">
            <div class="edit-rating">
                <p>Update Rating:</p>
                <div class="edit-stars">
                    ${[1,2,3,4,5].map(i => `
                        <span onclick="selectEditStar('${review.id}', ${i})" class="edit-star" data-rating="${i}">
                            <i class="${i <= review.rating ? 'fas' : 'far'} fa-star"></i>
                        </span>
                    `).join('')}
                </div>
            </div>
            <textarea class="edit-comment-input">${review.comment}</textarea>
            <div class="edit-actions">
                <button onclick="updateReview('${review.id}')" class="save-edit-btn">Save</button>
                <button onclick="cancelEditReview('${review.id}')" class="cancel-edit-btn">Cancel</button>
            </div>
        </div>
    `;
    
    return reviewDiv;
}

// Global function to start editing a review
function startEditReview(reviewId) {
    // Hide all other edit forms first
    document.querySelectorAll('.edit-review-form').forEach(form => {
        form.style.display = 'none';
    });
    
    // Get the review item
    const reviewItem = document.querySelector(`.review-item[data-review-id="${reviewId}"]`);
    
    if (reviewItem) {
        // Hide the review content
        const ratingElem = reviewItem.querySelector('.review-rating');
        const commentElem = reviewItem.querySelector('.review-comment');
        
        if (ratingElem) ratingElem.style.display = 'none';
        if (commentElem) commentElem.style.display = 'none';
        
        // Show the edit form
        const editForm = document.getElementById(`edit-form-${reviewId}`);
        if (editForm) {
            editForm.style.display = 'block';
            
            // Store original rating for reference
            const currentRating = reviewItem.querySelectorAll('.review-rating i.fas').length;
            editForm.dataset.originalRating = currentRating;
            editForm.dataset.currentRating = currentRating;
            
            // Focus on the textarea
            const textarea = editForm.querySelector('.edit-comment-input');
            if (textarea) textarea.focus();
        }
    }
}

// Global function to select a star when editing
function selectEditStar(reviewId, rating) {
    const editForm = document.getElementById(`edit-form-${reviewId}`);
    if (!editForm) return;
    
    // Update data attribute with current rating
    editForm.dataset.currentRating = rating;
    
    // Update stars visual state
    const stars = editForm.querySelectorAll('.edit-star i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
        } else {
            star.className = 'far fa-star';
        }
    });
}

// Global function to cancel editing
function cancelEditReview(reviewId) {
    const reviewItem = document.querySelector(`.review-item[data-review-id="${reviewId}"]`);
    if (!reviewItem) return;
    
    // Show the review content again
    const ratingElem = reviewItem.querySelector('.review-rating');
    const commentElem = reviewItem.querySelector('.review-comment');
    
    if (ratingElem) ratingElem.style.display = 'block';
    if (commentElem) commentElem.style.display = 'block';
    
    // Hide the edit form
    const editForm = document.getElementById(`edit-form-${reviewId}`);
    if (editForm) {
        editForm.style.display = 'none';
        
        // Reset stars to original state
        const originalRating = parseInt(editForm.dataset.originalRating);
        selectEditStar(reviewId, originalRating);
    }
}

// Global function to update a review
async function updateReview(reviewId) {
    const editForm = document.getElementById(`edit-form-${reviewId}`);
    if (!editForm) return;
    
    // Get updated values
    const rating = parseInt(editForm.dataset.currentRating);
    const comment = editForm.querySelector('.edit-comment-input').value.trim();
    
    // Get the project ID from the URL
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (!projectId) {
        alert('Missing project ID');
        return;
    }
    
    // Validate inputs
    if (!rating) {
        alert('Please select a rating');
        return;
    }
    
    if (!comment) {
        alert('Please write a review comment');
        return;
    }
    
    try {
        // Call API to update the review
        const success = await updateReviewAPI(projectId, reviewId, rating, comment);
        
        if (success) {
            alert('Review updated successfully!');
            
            // Reload all reviews
            loadProjectReviews(projectId);
        }
    } catch (error) {
        console.error('Error updating review:', error);
        alert('Error updating review: ' + error.message);
    }
}

// Function to call the API to update a review
async function updateReviewAPI(postId, reviewId, rating, comment) {
    try {
        console.log(`Updating review for post ${postId}, review ${reviewId}`);
        
        // Use the correct API endpoint according to the required format
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts/${postId}/reviews/${reviewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                review_id: reviewId,
                rating: rating,
                comment: comment
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to update review. Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating review:', error);
        throw error;
    }
}

// Function to update star display based on rating
function updateStarDisplay(container, rating) {
    const stars = container.querySelectorAll('i');
    const ratingValue = parseFloat(rating);
    
    stars.forEach((star, index) => {
        if (index < Math.floor(ratingValue)) {
            // Full star
            star.className = 'fas fa-star';
        } else if (index < Math.ceil(ratingValue) && ratingValue % 1 !== 0) {
            // Half star
            star.className = 'fas fa-star-half-alt';
        } else {
            // Empty star
            star.className = 'far fa-star';
        }
    });
}

// Function to fetch project reviews
async function fetchProjectReviews(projectId) {
    try {
        // This endpoint is assumed - modify based on actual API structure
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts/${projectId}/reviews`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            return []; // Return empty array if no reviews or error
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

// Function to setup star rating and review submission
function setupStarRating(projectId) {
    const starBtns = document.querySelectorAll('.star-btn');
    const submitReviewBtn = document.getElementById('submit-review');
    const reviewComment = document.getElementById('review-comment');
    let selectedRating = 0;
    
    // Setup star rating selection
    starBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            selectedRating = rating;
            
            // Update visual state of stars
            updateStars(rating);
            console.log("Selected rating:", rating);
        });
    });
    
    // Function to update star appearance based on selection
    function updateStars(rating) {
        starBtns.forEach(btn => {
            const btnRating = parseInt(btn.getAttribute('data-rating'));
            const starIcon = btn.querySelector('i');
            
            if (btnRating <= rating) {
                starIcon.className = 'fas fa-star'; // filled star
            } else {
                starIcon.className = 'far fa-star'; // empty star
            }
        });
    }
    
    // Handle review submission
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', async function() {
            const comment = reviewComment.value.trim();
            
            // Try to get the rating from multiple sources to ensure we have it
            let rating = window.selectedRating;
            
            // If not available, try the hidden input
            if (!rating) {
                const ratingInput = document.getElementById('selected-rating-value');
                if (ratingInput) {
                    rating = parseInt(ratingInput.value) || 0;
                }
            }
            
            // Get user ID
            const userId = getUserId();
            
            // Validate inputs
            if (!rating) {
                alert('Please select a rating by clicking on the stars');
                return;
            }
            
            if (!comment) {
                alert('Please write a review comment');
                return;
            }
            
            if (!userId) {
                alert('You must be logged in to submit a review');
                return;
            }
            
            try {
                // Prepare review data with exactly the required fields
                const reviewData = {
                    userId: userId,
                    rating: rating,
                    comment: comment
                };
                
                console.log('Review data to submit:', reviewData);
                
                // Submit the review
                const result = await submitPostReview(projectId, reviewData);
                
                if (result) {
                    alert('Review submitted successfully!');
                    // Reset form
                    window.selectedRating = 0;
                    if (document.getElementById('selected-rating-value')) {
                        document.getElementById('selected-rating-value').value = "0";
                    }
                    updateStars(0);
                    reviewComment.value = "";
                    
                    // Reload reviews to show the new one
                    loadProjectReviews(projectId);
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                alert('Error submitting review: ' + error.message);
            }
        });
    }
}

// Function to submit a review to the API
async function submitPostReview(postId, reviewData) {
    try {
        // Ensure we have all required fields
        if (!postId || !reviewData.userId || !reviewData.rating || !reviewData.comment) {
            throw new Error('Missing required fields for review submission');
        }
        
        console.log('Submitting review to API:', {
            postId,
            userId: reviewData.userId,
            rating: reviewData.rating,
            comment: reviewData.comment
        });
        
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts/${postId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: reviewData.userId,
                rating: reviewData.rating,
                comment: reviewData.comment
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to submit review. Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error submitting review:', error);
        throw error;
    }
}

// Make sure we have a valid userId function
function getUserId() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return null;
    
    // Try to get user ID in different ways, depending on your user storage format
    return currentUser.id || 
           currentUser.userId || 
           currentUser.username || 
           currentUser.email || 
           'anonymous-user';
}

// Global function to confirm and delete a review
function confirmDeleteReview(reviewId) {
    if (confirm('Are you sure you want to delete this review?')) {
        // Get the project ID from the URL
        const projectId = new URLSearchParams(window.location.search).get('id');
        if (!projectId) {
            alert('Missing project ID');
            return;
        }
        
        deleteReview(projectId, reviewId);
    }
}

// Function to delete a review
async function deleteReview(projectId, reviewId) {
    try {
        // Call API to delete the review
        const success = await deleteReviewAPI(projectId, reviewId);
        
        if (success) {
            alert('Review deleted successfully!');
            
            // Reload all reviews
            loadProjectReviews(projectId);
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('Error deleting review: ' + error.message);
    }
}

// Function to call the API to delete a review
async function deleteReviewAPI(postId, reviewId) {
    try {
        console.log(`Deleting review for post ${postId}, review ${reviewId}`);
        
        // Use the same endpoint but with DELETE method
        const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/posts/${postId}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to delete review. Status: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
}