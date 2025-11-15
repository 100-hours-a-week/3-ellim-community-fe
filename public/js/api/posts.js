/**
 * Posts API Module
 * 게시물 관련 API 호출을 담당합니다.
 */

import { apiRequest } from "./base.js";

/**
 * Posts API 객체
 * 게시물 CRUD 및 좋아요, 댓글 관련 API를 제공합니다.
 */
export const PostsAPI = {
    /**
     * 게시물 목록 조회 (무한 스크롤)
     * @param {number|null} lastPostId - 마지막 게시물 ID (다음 페이지 조회용)
     * @param {Object} options - API 요청 옵션
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    getList: (lastPostId, options = {}) => {
        const endpoint = lastPostId 
            ? `/posts?lastPostId=${lastPostId}` 
            : '/posts';
        
        return apiRequest(endpoint, {
            method: 'GET',
            ...options
        });
    },
    /**
     * 게시물 상세 조회
     * @param {number} postId - 게시물 ID
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    getById: (postId) =>
        apiRequest(`/posts/${postId}`, {
            method: 'GET',
        }),
    /**
     * 게시물 작성
     * @param {Object} data - 게시물 데이터
     * @param {string} data.title - 제목
     * @param {string} data.content - 내용
     * @param {number[]} [data.imageIds] - 이미지 ID 배열
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
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
    /**
     * 게시물 수정
     * @param {number} postId - 게시물 ID
     * @param {Object} data - 수정할 데이터
     * @param {string} data.title - 제목
     * @param {string} data.content - 내용
     * @param {number[]} [data.imageIds] - 이미지 ID 배열
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    update: (postId, data) => 
        apiRequest(`/posts/${postId}`, {
            method: 'PATCH',
            body: JSON.stringify({ 
                title: data.title, 
                content: data.content, 
                imageIds: data.imageIds 
            }),
        }),
    /**
     * 게시물 삭제
     * @param {number} postId - 게시물 ID
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    delete: (postId) =>
        apiRequest(`/posts/${postId}`, {
            method: 'DELETE',
        }),
    /**
     * 게시물 좋아요
     * @param {number} postId - 게시물 ID
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    like: (postId) =>
        apiRequest(`/posts/${postId}/like`, {
            method: 'POST',
        }),
    /**
     * 게시물 좋아요 취소
     * @param {number} postId - 게시물 ID
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    unlike: (postId) =>
        apiRequest(`/posts/${postId}/like`, {
            method: 'DELETE',
        }),
    /**
     * 댓글 목록 조회 (무한 스크롤)
     * @param {number} postId - 게시물 ID
     * @param {number|null} lastCommentId - 마지막 댓글 ID (다음 페이지 조회용)
     * @param {number} size - 조회할 댓글 수
     * @param {Object} options - API 요청 옵션
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    getComments: (postId, lastCommentId, size, options = {}) => {
        const endpoint = lastCommentId 
            ? `/posts/${postId}/comments?lastCommentId=${lastCommentId}&size=${size}`
            : `/posts/${postId}/comments?size=${size}`;
        
        return apiRequest(endpoint, {
            method: 'GET',
            ...options
        });
    },
    /**
     * 댓글 작성
     * @param {number} postId - 게시물 ID
     * @param {string} content - 댓글 내용
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    createComment: (postId, content) => 
        apiRequest(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),
    /**
     * 댓글 수정
     * @param {number} postId - 게시물 ID
     * @param {number} commentId - 댓글 ID
     * @param {string} content - 수정할 댓글 내용
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    updateComment: (postId, commentId, content) =>
        apiRequest(`/posts/${postId}/comments/${commentId}`, {
            method: 'PATCH',
            body: JSON.stringify({ content }),
        }),
    /**
     * 댓글 삭제
     * @param {number} postId - 게시물 ID
     * @param {number} commentId - 댓글 ID
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    deleteComment: (postId, commentId) =>
        apiRequest(`/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
        }),
}
