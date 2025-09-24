// API client for PHP backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  window.location.hostname === 'localhost' 
    ? 'http://localhost/arquivo-manager/api'
    : `${window.location.protocol}//${window.location.host}/api`
);

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('access_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth methods
  async signIn(email: string, password: string) {
    const response = await this.request<{ user: any; access_token: string }>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.access_token);
    return response;
  }

  async signUp(email: string, password: string, full_name: string) {
    return this.request<{ message: string }>('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  signOut() {
    this.setToken(null);
    return Promise.resolve();
  }

  // Files methods
  async getFiles() {
    return this.request<any[]>('/files/list.php');
  }

  async uploadFile(formData: FormData) {
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}/files/upload.php`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  // Users methods
  async getUsers() {
    return this.request<any[]>('/users/list.php');
  }

  async updateProfile(profileData: any) {
    return this.request('/users/update.php', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async updateUser(userId: string, userData: any) {
    return this.request('/users/update-user.php', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        ...userData
      }),
    });
  }

  // Groups methods
  async getGroups() {
    return this.request<any[]>('/groups/list.php');
  }

  // Categories methods
  async getCategories() {
    return this.request<any[]>('/categories/list.php');
  }

  // Downloads methods
  async getDownloads() {
    return this.request<any[]>('/downloads/list.php');
  }

  async recordDownload(fileId: string) {
    return this.request('/downloads/record.php', {
      method: 'POST',
      body: JSON.stringify({ file_id: fileId }),
    });
  }

  // Plays methods
  async recordPlay(fileId: string) {
    return this.request('/plays/record.php', {
      method: 'POST',
      body: JSON.stringify({ file_id: fileId }),
    });
  }

  // Categories CRUD
  async createCategory(name: string, description?: string) {
    return this.request('/categories/create.php', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteCategory(id: string) {
    return this.request(`/categories/delete.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Groups CRUD
  async createGroup(name: string, description?: string) {
    return this.request('/groups/create.php', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteGroup(id: string) {
    return this.request(`/groups/delete.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  async updateGroup(groupId: string, groupData: any) {
    return this.request('/groups/update.php', {
      method: 'POST',
      body: JSON.stringify({
        id: groupId,
        ...groupData
      }),
    });
  }

  async getGroupMembers(groupId: string) {
    return this.request<any[]>(`/groups/manage-members.php?group_id=${groupId}`);
  }

  async updateGroupMembers(groupId: string, userIds: string[], action: string = 'set') {
    return this.request('/groups/manage-members.php', {
      method: 'POST',
      body: JSON.stringify({
        group_id: groupId,
        user_ids: userIds,
        action
      }),
    });
  }

  // Files CRUD
  async deleteFile(id: string) {
    return this.request(`/files/delete.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Reports/Stats
  async getStats() {
    return this.request<any>('/reports/stats.php');
  }

  // Auth
  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password.php', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Validate current user role from server
  async validateUserRole() {
    return this.request<{ role: string; id: string; email: string; full_name: string }>('/auth/validate-role.php');
  }

  async getProfile() {
    return this.request<any>("/users/profile.php");
  }
}

export const apiClient = new ApiClient(API_BASE_URL);