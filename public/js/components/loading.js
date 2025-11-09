/**
 * Loading Component
 * Bootstrap Spinner 컴포넌트 래퍼
 * 전역 로딩 상태 관리
 * 오버레이 로딩 스피너 제공
 */

let loadingCounter = 0;
let loadingElement = null;

/**
 * 로딩 오버레이 DOM 요소 생성
 * @returns {HTMLElement} 로딩 오버레이 요소
 */
function createLoadingElement() {
  const loading = document.createElement('div');
  loading.id = 'global-loading-overlay';
  loading.className = 'loading-overlay';
  loading.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9998;
    opacity: 0;
    transition: opacity 0.15s ease;
  `;
  
  loading.innerHTML = `
    <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
      <span class="visually-hidden">Loading...</span>
    </div>
  `;
  
  return loading;
}

/**
 * 로딩 인디케이터 표시
 * 중첩 호출을 지원하며, 모든 show()에 대응하는 hide()가 호출될 때까지 표시 유지
 * @returns {void}
 */
export function show() {
  loadingCounter++;
  
  // 첫 번째 show() 호출 시에만 DOM 요소 생성 및 추가
  if (loadingCounter === 1) {
    if (!loadingElement) {
      loadingElement = createLoadingElement();
    }
    
    document.body.appendChild(loadingElement);
    
    // 약간의 지연 후 opacity 변경 (transition 효과)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (loadingElement) {
          loadingElement.style.opacity = '1';
        }
      });
    });
  }
}

/**
 * 로딩 인디케이터 숨김
 * show()와 hide() 호출 횟수가 일치할 때 실제로 숨김
 * @returns {void}
 */
export function hide() {
  loadingCounter = Math.max(0, loadingCounter - 1);
  
  // 모든 show()에 대응하는 hide()가 호출되었을 때만 숨김
  if (loadingCounter === 0 && loadingElement) {
    loadingElement.style.opacity = '0';
    
    // transition 완료 후 DOM에서 제거
    setTimeout(() => {
      if (loadingElement && loadingCounter === 0) {
        loadingElement.remove();
      }
    }, 150);
  }
}

/**
 * 로딩 상태 강제 초기화
 * 에러 발생 시 등 비정상적인 상황에서 로딩 상태를 강제로 리셋
 * @returns {void}
 */
export function reset() {
  loadingCounter = 0;
  
  if (loadingElement) {
    loadingElement.style.opacity = '0';
    setTimeout(() => {
      if (loadingElement) {
        loadingElement.remove();
      }
    }, 150);
  }
}

/**
 * 현재 로딩 상태 확인
 * @returns {boolean} 로딩 중이면 true, 아니면 false
 */
export function isLoading() {
  return loadingCounter > 0;
}

/**
 * Loading 객체 export
 */
export const Loading = {
  show,
  hide,
  reset,
  isLoading
};
