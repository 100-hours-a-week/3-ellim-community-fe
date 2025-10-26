const API_BASE_URL = 'http://localhost:8080';

export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {};

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

        if (response.status === 401) {
            window.location.href = '/users/signin';
            localStorage.removeItem('profileImageUrl');
            return;
        }

        const text = await response.text();
        let data = {};
        
        if (text){
            try {
                data = JSON.parse(text);
            } catch (err) {
                console.warn('응답을 JSON으로 파싱하는 데 실패했습니다:', err);
            }
        }

        if (!response.ok) {
            throw new Error(data?.message || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// CSRF token 관련된 사항은 추후 구현 예정
// 현재 Spring Security를 사용하여 구현 중이나 CSRF 토큰 처리는 고려 하지 않음
