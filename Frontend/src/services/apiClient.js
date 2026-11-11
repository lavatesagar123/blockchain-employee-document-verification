/**
 * Centralized API Client
 * Uses native Fetch API for communication with Django REST Framework backend.
 * Provides clear connectivity error messaging when backend is not running.
 */

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

export const TOKEN_STORAGE_KEY = 'verifychain_jwt_token';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to update token in storage:', err);
  }
};

export const clearStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear token from storage:', err);
  }
};

/**
 * Standard fetch wrapper with authentication headers, JSON parsing,
 * and comprehensive error messages.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, fetchOptions);

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const error = new Error();
      error.status = response.status;
      error.data = data;

      // Extract Django REST Framework error messages
      if (typeof data === 'string') {
        error.message = data;
      } else if (data?.detail) {
        error.message = data.detail;
      } else if (data?.message) {
        error.message = data.message;
      } else if (data?.non_field_errors) {
        error.message = Array.isArray(data.non_field_errors)
          ? data.non_field_errors.join(' ')
          : data.non_field_errors;
      } else if (typeof data === 'object' && Object.keys(data).length > 0) {
        // Collect field validation errors
        const firstField = Object.keys(data)[0];
        const fieldError = data[firstField];
        if (Array.isArray(fieldError)) {
          error.message = `${firstField}: ${fieldError.join(' ')}`;
        } else if (typeof fieldError === 'string') {
          error.message = `${firstField}: ${fieldError}`;
        } else {
          error.message = `Request failed with status ${response.status}`;
        }
      } else {
        error.message = `Request failed with status ${response.status}`;
      }

      throw error;
    }

    return data;
  } catch (error) {
    // If the error was created above from an HTTP response, rethrow it
    if (error.status) {
      throw error;
    }

    // Network / offline connection failure
    const networkError = new Error(
      `Cannot connect to backend server at ${API_BASE_URL}. Please ensure your Django REST Framework server is running and accessible.`
    );
    networkError.isNetworkError = true;
    networkError.status = 0;
    networkError.originalError = error;
    throw networkError;
  }
}

export const apiClient = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' })
};
