/**
 * 폼 검증 유틸리티
 * 백엔드 검증 규칙과 동일한 프론트엔드 검증 제공
 */

/**
 * 이메일 검증 (EmailMax247)
 * - 필수 입력
 * - 이메일 형식
 * - 최대 247자
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
 * - 필수 입력
 * - 8자 이상 20자 이하
 * - 최소 하나의 소문자
 * - 최소 하나의 대문자
 * - 최소 하나의 숫자
 * - 최소 하나의 특수문자
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
 * - 필수 입력
 * - 공백 없음
 * - 1자 이상 30자 이하
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
 * @returns {Object} { strength: 'weak'|'medium'|'strong', score: 0-4 }
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
