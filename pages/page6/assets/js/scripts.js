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
    }
    
    // Set up favorite and "I made it" buttons
    setupActionButtons();
    
    // Set up comment submission
    setupCommentSubmission(projectId);
});

function loadProjectDetails(projectId) {
    const publishedProjects = JSON.parse(localStorage.getItem('publishedProjects')) || [];
    const project = publishedProjects.find(p => p.id === projectId);
    
    if (!project) {
        // Redirect to projects page if project not found
        window.location.href = '../../../../pages/page3/index.html';
        return;
    }
    
    // Update project header
    document.getElementById('project-title').textContent = project.title;
    document.getElementById('project-author').textContent = `By ${project.author}`;
    document.getElementById('project-introduction').textContent = project.introduction;
    
    // Update supplies section
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
    
    // Update project steps
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

function setupActionButtons() {
    const favoriteButton = document.querySelector('.favorite-btn');
    const madeItButton = document.querySelector('.made-it-btn');
    
    if (favoriteButton) {
        favoriteButton.addEventListener('click', function() {
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-regular');
            icon.classList.toggle('fa-solid');
            this.style.color = icon.classList.contains('fa-solid') ? '#FB8143' : '#666';
        });
    }
    
    if (madeItButton) {
        madeItButton.addEventListener('click', function() {
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-regular');
            icon.classList.toggle('fa-solid');
            this.style.color = icon.classList.contains('fa-solid') ? '#FB8143' : '#666';
        });
    }
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
    window.location.href = '../../../../pages/page5/index.html';
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../../../../index.html';
}