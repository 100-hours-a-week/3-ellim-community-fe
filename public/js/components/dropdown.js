/**
 * Dropdown Component
 * 접근성을 고려한 드롭다운 메뉴
 * Bootstrap Dropdown 사용
 */

import { dom } from '../utils/dom.js';
import { events } from '../utils/events.js';

/**
 * 드롭다운 초기화
 * @param {string} buttonSelector - 드롭다운 버튼 선택자
 * @param {string} menuSelector - 드롭다운 메뉴 선택자
 * @param {string} pageId - 페이지 식별자 (이벤트 정리용)
 * @returns {Object} - 드롭다운 제어 객체
 */
export function initDropdown(buttonSelector, menuSelector, pageId) {
  const button = dom.qs(buttonSelector);
  const menu = dom.qs(menuSelector);

  if (!button || !menu) {
    console.warn(`Dropdown elements not found: ${buttonSelector}, ${menuSelector}`);
    return null;
  }

  // Bootstrap Dropdown 사용 가능 여부 확인
  if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
    return initBootstrapDropdown(button, menu, pageId);
  } else {
    // Bootstrap이 없는 경우 커스텀 구현
    return initCustomDropdown(button, menu, pageId);
  }
}

/**
 * Bootstrap Dropdown 초기화
 */
function initBootstrapDropdown(button, menu, pageId) {
  // Bootstrap Dropdown 인스턴스 생성
  const dropdown = new bootstrap.Dropdown(button);

  // 키보드 네비게이션은 Bootstrap이 자동 처리
  
  return {
    show: () => dropdown.show(),
    hide: () => dropdown.hide(),
    toggle: () => dropdown.toggle(),
    dispose: () => dropdown.dispose()
  };
}

/**
 * 커스텀 Dropdown 초기화 (Bootstrap 없을 때)
 */
function initCustomDropdown(button, menu, pageId) {
  let isOpen = false;

  // 초기 상태 설정
  button.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
  menu.style.display = 'none';

  // 버튼 클릭
  events.on(button, 'click', (e) => {
    e.stopPropagation();
    toggle();
  }, { pageId });

  // 외부 클릭 시 닫기
  events.on(document, 'click', (e) => {
    if (isOpen && !button.contains(e.target) && !menu.contains(e.target)) {
      close();
    }
  }, { pageId });

  // 키보드 네비게이션
  events.on(button, 'keydown', handleButtonKeydown, { pageId });
  events.on(menu, 'keydown', handleMenuKeydown, { pageId });

  function open() {
    isOpen = true;
    button.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    menu.style.display = 'block';

    // 첫 번째 메뉴 항목에 포커스
    const firstItem = menu.querySelector('a, button, [role="menuitem"]');
    if (firstItem) {
      firstItem.focus();
    }
  }

  function close() {
    isOpen = false;
    button.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    menu.style.display = 'none';
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function handleButtonKeydown(e) {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          open();
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        button.focus();
        break;
    }
  }

  function handleMenuKeydown(e) {
    const items = Array.from(menu.querySelectorAll('a, button, [role="menuitem"]'));
    const currentIndex = items.indexOf(document.activeElement);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          items[currentIndex + 1].focus();
        } else {
          items[0].focus(); // 순환
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          items[currentIndex - 1].focus();
        } else {
          items[items.length - 1].focus(); // 순환
        }
        break;
      case 'Home':
        e.preventDefault();
        items[0].focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1].focus();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        button.focus();
        break;
      case 'Tab':
        // Tab 키로 드롭다운 벗어나면 닫기
        close();
        break;
    }
  }

  return {
    show: open,
    hide: close,
    toggle: toggle,
    dispose: () => {
      // 이벤트는 events.removeAllForPage()로 정리됨
    }
  };
}

/**
 * 여러 드롭다운 초기화
 * @param {Array<Object>} dropdowns - 드롭다운 설정 배열
 * @param {string} pageId - 페이지 식별자
 * @returns {Array<Object>} - 드롭다운 제어 객체 배열
 */
export function initMultipleDropdowns(dropdowns, pageId) {
  return dropdowns.map(({ buttonSelector, menuSelector }) => {
    return initDropdown(buttonSelector, menuSelector, pageId);
  }).filter(dropdown => dropdown !== null);
}
