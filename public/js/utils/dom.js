/**
 * DOM Utilities Module
 * 공통 DOM 조작 유틸리티 제공
 */

/**
 * querySelector 래퍼
 * @param {string} selector - CSS 선택자
 * @param {Element|Document} parent - 부모 요소 (기본값: document)
 * @returns {Element|null}
 */
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * querySelectorAll 래퍼 (배열 반환)
 * @param {string} selector - CSS 선택자
 * @param {Element|Document} parent - 부모 요소 (기본값: document)
 * @returns {Element[]}
 */
export function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * 요소 생성
 * @param {string} tag - HTML 태그명
 * @param {Object} attributes - 속성 객체
 * @param {Array<Element|string>} children - 자식 요소 또는 텍스트
 * @returns {Element}
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  // 속성 설정
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = dataValue;
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      // 이벤트 리스너 (권장하지 않음, events.on() 사용 권장)
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  }

  // 자식 요소 추가
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Element) {
      element.appendChild(child);
    }
  }

  return element;
}

/**
 * HTML 컴포넌트 로드
 * @param {string} url - 컴포넌트 URL
 * @returns {Promise<string>} HTML 문자열
 */
export async function loadComponent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load component: ${url}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading component:', error);
    return '';
  }
}

/**
 * 요소 표시
 * @param {Element} element - 대상 요소
 */
export function show(element) {
  if (element) {
    element.style.display = '';
    element.removeAttribute('hidden');
  }
}

/**
 * 요소 숨김
 * @param {Element} element - 대상 요소
 */
export function hide(element) {
  if (element) {
    element.style.display = 'none';
    element.setAttribute('hidden', '');
  }
}

/**
 * 요소 표시/숨김 토글
 * @param {Element} element - 대상 요소
 */
export function toggle(element) {
  if (element) {
    if (element.style.display === 'none' || element.hasAttribute('hidden')) {
      show(element);
    } else {
      hide(element);
    }
  }
}

/**
 * HTML 이스케이프 (XSS 방지)
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} 이스케이프된 문자열
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') {
    return '';
  }

  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
}

export const dom = {
  qs,
  qsa,
  createElement,
  loadComponent,
  show,
  hide,
  toggle,
  escapeHTML
};
