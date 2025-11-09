/**
 * Form Helpers Utility
 * 폼 관련 공통 기능 제공
 */

import { events } from "./events.js";

/**
 * 글자 수 카운터 생성
 * @param {HTMLInputElement|HTMLTextAreaElement} input - 입력 요소
 * @param {HTMLElement} countElement - 카운터 표시 요소
 * @param {number} maxLength - 최대 글자 수
 * @param {Object} options - 옵션
 * @param {string} options.pageId - 페이지 ID (이벤트 관리용)
 * @param {Function} options.onUpdate - 업데이트 시 콜백 (currentLength, maxLength) => void
 * @returns {Object} - { update: Function, destroy: Function }
 */
export function createCharCounter(input, countElement, maxLength, options = {}) {
  const { pageId, onUpdate } = options;

  /**
   * 글자 수 업데이트
   */
  function update() {
    const currentLength = input.value.length;
    
    countElement.textContent = currentLength;
    
    // 글자 수에 따라 색상 변경
    if (currentLength >= maxLength) {
      countElement.className = "text-danger fw-bold";
    } else if (currentLength >= maxLength * 0.9) {
      countElement.className = "text-warning fw-bold";
    } else {
      countElement.className = "text-muted";
    }

    if (onUpdate) {
      onUpdate(currentLength, maxLength);
    }
  }

  // 초기 업데이트
  update();

  // 입력 이벤트 리스너
  if (pageId) {
    events.on(input, "input", update, { pageId });
  } else {
    input.addEventListener("input", update);
  }

  return {
    update,
    destroy: () => {
      // pageId가 있으면 events.removeAllForPage로 자동 정리됨
      if (!pageId) {
        input.removeEventListener("input", update);
      }
    }
  };
}

/**
 * 폼 컨트롤러 생성
 * @param {HTMLFormElement} form - 폼 요소
 * @param {Object} options - 옵션
 * @param {HTMLElement[]} options.additionalElements - 추가로 제어할 요소들
 * @param {HTMLButtonElement} options.submitButton - 제출 버튼
 * @param {string} options.loadingText - 로딩 중 버튼 텍스트
 * @param {string} options.loadingHTML - 로딩 중 버튼 HTML
 * @returns {Object} - { disable: Function, enable: Function, isDisabled: Function }
 */
export function createFormController(form, options = {}) {
  const {
    additionalElements = [],
    submitButton,
    loadingText = '처리 중...',
    loadingHTML = '<span class="spinner-border spinner-border-sm me-1"></span>처리 중...'
  } = options;

  let isDisabled = false;
  let originalButtonContent = null;

  /**
   * 폼 비활성화
   */
  function disable() {
    if (isDisabled) return;

    // 폼 내 모든 입력 요소 비활성화
    const formElements = form.querySelectorAll('input, textarea, select, button');
    formElements.forEach(el => {
      el.disabled = true;
    });

    // 추가 요소 비활성화
    additionalElements.forEach(el => {
      el.disabled = true;
    });

    // 제출 버튼 로딩 상태
    if (submitButton) {
      originalButtonContent = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = loadingHTML;
    }

    isDisabled = true;
  }

  /**
   * 폼 활성화
   */
  function enable() {
    if (!isDisabled) return;

    // 폼 내 모든 입력 요소 활성화
    const formElements = form.querySelectorAll('input, textarea, select, button');
    formElements.forEach(el => {
      el.disabled = false;
    });

    // 추가 요소 활성화
    additionalElements.forEach(el => {
      el.disabled = false;
    });

    // 제출 버튼 복원
    if (submitButton && originalButtonContent) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonContent;
    }

    isDisabled = false;
  }

  return {
    disable,
    enable,
    isDisabled: () => isDisabled
  };
}

/**
 * 폼 제출 헬퍼
 * @param {HTMLFormElement} form - 폼 요소
 * @param {Function} submitFn - 제출 함수 (async)
 * @param {Object} options - 옵션
 * @param {Function} options.onBefore - 제출 전 콜백 (return false로 취소 가능)
 * @param {Function} options.onSuccess - 성공 시 콜백
 * @param {Function} options.onError - 에러 시 콜백
 * @param {Function} options.onFinally - 완료 시 콜백
 * @param {Object} options.controller - 폼 컨트롤러 (createFormController 반환값)
 * @returns {Function} - 이벤트 핸들러 함수
 */
export function createFormSubmitHandler(form, submitFn, options = {}) {
  const {
    onBefore,
    onSuccess,
    onError,
    onFinally,
    controller
  } = options;

  return async function handleSubmit(event) {
    event.preventDefault();

    // 제출 전 콜백
    if (onBefore) {
      const shouldContinue = await onBefore();
      if (shouldContinue === false) {
        return;
      }
    }

    // 폼 비활성화
    if (controller) {
      controller.disable();
    }

    try {
      const result = await submitFn();

      if (onSuccess) {
        await onSuccess(result);
      }
    } catch (error) {
      console.error("Form submit error:", error);

      if (onError) {
        await onError(error);
      }

      // 에러 시 폼 활성화
      if (controller) {
        controller.enable();
      }
    } finally {
      if (onFinally) {
        await onFinally();
      }
    }
  };
}

/**
 * 입력 필드 자동 높이 조절 (textarea)
 * @param {HTMLTextAreaElement} textarea - 텍스트 영역
 * @param {Object} options - 옵션
 * @param {number} options.minHeight - 최소 높이 (px)
 * @param {number} options.maxHeight - 최대 높이 (px)
 * @param {string} options.pageId - 페이지 ID
 */
export function createAutoResizeTextarea(textarea, options = {}) {
  const { minHeight = 100, maxHeight = 500, pageId } = options;

  function resize() {
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }

  // 초기 크기 조정
  resize();

  // 입력 이벤트 리스너
  if (pageId) {
    events.on(textarea, "input", resize, { pageId });
  } else {
    textarea.addEventListener("input", resize);
  }

  return {
    resize,
    destroy: () => {
      if (!pageId) {
        textarea.removeEventListener("input", resize);
      }
    }
  };
}
