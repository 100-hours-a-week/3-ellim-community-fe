/**
 * 검증 함수 사용 예제
 * 
 * 이 파일은 validators.js의 사용법을 보여주는 예제입니다.
 * 실제 테스트가 아닌 참고용 문서입니다.
 */

import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateNickname,
  getPasswordStrength
} from './validators.js';

// ===== 이메일 검증 예제 =====
console.log('=== 이메일 검증 ===');

// 유효한 이메일
console.log(validateEmail('user@example.com'));
// { isValid: true, errors: [] }

// 빈 이메일
console.log(validateEmail(''));
// { isValid: false, errors: ['이메일을 입력해주세요.'] }

// 잘못된 형식
console.log(validateEmail('invalid-email'));
// { isValid: false, errors: ['올바른 이메일 형식이 아닙니다.'] }

// 너무 긴 이메일
console.log(validateEmail('a'.repeat(248) + '@example.com'));
// { isValid: false, errors: ['이메일은 최대 247자까지 입력 가능합니다.'] }


// ===== 비밀번호 검증 예제 =====
console.log('\n=== 비밀번호 검증 ===');

// 유효한 비밀번호
console.log(validatePassword('Password123!'));
// { isValid: true, errors: [] }

// 너무 짧음
console.log(validatePassword('Pass1!'));
// { isValid: false, errors: ['비밀번호는 최소 8자 이상이어야 합니다.', ...] }

// 소문자 없음
console.log(validatePassword('PASSWORD123!'));
// { isValid: false, errors: ['최소 하나의 소문자를 포함해야 합니다.'] }

// 대문자 없음
console.log(validatePassword('password123!'));
// { isValid: false, errors: ['최소 하나의 대문자를 포함해야 합니다.'] }

// 숫자 없음
console.log(validatePassword('Password!'));
// { isValid: false, errors: ['최소 하나의 숫자를 포함해야 합니다.'] }

// 특수문자 없음
console.log(validatePassword('Password123'));
// { isValid: false, errors: ['최소 하나의 특수문자를 포함해야 합니다.'] }


// ===== 비밀번호 확인 검증 예제 =====
console.log('\n=== 비밀번호 확인 검증 ===');

// 일치
console.log(validatePasswordConfirm('Password123!', 'Password123!'));
// { isValid: true, errors: [] }

// 불일치
console.log(validatePasswordConfirm('Password123!', 'Different123!'));
// { isValid: false, errors: ['비밀번호가 일치하지 않습니다.'] }


// ===== 닉네임 검증 예제 =====
console.log('\n=== 닉네임 검증 ===');

// 유효한 닉네임
console.log(validateNickname('사용자123'));
// { isValid: true, errors: [] }

// 공백 포함
console.log(validateNickname('사용자 123'));
// { isValid: false, errors: ['닉네임에는 공백을 포함할 수 없습니다.'] }

// 너무 긴 닉네임
console.log(validateNickname('a'.repeat(31)));
// { isValid: false, errors: ['닉네임은 최대 30자까지 입력 가능합니다.'] }


// ===== 비밀번호 강도 예제 =====
console.log('\n=== 비밀번호 강도 ===');

console.log(getPasswordStrength('pass'));
// { strength: 'weak', score: 0 }

console.log(getPasswordStrength('Password1'));
// { strength: 'medium', score: 3 }

console.log(getPasswordStrength('Password123!'));
// { strength: 'strong', score: 5 }
