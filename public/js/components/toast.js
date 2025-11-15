/**
 * Toast Component
 * Bootstrap Toast 컴포넌트 래퍼
 * success, info, warning, error 타입별 토스트 제공
 * 자동 사라짐 기능 (기본 3초)
 * 여러 토스트 동시 표시 지원
 */

let toastCounter = 0;

// 토스트 컨테이너 생성 및 반환
function getToastContainer() {
  let container = document.getElementById('toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  return container;
}

// 토스트 타입별 아이콘 및 색상
const toastConfig = {
  success: {
    icon: '✓',
    bgClass: 'bg-success',
    textClass: 'text-white'
  },
  info: {
    icon: 'ℹ',
    bgClass: 'bg-info',
    textClass: 'text-white'
  },
  warning: {
    icon: '⚠',
    bgClass: 'bg-warning',
    textClass: 'text-dark'
  },
  error: {
    icon: '✕',
    bgClass: 'bg-danger',
    textClass: 'text-white'
  }
};

/**
 * 토스트 DOM 요소 생성
 * @param {string} id - 토스트 고유 ID
 * @param {string} type - 토스트 타입 (success, info, warning, error)
 * @param {string} message - 토스트 메시지
 * @param {number} delay - 자동 사라짐 시간 (밀리초)
 * @returns {HTMLElement} 토스트 요소
 */
function createToastElement(id, type, message, delay) {
  const config = toastConfig[type] || toastConfig.info;
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center ${config.bgClass} ${config.textClass} border-0`;
  toast.id = id;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.setAttribute('data-bs-delay', delay);
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center">
        <span class="me-2 fs-5">${config.icon}</span>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-${config.textClass === 'text-white' ? 'white' : ''} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  return toast;
}

/**
 * 토스트 표시
 * @param {string} type - 토스트 타입 (success, info, warning, error)
 * @param {string} message - 토스트 메시지
 * @param {number} delay - 자동 사라짐 시간 (밀리초, 기본 3000)
 * @returns {void}
 */
function showToast(type, message, delay = 3000) {
  const id = `toast-${type}-${toastCounter++}`;
  const container = getToastContainer();
  const toastElement = createToastElement(id, type, message, delay);
  
  // 컨테이너에 토스트 추가
  container.appendChild(toastElement);
  
  // Bootstrap Toast 인스턴스 생성 및 표시
  const bsToast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: delay
  });
  
  // 토스트가 완전히 숨겨진 후 DOM에서 제거
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
    
    // 컨테이너가 비어있으면 제거
    if (container.children.length === 0) {
      container.remove();
    }
  }, { once: true });
  
  bsToast.show();
}

/**
 * Success 토스트 표시
 * @param {string} message - 토스트 메시지
 * @param {number} delay - 자동 사라짐 시간 (밀리초, 기본 3000)
 * @returns {void}
 */
export function success(message, delay = 3000) {
  showToast('success', message, delay);
}

/**
 * Info 토스트 표시
 * @param {string} message - 토스트 메시지
 * @param {number} delay - 자동 사라짐 시간 (밀리초, 기본 3000)
 * @returns {void}
 */
export function info(message, delay = 3000) {
  showToast('info', message, delay);
}

/**
 * Warning 토스트 표시
 * @param {string} message - 토스트 메시지
 * @param {number} delay - 자동 사라짐 시간 (밀리초, 기본 3000)
 * @returns {void}
 */
export function warning(message, delay = 3000) {
  showToast('warning', message, delay);
}

/**
 * Error 토스트 표시
 * @param {string} message - 토스트 메시지
 * @param {number} delay - 자동 사라짐 시간 (밀리초, 기본 3000)
 * @returns {void}
 */
export function error(message, delay = 3000) {
  showToast('error', message, delay);
}

/**
 * 페이지 전환 후 Toast 표시를 위한 데이터 저장
 * @param {string} type - 토스트 타입 (success, info, warning, error)
 * @param {string} message - 토스트 메시지
 * @param {number} delay - 자동 사라짐 시간 (밀리초, 기본 3000)
 * @returns {void}
 */
export function showAfterNavigation(type, message, delay = 3000) {
  sessionStorage.setItem('toast', JSON.stringify({ type, message, delay }));
}

/**
 * 페이지 로드 시 저장된 Toast가 있으면 표시
 * 각 페이지 초기화 시 호출 필요
 * @returns {void}
 */
export function checkPendingToast() {
  const toastData = sessionStorage.getItem('toast');
  
  if (toastData) {
    try {
      const { type, message, delay } = JSON.parse(toastData);
      sessionStorage.removeItem('toast');
      
      // 약간의 지연 후 표시 (페이지 렌더링 완료 대기)
      setTimeout(() => {
        showToast(type, message, delay);
      }, 100);
    } catch (error) {
      console.error('Failed to parse toast data:', error);
      sessionStorage.removeItem('toast');
    }
  }
}

/**
 * Toast 객체 export
 */
export const Toast = {
  success,
  info,
  warning,
  error,
  showAfterNavigation,
  checkPendingToast
};
