/**
 * Toast Component
 * Bootstrap Toast를 사용한 가벼운 알림 메시지
 */

let toastCounter = 0;
let activeToasts = new Set();

/**
 * Toast 컨테이너 생성 (없을 경우)
 */
function ensureToastContainer() {
  let container = document.querySelector('.toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  return container;
}

/**
 * 기존 Toast 모두 제거
 */
function clearAllToasts() {
  activeToasts.forEach(toastElement => {
    const bsToast = bootstrap.Toast.getInstance(toastElement);
    if (bsToast) {
      bsToast.hide();
    }
  });
  activeToasts.clear();
}

/**
 * Toast 요소 생성 (단일 색상 - 다크 그레이)
 */
function createToastElement(id, message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.id = id;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  toast.innerHTML = `
    <div class="toast-body d-flex align-items-center justify-content-between">
      <span>${message}</span>
      <button type="button" class="btn-close ms-3" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  return toast;
}

/**
 * Toast 표시 (기존 Toast 제거 후 새로 표시)
 * @param {string} message - 메시지
 * @param {number} delay - 자동 닫힘 시간 (ms)
 * @returns {Promise<void>}
 */
function show(message, delay = 3500) {
  // 기존 Toast 모두 제거
  clearAllToasts();
  
  const id = `toast-${toastCounter++}`;
  const container = ensureToastContainer();
  const toastElement = createToastElement(id, message);
  
  container.appendChild(toastElement);
  activeToasts.add(toastElement);
  
  const bsToast = new bootstrap.Toast(toastElement, {
    autohide: delay > 0,
    delay: delay
  });
  
  return new Promise((resolve) => {
    // Toast가 완전히 숨겨진 후 제거
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
      activeToasts.delete(toastElement);
      resolve();
    }, { once: true });
    
    bsToast.show();
  });
}

export const Toast = {
  show
};
