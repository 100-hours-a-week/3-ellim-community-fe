import { apiRequest } from "./base.js";

export const UserAPI = {
    signIn: (email, password) => 
        apiRequest('/auth', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),
    signUp: (email, password, password2, nickname, profileImageId) =>
        apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify({ email, password, password2, nickname, profileImageId: profileImageId ?? null }),
        }),
    signOut: () => {
            localStorage.removeItem('profileImageUrl');
            return apiRequest('/auth', { 
                method: 'DELETE' 
            });
    },
    getCurrentUser: () => 
        apiRequest('/users/me', { 
            method: 'GET' 
        }),
    getUserById: (user_id) => 
        apiRequest(`/users/${user_id}`, { 
            method: 'GET' 
        }),
    updateCurrentUser: (nickname, profileImageId) => {
            const body = {};
            if (nickname !== undefined && nickname !== null) body.nickname = nickname;
            if (profileImageId !== undefined && profileImageId !== null) body.profileImageId = profileImageId;

            return apiRequest('/users/me', {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
        },
    updateCurrentUserPassword: (newPassword, newPassword2) => 
        apiRequest('/users/me/password', {
            method: 'PATCH',
            body: JSON.stringify({ newPassword, newPassword2 }),
        }),
    deleteCurrentUser: () => 
        apiRequest('/users/me', {
            method: 'DELETE',
        }),
}