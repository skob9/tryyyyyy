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

// On page load, check if a user is logged in and update the header accordingly
document.addEventListener('DOMContentLoaded', function() {

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        updateHeaderForLoggedInUser(currentUser);
    }
    const searchInput = document.querySelector('.search-container input');
    const searchButton = document.querySelector('.search-container button');
    
    // Function to search all content on the page (including header and footer)
    function searchPageContent() {
        const searchText = searchInput.value.trim().toLowerCase();
        if (!searchText) {
            // If search is empty, remove all highlights
            removeHighlights();
            return;
        }
        
        // First remove any previous highlighting
        removeHighlights();
        
        // Create an array of all text elements to search (including header and footer)
        const textElements = [];
        
        // Helper function to recursively get all text nodes
        function getTextNodes(element) {
            if (element.nodeType === 3) { // Text node
                // Skip empty text nodes
                if (element.nodeValue.trim() !== '') {
                    textElements.push({
                        node: element,
                        parent: element.parentNode
                    });
                }
            } else if (element.nodeType === 1 && element.childNodes) { // Element node
                // Skip script, style, and noscript elements
                if (!['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)) {
                    // Also skip if the element is inside a search highlight
                    if (!element.closest('.search-highlight')) {
                        for (let i = 0; i < element.childNodes.length; i++) {
                            getTextNodes(element.childNodes[i]);
                        }
                    }
                }
            }
        }
        
        // Get all text nodes in the entire document body
        getTextNodes(document.body);
        
        // Array to store matches
        const matches = [];
        
        // Search through all text elements
        textElements.forEach(item => {
            const text = item.node.nodeValue;
            const lowerText = text.toLowerCase();
            
            // Check if the text contains the search term
            if (lowerText.includes(searchText)) {
                matches.push(item);
            }
        });
        
        // If matches found, highlight them
        if (matches.length > 0) {
            matches.forEach(match => {
                const text = match.node.nodeValue;
                
                // Create a wrapper element
                const wrapper = document.createElement('span');
                
                // Create highlighted HTML
                const highlightedText = text.replace(
                    new RegExp(searchText, 'gi'),
                    (matched) => `<span class="search-highlight">${matched}</span>`
                );
                
                // Set the wrapper's HTML
                wrapper.innerHTML = highlightedText;
                
                // Replace the text node with our wrapper
                if (match.parent) {
                    match.parent.replaceChild(wrapper, match.node);
                }
            });
            
            // Scroll to the first match
            const firstMatch = document.querySelector('.search-highlight');
            if (firstMatch) {
                firstMatch.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
            
            // Add a match counter notification
            showNotification(`Found ${matches.length} match${matches.length > 1 ? 'es' : ''} for "${searchText}"`);
        } else {
            // Show no matches found
            showNotification(`No matches found for "${searchText}"`);
        }
    }
    
    // Function to remove all search highlights
    function removeHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.innerHTML = parent.innerHTML.replace(/<span class="search-highlight"[^>]*>(.*?)<\/span>/g, '$1');
            }
        });
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
        notification.style.fontWeight = 'bold';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Add event listener for search button click
    if (searchButton) {
        searchButton.addEventListener('click', function(event) {
            event.preventDefault();
            searchPageContent();
        });
    }
    
    // Add event listener for pressing Enter key in search input
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchPageContent();
            }
        });
        
        // Clear highlights when search input is cleared
        searchInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                removeHighlights();
            }
        });
    }
    
    // Add styles for highlighted search results
    const style = document.createElement('style');
    style.textContent = `
        .search-highlight {
            background-color: #FB8143;
            color: white;
            padding: 0 2px;
            border-radius: 2px;
            font-weight: bold;
        }
        
        #search-notification {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
    `;
    document.head.appendChild(style);
});