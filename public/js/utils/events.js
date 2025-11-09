/**
 * Event Manager
 * 이벤트 리스너의 중복 등록을 방지하고 페이지별로 관리하는 유틸리티
 */

// 리스너 메타데이터 구조
class ListenerMeta {
  constructor(element, eventType, handler, options = {}) {
    this.element = element;
    this.eventType = eventType;
    this.handler = handler;
    this.options = options;
    this.pageId = options.pageId || null;
  }

  // 리스너 식별을 위한 키 생성
  getKey() {
    return `${this.eventType}:${this.handler.toString()}`;
  }
}

// WeakMap: 요소별 리스너 추적 (요소가 제거되면 자동으로 정리됨)
const listenersByElement = new WeakMap();

// Map: pageId별 리스너 추적
const listenersByPageId = new Map();

/**
 * 이벤트 리스너를 등록합니다 (중복 방지)
 * @param {Element} element - 대상 요소
 * @param {string} eventType - 이벤트 타입 (예: 'click', 'submit')
 * @param {Function} handler - 이벤트 핸들러 함수
 * @param {Object} options - 옵션 객체
 * @param {string} options.pageId - 페이지 ID (정리용)
 * @param {boolean} options.once - 일회성 실행 여부
 * @param {boolean} options.capture - 캡처 단계 옵션
 * @returns {boolean} - 등록 성공 여부 (중복이면 false)
 */
function on(element, eventType, handler, options = {}) {
  if (!element || !eventType || typeof handler !== 'function') {
    console.warn('Invalid parameters for events.on()');
    return false;
  }

  // 요소별 리스너 맵 가져오기 또는 생성
  let elementListeners = listenersByElement.get(element);
  if (!elementListeners) {
    elementListeners = new Map();
    listenersByElement.set(element, elementListeners);
  }

  // 이벤트 타입별 리스너 Set 가져오기 또는 생성
  let typeListeners = elementListeners.get(eventType);
  if (!typeListeners) {
    typeListeners = new Set();
    elementListeners.set(eventType, typeListeners);
  }

  // 중복 확인 (동일한 element + eventType + handler 조합)
  const listenerMeta = new ListenerMeta(element, eventType, handler, options);
  const key = listenerMeta.getKey();
  
  for (const existing of typeListeners) {
    if (existing.getKey() === key) {
      console.warn(`Duplicate event listener prevented: ${eventType} on`, element);
      return false;
    }
  }

  // 리스너 등록
  typeListeners.add(listenerMeta);

  // pageId가 있으면 페이지별 추적에도 추가
  if (options.pageId) {
    let pageListeners = listenersByPageId.get(options.pageId);
    if (!pageListeners) {
      pageListeners = new Set();
      listenersByPageId.set(options.pageId, pageListeners);
    }
    pageListeners.add(listenerMeta);
  }

  // 실제 이벤트 리스너 등록
  const eventOptions = {
    once: options.once || false,
    capture: options.capture || false
  };

  element.addEventListener(eventType, handler, eventOptions);

  return true;
}

/**
 * 이벤트 리스너를 제거합니다
 * @param {Element} element - 대상 요소
 * @param {string} eventType - 이벤트 타입
 * @param {Function} handler - 이벤트 핸들러 함수
 * @returns {boolean} - 제거 성공 여부
 */
function off(element, eventType, handler) {
  if (!element || !eventType || typeof handler !== 'function') {
    console.warn('Invalid parameters for events.off()');
    return false;
  }

  const elementListeners = listenersByElement.get(element);
  if (!elementListeners) {
    return false;
  }

  const typeListeners = elementListeners.get(eventType);
  if (!typeListeners) {
    return false;
  }

  // 해당 핸들러를 가진 리스너 찾기
  const key = `${eventType}:${handler.toString()}`;
  let found = null;

  for (const listenerMeta of typeListeners) {
    if (listenerMeta.getKey() === key) {
      found = listenerMeta;
      break;
    }
  }

  if (!found) {
    return false;
  }

  // 리스너 제거
  typeListeners.delete(found);

  // pageId 추적에서도 제거
  if (found.pageId) {
    const pageListeners = listenersByPageId.get(found.pageId);
    if (pageListeners) {
      pageListeners.delete(found);
      if (pageListeners.size === 0) {
        listenersByPageId.delete(found.pageId);
      }
    }
  }

  // 실제 이벤트 리스너 제거
  element.removeEventListener(eventType, handler, found.options.capture || false);

  // Set이 비어있으면 정리
  if (typeListeners.size === 0) {
    elementListeners.delete(eventType);
  }

  return true;
}

/**
 * 일회성 이벤트 리스너를 등록합니다
 * @param {Element} element - 대상 요소
 * @param {string} eventType - 이벤트 타입
 * @param {Function} handler - 이벤트 핸들러 함수
 * @param {Object} options - 옵션 객체
 * @returns {boolean} - 등록 성공 여부
 */
function once(element, eventType, handler, options = {}) {
  return on(element, eventType, handler, { ...options, once: true });
}

/**
 * 특정 요소의 모든 이벤트 리스너를 제거합니다
 * @param {Element} element - 대상 요소
 * @returns {number} - 제거된 리스너 수
 */
function removeAll(element) {
  if (!element) {
    console.warn('Invalid element for events.removeAll()');
    return 0;
  }

  const elementListeners = listenersByElement.get(element);
  if (!elementListeners) {
    return 0;
  }

  let count = 0;

  // 모든 이벤트 타입의 리스너 제거
  for (const [eventType, typeListeners] of elementListeners) {
    for (const listenerMeta of typeListeners) {
      // 실제 이벤트 리스너 제거
      element.removeEventListener(
        eventType,
        listenerMeta.handler,
        listenerMeta.options.capture || false
      );

      // pageId 추적에서도 제거
      if (listenerMeta.pageId) {
        const pageListeners = listenersByPageId.get(listenerMeta.pageId);
        if (pageListeners) {
          pageListeners.delete(listenerMeta);
          if (pageListeners.size === 0) {
            listenersByPageId.delete(listenerMeta.pageId);
          }
        }
      }

      count++;
    }
  }

  // WeakMap에서 제거 (자동으로 정리되지만 명시적으로 제거)
  listenersByElement.delete(element);

  return count;
}

/**
 * 특정 페이지의 모든 이벤트 리스너를 제거합니다
 * @param {string} pageId - 페이지 ID
 * @returns {number} - 제거된 리스너 수
 */
function removeAllForPage(pageId) {
  if (!pageId) {
    console.warn('Invalid pageId for events.removeAllForPage()');
    return 0;
  }

  const pageListeners = listenersByPageId.get(pageId);
  if (!pageListeners) {
    return 0;
  }

  let count = 0;

  // 페이지의 모든 리스너 제거
  for (const listenerMeta of pageListeners) {
    const { element, eventType, handler, options } = listenerMeta;

    // 실제 이벤트 리스너 제거
    element.removeEventListener(eventType, handler, options.capture || false);

    // 요소별 추적에서도 제거
    const elementListeners = listenersByElement.get(element);
    if (elementListeners) {
      const typeListeners = elementListeners.get(eventType);
      if (typeListeners) {
        typeListeners.delete(listenerMeta);
        if (typeListeners.size === 0) {
          elementListeners.delete(eventType);
        }
      }
    }

    count++;
  }

  // pageId 추적에서 제거
  listenersByPageId.delete(pageId);

  return count;
}

// Export
export const events = {
  on,
  off,
  once,
  removeAll,
  removeAllForPage
};
