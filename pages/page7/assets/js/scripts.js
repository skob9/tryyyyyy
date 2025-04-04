// DOM Elements
const dashboardNav = document.getElementById('dashboard-nav');
const permissionsNav = document.getElementById('permissions-nav');
const logoutNav = document.getElementById('logout-nav');
const dashboardPanel = document.getElementById('dashboard-panel');
const permissionsPanel = document.getElementById('permissions-panel');
const permissionsTableBody = document.getElementById('permissions-table-body');

// Sample permissions data
const permissionsData = [
    { id: 1, name: "User 1", title: "Admin Access", category: "System", status: "Review" },
    { id: 2, name: "User 2", title: "Content Editor", category: "Content", status: "Review" },
    { id: 3, name: "User 3", title: "Moderator", category: "Community", status: "Pending" },
    { id: 4, name: "User 4", title: "Viewer", category: "Reports", status: "Posted" }
];

// Store the full user data globally so we can filter it
let allUsers = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set up navigation click events
    if (dashboardNav) {
        dashboardNav.addEventListener('click', function(e) {
            e.preventDefault();
            showDashboard();
        });
    }
    
    if (permissionsNav) {
        permissionsNav.addEventListener('click', function(e) {
            e.preventDefault();
            showPermissions();
        });
    }
    
    if (logoutNav) {
        logoutNav.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Populate permissions table
    populatePermissionsTable();
    
    // Show permissions panel by default
    showPermissions();
});

// Function to fetch and populate user data
async function populateUserDatabase() {
    try {
        const response = await fetch('https://demo-api-skills.vercel.app/api/DIYHomes/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (response.ok) {
            console.log('API Response data:', data);
            
            // Store all users in our global variable
            allUsers = data;
            
            // Ensure we have IDs as expected
            console.log('User IDs:', allUsers.map(user => user.id));
            
            populateUserManagement(data);
            
            // Setup search functionality after data is loaded
            setupSearchFunctionality();
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        alert('Error fetching users: ' + error);
    }
}

// Setup search functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('user-id-search');
    const searchBtn = document.getElementById('search-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const searchId = searchInput.value.trim();
            if (searchId === '') {
                alert('Please enter a user ID to search');
                return;
            }
            
            console.log('Searching for ID:', searchId);
            console.log('All users:', allUsers);
            
            // Convert to string for comparison to ensure matching works properly
            const filteredUsers = allUsers.filter(user => String(user.id) === String(searchId));
            
            console.log('Filtered users:', filteredUsers);
            
            if (filteredUsers.length === 0) {
                alert(`No user found with ID: ${searchId}`);
                return;
            }
            
            // Display the filtered results
            populateUserManagement(filteredUsers);
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            populateUserManagement(allUsers);
        });
    }
}

// Show Dashboard Panel
function showDashboard() {
    // Update active navigation
    dashboardNav.classList.add('active');
    permissionsNav.classList.remove('active');
    
    // Show dashboard panel, hide permissions panel
    dashboardPanel.classList.remove('hidden');
    permissionsPanel.classList.add('hidden');

    populateUserDatabase();
}

// Show Permissions Panel
function showPermissions() {
    // Update active navigation
    permissionsNav.classList.add('active');
    dashboardNav.classList.remove('active');
    
    // Show permissions panel, hide dashboard panel
    permissionsPanel.classList.remove('hidden');
    dashboardPanel.classList.add('hidden');
}

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // In a real app, this would redirect to logout endpoint
        alert('Logout functionality will be implemented when the site is complete.');
    }
}

// Populate Permissions Table
function populatePermissionsTable() {
    if (permissionsTableBody) {
        permissionsTableBody.innerHTML = '';
        
        permissionsData.forEach(permission => {
            const row = document.createElement('tr');
            
            // Format status badge class based on status value
            const statusClass = `status-${permission.status.toLowerCase()}`;
            
            row.innerHTML = `
                <td>${permission.id}</td>
                <td>${permission.name}</td>
                <td>${permission.title}</td>
                <td>${permission.category}</td>
                <td><span class="status-badge ${statusClass}">${permission.status}</span></td>
            `;
            
            permissionsTableBody.appendChild(row);
        });
    }
}

function populateUserManagement(users) {
    // Get reference to the table body
    const tableBody = document.querySelector('#dashboard-panel .data-table tbody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Update total users count
    const userCountElement = document.querySelector('.user-icon').nextElementSibling.querySelector('.stat-value');
    userCountElement.textContent = users.length;
    
    // If there are no users, show the empty state and hide table
    const emptyState = document.querySelector('#dashboard-panel .empty-state');
    const dataTable = document.querySelector('#dashboard-panel .data-table');
    
    if (users.length === 0) {
      emptyState.style.display = 'flex';
      dataTable.style.display = 'none';
      return;
    }
    
    // Hide empty state and show table
    emptyState.style.display = 'none';
    dataTable.style.display = 'table';
    
    // Add a row for each user
    users.forEach(user => {
      const row = document.createElement('tr');
      
      // Create cells
      const idCell = document.createElement('td');
      idCell.textContent = user.id;
      
      const nameCell = document.createElement('td');
      nameCell.textContent = user.name;
      
      const emailCell = document.createElement('td');
      emailCell.textContent = user.email;
      
      const roleCell = document.createElement('td');
      roleCell.textContent = user.role || 'User'; // Default role if not specified
      
      const dateCell = document.createElement('td');
      dateCell.textContent = user.registered || new Date().toLocaleDateString(); // Default to today if not specified
      
      // Create actions cell with delete button
      const actionsCell = document.createElement('td');
      const deleteButton = document.createElement('button');
      deleteButton.classList.add('delete-btn');
      deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
      deleteButton.addEventListener('click', () => deleteUser(user.id, user.email));
      actionsCell.appendChild(deleteButton);
      
      // Append cells to row
      row.appendChild(idCell);
      row.appendChild(nameCell);
      row.appendChild(emailCell);
      row.appendChild(roleCell);
      row.appendChild(dateCell);
      row.appendChild(actionsCell);
      
      // Append row to table body
      tableBody.appendChild(row);
    });
    
    // Show the dashboard panel if it's hidden
    const dashboardPanel = document.getElementById('dashboard-panel');
    dashboardPanel.classList.remove('hidden');
}

// Function to handle user deletion
async function deleteUser(userId, userEmail) {
    if (confirm(`Are you sure you want to delete user ${userEmail}?`)) {
        try {
            const response = await fetch(`https://demo-api-skills.vercel.app/api/DIYHomes/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                // Refresh the user list after successful deletion
                alert(`User ${userEmail} has been deleted successfully.`);
                populateUserDatabase();
            } else {
                const errorData = await response.json();
                alert(`Failed to delete user: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            alert(`Error deleting user: ${error.message}`);
        }
    }
}