document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const addStepBtn = document.getElementById('addStepBtn');
    const stepsContainer = document.getElementById('steps-container');
    const cancelBtn = document.getElementById('cancelBtn');
    const publishBtn = document.getElementById('publishBtn');
    
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        updateHeaderForLoggedInUser(currentUser);
    }
    
    // Set up counter for step numbers
    let stepCounter = 2; // Start at 2 because we already have steps 1 and 2 in the HTML
    
    // Add a new step
    addStepBtn.addEventListener('click', function() {
        stepCounter++;
        
        // Create a new step element
        const newStep = document.createElement('div');
        newStep.className = 'step-group';
        newStep.dataset.step = stepCounter;
        
        newStep.innerHTML = `
            <h3 class="step-title">Step ${stepCounter}: <span class="step-title-edit" contenteditable="true">Enter Step Title</span></h3>
            <textarea class="full-width step-description" placeholder="Write a detailed description of this step."></textarea>
        `;
        
        // Add the new step to the steps container
        stepsContainer.appendChild(newStep);
        
        // Make the new step's title editable
        const titleElement = newStep.querySelector('.step-title-edit');
        makeEditableFocus(titleElement);
    });
    
    // Make all editable titles focusable on click
    document.querySelectorAll('.step-title-edit').forEach(element => {
        element.addEventListener('click', function() {
            this.focus();
        });
    });
    
    // Function to focus and select all text in an editable element
    function makeEditableFocus(element) {
        element.focus();
        // Select all the text in the element
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    // Cancel button event
    cancelBtn.addEventListener('click', function() {
        if(confirm('Are you sure you want to cancel? All your progress will be lost.')) {
            // Redirect to the home page or previous page
            window.history.back();
            // Alternatively: window.location.href = 'index.html';
        }
    });
    
    // Publish button event
    publishBtn.addEventListener('click', function() {
        // Collect form data
        const formData = {
            id: Date.now().toString(), // Generate a unique ID for the project
            title: document.getElementById('projectTitle').value,
            category: document.getElementById('category').value,
            introduction: document.querySelector('.form-section:nth-child(3) textarea').value,
            supplies: document.querySelector('.form-section:nth-child(4) textarea').value,
            steps: [],
            author: currentUser ? currentUser.username : 'Anonymous',
            datePublished: new Date().toISOString()
        };
        
        // Collect all steps
        document.querySelectorAll('.step-group').forEach(stepElement => {
            const stepNumber = stepElement.dataset.step;
            const stepTitle = stepElement.querySelector('.step-title-edit').textContent;
            const stepDescription = stepElement.querySelector('.step-description').value;
            
            formData.steps.push({
                number: stepNumber,
                title: stepTitle,
                description: stepDescription
            });
        });
        
        // Validate form data
        if (!formData.title.trim()) {
            alert('Please provide a project title');
            return;
        }
        
        if (!formData.category) {
            alert('Please select a category');
            return;
        }
        
        // Save the project to localStorage
        saveProject(formData);
        
        // Show success message
        alert('Project published successfully!');
        
        // Redirect to the projects page
        window.location.href = '../../../../pages/page3/index.html';
    });
    
    // Function to save project to localStorage
    function saveProject(project) {
        // Get existing projects from localStorage
        let projects = JSON.parse(localStorage.getItem('publishedProjects')) || [];
        
        // Add the new project
        projects.push(project);
        
        // Save back to localStorage
        localStorage.setItem('publishedProjects', JSON.stringify(projects));
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
    window.navigateToProfile = function() {
        window.location.href = '../../../../pages/page5/index.html';
    };

    window.logout = function() {
        localStorage.removeItem('currentUser');
        window.location.href = '../../../../index.html';
    };

    // Function to update the header for a logged-in user
    function updateHeaderForLoggedInUser(user) {
        const navRight = document.querySelector('.nav-right');
        navRight.innerHTML = ''; // Clear default buttons

        // Create "Post" button
        const postButton = document.createElement('button');
        postButton.className = 'btn btn-primary';
        postButton.textContent = 'Post';
        postButton.onclick = function() {
            // We're already on the post creation page
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
});