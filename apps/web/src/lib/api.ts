import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const meetingTypesApi = {
  getAll: (params?: any) => api.get('/meeting-types', { params }),
  getOne: (id: string) => api.get(`/meeting-types/${id}`),
  create: (data: any) => api.post('/meeting-types', data),
  update: (id: string, data: any) => api.patch(`/meeting-types/${id}`, data),
  delete: (id: string) => api.delete(`/meeting-types/${id}`),
};

export const availabilityApi = {
  getSlots: (mentorId: string, meetingTypeId: string, params: any) =>
    api.get(`/availability/slots/${mentorId}/${meetingTypeId}`, { params }),
  getAll: () => api.get('/availability'),
  create: (data: any) => api.post('/availability', data),
  update: (id: string, data: any) => api.patch(`/availability/${id}`, data),
  delete: (id: string) => api.delete(`/availability/${id}`),
};

export const bookingsApi = {
  create: (data: any) => api.post('/bookings', data),
  getAll: (params?: any) => api.get('/bookings', { params }),
  getOne: (id: string) => api.get(`/bookings/${id}`),
  approve: (id: string) => api.post(`/bookings/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post(`/bookings/${id}/reject`, { reason }),
  cancel: (id: string, reason?: string) =>
    api.post(`/bookings/${id}/cancel`, { reason }),
  reschedule: (id: string, startTime: string, endTime: string) =>
    api.post(`/bookings/${id}/reschedule`, { startTime, endTime }),
  addNotes: (id: string, notes: string) =>
    api.post(`/bookings/${id}/notes`, { notes }),
  getStats: (mentorId: string, params?: any) =>
    api.get('/bookings/stats/summary', { params: { mentorId, ...params } }),
};

// ============================================================================
// v2.0 API METHODS
// ============================================================================

export const reviewsApi = {
  create: (data: any) => api.post('/reviews', data),
  getAll: (params?: any) => api.get('/reviews', { params }),
  getOne: (id: string) => api.get(`/reviews/${id}`),
  update: (id: string, data: any) => api.patch(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  respond: (id: string, response: string) =>
    api.post(`/reviews/${id}/respond`, { response }),
  markHelpful: (id: string) => api.post(`/reviews/${id}/helpful`),
  getMentorStats: (mentorId: string) =>
    api.get(`/reviews/mentor/${mentorId}/stats`),
};

export const paymentsApi = {
  createIntent: (bookingId: string) =>
    api.post('/payments/create-intent', { bookingId }),
  getHistory: () => api.get('/payments/history'),
  getEarnings: (params?: any) => api.get('/payments/earnings', { params }),
};

export const messagingApi = {
  createConversation: (otherUserId: string) =>
    api.post('/messaging/conversations', { otherUserId }),
  getConversations: () => api.get('/messaging/conversations'),
  getMessages: (conversationId: string, params?: any) =>
    api.get(`/messaging/conversations/${conversationId}/messages`, { params }),
  sendMessage: (data: any) => api.post('/messaging/messages', data),
  markAsRead: (conversationId: string) =>
    api.post('/messaging/conversations/mark-read', { conversationId }),
};

export const gamificationApi = {
  getUserAchievements: () => api.get('/gamification/achievements'),
  getLeaderboard: (type?: string, limit?: number) =>
    api.get('/gamification/leaderboard', { params: { type, limit } }),
  getUserStats: () => api.get('/gamification/stats'),
};

export const goalsApi = {
  create: (data: any) => api.post('/goals', data),
  getAll: (params?: any) => api.get('/goals', { params }),
  getOne: (id: string) => api.get(`/goals/${id}`),
  update: (id: string, data: any) => api.patch(`/goals/${id}`, data),
  complete: (id: string) => api.post(`/goals/${id}/complete`),
  addMilestone: (goalId: string, data: any) =>
    api.post(`/goals/${goalId}/milestones`, data),
  completeMilestone: (milestoneId: string) =>
    api.post(`/goals/milestones/${milestoneId}/complete`),
  getProgress: () => api.get('/goals/progress'),
};

export const marketplaceApi = {
  searchMentors: (params?: any) => api.get('/marketplace/mentors', { params }),
  getMentorProfile: (mentorId: string) =>
    api.get(`/marketplace/mentors/${mentorId}`),
  getFeaturedMentors: (limit?: number) =>
    api.get('/marketplace/featured', { params: { limit } }),
  getCategories: () => api.get('/marketplace/categories'),
};
