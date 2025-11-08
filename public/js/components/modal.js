/**
 * Modal Component
 * Bootstrap Modal을 쉽게 사용할 수 있는 래퍼 (alert/confirm/prompt 대체)
 * Promise 기반 인터페이스 제공
 */

let modalCounter = 0;

/**
 * 모달 DOM 요소 생성
 */
function createModalElement(id, title, bodyContent, footerButtons) {
  const modal = document.createElement('div');
  modal.className = 'modal fade modal-fast';
  modal.id = id;
  modal.tabIndex = -1;
  modal.setAttribute('aria-labelledby', `${id}Label`);
  modal.setAttribute('aria-hidden', 'true');

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="${id}Label">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          ${bodyContent}
        </div>
        <div class="modal-footer">
          ${footerButtons}
        </div>
      </div>
    </div>
  `;

  return modal;
}

/**
 * 모달 표시 및 Promise 반환
 */
function showModal(modalElement, onResolve) {
  document.body.appendChild(modalElement);

  const bsModal = new bootstrap.Modal(modalElement);
  
  return new Promise((resolve) => {
    // 모달이 완전히 숨겨진 후 정리
    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
    }, { once: true });

    // 사용자 정의 resolve 핸들러 실행
    onResolve(resolve, bsModal);

    bsModal.show();
  });
}

/**
 * Alert 모달 표시
 * @param {string} title - 모달 제목
 * @param {string} message - 모달 메시지
 * @returns {Promise<void>}
 */
export function alert(title, message) {
  const id = `modal-alert-${modalCounter++}`;
  const bodyContent = `<p>${message}</p>`;
  const footerButtons = `
    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">확인</button>
  `;

  const modalElement = createModalElement(id, title, bodyContent, footerButtons);

  return showModal(modalElement, (resolve, bsModal) => {
    const confirmBtn = modalElement.querySelector('.btn-primary');
    confirmBtn.addEventListener('click', () => {
      resolve();
    }, { once: true });

    // 모달이 닫힐 때도 resolve
    modalElement.addEventListener('hidden.bs.modal', () => {
      resolve();
    }, { once: true });
  });
}

/**
 * Confirm 모달 표시
 * @param {string} title - 모달 제목
 * @param {string} message - 모달 메시지
 * @returns {Promise<boolean>} - 확인: true, 취소: false
 */
export function confirm(title, message) {
  const id = `modal-confirm-${modalCounter++}`;
  const bodyContent = `<p>${message}</p>`;
  const footerButtons = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
    <button type="button" class="btn btn-primary" data-confirm="true">확인</button>
  `;

  const modalElement = createModalElement(id, title, bodyContent, footerButtons);

  return showModal(modalElement, (resolve, bsModal) => {
    let result = false;

    const confirmBtn = modalElement.querySelector('[data-confirm="true"]');
    const cancelBtn = modalElement.querySelector('.btn-secondary');

    confirmBtn.addEventListener('click', () => {
      result = true;
      bsModal.hide();
    }, { once: true });

    cancelBtn.addEventListener('click', () => {
      result = false;
      bsModal.hide();
    }, { once: true });

    // 모달이 닫힐 때 결과 반환
    modalElement.addEventListener('hidden.bs.modal', () => {
      resolve(result);
    }, { once: true });
  });
}

/**
 * Prompt 모달 표시
 * @param {string} title - 모달 제목
 * @param {string} message - 모달 메시지
 * @param {string} defaultValue - 기본값
 * @returns {Promise<string|null>} - 입력값 또는 null (취소 시)
 */
export function prompt(title, message, defaultValue = '') {
  const id = `modal-prompt-${modalCounter++}`;
  const bodyContent = `
    <p>${message}</p>
    <input type="text" class="form-control" id="${id}-input" value="${defaultValue}">
  `;
  const footerButtons = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
    <button type="button" class="btn btn-primary" data-confirm="true">확인</button>
  `;

  const modalElement = createModalElement(id, title, bodyContent, footerButtons);

  return showModal(modalElement, (resolve, bsModal) => {
    let result = null;

    const input = modalElement.querySelector(`#${id}-input`);
    const confirmBtn = modalElement.querySelector('[data-confirm="true"]');
    const cancelBtn = modalElement.querySelector('.btn-secondary');

    // 입력 필드에 포커스
    modalElement.addEventListener('shown.bs.modal', () => {
      input.focus();
      input.select();
    }, { once: true });

    // Enter 키로 확인
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        result = input.value;
        bsModal.hide();
      }
    });

    confirmBtn.addEventListener('click', () => {
      result = input.value;
      bsModal.hide();
    }, { once: true });

    cancelBtn.addEventListener('click', () => {
      result = null;
      bsModal.hide();
    }, { once: true });

    // 모달이 닫힐 때 결과 반환
    modalElement.addEventListener('hidden.bs.modal', () => {
      resolve(result);
    }, { once: true });
  });
}

/**
 * 커스텀 모달 표시
 * @param {Object} options - 모달 옵션
 * @param {string} options.title - 모달 제목
 * @param {string} options.body - 모달 본문 HTML
 * @param {Array<Object>} options.buttons - 버튼 배열
 * @param {string} options.buttons[].text - 버튼 텍스트
 * @param {string} options.buttons[].className - 버튼 클래스
 * @param {Function} options.buttons[].onClick - 버튼 클릭 핸들러
 * @returns {Promise<any>}
 */
export function custom(options) {
  const id = `modal-custom-${modalCounter++}`;
  const { title, body, buttons = [] } = options;

  const footerButtons = buttons.map((btn, index) => {
    const className = btn.className || 'btn btn-secondary';
    return `<button type="button" class="btn ${className}" data-btn-index="${index}">${btn.text}</button>`;
  }).join('');

  const modalElement = createModalElement(id, title, body, footerButtons);

  return showModal(modalElement, (resolve, bsModal) => {
    buttons.forEach((btn, index) => {
      const btnElement = modalElement.querySelector(`[data-btn-index="${index}"]`);
      btnElement.addEventListener('click', async () => {
        if (btn.onClick) {
          const result = await btn.onClick();
          resolve(result);
        } else {
          resolve(index);
        }
        bsModal.hide();
      }, { once: true });
    });

    // 모달이 닫힐 때 null 반환 (버튼 클릭 없이 닫힌 경우)
    modalElement.addEventListener('hidden.bs.modal', () => {
      resolve(null);
    }, { once: true });
  });
}

export const Modal = {
  alert,
  confirm,
  prompt,
  custom
};
