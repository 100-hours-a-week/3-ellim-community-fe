/**
 * Base API Module
 * 모든 HTTP 요청의 기본 처리를 담당합니다.
 * 
 * - 중앙 집중식 에러 처리
 * - 일관된 응답 형식
 * - 자동 인증 처리
 */

import { config } from '../config.js';
import { auth } from '../utils/auth.js';

/**
 * API 요청을 수행하고 일관된 형식으로 응답을 반환합니다.
 * 
 * 백엔드 응답 형식:
 * - 성공: { message: string, data: T, error: null }
 * - 실패: { message: string, data: null, error: { reason: string } }
 * 
 * @param {string} endpoint - API 엔드포인트 (예: '/posts', '/users/me')
 * @param {Object} options - fetch 옵션
 * @returns {Promise<{data: any, error: {message: string, reason: string}|null, status: number}>}
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${config.API_BASE_URL}${endpoint}`;

    const defaultHeaders = {};

    // FormData가 아닌 경우에만 Content-Type 설정
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const headers = {
        ...defaultHeaders,
        ...(options.headers || {}),
    };

    try {
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: headers,
            body: options.body,
            credentials: 'include',
        });

        const status = response.status;

        // 응답 본문 파싱
        const text = await response.text();
        let apiResponse = null;
        
        if (text) {
            try {
                apiResponse = JSON.parse(text);
            } catch (err) {
                // JSON 파싱 실패
                console.warn('응답을 JSON으로 파싱하는 데 실패했습니다:', err);
            }
        }

        // 전역 HTTP 상태 처리 (4xx, 5xx)
        if (!response.ok) {
            await handleHttpError(status, apiResponse);
        }

        // 성공 응답 반환 (2xx)
        return {
            data: apiResponse?.data || null,
            error: null,
            status: status
        };

    } catch (error) {
        console.error('API request error:', error);
        
        // 이미 처리된 HTTP 에러인 경우
        if (error.handled) {
            return {
                data: null,
                error: {
                    message: error.message,
                    reason: error.reason || null
                },
                status: error.status
            };
        }

        // 네트워크 에러 등
        return {
            data: null,
            error: {
                message: error.message || '요청 처리 중 오류가 발생했습니다.',
                reason: null
            },
            status: null
        };
    }
}

/**
 * HTTP 에러를 처리하고 적절한 액션을 수행합니다.
 * 
 * @param {number} status - HTTP 상태 코드
 * @param {Object} apiResponse - 파싱된 백엔드 응답 (ApiResponse<T> 형식)
 * @throws {Error} 처리된 에러 객체
 */
async function handleHttpError(status, apiResponse) {
    // 백엔드 ApiResponse에서 에러 정보 추출
    const errorMessage = apiResponse?.message || `HTTP ${status}`;
    const errorReason = apiResponse?.error?.reason || null;

    const error = new Error(errorMessage);
    error.status = status;
    error.reason = errorReason;
    error.handled = true;

    // 401 Unauthorized - 인증 실패
    if (status === 401) {
        auth.clear();
        window.location.href = config.ROUTES.SIGNIN;
        throw error;
    }

    // 403 Forbidden - 권한 없음
    if (status === 403) {
        alert('권한이 없습니다.');
        throw error;
    }

    // 404 Not Found
    if (status === 404) {
        window.location.href = config.ROUTES.NOT_FOUND;
        throw error;
    }

    // 500+ Server Error
    if (status >= 500) {
        alert('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        throw error;
    }

    // 기타 에러
    throw error;
}
