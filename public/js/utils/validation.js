/**
 * Form Validation Utility
 * Bootstrap 폼 유효성 검사 래퍼 및 공통 유효성 검사 규칙
 * 백엔드 검증 규칙과 동일한 프론트엔드 검증 제공
 */

/**
 * 이메일 검증 (EmailMax247)
 * @param {string} email - 검증할 이메일
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateEmail(email) {
  const errors = [];
  
  if (!email || email.trim() === '') {
    errors.push('이메일을 입력해주세요.');
    return { isValid: false, errors };
  }
  
  const trimmedEmail = email.trim();
  
  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('올바른 이메일 형식이 아닙니다.');
  }
  
  // 길이 검증
  if (trimmedEmail.length > 247) {
    errors.push('이메일은 최대 247자까지 입력 가능합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 비밀번호 검증 (StrongPassword)
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password || password.trim() === '') {
    errors.push('비밀번호를 입력해주세요.');
    return { isValid: false, errors };
  }
  
  // 길이 검증
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }
  if (password.length > 20) {
    errors.push('비밀번호는 최대 20자까지 입력 가능합니다.');
  }
  
  // 소문자 포함 검증
  if (!/[a-z]/.test(password)) {
    errors.push('최소 하나의 소문자를 포함해야 합니다.');
  }
  
  // 대문자 포함 검증
  if (!/[A-Z]/.test(password)) {
    errors.push('최소 하나의 대문자를 포함해야 합니다.');
  }
  
  // 숫자 포함 검증
  if (!/\d/.test(password)) {
    errors.push('최소 하나의 숫자를 포함해야 합니다.');
  }
  
  // 특수문자 포함 검증
  if (!/[!@#$%^&*()_+\-={}[\]:";'<>?,./]/.test(password)) {
    errors.push('최소 하나의 특수문자를 포함해야 합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 비밀번호 확인 검증
 * @param {string} password - 원본 비밀번호
 * @param {string} passwordConfirm - 확인 비밀번호
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validatePasswordConfirm(password, passwordConfirm) {
  const errors = [];
  
  if (!passwordConfirm || passwordConfirm.trim() === '') {
    errors.push('비밀번호 확인을 입력해주세요.');
    return { isValid: false, errors };
  }
  
  if (password !== passwordConfirm) {
    errors.push('비밀번호가 일치하지 않습니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 닉네임 검증 (NicknameNoWhitespace)
 * @param {string} nickname - 검증할 닉네임
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateNickname(nickname) {
  const errors = [];
  
  if (!nickname || nickname.trim() === '') {
    errors.push('닉네임을 입력해주세요.');
    return { isValid: false, errors };
  }
  
  // 공백 검증
  if (/\s/.test(nickname)) {
    errors.push('닉네임에는 공백을 포함할 수 없습니다.');
  }
  
  // 길이 검증
  if (nickname.length < 1) {
    errors.push('닉네임은 최소 1자 이상이어야 합니다.');
  }
  if (nickname.length > 30) {
    errors.push('닉네임은 최대 30자까지 입력 가능합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 비밀번호 강도 계산 (UI 피드백용)
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} { strength: 'weak'|'medium'|'strong', score: 0-5 }
 */
export function getPasswordStrength(password) {
  if (!password) {
    return { strength: 'weak', score: 0 };
  }
  
  let score = 0;
  
  // 길이 점수
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // 복잡도 점수
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-={}[\]:";'<>?,./]/.test(password)) score++;
  
  let strength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return { strength, score };
}

/**
 * 유효성 검사 규칙 정의 (간단한 필드 검증용)
 */
const validationRules = {
  email: {
    validate: validateEmail,
  },
  password: {
    validate: validatePassword,
  },
  nickname: {
    validate: validateNickname,
  },
  title: {
    minLength: 1,
    maxLength: 26,
    message: '제목은 1-26자 이내로 입력해주세요.',
  },
  content: {
    minLength: 1,
    maxLength: 5000,
    message: '내용은 1-5000자 이내로 입력해주세요.',
  },
  required: {
    message: '필수 입력 항목입니다.',
  },
};

/**
 * 필드 유효성 검사
 * @param {HTMLInputElement|HTMLTextAreaElement} field - 검사할 필드
 * @param {string} ruleName - 적용할 규칙 이름 (email, password, nickname 등)
 * @returns {boolean} 유효성 검사 통과 여부
 */
export function validateField(field, ruleName = null) {
  if (!field) return false;

  // 필수 필드 체크
  const isRequired = field.hasAttribute('required');
  const value = field.value.trim();

  if (isRequired && !value) {
    setFieldInvalid(field, validationRules.required.message);
    return false;
  }

  // 값이 없고 필수가 아니면 통과
  if (!value && !isRequired) {
    setFieldValid(field);
    return true;
  }

  // 규칙 이름이 지정되지 않았으면 data-validate 속성에서 가져오기
  if (!ruleName) {
    ruleName = field.getAttribute('data-validate');
  }

  // 규칙이 없으면 기본 HTML5 유효성 검사만 수행
  if (!ruleName || !validationRules[ruleName]) {
    if (field.checkValidity()) {
      setFieldValid(field);
      return true;
    } else {
      setFieldInvalid(field, field.validationMessage);
      return false;
    }
  }

  const rule = validationRules[ruleName];

  // 커스텀 검증 함수가 있으면 사용
  if (rule.validate) {
    const result = rule.validate(value);
    if (!result.isValid) {
      setFieldInvalid(field, result.errors[0] || rule.message);
      return false;
    }
    setFieldValid(field);
    return true;
  }

  // 길이 검사
  if (rule.minLength && value.length < rule.minLength) {
    setFieldInvalid(field, rule.message);
    return false;
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    setFieldInvalid(field, rule.message);
    return false;
  }

  // 패턴 검사
  if (rule.pattern && !rule.pattern.test(value)) {
    setFieldInvalid(field, rule.message);
    return false;
  }

  // 모든 검사 통과
  setFieldValid(field);
  return true;
}

/**
 * 폼 전체 유효성 검사
 * @param {HTMLFormElement} form - 검사할 폼
 * @returns {boolean} 유효성 검사 통과 여부
 */
export function validateForm(form) {
  if (!form) return false;

  let isValid = true;

  // 모든 입력 필드 검사
  const fields = form.querySelectorAll('input, textarea, select');
  fields.forEach((field) => {
    // disabled 필드는 건너뛰기
    if (field.disabled) return;

    const ruleName = field.getAttribute('data-validate');
    if (!validateField(field, ruleName)) {
      isValid = false;
    }
  });

  // Bootstrap의 was-validated 클래스 추가
  form.classList.add('was-validated');

  return isValid;
}

/**
 * 필드를 유효 상태로 설정
 * @param {HTMLInputElement|HTMLTextAreaElement} field
 */
function setFieldValid(field) {
  field.classList.remove('is-invalid');
  field.classList.add('is-valid');

  // 기존 에러 메시지 제거
  const feedback = field.parentElement.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.textContent = '';
  }
}

/**
 * 필드를 무효 상태로 설정하고 에러 메시지 표시
 * @param {HTMLInputElement|HTMLTextAreaElement} field
 * @param {string} message - 에러 메시지
 */
function setFieldInvalid(field, message) {
  field.classList.remove('is-valid');
  field.classList.add('is-invalid');

  // 에러 메시지 표시
  let feedback = field.parentElement.querySelector('.invalid-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    field.parentElement.appendChild(feedback);
  }
  feedback.textContent = message;
}

/**
 * 폼에 실시간 유효성 검사 설정
 * @param {HTMLFormElement} form - 폼 요소
 * @param {Object} options - 옵션 (향후 확장용)
 */
export function setupRealtimeValidation(form, options = {}) {
  if (!form) return;

  // 모든 입력 필드에 blur 이벤트 추가
  const fields = form.querySelectorAll('input, textarea, select');
  fields.forEach((field) => {
    // blur 이벤트: 필드를 벗어날 때 검사
    field.addEventListener('blur', () => {
      const ruleName = field.getAttribute('data-validate');
      validateField(field, ruleName);
    });

    // input 이벤트: 입력 중에는 에러만 제거 (실시간 피드백)
    field.addEventListener('input', () => {
      if (field.classList.contains('is-invalid')) {
        const ruleName = field.getAttribute('data-validate');
        validateField(field, ruleName);
      }
    });
  });
}

/**
 * 비밀번호 확인 검사
 * @param {HTMLInputElement} passwordField - 비밀번호 필드
 * @param {HTMLInputElement} confirmField - 비밀번호 확인 필드
 * @returns {boolean} 일치 여부
 */
export function validatePasswordMatch(passwordField, confirmField) {
  if (!passwordField || !confirmField) return false;

  const password = passwordField.value;
  const confirm = confirmField.value;

  if (password !== confirm) {
    setFieldInvalid(confirmField, '비밀번호가 일치하지 않습니다.');
    return false;
  }

  setFieldValid(confirmField);
  return true;
}

/**
 * 폼 유효성 검사 초기화 (Bootstrap 스타일 제거)
 * @param {HTMLFormElement} form
 */
export function resetValidation(form) {
  if (!form) return;

  form.classList.remove('was-validated');

  const fields = form.querySelectorAll('input, textarea, select');
  fields.forEach((field) => {
    field.classList.remove('is-valid', 'is-invalid');
  });

  const feedbacks = form.querySelectorAll('.invalid-feedback');
  feedbacks.forEach((feedback) => {
    feedback.textContent = '';
  });
}

/**
 * 입력 필드에 검증 상태 표시 (validators.js 호환용)
 * @param {HTMLElement} input - 입력 필드
 * @param {Object} validationResult - { isValid, errors }
 */
export function showValidationFeedback(input, validationResult) {
  if (!input) return;
  
  const { isValid, errors } = validationResult;
  
  if (isValid) {
    setFieldValid(input);
  } else {
    const errorMessage = errors && errors.length > 0 ? errors[0] : '입력값이 올바르지 않습니다.';
    setFieldInvalid(input, errorMessage);
  }
}

/**
 * 검증 피드백 제거 (validators.js 호환용)
 * @param {HTMLElement} input - 입력 필드
 */
export function clearValidationFeedback(input) {
  if (!input) return;
  
  input.classList.remove('is-valid', 'is-invalid');
  
  // 기존 피드백 메시지 제거
  const existingFeedback = input.parentElement.querySelector('.invalid-feedback');
  if (existingFeedback) {
    existingFeedback.textContent = '';
  }
}

/**
 * 비밀번호 요구사항 체크리스트 생성
 * @param {HTMLElement} passwordInput - 비밀번호 입력 필드
 * @returns {HTMLElement} 체크리스트 요소
 */
export function createPasswordRequirements(passwordInput) {
  if (!passwordInput) return null;
  
  const container = document.createElement('div');
  container.className = 'password-requirements mt-2';
  container.innerHTML = `
    <div class="row g-2 small">
      <div class="col-6">
        <div class="d-flex align-items-center gap-1" data-rule="length">
          <span class="icon text-secondary fw-bold flex-shrink-0">○</span>
          <span class="text text-muted">8-20자</span>
        </div>
      </div>
      <div class="col-6">
        <div class="d-flex align-items-center gap-1" data-rule="lowercase">
          <span class="icon text-secondary fw-bold flex-shrink-0">○</span>
          <span class="text text-muted">소문자</span>
        </div>
      </div>
      <div class="col-6">
        <div class="d-flex align-items-center gap-1" data-rule="uppercase">
          <span class="icon text-secondary fw-bold flex-shrink-0">○</span>
          <span class="text text-muted">대문자</span>
        </div>
      </div>
      <div class="col-6">
        <div class="d-flex align-items-center gap-1" data-rule="number">
          <span class="icon text-secondary fw-bold flex-shrink-0">○</span>
          <span class="text text-muted">숫자</span>
        </div>
      </div>
      <div class="col-12">
        <div class="d-flex align-items-center gap-1" data-rule="special">
          <span class="icon text-secondary fw-bold flex-shrink-0">○</span>
          <span class="text text-muted">특수문자 (!@#$%^&* 등)</span>
        </div>
      </div>
    </div>
  `;
  
  passwordInput.parentElement.appendChild(container);
  
  return container;
}

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
