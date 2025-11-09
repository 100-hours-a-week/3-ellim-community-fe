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
import { initHeader } from "../../components/header.js";
import { initFooter } from "../../components/footer.js";
import { config } from "../../config.js";
import { setupRealtimeValidation, validateForm, validatePasswordMatch } from "../../utils/validation.js";

const PAGE_ID = "users-edit-password";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="users-edit-password"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

/**
 * 페이지 초기화
 */
async function init() {
  // 헤더 초기화
  await initHeader(PAGE_ID);
  
  // 푸터 초기화
  await initFooter();
  
  // 인증 필수 (서버에서 사용자 정보 가져옴)
  const user = await auth.requireAuth();
  if (!user) return;

  setupEventListeners();
  setupValidation();
}

/**
 * 폼 유효성 검사 설정
 */
function setupValidation() {
  const form = dom.qs("#user-edit-password-form");
  if (form) {
    setupRealtimeValidation(form, { pageId: PAGE_ID });
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
  
  // 비밀번호 확인 필드에 대한 추가 검증
  if (newPassword2Input) {
    events.on(newPassword2Input, "blur", () => {
      const newPasswordInput = dom.qs("#newPassword");
      validatePasswordMatch(newPasswordInput, newPassword2Input);
    }, { pageId: PAGE_ID });
  }
}

/**
 * 비밀번호 변경 처리
 * @param {Event} e - 폼 제출 이벤트
 */
async function handlePasswordUpdate(e) {
  e.preventDefault();

  const form = dom.qs("#user-edit-password-form");
  const newPasswordInput = dom.qs("#newPassword");
  const newPassword2Input = dom.qs("#newPassword2");
  const submitBtn = dom.qs('button[type="submit"]');

  // 폼 유효성 검사
  if (!validateForm(form)) {
    Toast.show("입력 항목을 확인해주세요.");
    return;
  }

  // 비밀번호 일치 확인
  if (!validatePasswordMatch(newPasswordInput, newPassword2Input)) {
    Toast.show("비밀번호가 일치하지 않습니다.");
    return;
  }

  const newPassword = newPasswordInput?.value;
  const newPassword2 = newPassword2Input?.value;

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
