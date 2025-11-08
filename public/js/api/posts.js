import { apiRequest } from "./base.js";

export const PostsAPI = {
    getList: (lastPostId) => {
        if (lastPostId === undefined || lastPostId === null) {
            return apiRequest('/posts', {
                method: 'GET',
            });
        } else {
            return apiRequest(`/posts?lastPostId=${lastPostId}`, {
                method: 'GET',
            });
        }
    },
    getById: (postId) =>
        apiRequest(`/posts/${postId}`, {
            method: 'GET',
        }),
    create: (data) => {
        const body = { title: data.title, content: data.content };
        if (data.imageIds !== undefined && data.imageIds !== null) {
            body.imageIds = data.imageIds;
        }

        return apiRequest('/posts', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },
    update: (postId, data) => 
        apiRequest(`/posts/${postId}`, {
            method: 'PATCH',
            body: JSON.stringify({ 
                title: data.title, 
                content: data.content, 
                imageIds: data.imageIds 
            }),
        }),
    delete: (postId) =>
        apiRequest(`/posts/${postId}`, {
            method: 'DELETE',
        }),
    like: (postId) =>
        apiRequest(`/posts/${postId}/like`, {
            method: 'POST',
        }),
    unlike: (postId) =>
        apiRequest(`/posts/${postId}/like`, {
            method: 'DELETE',
        }),
    getComments: (postId, lastCommentId, size) => {
        if (lastCommentId === undefined || lastCommentId === null) {
            return apiRequest(`/posts/${postId}/comments?size=${size}`, {
                method: 'GET',
            });
        } else {
            return apiRequest(`/posts/${postId}/comments?lastCommentId=${lastCommentId}&size=${size}`, {
                method: 'GET',
            });
        }
    },
    createComment: (postId, content) => 
        apiRequest(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),
    updateComment: (postId, commentId, content) =>
        apiRequest(`/posts/${postId}/comments/${commentId}`, {
            method: 'PATCH',
            body: JSON.stringify({ content }),
        }),
    deleteComment: (postId, commentId) =>
        apiRequest(`/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
        }),
}
