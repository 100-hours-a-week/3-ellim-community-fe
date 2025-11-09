/**
 * 비밀번호 변경 페이지 모듈
 * 
 * 사용자 비밀번호 변경 기능을 처리합니다.
 * - 새 비밀번호 입력 및 확인
 * - 비밀번호 변경 API 호출
 * - 에러 처리 및 사용자 피드백
 * - 성공 시 로그인 페이지로 리다이렉트
 */

import { UsersAPI } from "../../api/users.js";
import { events } from "../../utils/events.js";
import { dom } from "../../utils/dom.js";
import { navigation } from "../../utils/navigation.js";
import { auth } from "../../utils/auth.js";
import { Modal } from "../../components/modal.js";
import { Toast } from "../../components/toast.js";
import { config } from "../../config.js";
import {
  validatePassword,
  validatePasswordConfirm
} from "../../utils/validators.js";
import {
  showValidationFeedback,
  clearValidationFeedback,
  createPasswordRequirements,
  updatePasswordRequirements
} from "../../components/formValidation.js";

const PAGE_ID = "users-edit-password";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="users-edit-password"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// UI 요소 참조
let passwordRequirements = null;

/**
 * 페이지 초기화
 */
async function init() {
  // 인증 필수
  if (!auth.requireSignIn()) {
    return;
  }

  setupValidationUI();
  setupEventListeners();
}

/**
 * 검증 UI 설정
 */
function setupValidationUI() {
  const passwordInput = dom.qs("#newPassword");
  
  if (passwordInput) {
    // 비밀번호 요구사항 체크리스트 생성
    passwordRequirements = createPasswordRequirements(passwordInput);
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  const form = dom.qs("#user-edit-password-form");
  const newPasswordInput = dom.qs("#newPassword");
  const newPassword2Input = dom.qs("#newPassword2");
  
  if (form) {
    events.on(form, "submit", handlePasswordUpdate, { pageId: PAGE_ID });
  }
  
  // 실시간 검증 이벤트
  if (newPasswordInput) {
    events.on(newPasswordInput, "input", handlePasswordInput, { pageId: PAGE_ID });
    events.on(newPasswordInput, "blur", handlePasswordValidation, { pageId: PAGE_ID });
  }
  
  if (newPassword2Input) {
    events.on(newPassword2Input, "input", handlePassword2Input, { pageId: PAGE_ID });
    events.on(newPassword2Input, "blur", handlePassword2Validation, { pageId: PAGE_ID });
  }
}

/**
 * 비밀번호 입력 처리 (실시간 요구사항 표시)
 */
function handlePasswordInput(e) {
  const input = e.target;
  const password = input.value;
  
  // 요구사항 체크리스트 업데이트 (비어있어도 업데이트)
  if (passwordRequirements) {
    updatePasswordRequirements(passwordRequirements, password);
  }
  
  // 입력 중에는 검증 피드백 제거
  clearValidationFeedback(input);
  
  // 비밀번호 확인 필드가 입력되어 있으면 재검증
  const password2Input = dom.qs("#newPassword2");
  if (password2Input && password2Input.value) {
    // 비밀번호 확인 필드 검증 피드백 제거 (입력 중이므로)
    clearValidationFeedback(password2Input);
  }
}

/**
 * 비밀번호 검증 처리 (blur 시)
 */
function handlePasswordValidation(e) {
  const input = e.target;
  const password = input.value;
  const password2Input = dom.qs("#newPassword2");
  
  // 비밀번호 자체 검증
  const result = validatePassword(password);
  showValidationFeedback(input, result);
  
  // 비밀번호 확인 필드가 입력되어 있으면 일치 여부도 재검증
  if (password2Input && password2Input.value) {
    const password2Result = validatePasswordConfirm(password, password2Input.value);
    showValidationFeedback(password2Input, password2Result);
  }
}

/**
 * 비밀번호 확인 입력 처리
 */
function handlePassword2Input(e) {
  const input = e.target;
  
  // 입력 중에는 검증 피드백 제거
  clearValidationFeedback(input);
}

/**
 * 비밀번호 확인 검증 처리 (blur 시)
 */
function handlePassword2Validation(e) {
  const input = e.target;
  const passwordInput = dom.qs("#newPassword");
  
  // 비밀번호 확인 검증
  const result = validatePasswordConfirm(passwordInput?.value, input.value);
  showValidationFeedback(input, result);
  
  // 비밀번호 필드가 입력되어 있으면 비밀번호 자체도 재검증
  if (passwordInput && passwordInput.value) {
    const passwordResult = validatePassword(passwordInput.value);
    showValidationFeedback(passwordInput, passwordResult);
  }
}

/**
 * 비밀번호 변경 처리
 * @param {Event} e - 폼 제출 이벤트
 */
async function handlePasswordUpdate(e) {
  e.preventDefault();

  const newPasswordInput = dom.qs("#newPassword");
  const newPassword2Input = dom.qs("#newPassword2");
  const submitBtn = dom.qs('button[type="submit"]');

  const newPassword = newPasswordInput?.value;
  const newPassword2 = newPassword2Input?.value;

  // 전체 폼 검증
  const passwordValidation = validatePassword(newPassword);
  const password2Validation = validatePasswordConfirm(newPassword, newPassword2);

  // 검증 피드백 표시
  showValidationFeedback(newPasswordInput, passwordValidation);
  showValidationFeedback(newPassword2Input, password2Validation);

  // 검증 실패 시 중단
  if (!passwordValidation.isValid || !password2Validation.isValid) {
    Toast.show("입력 항목을 확인해주세요.");
    return;
  }

  // 로딩 상태 시작
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>변경 중...';

  try {
    // 비밀번호 변경 API 호출
    const response = await UsersAPI.updatePassword({
      newPassword,
      newPassword2
    });

    if (response.status >= 200 && response.status < 300) {
      // 변경 성공
      await Modal.alert("비밀번호 변경 완료", "비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
      
      // 인증 정보 클리어
      auth.clear();
      
      // 로그인 페이지로 이동
      navigation.goTo(config.ROUTES.SIGNIN);
    } else if (response.status === null) {
      // 로딩 상태 종료
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      
      // 네트워크 에러
      Toast.show("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } else {
      // 로딩 상태 종료
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      
      // 변경 실패
      const errorMessage = response.error?.message || "비밀번호 변경에 실패했습니다.";
      Toast.show(errorMessage);
    }
  } catch (error) {
    // 로딩 상태 종료
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    
    console.error("Update password error:", error);
    Toast.show("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
}

/**
 * 페이지 정리
 * 페이지 언로드 시 모든 이벤트 리스너 제거
 */
function cleanup() {
  events.removeAllForPage(PAGE_ID);
}

// 페이지 로드 시 자동 실행
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// 페이지 언로드 시 정리
window.addEventListener("beforeunload", cleanup);
