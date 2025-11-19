// API Service
const API_URL = 'http://localhost:5000/api';

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        },
        ...options
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 401) {
        localStorage.removeItem('token');
        location.reload();
        return;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// Auth API
const authAPI = {
    login: (email, password) => apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
    }),
    me: () => apiRequest('/auth/me')
};

// Dashboard API
const dashboardAPI = {
    stats: () => apiRequest('/dashboard/stats'),
    activity: () => apiRequest('/dashboard/recent-activity'),
    charts: () => apiRequest('/dashboard/charts')
};

// Users API
const usersAPI = {
    list: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/users?${query}`);
    },
    get: (id) => apiRequest(`/users/${id}`),
    create: (data) => apiRequest('/users', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' })
};

// Plans API
const plansAPI = {
    list: () => apiRequest('/plans'),
    create: (data) => apiRequest('/plans', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/plans/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/plans/${id}`, { method: 'DELETE' })
};

// Programs API
const programsAPI = {
    list: () => apiRequest('/programs'),
    get: (id) => apiRequest(`/programs/${id}`),
    create: (data) => apiRequest('/programs', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/programs/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/programs/${id}`, { method: 'DELETE' })
};

// Classes API
const classesAPI = {
    list: () => apiRequest('/classes'),
    create: (data) => apiRequest('/classes', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/classes/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/classes/${id}`, { method: 'DELETE' })
};

// Schedule API
const scheduleAPI = {
    list: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/schedule?${query}`);
    },
    create: (data) => apiRequest('/schedule', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/schedule/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/schedule/${id}`, { method: 'DELETE' })
};

// Articles API
const articlesAPI = {
    list: () => apiRequest('/articles'),
    get: (id) => apiRequest(`/articles/${id}`),
    create: (data) => apiRequest('/articles', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/articles/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/articles/${id}`, { method: 'DELETE' })
};

// Nutrition API
const nutritionAPI = {
    list: () => apiRequest('/nutrition'),
    get: (id) => apiRequest(`/nutrition/${id}`),
    create: (data) => apiRequest('/nutrition', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/nutrition/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/nutrition/${id}`, { method: 'DELETE' })
};

// Products API
const productsAPI = {
    list: () => apiRequest('/products'),
    create: (data) => apiRequest('/products', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' })
};

// Orders API
const ordersAPI = {
    list: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/orders?${query}`);
    },
    get: (id) => apiRequest(`/orders/${id}`),
    updateStatus: (id, status) => apiRequest(`/orders/${id}/status`, { method: 'PUT', body: { status } })
};

// Trainers API
const trainersAPI = {
    list: () => apiRequest('/trainers')
};
