// main.js
// Complete JavaScript functionality for the Volunteer Events Platform

// ========================
// DATA MODELS (Simulated Database)
// ========================

// Sample data structure for events
let events = [
    {
        id: 1,
        name: "Beach Cleanup",
        date: "2025-05-15",
        location: "Bar Beach",
        description: "Help clean the beach and protect marine life.",
        capacity: 50,
        registered: 32,
        category: "Environment"
    },
    {
        id: 2,
        name: "Food Bank Drive",
        date: "2025-05-20",
        location: "Community Center",
        description: "Sort and distribute food to families in need.",
        capacity: 30,
        registered: 25,
        category: "Community"
    },
    {
        id: 3,
        name: "Tree Planting",
        date: "2025-06-05",
        location: "Ramat Park",
        description: "Plant trees to restore local greenery.",
        capacity: 40,
        registered: 18,
        category: "Environment"
    },
    {
        id: 4,
        name: "Senior Care Visit",
        date: "2025-06-10",
        location: "Sunrise Senior Living",
        description: "Spend time with seniors, play games, and chat.",
        capacity: 20,
        registered: 12,
        category: "Community"
    }
];

// Sample data for volunteers
let volunteers = [
    { id: 1, name: "John Doe", email: "johndoe@email.com", status: "Active", eventsAttended: 3 },
    { id: 2, name: "Mary Musa", email: "bob@email.com", status: "Active", eventsAttended: 5 },
    { id: 3, name: "David James", email: "davidjames@email.com", status: "Pending", eventsAttended: 1 }
];

// Current logged-in user (simulated)
let currentUser = {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    role: "admin" // or "volunteer"
};

// Store registrations (eventId -> array of volunteerIds)
let eventRegistrations = {
    1: [1, 2],
    2: [1],
    3: [3],
    4: [2]
};

// Store certificates (volunteerId -> array of eventIds)
let certificates = [
    { volunteerId: 1, eventId: 1, date: "2025-04-01" },
    { volunteerId: 1, eventId: 2, date: "2025-04-10" },
    { volunteerId: 2, eventId: 1, date: "2025-04-01" }
];

// ========================
// UTILITY FUNCTIONS
// ========================

// Helper to get DOM elements safely
function getElement(id) {
    return document.getElementById(id);
}

// Show/hide sections
function showSection(sectionId) {
    const sections = ['dashboard-section', 'create-events-section', 'events-section', 'volunteers-section', 'certificates-section', 'profile-section', 'auth-section'];
    sections.forEach(section => {
        const el = getElement(section);
        if (el) el.style.display = 'none';
    });
    const activeSection = getElement(sectionId);
    if (activeSection) activeSection.style.display = 'block';
}

// Simple notification system
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 24px';
    notification.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
    notification.style.color = 'white';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ========================
// AUTHENTICATION & PROFILE
// ========================

// Handle login
function login(email, password) {
    // Simple validation - in real app, check against database
    if (email === currentUser.email && password === currentUser.password) {
        currentUser = { ...currentUser, isLoggedIn: true };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showNotification('Login successful!');
        updateUIForAuth();
        return true;
    } else {
        showNotification('Invalid email or password', 'error');
        return false;
    }
}

// Handle signup
function signup(name, email, password) {
    // Simple validation
    if (name && email && password) {
        currentUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password,
            role: 'volunteer',
            isLoggedIn: true
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showNotification('Account created successfully!');
        updateUIForAuth();
        return true;
    } else {
        showNotification('Please fill all fields', 'error');
        return false;
    }
}

// Handle logout
function logout() {
    currentUser = { isLoggedIn: false };
    localStorage.removeItem('currentUser');
    showNotification('Logged out successfully');
    updateUIForAuth();
}

// Update UI based on auth state
function updateUIForAuth() {
    const authState = currentUser && currentUser.isLoggedIn;
    const navLinks = document.querySelector('.NavLinks');
    const headerContainer = document.querySelector('.header-container');
    
    if (authState) {
        // Show main content, hide auth forms
        if (getElement('auth-section')) getElement('auth-section').style.display = 'none';
        showSection('dashboard-section');
        
        // Update nav to show user name
        if (navLinks) {
            const profileLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.textContent === 'Profile');
            if (profileLink) {
                profileLink.textContent = `👤 ${currentUser.name}`;
            }
        }
        
        // Load all data
        loadDashboardData();
        loadEventsList();
        loadVolunteersList();
        loadCertificatesList();
        loadProfileData();
    } else {
        // Show auth section
        if (getElement('auth-section')) getElement('auth-section').style.display = 'block';
        const sections = ['dashboard-section', 'create-events-section', 'events-section', 'volunteers-section', 'certificates-section', 'profile-section'];
        sections.forEach(section => {
            const el = getElement(section);
            if (el) el.style.display = 'none';
        });
        
        // Reset nav profile text
        if (navLinks) {
            const profileLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.textContent.includes('👤'));
            if (profileLink) {
                profileLink.textContent = 'Profile';
            }
        }
    }
}

// Load profile data
function loadProfileData() {
    if (!currentUser || !currentUser.isLoggedIn) return;
    
    const profileInfo = getElement('profile-info');
    if (profileInfo) {
        profileInfo.innerHTML = `
            <div class="profile-card">
                <h3>Personal Information</h3>
                <p><strong>Name:</strong> ${currentUser.name}</p>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Role:</strong> ${currentUser.role || 'Volunteer'}</p>
                <p><strong>Member Since:</strong> ${new Date().toLocaleDateString()}</p>
                <button onclick="toggleEditProfile()" class="btn-secondary">Edit Profile</button>
            </div>
        `;
    }
    
    const editForm = getElement('edit-profile-form');
    if (editForm) {
        editForm.innerHTML = `
            <h3>Edit Profile</h3>
            <div class="form-group">
                <label>Name:</label>
                <input type="text" id="edit-name" value="${currentUser.name}">
            </div>
            <div class="form-group">
                <label>Email:</label>
                <input type="email" id="edit-email" value="${currentUser.email}">
            </div>
            <div class="form-group">
                <label>New Password:</label>
                <input type="password" id="edit-password" placeholder="Leave blank to keep current">
            </div>
            <button onclick="updateProfile()" class="btn-primary">Save Changes</button>
            <button onclick="deleteAccount()" class="btn-danger" style="background:#f44336;">Delete Account</button>
        `;
    }
}

// Toggle edit profile form
function toggleEditProfile() {
    const editForm = getElement('edit-profile-form');
    if (editForm) {
        editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';
    }
}

// Update profile
function updateProfile() {
    const newName = getElement('edit-name')?.value;
    const newEmail = getElement('edit-email')?.value;
    const newPassword = getElement('edit-password')?.value;
    
    if (newName) currentUser.name = newName;
    if (newEmail) currentUser.email = newEmail;
    if (newPassword) currentUser.password = newPassword;
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showNotification('Profile updated successfully');
    loadProfileData();
    updateUIForAuth(); // Refresh nav
}

// Delete account
function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        logout();
        showNotification('Account deleted');
    }
}

// ========================
// DASHBOARD
// ========================

function loadDashboardData() {
    if (!currentUser || !currentUser.isLoggedIn) return;
    
    const upcomingEvents = events.filter(e => new Date(e.date) > new Date());
    const myEvents = eventRegistrations[currentUser.id] || [];
    const myEventsCount = myEvents.length;
    const certificatesCount = certificates.filter(c => c.volunteerId === currentUser.id).length;
    
    const dashboardStats = getElement('dashboard-stats');
    if (dashboardStats) {
        dashboardStats.innerHTML = `
            <div class="stat-card">
                <h4>Total Events</h4>
                <p>${events.length}</p>
            </div>
            <div class="stat-card">
                <h4>Upcoming Events</h4>
                <p>${upcomingEvents.length}</p>
            </div>
            <div class="stat-card">
                <h4>My Registrations</h4>
                <p>${myEventsCount}</p>
            </div>
            <div class="stat-card">
                <h4>Certificates Earned</h4>
                <p>${certificatesCount}</p>
            </div>
        `;
    }
    
    const upcomingList = getElement('upcoming-events-list');
    if (upcomingList) {
        upcomingList.innerHTML = upcomingEvents.slice(0, 3).map(event => `
            <div class="event-item">
                <strong>${event.name}</strong> - ${event.date} at ${event.location}
                <button onclick="registerForEvent(${event.id})" class="btn-small">Register</button>
            </div>
        `).join('');
    }
}

// ========================
// EVENTS MANAGEMENT
// ========================

function loadEventsList() {
    const eventsContainer = getElement('events-list');
    if (!eventsContainer) return;
    
    eventsContainer.innerHTML = events.map(event => {
        const isRegistered = eventRegistrations[event.id]?.includes(currentUser?.id);
        const spotsLeft = event.capacity - event.registered;
        
        return `
            <div class="event-card">
                <h3>${event.name}</h3>
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Location:</strong> ${event.location}</p>
                <p><strong>Category:</strong> ${event.category}</p>
                <p>${event.description}</p>
                <p><strong>Spots Left:</strong> ${spotsLeft} / ${event.capacity}</p>
                ${!isRegistered ? 
                    `<button onclick="registerForEvent(${event.id})" class="btn-primary">Register</button>` : 
                    `<button disabled class="btn-disabled">Already Registered</button>`
                }
                ${currentUser?.role === 'admin' ? 
                    `<button onclick="deleteEvent(${event.id})" class="btn-danger">Delete</button>` : ''
                }
            </div>
        `;
    }).join('');
}

function registerForEvent(eventId) {
    if (!currentUser || !currentUser.isLoggedIn) {
        showNotification('Please login to register', 'error');
        return;
    }
    
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    if (event.registered >= event.capacity) {
        showNotification('Event is full!', 'error');
        return;
    }
    
    // Check if already registered
    if (eventRegistrations[eventId]?.includes(currentUser.id)) {
        showNotification('Already registered for this event', 'error');
        return;
    }
    
    // Register user
    if (!eventRegistrations[eventId]) eventRegistrations[eventId] = [];
    eventRegistrations[eventId].push(currentUser.id);
    event.registered++;
    
    showNotification(`Successfully registered for ${event.name}!`);
    loadEventsList();
    loadDashboardData();
    loadVolunteersList(); // Refresh volunteer list
}

function createEvent(eventData) {
    const newEvent = {
        id: events.length + 1,
        name: eventData.name,
        date: eventData.date,
        location: eventData.location,
        description: eventData.description,
        capacity: parseInt(eventData.capacity),
        registered: 0,
        category: eventData.category
    };
    
    events.push(newEvent);
    showNotification('Event created successfully!');
    loadEventsList();
    loadDashboardData();
}

function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        events = events.filter(e => e.id !== eventId);
        delete eventRegistrations[eventId];
        showNotification('Event deleted');
        loadEventsList();
        loadDashboardData();
        loadVolunteersList();
    }
}

// ========================
// VOLUNTEERS MANAGEMENT
// ========================

function loadVolunteersList() {
    const volunteersContainer = getElement('volunteers-list');
    if (!volunteersContainer) return;
    
    // Get volunteers with their event counts
    const volunteersWithStats = volunteers.map(vol => ({
        ...vol,
        eventCount: Object.values(eventRegistrations).flat().filter(id => id === vol.id).length
    }));
    
    volunteersContainer.innerHTML = `
        <table class="data-table">
            <thead>
                <tr><th>Name</th><th>Email</th><th>Status</th><th>Events Attended</th><th>Actions</th></tr>
            </thead>
            <tbody>
                ${volunteersWithStats.map(vol => `
                    <tr>
                        <td>${vol.name}</td>
                        <td>${vol.email}</td>
                        <td><span class="status-badge ${vol.status.toLowerCase()}">${vol.status}</span></td>
                        <td>${vol.eventCount}</td>
                        <td>
                            <button onclick="viewVolunteerDetails(${vol.id})" class="btn-small">View</button>
                            ${currentUser?.role === 'admin' ? `<button onclick="deleteVolunteer(${vol.id})" class="btn-small btn-danger">Delete</button>` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function viewVolunteerDetails(volunteerId) {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (!volunteer) return;
    
    // Find events this volunteer registered for
    const registeredEvents = [];
    for (const [eventId, regs] of Object.entries(eventRegistrations)) {
        if (regs.includes(volunteerId)) {
            const event = events.find(e => e.id === parseInt(eventId));
            if (event) registeredEvents.push(event);
        }
    }
    
    alert(`Volunteer: ${volunteer.name}\nEmail: ${volunteer.email}\nStatus: ${volunteer.status}\nEvents: ${registeredEvents.map(e => e.name).join(', ') || 'None'}`);
}

function deleteVolunteer(volunteerId) {
    if (confirm('Delete this volunteer?')) {
        volunteers = volunteers.filter(v => v.id !== volunteerId);
        // Remove from registrations
        for (const eventId in eventRegistrations) {
            eventRegistrations[eventId] = eventRegistrations[eventId].filter(id => id !== volunteerId);
        }
        showNotification('Volunteer deleted');
        loadVolunteersList();
        loadEventsList(); // Update event counts
    }
}

// ========================
// CERTIFICATES MANAGEMENT
// ========================

function loadCertificatesList() {
    const certificatesContainer = getElement('certificates-list');
    if (!certificatesContainer) return;
    
    // Get certificates for current user or all if admin
    const userCerts = currentUser?.role === 'admin' ? 
        certificates : 
        certificates.filter(c => c.volunteerId === currentUser?.id);
    
    const certsWithDetails = userCerts.map(cert => {
        const volunteer = volunteers.find(v => v.id === cert.volunteerId);
        const event = events.find(e => e.id === cert.eventId);
        return {
            ...cert,
            volunteerName: volunteer?.name || 'Unknown',
            eventName: event?.name || 'Unknown Event'
        };
    });
    
    if (certsWithDetails.length === 0) {
        certificatesContainer.innerHTML = '<p>No certificates yet. Complete events to earn certificates!</p>';
        return;
    }
    
    certificatesContainer.innerHTML = `
        <table class="data-table">
            <thead>
                <tr><th>Volunteer</th><th>Event</th><th>Date Earned</th><th>Actions</th></tr>
            </thead>
            <tbody>
                ${certsWithDetails.map(cert => `
                    <tr>
                        <td>${cert.volunteerName}</td>
                        <td>${cert.eventName}</td>
                        <td>${cert.date}</td>
                        <td><button onclick="downloadCertificate(${cert.volunteerId}, ${cert.eventId})" class="btn-small">Download</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function downloadCertificate(volunteerId, eventId) {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    const event = events.find(e => e.id === eventId);
    if (volunteer && event) {
        // Simulate certificate download
        const certContent = `Certificate of Volunteering\n\nThis certifies that ${volunteer.name} has successfully volunteered for ${event.name} on ${event.date}.\n\nDate: ${new Date().toLocaleDateString()}`;
        const blob = new Blob([certContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${volunteer.name}_${event.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Certificate downloaded');
    }
}


// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.NavLinks a');
    const pageMapping = {
        'Dashboard': 'dashboard-section',
        'Create Events': 'create-events-section',
        'Events': 'events-section',
        'Volunteers': 'volunteers-section',
        'Certificates': 'certificates-section',
        'Profile': 'profile-section',
        'Log Out': 'logout'
    };
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const text = link.textContent.replace('👤', '').trim();
            
            if (text === 'Log Out') {
                e.preventDefault();
                logout();
                return;
            }
            
            if (pageMapping[text]) {
                e.preventDefault();
                if (currentUser && currentUser.isLoggedIn) {
                    showSection(pageMapping[text]);
                    // Refresh data when navigating
                    if (pageMapping[text] === 'dashboard-section') loadDashboardData();
                    if (pageMapping[text] === 'events-section') loadEventsList();
                    if (pageMapping[text] === 'volunteers-section') loadVolunteersList();
                    if (pageMapping[text] === 'certificates-section') loadCertificatesList();
                    if (pageMapping[text] === 'profile-section') loadProfileData();
                } else {
                    showNotification('Please login first', 'error');
                }
            }
        });
    });
}

// ========================
// INITIALIZATION
// ========================

function init() {
    // Check for stored user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
    
    // Create missing sections in HTML if needed
    const mainContainer = document.querySelector('body');
    const sections = ['dashboard-section', 'create-events-section', 'events-section', 'volunteers-section', 'certificates-section', 'profile-section', 'auth-section'];
    sections.forEach(section => {
        if (!getElement(section)) {
            const div = document.createElement('div');
            div.id = section;
            div.style.display = 'none';
            document.body.appendChild(div);
        }
    });
    
    // Populate sections with content
    const dashboardSection = getElement('dashboard-section');
    if (dashboardSection) dashboardSection.innerHTML = '<h2>Dashboard</h2><div id="dashboard-stats" class="stats-grid"></div><h3>Upcoming Events</h3><div id="upcoming-events-list"></div>';
    
    const createSection = getElement('create-events-section');
    if (createSection) createSection.innerHTML = `
        <h2>Create New Event</h2>
        <form id="create-event-form" class="event-form">
            <div class="form-group"><label>Event Name</label><input type="text" id="event-name" required></div>
            <div class="form-group"><label>Date</label><input type="date" id="event-date" required></div>
            <div class="form-group"><label>Location</label><input type="text" id="event-location" required></div>
            <div class="form-group"><label>Description</label><textarea id="event-description" rows="3"></textarea></div>
            <div class="form-group"><label>Capacity</label><input type="number" id="event-capacity" required></div>
            <div class="form-group"><label>Category</label><select id="event-category"><option>Environment</option><option>Community</option><option>Education</option></select></div>
            <button type="submit" class="btn-primary">Create Event</button>
        </form>
    `;
    
    const eventsSection = getElement('events-section');
    if (eventsSection) eventsSection.innerHTML = '<h2>All Events</h2><div id="events-list" class="events-grid"></div>';
    
    const volunteersSection = getElement('volunteers-section');
    if (volunteersSection) volunteersSection.innerHTML = '<h2>Volunteers</h2><div id="volunteers-list"></div>';
    
    const certificatesSection = getElement('certificates-section');
    if (certificatesSection) certificatesSection.innerHTML = '<h2>Certificates</h2><div id="certificates-list"></div>';
    
    const profileSection = getElement('profile-section');
    if (profileSection) profileSection.innerHTML = '<h2>My Profile</h2><div id="profile-info"></div><div id="edit-profile-form" style="display:none"></div><button id="change-password-btn" class="btn-secondary">Change Password</button>';
    
    const authSection = getElement('auth-section');
    if (authSection) authSection.innerHTML = `
        <div class="auth-container">
            <div class="auth-form">
                <h2>Login</h2>
                <form id="login-form">
                    <input type="email" id="login-email" placeholder="Email" required>
                    <input type="password" id="login-password" placeholder="Password" required>
                    <button type="submit">Login</button>
                    <a href="#forgot">Forgot Password?</a>
                </form>
            </div>
            <div class="auth-form">
                <h2>Sign Up</h2>
                <form id="signup-form">
                    <input type="text" id="signup-name" placeholder="Full Name" required>
                    <input type="email" id="signup-email" placeholder="Email" required>
                    <input type="password" id="signup-password" placeholder="Password" required>
                    <button type="submit">Sign Up</button>
                </form>
            </div>
        </div>
    `;
    
    setupEventListeners();
    setupNavigation();
    updateUIForAuth();
    
    // Add basic CSS styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
        .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .event-card, .profile-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .data-table { width: 100%; border-collapse: collapse; background: white; }
        .data-table th, .data-table td { padding: 12px; border: 1px solid #ddd; text-align: left; }
        .data-table th { background: #f2f2f2; }
        .btn-primary, .btn-secondary, .btn-small, .btn-danger { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
        .btn-primary { background: #4CAF50; color: white; }
        .btn-secondary { background: #2196F3; color: white; }
        .btn-danger { background: #f44336; color: white; }
        .btn-small { padding: 4px 8px; font-size: 12px; }
        .btn-disabled { background: #ccc; cursor: not-allowed; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .auth-container { display: flex; gap: 40px; justify-content: center; padding: 40px; }
        .auth-form { background: white; padding: 30px; border-radius: 8px; width: 300px; }
        .auth-form input { width: 100%; padding: 10px; margin: 10px 0; }
        .auth-form button { width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; }
        .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; }
        .status-badge.active { background: #4CAF50; color: white; }
        .status-badge.pending { background: #ff9800; color: white; }
        .NavLinks { list-style: none; display: flex; gap: 20px; background: #333; padding: 15px; margin: 0; }
        .NavLinks a { color: white; text-decoration: none; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f9f9f9; }
        h2 { padding: 20px; margin: 0; }
    `;
    document.head.appendChild(style);
}

// Start the application
init();