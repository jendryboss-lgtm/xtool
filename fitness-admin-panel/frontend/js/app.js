// App State
let currentUser = null;
let currentPage = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const user = await authAPI.me();
            currentUser = {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            };
            showApp();
        } catch (e) {
            showLogin();
        }
    } else {
        showLogin();
    }

    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Navigation
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            navigateTo(page);
        });
    });

    // Modal close
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') closeModal();
    });
});

// Auth
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
        const data = await authAPI.login(email, password);
        localStorage.setItem('token', data.token);
        currentUser = data.user;
        showApp();
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    showLogin();
}

function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    document.getElementById('user-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('user-role').textContent = currentUser.role;
    navigateTo('dashboard');
}

// Navigation
function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
    });
    renderPage(page);
}

// Page Rendering
async function renderPage(page) {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="empty-state">Loading...</div>';

    try {
        switch (page) {
            case 'dashboard': await renderDashboard(); break;
            case 'users': await renderUsers(); break;
            case 'plans': await renderPlans(); break;
            case 'programs': await renderPrograms(); break;
            case 'classes': await renderClasses(); break;
            case 'schedule': await renderSchedule(); break;
            case 'articles': await renderArticles(); break;
            case 'nutrition': await renderNutrition(); break;
            case 'products': await renderProducts(); break;
            case 'orders': await renderOrders(); break;
        }
    } catch (error) {
        content.innerHTML = `<div class="empty-state">Error loading page: ${error.message}</div>`;
    }
}

// Dashboard
async function renderDashboard() {
    const [stats, activity] = await Promise.all([
        dashboardAPI.stats(),
        dashboardAPI.activity()
    ]);

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Dashboard</h1>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon purple">👥</div>
                <div class="stat-label">Active Members</div>
                <div class="stat-value">${stats.activeMembers}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">🏋️</div>
                <div class="stat-label">Workout Programs</div>
                <div class="stat-value">${stats.totalPrograms}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">💰</div>
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">$${stats.totalRevenue?.toFixed(2) || '0.00'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">📅</div>
                <div class="stat-label">Upcoming Classes</div>
                <div class="stat-value">${stats.upcomingClasses}</div>
            </div>
        </div>

        <div class="grid-3">
            <div class="card">
                <div class="card-header"><h3 class="card-title">Recent Members</h3></div>
                ${activity.recentUsers.map(u => `
                    <div class="list-item">
                        <div>
                            <div class="font-bold">${u.first_name} ${u.last_name}</div>
                            <div class="text-muted">${u.email}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="card">
                <div class="card-header"><h3 class="card-title">Recent Orders</h3></div>
                ${activity.recentOrders.map(o => `
                    <div class="list-item">
                        <div style="flex:1">
                            <div class="font-bold">Order #${o.id}</div>
                            <div class="text-muted">${o.first_name} ${o.last_name}</div>
                        </div>
                        <div>
                            <div class="font-bold">$${o.total_amount}</div>
                            <span class="badge badge-${o.status === 'delivered' ? 'success' : 'info'}">${o.status}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="card">
                <div class="card-header"><h3 class="card-title">Upcoming Classes</h3></div>
                ${activity.upcomingClasses.map(c => `
                    <div class="list-item">
                        <div>
                            <div class="font-bold">${c.class_name}</div>
                            <div class="text-muted">${formatDate(c.start_time)} - ${c.location}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Users
async function renderUsers() {
    const [usersData, plans] = await Promise.all([
        usersAPI.list(),
        plansAPI.list()
    ]);
    const users = usersData.users;

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Users</h1>
            <button class="btn btn-primary" onclick="showUserModal()">Add User</button>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Phone</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td class="font-bold">${u.first_name} ${u.last_name}</td>
                                <td>${u.email}</td>
                                <td><span class="badge badge-${u.role === 'admin' ? 'purple' : u.role === 'trainer' ? 'info' : 'success'}">${u.role}</span></td>
                                <td><span class="badge badge-${u.membership_status === 'active' ? 'success' : 'warning'}">${u.membership_status}</span></td>
                                <td>${u.phone || '-'}</td>
                                <td class="action-btns">
                                    <button class="btn btn-secondary btn-sm" onclick="showUserModal(${u.id})">Edit</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.usersData = users;
    window.plansData = plans;
}

async function showUserModal(id = null) {
    const user = id ? window.usersData.find(u => u.id === id) : null;
    const plans = window.plansData || await plansAPI.list();

    showModal(`
        <div class="modal-header">
            <h3 class="modal-title">${user ? 'Edit' : 'Add'} User</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <form onsubmit="saveUser(event, ${id})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">First Name</label>
                    <input type="text" class="form-input" name="firstName" value="${user?.first_name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Last Name</label>
                    <input type="text" class="form-input" name="lastName" value="${user?.last_name || ''}" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" name="email" value="${user?.email || ''}" required ${user ? 'disabled' : ''}>
            </div>
            ${!user ? `
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" name="password" required>
                </div>
            ` : ''}
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Role</label>
                    <select class="form-input" name="role">
                        <option value="member" ${user?.role === 'member' ? 'selected' : ''}>Member</option>
                        <option value="trainer" ${user?.role === 'trainer' ? 'selected' : ''}>Trainer</option>
                        <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-input" name="phone" value="${user?.phone || ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Membership Plan</label>
                    <select class="form-input" name="membershipPlanId">
                        <option value="">None</option>
                        ${plans.map(p => `<option value="${p.id}" ${user?.membership_plan_id === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-input" name="membershipStatus">
                        <option value="active" ${user?.membership_status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user?.membership_status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="suspended" ${user?.membership_status === 'suspended' ? 'selected' : ''}>Suspended</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `);
}

async function saveUser(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = {
        firstName: form.firstName.value,
        lastName: form.lastName.value,
        email: form.email?.value,
        password: form.password?.value,
        role: form.role.value,
        phone: form.phone.value,
        membershipPlanId: form.membershipPlanId.value || null,
        membershipStatus: form.membershipStatus.value
    };

    try {
        if (id) {
            await usersAPI.update(id, data);
        } else {
            await usersAPI.create(data);
        }
        closeModal();
        renderUsers();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        await usersAPI.delete(id);
        renderUsers();
    }
}

// Plans
async function renderPlans() {
    const plans = await plansAPI.list();

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Membership Plans</h1>
            <button class="btn btn-primary" onclick="showPlanModal()">Add Plan</button>
        </div>
        <div class="stats-grid">
            ${plans.map(p => `
                <div class="card" style="margin-bottom:0">
                    <div style="display:flex;justify-content:space-between;margin-bottom:16px">
                        <div>
                            <h3 style="font-size:18px;font-weight:600;margin-bottom:4px">${p.name}</h3>
                            <span class="badge badge-${p.is_active ? 'success' : 'warning'}">${p.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div style="text-align:right">
                            <div style="font-size:28px;font-weight:700;color:#6366f1">$${p.price}</div>
                            <div class="text-muted">/${p.duration_months === 1 ? 'month' : p.duration_months + ' months'}</div>
                        </div>
                    </div>
                    <p class="text-muted mb-4">${p.description || ''}</p>
                    ${p.features ? `
                        <ul style="list-style:none;font-size:14px;margin-bottom:16px">
                            ${p.features.split(',').map(f => `<li style="padding:4px 0"><span style="color:#16a34a;margin-right:8px">✓</span>${f.trim()}</li>`).join('')}
                        </ul>
                    ` : ''}
                    <div class="action-btns">
                        <button class="btn btn-secondary btn-sm" onclick="showPlanModal(${p.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deletePlan(${p.id})">Delete</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    window.plansData = plans;
}

async function showPlanModal(id = null) {
    const plan = id ? window.plansData.find(p => p.id === id) : null;

    showModal(`
        <div class="modal-header">
            <h3 class="modal-title">${plan ? 'Edit' : 'Add'} Plan</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <form onsubmit="savePlan(event, ${id})">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-input" name="name" value="${plan?.name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-input" name="description" rows="2">${plan?.description || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Price ($)</label>
                    <input type="number" step="0.01" class="form-input" name="price" value="${plan?.price || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Duration (months)</label>
                    <input type="number" class="form-input" name="durationMonths" value="${plan?.duration_months || ''}" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Features (comma-separated)</label>
                <textarea class="form-input" name="features" rows="3">${plan?.features || ''}</textarea>
            </div>
            <div class="form-group">
                <label><input type="checkbox" name="isActive" ${plan?.is_active !== 0 ? 'checked' : ''}> Active</label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `);
}

async function savePlan(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.name.value,
        description: form.description.value,
        price: parseFloat(form.price.value),
        durationMonths: parseInt(form.durationMonths.value),
        features: form.features.value,
        isActive: form.isActive.checked
    };

    try {
        if (id) {
            await plansAPI.update(id, data);
        } else {
            await plansAPI.create(data);
        }
        closeModal();
        renderPlans();
    } catch (error) {
        alert(error.message);
    }
}

async function deletePlan(id) {
    if (confirm('Delete this plan?')) {
        await plansAPI.delete(id);
        renderPlans();
    }
}

// Programs
async function renderPrograms() {
    const [programs, trainers] = await Promise.all([
        programsAPI.list(),
        trainersAPI.list()
    ]);

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Workout Programs</h1>
            <button class="btn btn-primary" onclick="showProgramModal()">Add Program</button>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Title</th><th>Difficulty</th><th>Duration</th><th>Category</th><th>Trainer</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${programs.map(p => `
                            <tr>
                                <td class="font-bold">${p.title}</td>
                                <td><span class="badge badge-${p.difficulty === 'beginner' ? 'success' : p.difficulty === 'intermediate' ? 'warning' : 'danger'}">${p.difficulty}</span></td>
                                <td>${p.duration_weeks} weeks</td>
                                <td>${p.category || '-'}</td>
                                <td>${p.trainer_name || '-'}</td>
                                <td><span class="badge badge-${p.is_published ? 'success' : 'warning'}">${p.is_published ? 'Published' : 'Draft'}</span></td>
                                <td class="action-btns">
                                    <button class="btn btn-secondary btn-sm" onclick="showProgramModal(${p.id})">Edit</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteProgram(${p.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.programsData = programs;
    window.trainersData = trainers;
}

async function showProgramModal(id = null) {
    const program = id ? window.programsData.find(p => p.id === id) : null;
    const trainers = window.trainersData;

    showModal(`
        <div class="modal-header">
            <h3 class="modal-title">${program ? 'Edit' : 'Add'} Program</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <form onsubmit="saveProgram(event, ${id})">
            <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" class="form-input" name="title" value="${program?.title || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-input" name="description" rows="3">${program?.description || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Difficulty</label>
                    <select class="form-input" name="difficulty">
                        <option value="beginner" ${program?.difficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
                        <option value="intermediate" ${program?.difficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                        <option value="advanced" ${program?.difficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Duration (weeks)</label>
                    <input type="number" class="form-input" name="durationWeeks" value="${program?.duration_weeks || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <input type="text" class="form-input" name="category" value="${program?.category || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Trainer</label>
                    <select class="form-input" name="trainerId">
                        <option value="">Select</option>
                        ${trainers.map(t => `<option value="${t.id}" ${program?.trainer_id === t.id ? 'selected' : ''}>${t.first_name} ${t.last_name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label><input type="checkbox" name="isPublished" ${program?.is_published ? 'checked' : ''}> Published</label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `);
}

async function saveProgram(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = {
        title: form.title.value,
        description: form.description.value,
        difficulty: form.difficulty.value,
        durationWeeks: parseInt(form.durationWeeks.value),
        category: form.category.value,
        trainerId: form.trainerId.value || null,
        isPublished: form.isPublished.checked
    };

    try {
        if (id) await programsAPI.update(id, data);
        else await programsAPI.create(data);
        closeModal();
        renderPrograms();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteProgram(id) {
    if (confirm('Delete this program?')) {
        await programsAPI.delete(id);
        renderPrograms();
    }
}

// Classes
async function renderClasses() {
    const [classes, trainers] = await Promise.all([
        classesAPI.list(),
        trainersAPI.list()
    ]);

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Fitness Classes</h1>
            <button class="btn btn-primary" onclick="showClassModal()">Add Class</button>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Name</th><th>Type</th><th>Instructor</th><th>Capacity</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${classes.map(c => `
                            <tr>
                                <td class="font-bold">${c.name}</td>
                                <td><span class="badge badge-purple">${c.class_type || '-'}</span></td>
                                <td>${c.instructor_name || '-'}</td>
                                <td>${c.max_capacity}</td>
                                <td>${c.duration_minutes} min</td>
                                <td><span class="badge badge-${c.is_active ? 'success' : 'warning'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td class="action-btns">
                                    <button class="btn btn-secondary btn-sm" onclick="showClassModal(${c.id})">Edit</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteClass(${c.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.classesData = classes;
    window.trainersData = trainers;
}

async function showClassModal(id = null) {
    const cls = id ? window.classesData.find(c => c.id === id) : null;
    const trainers = window.trainersData;

    showModal(`
        <div class="modal-header">
            <h3 class="modal-title">${cls ? 'Edit' : 'Add'} Class</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <form onsubmit="saveClass(event, ${id})">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-input" name="name" value="${cls?.name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-input" name="description" rows="3">${cls?.description || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Class Type</label>
                    <select class="form-input" name="classType">
                        <option value="">Select</option>
                        ${['yoga', 'pilates', 'hiit', 'strength', 'dance', 'cycling'].map(t =>
                            `<option value="${t}" ${cls?.class_type === t ? 'selected' : ''}>${t}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Instructor</label>
                    <select class="form-input" name="instructorId">
                        <option value="">Select</option>
                        ${trainers.map(t => `<option value="${t.id}" ${cls?.instructor_id === t.id ? 'selected' : ''}>${t.first_name} ${t.last_name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Max Capacity</label>
                    <input type="number" class="form-input" name="maxCapacity" value="${cls?.max_capacity || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Duration (min)</label>
                    <input type="number" class="form-input" name="durationMinutes" value="${cls?.duration_minutes || ''}" required>
                </div>
            </div>
            <div class="form-group">
                <label><input type="checkbox" name="isActive" ${cls?.is_active !== 0 ? 'checked' : ''}> Active</label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `);
}

async function saveClass(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.name.value,
        description: form.description.value,
        classType: form.classType.value,
        instructorId: form.instructorId.value || null,
        maxCapacity: parseInt(form.maxCapacity.value),
        durationMinutes: parseInt(form.durationMinutes.value),
        isActive: form.isActive.checked
    };

    try {
        if (id) await classesAPI.update(id, data);
        else await classesAPI.create(data);
        closeModal();
        renderClasses();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteClass(id) {
    if (confirm('Delete this class?')) {
        await classesAPI.delete(id);
        renderClasses();
    }
}

// Schedule
async function renderSchedule() {
    const schedule = await scheduleAPI.list();

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Class Schedule</h1>
            <button class="btn btn-primary" onclick="showScheduleModal()">Add Schedule</button>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Date & Time</th><th>Class</th><th>Instructor</th><th>Location</th><th>Spots</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${schedule.map(s => `
                            <tr>
                                <td>
                                    <div class="font-bold">${formatDate(s.start_time)}</div>
                                    <div class="text-muted">${formatTime(s.start_time)} - ${formatTime(s.end_time)}</div>
                                </td>
                                <td><div class="font-bold">${s.class_name}</div><span class="badge badge-purple">${s.class_type}</span></td>
                                <td>${s.instructor_name}</td>
                                <td>${s.location}</td>
                                <td>${s.spots_available}</td>
                                <td><span class="badge badge-${s.status === 'scheduled' ? 'info' : s.status === 'completed' ? 'success' : 'danger'}">${s.status}</span></td>
                                <td class="action-btns">
                                    <button class="btn btn-secondary btn-sm" onclick="showScheduleModal(${s.id})">Edit</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteSchedule(${s.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.scheduleData = schedule;
}

async function showScheduleModal(id = null) {
    const [classes, trainers] = await Promise.all([classesAPI.list(), trainersAPI.list()]);
    const item = id ? window.scheduleData.find(s => s.id === id) : null;

    showModal(`
        <div class="modal-header">
            <h3 class="modal-title">${item ? 'Edit' : 'Add'} Schedule</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <form onsubmit="saveSchedule(event, ${id})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Class</label>
                    <select class="form-input" name="classId" required>
                        <option value="">Select</option>
                        ${classes.map(c => `<option value="${c.id}" ${item?.class_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Instructor</label>
                    <select class="form-input" name="instructorId" required>
                        <option value="">Select</option>
                        ${trainers.map(t => `<option value="${t.id}" ${item?.instructor_id === t.id ? 'selected' : ''}>${t.first_name} ${t.last_name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Start Time</label>
                    <input type="datetime-local" class="form-input" name="startTime" value="${item ? item.start_time.slice(0, 16) : ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">End Time</label>
                    <input type="datetime-local" class="form-input" name="endTime" value="${item ? item.end_time.slice(0, 16) : ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-input" name="location" value="${item?.location || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Available Spots</label>
                    <input type="number" class="form-input" name="spotsAvailable" value="${item?.spots_available || ''}" required>
                </div>
            </div>
            ${item ? `
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-input" name="status">
                        <option value="scheduled" ${item.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                        <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            ` : ''}
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `);
}

async function saveSchedule(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = {
        classId: form.classId.value,
        instructorId: form.instructorId.value,
        startTime: form.startTime.value,
        endTime: form.endTime.value,
        location: form.location.value,
        spotsAvailable: parseInt(form.spotsAvailable.value),
        status: form.status?.value || 'scheduled'
    };

    try {
        if (id) await scheduleAPI.update(id, data);
        else await scheduleAPI.create(data);
        closeModal();
        renderSchedule();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteSchedule(id) {
    if (confirm('Delete this schedule?')) {
        await scheduleAPI.delete(id);
        renderSchedule();
    }
}

// Articles
async function renderArticles() {
    const articles = await articlesAPI.list();

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Articles</h1>
            <button class="btn btn-primary" onclick="showArticleModal()">Add Article</button>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Title</th><th>Category</th><th>Author</th><th>Views</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${articles.map(a => `
                            <tr>
                                <td class="font-bold">${a.title}</td>
                                <td><span class="badge badge-info">${a.category || '-'}</span></td>
                                <td>${a.author_name}</td>
                                <td>${a.views}</td>
                                <td><span class="badge badge-${a.is_published ? 'success' : 'warning'}">${a.is_published ? 'Published' : 'Draft'}</span></td>
                                <td class="action-btns">
                                    <button class="btn btn-secondary btn-sm" onclick="showArticleModal(${a.id})">Edit</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteArticle(${a.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.articlesData = articles;
}

async function showArticleModal(id = null) {
    const article = id ? window.articlesData.find(a => a.id === id) : null;

    showModal(`
        <div class="modal-header">
            <h3 class="modal-title">${article ? 'Edit' : 'Add'} Article</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <form onsubmit="saveArticle(event, ${id})">
            <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" class="form-input" name="title" value="${article?.title || ''}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Slug</label>
                    <input type="text" class="form-input" name="slug" value="${article?.slug || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" name="category">
                        <option value="">Select</option>
                        ${['fitness', 'nutrition', 'wellness', 'lifestyle', 'tips'].map(c =>
                            `<option value="${c}" ${article?.category === c ? 'selected' : ''}>${c}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Excerpt</label>
                <textarea class="form-input" name="excerpt" rows="2">${article?.excerpt || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Content</label>
                <textarea class="form-input" name="content" rows="6">${article?.content || ''}</textarea>
            </div>
            <div class="form-group">
                <label><input type="checkbox" name="isPublished" ${article?.is_published ? 'checked' : ''}> Published</label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `);
}

async function saveArticle(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = {
        title: form.title.value,
        slug: form.slug.value || form.title.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content: form.content.value,
        excerpt: form.excerpt.value,
        category: form.category.value,
        isPublished: form.isPublished.checked
    };

    try {
        if (id) await articlesAPI.update(id, data);
        else await articlesAPI.create(data);
        closeModal();
        renderArticles();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteArticle(id) {
    if (confirm('Delete this article?')) {
        await articlesAPI.delete(id);
        renderArticles();
    }
}

// Nutrition
async function renderNutrition() {
    const plans = await nutritionAPI.list();

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Nutrition Plans</h1>
            <button class="btn btn-primary" onclick="showNutritionModal()">Add Plan</button>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Title</th><th>Diet Type</th><th>Calories</th><th>Macros (P/C/F)</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${plans.map(p => `
                            <tr>
                                <td class="font-bold">${p.title}</td>
                                <td><span class="badge badge-purple">${p.diet_type || '-'}</span></td>
                                <td>${p.calories_target} kcal</td>
                                <td>${p.protein_target}g / ${p.carbs_target}g / ${p.fat_target}g</td>
                                <td><span class="badge badge-${p.is_published ? 'success' : 'warning'}">${p.is_published ? 'Published' : 'Draft'}</span></td>
                                <td class="action-btns">
                                    <button class="btn btn-secondary btn-sm" onclick="showNutritionModal(${p.id})">Edit</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteNutrition(${p.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.nutritionData = plans;
}

async function showNutritionModal(id = null) {
    const plan = id ? window.nutritionData.find(p => p.id === id) : null;

    showModal(`
        <div class="modal-header">
            <h3 class="modal-title">${plan ? 'Edit' : 'Add'} Nutrition Plan</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <form onsubmit="saveNutrition(event, ${id})">
            <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" class="form-input" name="title" value="${plan?.title || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-input" name="description" rows="2">${plan?.description || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Calories</label>
                    <input type="number" class="form-input" name="caloriesTarget" value="${plan?.calories_target || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Meals/Day</label>
                    <input type="number" class="form-input" name="mealCount" value="${plan?.meal_count || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Protein (g)</label>
                    <input type="number" class="form-input" name="proteinTarget" value="${plan?.protein_target || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Carbs (g)</label>
                    <input type="number" class="form-input" name="carbsTarget" value="${plan?.carbs_target || ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Fat (g)</label>
                    <input type="number" class="form-input" name="fatTarget" value="${plan?.fat_target || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Diet Type</label>
                    <select class="form-input" name="dietType">
                        <option value="">Select</option>
                        ${['balanced', 'high-protein', 'low-carb', 'keto', 'vegetarian', 'vegan'].map(t =>
                            `<option value="${t}" ${plan?.diet_type === t ? 'selected' : ''}>${t}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label><input type="checkbox" name="isPublished" ${plan?.is_published ? 'checked' : ''}> Published</label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `);
}

async function saveNutrition(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = {
        title: form.title.value,
        description: form.description.value,
        caloriesTarget: parseInt(form.caloriesTarget.value),
        proteinTarget: parseInt(form.proteinTarget.value) || 0,
        carbsTarget: parseInt(form.carbsTarget.value) || 0,
        fatTarget: parseInt(form.fatTarget.value) || 0,
        mealCount: parseInt(form.mealCount.value),
        dietType: form.dietType.value,
        isPublished: form.isPublished.checked
    };

    try {
        if (id) await nutritionAPI.update(id, data);
        else await nutritionAPI.create(data);
        closeModal();
        renderNutrition();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteNutrition(id) {
    if (confirm('Delete this nutrition plan?')) {
        await nutritionAPI.delete(id);
        renderNutrition();
    }
}

// Products
async function renderProducts() {
    const products = await productsAPI.list();

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Products</h1>
            <button class="btn btn-primary" onclick="showProductModal()">Add Product</button>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${products.map(p => `
                            <tr>
                                <td class="font-bold">${p.name}</td>
                                <td><span class="badge badge-info">${p.category || '-'}</span></td>
                                <td>
                                    ${p.sale_price ? `<span style="text-decoration:line-through;color:#94a3b8">$${p.price}</span> <span style="font-weight:600;color:#dc2626">$${p.sale_price}</span>` : `<span class="font-bold">$${p.price}</span>`}
                                </td>
                                <td><span class="${p.stock_quantity < 10 ? 'badge badge-warning' : ''}">${p.stock_quantity}</span></td>
                                <td><span class="badge badge-${p.is_active ? 'success' : 'warning'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td class="action-btns">
                                    <button class="btn btn-secondary btn-sm" onclick="showProductModal(${p.id})">Edit</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.productsData = products;
}

async function showProductModal(id = null) {
    const product = id ? window.productsData.find(p => p.id === id) : null;

    showModal(`
        <div class="modal-header">
            <h3 class="modal-title">${product ? 'Edit' : 'Add'} Product</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <form onsubmit="saveProduct(event, ${id})">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-input" name="name" value="${product?.name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-input" name="description" rows="2">${product?.description || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Price ($)</label>
                    <input type="number" step="0.01" class="form-input" name="price" value="${product?.price || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Sale Price</label>
                    <input type="number" step="0.01" class="form-input" name="salePrice" value="${product?.sale_price || ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Stock</label>
                    <input type="number" class="form-input" name="stockQuantity" value="${product?.stock_quantity || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" name="category">
                        <option value="">Select</option>
                        ${['equipment', 'accessories', 'apparel', 'supplements', 'electronics'].map(c =>
                            `<option value="${c}" ${product?.category === c ? 'selected' : ''}>${c}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label><input type="checkbox" name="isActive" ${product?.is_active !== 0 ? 'checked' : ''}> Active</label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `);
}

async function saveProduct(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.name.value,
        description: form.description.value,
        price: parseFloat(form.price.value),
        salePrice: form.salePrice.value ? parseFloat(form.salePrice.value) : null,
        stockQuantity: parseInt(form.stockQuantity.value),
        category: form.category.value,
        isActive: form.isActive.checked
    };

    try {
        if (id) await productsAPI.update(id, data);
        else await productsAPI.create(data);
        closeModal();
        renderProducts();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteProduct(id) {
    if (confirm('Delete this product?')) {
        await productsAPI.delete(id);
        renderProducts();
    }
}

// Orders
async function renderOrders() {
    const data = await ordersAPI.list();
    const orders = data.orders;

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Orders</h1>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${orders.map(o => `
                            <tr>
                                <td class="font-bold">#${o.id}</td>
                                <td>
                                    <div>${o.first_name} ${o.last_name}</div>
                                    <div class="text-muted">${o.email}</div>
                                </td>
                                <td class="font-bold">$${o.total_amount}</td>
                                <td><span class="badge badge-${getOrderStatusClass(o.status)}">${o.status}</span></td>
                                <td><span class="badge badge-${o.payment_status === 'completed' ? 'success' : 'warning'}">${o.payment_status}</span></td>
                                <td>${formatDate(o.created_at)}</td>
                                <td class="action-btns">
                                    <button class="btn btn-secondary btn-sm" onclick="viewOrder(${o.id})">View</button>
                                    <select class="form-input btn-sm" onchange="updateOrderStatus(${o.id}, this.value)" style="padding:6px 8px;font-size:12px">
                                        ${['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s =>
                                            `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`
                                        ).join('')}
                                    </select>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function viewOrder(id) {
    const order = await ordersAPI.get(id);

    showModal(`
        <div class="modal-header">
            <h3 class="modal-title">Order #${order.id}</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="mb-4">
            <h4 style="font-size:14px;font-weight:600;margin-bottom:8px">Customer</h4>
            <div>${order.first_name} ${order.last_name}</div>
            <div class="text-muted">${order.email}</div>
            <div class="text-muted">${order.phone || ''}</div>
        </div>
        <div class="mb-4">
            <h4 style="font-size:14px;font-weight:600;margin-bottom:8px">Shipping Address</h4>
            <div class="text-muted">${order.shipping_address}</div>
        </div>
        <div class="mb-4">
            <h4 style="font-size:14px;font-weight:600;margin-bottom:8px">Items</h4>
            <table>
                <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                    ${order.items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${i.price}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:16px;border-top:1px solid #e2e8f0">
            <div>
                Status: <span class="badge badge-${getOrderStatusClass(order.status)}">${order.status}</span>
                Payment: <span class="badge badge-${order.payment_status === 'completed' ? 'success' : 'warning'}">${order.payment_status}</span>
            </div>
            <div style="font-size:20px;font-weight:700">Total: $${order.total_amount}</div>
        </div>
    `);
}

async function updateOrderStatus(id, status) {
    await ordersAPI.updateStatus(id, status);
    renderOrders();
}

function getOrderStatusClass(status) {
    const classes = { pending: 'warning', processing: 'info', shipped: 'purple', delivered: 'success', cancelled: 'danger' };
    return classes[status] || 'info';
}

// Helpers
function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
