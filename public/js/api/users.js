/**
 * Users API Module
 * 사용자 관련 API 호출을 담당합니다.
 */

import { apiRequest } from "./base.js";

/**
 * Users API 객체
 * 인증, 회원가입, 프로필 관리 등 사용자 관련 API를 제공합니다.
 */
export const UsersAPI = {
    /**
     * 로그인
     * @param {Object} data - 로그인 데이터
     * @param {string} data.email - 이메일
     * @param {string} data.password - 비밀번호
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    signIn: (data) => 
        apiRequest('/auth', {
            method: 'POST',
            body: JSON.stringify({ 
                email: data.email, 
                password: data.password 
            }),
            skipAuthRedirect: true, // 로그인 실패 시 리다이렉트 방지
        }),
    /**
     * 회원가입
     * @param {Object} data - 회원가입 데이터
     * @param {string} data.email - 이메일
     * @param {string} data.password - 비밀번호
     * @param {string} data.password2 - 비밀번호 확인
     * @param {string} data.nickname - 닉네임
     * @param {number|null} [data.profileImageId] - 프로필 이미지 ID
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
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
            skipAuthRedirect: true, // 회원가입 실패 시 리다이렉트 방지
        }),
    /**
     * 로그아웃
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    signOut: () => 
        apiRequest('/auth', { 
            method: 'DELETE' 
        }),
    /**
     * 현재 사용자 정보 조회
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    getCurrent: () => 
        apiRequest('/users/me', { 
            method: 'GET' 
        }),
    /**
     * 특정 사용자 정보 조회
     * @param {number} userId - 사용자 ID
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    getById: (userId) => 
        apiRequest(`/users/${userId}`, { 
            method: 'GET' 
        }),
    /**
     * 현재 사용자 정보 수정
     * @param {Object} data - 수정할 데이터
     * @param {string} [data.nickname] - 닉네임
     * @param {number|null} [data.profileImageId] - 프로필 이미지 ID
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    updateCurrent: (data) => {
        const body = {};
        if (data.nickname !== undefined && data.nickname !== null) {
            body.nickname = data.nickname;
        }
        if (data.profileImageId !== undefined) {
            body.profileImageId = data.profileImageId;
        }

        return apiRequest('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    },
    /**
     * 비밀번호 변경
     * @param {Object} data - 비밀번호 데이터
     * @param {string} data.newPassword - 새 비밀번호
     * @param {string} data.newPassword2 - 새 비밀번호 확인
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    updatePassword: (data) => 
        apiRequest('/users/me/password', {
            method: 'PATCH',
            body: JSON.stringify({ 
                newPassword: data.newPassword, 
                newPassword2: data.newPassword2 
            }),
        }),
    /**
     * 회원 탈퇴
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    deleteCurrent: () => 
        apiRequest('/users/me', {
            method: 'DELETE',
        }),
}