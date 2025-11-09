/**
 * Images API Module
 * 이미지 업로드 관련 API 호출을 담당합니다.
 */

import { apiRequest } from "./base.js";

/**
 * Images API 객체
 * 프로필 이미지 및 게시물 이미지 업로드 API를 제공합니다.
 */
export const ImagesAPI = {
    /**
     * 프로필 이미지 업로드
     * @param {File} file - 업로드할 이미지 파일
     * @returns {Promise<{data: {imageId: number, imageUrl: string}, error: any, status: number}>}
     */
    uploadProfile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest('/images/profile-img', {
            method: 'POST',
            body: formData,
        });
    },
    /**
     * 게시물 이미지 업로드
     * @param {File} file - 업로드할 이미지 파일
     * @returns {Promise<{data: {imageId: number, imageUrl: string}, error: any, status: number}>}
     */
    uploadPost: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest('/images/post-img', {
            method: 'POST',
            body: formData,
        });
    },
}
