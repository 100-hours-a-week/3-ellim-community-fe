import { apiRequest } from "./base.js";

export const PostAPI = {
    getPosts: (lastPostId) => {
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
    getPostById: (postId) =>
        apiRequest(`/posts/${postId}`, {
            method: 'GET',
        }),
    createPost: (title, content, imageIds) => {
        const body = { title, content };
        if (imageIds !== undefined && imageIds !== null) body.imageIds = imageIds;

        return apiRequest('/posts', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },
    updatePost: (postId, title, content, imageIds) => 
        apiRequest(`/posts/${postId}`, {
            method: 'PATCH',
            body: JSON.stringify({ title, content, imageIds }),
        }),
    deletePost: (postId) =>
        apiRequest(`/posts/${postId}`, {
            method: 'DELETE',
        }),
    getCommentsOnPost: (postId, lastCommentId, size) => {
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
    createCommentOnPost: (postId, content) => 
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
    likePost: (postId) =>
        apiRequest(`/posts/${postId}/like`, {
            method: 'POST',
    }),
    cancelLikePost: (postId) =>
        apiRequest(`/posts/${postId}/like`, {
            method: 'DELETE',
    }),
}
