/**
 * 폼 검증 UI 컴포넌트
 * 실시간 검증 피드백 제공
 */

import { dom } from "../utils/dom.js";

/**
 * 입력 필드에 검증 상태 표시
 * @param {HTMLElement} input - 입력 필드
 * @param {Object} validationResult - { isValid, errors }
 */
export function showValidationFeedback(input, validationResult) {
  if (!input) return;
  
  // 기존 피드백 제거
  clearValidationFeedback(input);
  
  const { isValid, errors } = validationResult;
  
  if (isValid) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
  } else {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    
    // 에러 메시지 표시
    if (errors && errors.length > 0) {
      const feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      feedback.textContent = errors[0]; // 첫 번째 에러만 표시
      input.parentElement.appendChild(feedback);
    }
  }
}

/**
 * 검증 피드백 제거
 * @param {HTMLElement} input - 입력 필드
 */
export function clearValidationFeedback(input) {
  if (!input) return;
  
  input.classList.remove('is-valid', 'is-invalid');
  
  // 기존 피드백 메시지 제거
  const existingFeedback = input.parentElement.querySelector('.invalid-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
}

// /**
//  * 비밀번호 강도 표시기 생성
//  * @param {HTMLElement} passwordInput - 비밀번호 입력 필드
//  * @returns {HTMLElement} 강도 표시기 요소
//  */
// export function createPasswordStrengthIndicator(passwordInput) {
//   if (!passwordInput) return null;
  
//   const container = document.createElement('div');
//   container.className = 'password-strength-indicator mt-2';
//   container.innerHTML = `
//     <div class="d-flex gap-1 mb-1">
//       <div class="strength-bar flex-fill bg-secondary" style="height: 4px; border-radius: 2px;"></div>
//       <div class="strength-bar flex-fill bg-secondary" style="height: 4px; border-radius: 2px;"></div>
//       <div class="strength-bar flex-fill bg-secondary" style="height: 4px; border-radius: 2px;"></div>
//       <div class="strength-bar flex-fill bg-secondary" style="height: 4px; border-radius: 2px;"></div>
//     </div>
//     <small class="strength-text text-muted">비밀번호 강도</small>
//   `;
  
//   passwordInput.parentElement.appendChild(container);
  
//   return container;
// }

// /**
//  * 비밀번호 강도 업데이트
//  * @param {HTMLElement} indicator - 강도 표시기 요소
//  * @param {Object} strength - { strength: 'weak'|'medium'|'strong', score: 0-4 }
//  */
// export function updatePasswordStrength(indicator, strength) {
//   if (!indicator) return;
  
//   const bars = indicator.querySelectorAll('.strength-bar');
//   const text = indicator.querySelector('.strength-text');
  
//   // 모든 바 초기화
//   bars.forEach(bar => {
//     bar.className = 'strength-bar flex-fill bg-secondary';
//     bar.style.height = '4px';
//     bar.style.borderRadius = '2px';
//   });
  
//   // 비밀번호가 비어있으면 초기 상태로
//   if (strength.score === 0) {
//     text.textContent = '비밀번호 강도';
//     text.className = 'strength-text text-muted';
//     return;
//   }
  
//   // 강도에 따라 바 색상 변경
//   let color = 'danger';
//   let label = '약함';
  
//   if (strength.strength === 'strong') {
//     color = 'success';
//     label = '강함';
//   } else if (strength.strength === 'medium') {
//     color = 'warning';
//     label = '보통';
//   }
  
//   // 점수만큼 바 활성화
//   for (let i = 0; i < strength.score && i < bars.length; i++) {
//     bars[i].classList.remove('bg-secondary');
//     bars[i].classList.add(`bg-${color}`);
//   }
  
//   text.textContent = `비밀번호 강도: ${label}`;
//   text.className = `strength-text text-${color}`;
// }

// /**
//  * 비밀번호 요구사항 체크리스트 생성 (2열 레이아웃)
//  * @param {HTMLElement} passwordInput - 비밀번호 입력 필드
//  * @returns {HTMLElement} 체크리스트 요소
//  */
// export function createPasswordRequirements(passwordInput) {
//   if (!passwordInput) return null;
  
//   const container = document.createElement('div');
//   container.className = 'password-requirements mt-2';
//   container.innerHTML = `
//     <div class="row g-2 small">
//       <div class="col-6">
//         <div class="d-flex align-items-center gap-1" data-rule="length">
//           <span class="icon text-secondary fw-bold flex-shrink-0">○</span>
//           <span class="text text-muted">8-20자</span>
//         </div>
//       </div>
//       <div class="col-6">
//         <div class="d-flex align-items-center gap-1" data-rule="lowercase">
//           <span class="icon text-secondary fw-bold flex-shrink-0">○</span>
//           <span class="text text-muted">소문자</span>
//         </div>
//       </div>
//       <div class="col-6">
//         <div class="d-flex align-items-center gap-1" data-rule="uppercase">
//           <span class="icon text-secondary fw-bold flex-shrink-0">○</span>
//           <span class="text text-muted">대문자</span>
//         </div>
//       </div>
//       <div class="col-6">
//         <div class="d-flex align-items-center gap-1" data-rule="number">
//           <span class="icon text-secondary fw-bold flex-shrink-0">○</span>
//           <span class="text text-muted">숫자</span>
//         </div>
//       </div>
//       <div class="col-12">
//         <div class="d-flex align-items-center gap-1" data-rule="special">
//           <span class="icon text-secondary fw-bold flex-shrink-0">○</span>
//           <span class="text text-muted">특수문자 (!@#$%^&* 등)</span>
//         </div>
//       </div>
//     </div>
//   `;
  
//   passwordInput.parentElement.appendChild(container);
  
//   return container;
// }

/**
 * 비밀번호 요구사항 체크리스트 업데이트
 * @param {HTMLElement} requirementsContainer - 요구사항 컨테이너
 * @param {string} password - 비밀번호
 */
export function updatePasswordRequirements(requirementsContainer, password) {
  if (!requirementsContainer) return;
  
  const requirements = {
    length: password.length >= 8 && password.length <= 20,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-={}[\]:";'<>?,./]/.test(password)
  };
  
  Object.entries(requirements).forEach(([rule, isMet]) => {
    const item = requirementsContainer.querySelector(`[data-rule="${rule}"]`);
    if (!item) return;
    
    const icon = item.querySelector('.icon');
    const text = item.querySelector('.text');
    
    if (isMet) {
      icon.textContent = '✓';
      icon.className = 'icon text-success fw-bold flex-shrink-0';
      text.className = 'text text-success';
    } else {
      icon.textContent = '○';
      icon.className = 'icon text-secondary fw-bold flex-shrink-0';
      text.className = 'text text-muted';
    }
  });
}

/**
 * 폼 전체 검증
 * @param {Object} validators - { fieldName: validationFunction }
 * @param {Object} values - { fieldName: value }
 * @returns {Object} { isValid, errors: { fieldName: [errors] } }
 */
export function validateForm(validators, values) {
  const errors = {};
  let isValid = true;
  
  Object.entries(validators).forEach(([fieldName, validator]) => {
    const value = values[fieldName];
    const result = validator(value);
    
    if (!result.isValid) {
      errors[fieldName] = result.errors;
      isValid = false;
    }
  });
  
  return { isValid, errors };
}
