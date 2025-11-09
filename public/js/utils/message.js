/**
 * Form Message Utility
 * 폼 인라인 메시지 표시/숨김 유틸리티
 * 
 * 사용법:
 * 1. HTML에 <div id="form-message" class="small mb-3"></div> 추가
 * 2. showMessage(message, type) 호출
 * 
 * 타입:
 * - 'error': 빨간색 (기본값)
 * - 'success': 초록색
 * - 'warning': 노란색
 */

/**
 * 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {string} type - 메시지 타입 ('error' | 'success' | 'warning')
 */
export function showMessage(message, type = 'error') {
  const messageElement = document.querySelector('#form-message');
  if (messageElement) {
    messageElement.textContent = message;
    
    // 타입에 따라 색상 클래스 설정
    let colorClass = 'text-danger'; // 기본값: 에러 (빨간색)
    if (type === 'success') {
      colorClass = 'text-success';
    } else if (type === 'warning') {
      colorClass = 'text-warning';
    }
    
    messageElement.className = `small mb-3 ${colorClass}`;
  }
}

/**
 * 메시지 숨김
 */
export function hideMessage() {
  const messageElement = document.querySelector('#form-message');
  if (messageElement) {
    messageElement.textContent = '';
    messageElement.className = 'small mb-3';
  }
}
