/**
 * 로그인 페이지 모듈
 * 
 * 사용자 로그인 기능을 처리합니다.
 * - 로그인 폼 제출 처리
 * - 인증 성공 시 사용자 정보 캐싱 및 홈으로 이동
 * - 에러 처리 및 사용자 피드백
 */

import { UsersAPI } from "../../api/users.js";
import { events } from "../../utils/events.js";
import { dom } from "../../utils/dom.js";
import { navigation } from "../../utils/navigation.js";
import { auth } from "../../utils/auth.js";
import { Toast } from "../../components/toast.js";
import { config } from "../../config.js";

const PAGE_ID = "users-signin";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="users-signin"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

/**
 * 페이지 초기화
 */
async function init() {
  setupEventListeners();
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  const form = dom.qs("#sign-in-form");
  
  if (form) {
    events.on(form, "submit", handleSignIn, { pageId: PAGE_ID });
  }
}

/**
 * 로그인 폼 제출 처리
 * @param {Event} e - 폼 제출 이벤트
 */
async function handleSignIn(e) {
  e.preventDefault();

  const emailInput = dom.qs("#email");
  const passwordInput = dom.qs("#password");
  const submitBtn = dom.qs('button[type="submit"]');

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!email || !password) {
    Toast.show("이메일과 비밀번호를 모두 입력해주세요.");
    return;
  }

  // 로딩 상태 시작
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>로그인 중...';

  try {
    // 로그인 API 호출
    const response = await UsersAPI.signIn({ email, password });

    if (response.status >= 200 && response.status < 300) {
      // 로그인 성공 - 현재 사용자 정보 캐싱
      await auth.fetchAndCacheCurrentUser();
      
      // 홈 페이지로 이동
      navigation.goTo(config.ROUTES.HOME);
    } else if (response.status === null) {
      // 로딩 상태 종료
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      
      // 네트워크 에러 (서버 연결 실패 등)
      Toast.show("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } else {
      // 로딩 상태 종료
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      
      // 로그인 실패 (401, 400 등)
      Toast.show("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  } catch (error) {
    // 로딩 상태 종료
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    
    console.error("Sign in error:", error);
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
