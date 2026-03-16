// For Vercel unified deploy, same-origin /api works in both dev and production.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to get auth token from localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    } catch (networkError) {
        throw new Error('Cannot connect to backend API. Make sure the server is running.');
    }

    if (!response.ok) {
        const raw = await response.text();
        let message = `Request failed (${response.status})`;

        try {
            const parsed = raw ? JSON.parse(raw) : {};
            message = parsed.message || parsed.error || message;
        } catch {
            if (raw?.trim()) {
                message = raw.slice(0, 180);
            }
        }

        throw new Error(message);
    }

    return response.json();
};

// Auth API
export const authAPI = {
    register: async (username, email, password) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    },

    login: async (email, password) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    logout: async () => {
        return apiRequest('/auth/logout', {
            method: 'POST'
        });
    },

    getCurrentUser: async () => {
        return apiRequest('/auth/me');
    }
};

// Meals API
export const mealsAPI = {
    getAll: async (date) => {
        const qs = date ? `?date=${date}` : '';
        const data = await apiRequest(`/meals${qs}`);
        return data.meals || [];
    },

    getByDate: async (dateStr) => {
        const data = await apiRequest(`/meals?date=${dateStr}`);
        return data.meals || [];
    },

    getById: async (id) => {
        const data = await apiRequest(`/meals/${id}`);
        return data.meal;
    },

    create: async (meal) => {
        const data = await apiRequest('/meals', {
            method: 'POST',
            body: JSON.stringify(meal)
        });
        return data.meal;
    },

    update: async (id, meal) => {
        const data = await apiRequest(`/meals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(meal)
        });
        return data.meal;
    },

    delete: async (id) => {
        return apiRequest(`/meals/${id}`, {
            method: 'DELETE'
        });
    }
};

// Dashboard API
export const dashboardAPI = {
    getSummary: async () => {
        return apiRequest('/dashboard');
    },
    getWeekly: async (weekStart) => {
        const qs = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
        return apiRequest(`/dashboard/weekly${qs}`);
    }
};

export const nutritionAPI = {
    search: async (query) => {
        return apiRequest(`/nutrition/search?q=${encodeURIComponent(query)}`);
    },
    getPopular: async () => {
        return apiRequest('/nutrition/popular');
    }
};

export const wellnessAPI = {
    getDaily: async () => {
        return apiRequest('/wellness/daily');
    },
    getTips: async () => {
        return apiRequest('/wellness/tips');
    }
};

export const settingsAPI = {
    get: async () => {
        return apiRequest('/settings');
    },
    update: async (settings) => {
        return apiRequest('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }
};
