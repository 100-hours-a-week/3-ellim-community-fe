import { apiRequest } from "./base.js";

export const UsersAPI = {
    signIn: (email, password) => 
        apiRequest('/auth', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),
    signUp: (data) =>
        apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify({ 
                email: data.email, 
                password: data.password, 
                password2: data.password2, 
                nickname: data.nickname, 
                profileImageId: data.profileImageId ?? null 
            }),
        }),
    signOut: () => 
        apiRequest('/auth', { 
            method: 'DELETE' 
        }),
    getCurrent: () => 
        apiRequest('/users/me', { 
            method: 'GET' 
        }),
    getById: (userId) => 
        apiRequest(`/users/${userId}`, { 
            method: 'GET' 
        }),
    updateCurrent: (data) => {
        const body = {};
        if (data.nickname !== undefined && data.nickname !== null) {
            body.nickname = data.nickname;
        }
        if (data.profileImageId !== undefined && data.profileImageId !== null) {
            body.profileImageId = data.profileImageId;
        }

        return apiRequest('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    },
    updatePassword: (newPassword, newPassword2) => 
        apiRequest('/users/me/password', {
            method: 'PATCH',
            body: JSON.stringify({ newPassword, newPassword2 }),
        }),
    deleteCurrent: () => 
        apiRequest('/users/me', {
            method: 'DELETE',
        }),
}