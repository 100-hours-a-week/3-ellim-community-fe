/**
 * Date and Time Utility
 * 날짜 및 시간 관련 공통 기능 제공
 */

/**
 * 날짜를 상대적 시간으로 변환
 * @param {string|Date} dateInput - ISO 8601 날짜 문자열 또는 Date 객체
 * @returns {string} - 상대적 시간 표현 (예: "방금 전", "3분 전", "2시간 전")
 */
export function formatRelativeTime(dateInput) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "방금 전";
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay < 7) {
    return `${diffDay}일 전`;
  } else {
    return formatDate(date, 'ko-KR');
  }
}

/**
 * 날짜 포맷팅
 * @param {string|Date} dateInput - 날짜
 * @param {string} locale - 로케일 (기본: 'ko-KR')
 * @param {Object} options - Intl.DateTimeFormat 옵션
 * @returns {string} - 포맷된 날짜
 */
export function formatDate(dateInput, locale = 'ko-KR', options = {}) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };

  return date.toLocaleDateString(locale, defaultOptions);
}

/**
 * 날짜와 시간 포맷팅
 * @param {string|Date} dateInput - 날짜
 * @param {string} locale - 로케일 (기본: 'ko-KR')
 * @param {Object} options - Intl.DateTimeFormat 옵션
 * @returns {string} - 포맷된 날짜 및 시간
 */
export function formatDateTime(dateInput, locale = 'ko-KR', options = {}) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return date.toLocaleString(locale, defaultOptions);
}

/**
 * 시간만 포맷팅
 * @param {string|Date} dateInput - 날짜
 * @param {string} locale - 로케일 (기본: 'ko-KR')
 * @returns {string} - 포맷된 시간 (예: "오후 3:45")
 */
export function formatTime(dateInput, locale = 'ko-KR') {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * ISO 8601 형식으로 변환
 * @param {Date} date - 날짜 객체
 * @returns {string} - ISO 8601 문자열
 */
export function toISOString(date) {
  return date.toISOString();
}

/**
 * 두 날짜 사이의 차이 계산
 * @param {string|Date} date1 - 첫 번째 날짜
 * @param {string|Date} date2 - 두 번째 날짜
 * @returns {Object} - { days, hours, minutes, seconds }
 */
export function getDateDifference(date1, date2) {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffMs = Math.abs(d2 - d1);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  return {
    days: diffDay,
    hours: diffHour % 24,
    minutes: diffMin % 60,
    seconds: diffSec % 60,
    totalMilliseconds: diffMs
  };
}

/**
 * 날짜가 오늘인지 확인
 * @param {string|Date} dateInput - 날짜
 * @returns {boolean}
 */
export function isToday(dateInput) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * 날짜가 어제인지 확인
 * @param {string|Date} dateInput - 날짜
 * @returns {boolean}
 */
export function isYesterday(dateInput) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return date.getDate() === yesterday.getDate() &&
         date.getMonth() === yesterday.getMonth() &&
         date.getFullYear() === yesterday.getFullYear();
}
