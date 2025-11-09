/**
 * 회원가입 페이지 모듈
 * 
 * 사용자 회원가입 기능을 처리합니다.
 * - 회원가입 폼 제출 처리
 * - 실시간 입력 검증 및 피드백
 * - 프로필 이미지 업로드 (선택사항)
 * - 회원가입 성공 시 로그인 페이지로 이동
 * - 에러 처리 및 사용자 피드백
 */

import { UsersAPI } from "../../api/users.js";
import { ImagesAPI } from "../../api/images.js";
import { events } from "../../utils/events.js";
import { dom } from "../../utils/dom.js";
import { navigation } from "../../utils/navigation.js";
import { initFooter } from "../../components/footer.js";
import { config } from "../../config.js";
import { showMessage, hideMessage } from "../../utils/message.js";
import { setupRealtimeValidation, validateForm, validateField, validatePasswordMatch } from "../../utils/validation.js";

const PAGE_ID = "users-signup";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="users-signup"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// UI 요소 참조
let uploadedImageId = null; // 업로드된 이미지 ID 저장
let currentImageFile = null; // 현재 선택된 이미지 파일 (미리보기용)

// 허용된 이미지 형식
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_IMAGE_EXTENSIONS = ['.webp', '.jpeg', '.jpg', '.png'];

/**
 * 페이지 초기화
 */
async function init() {
  // 푸터 초기화
  await initFooter();
  
  setupEventListeners();
  setupValidation();
}

/**
 * 폼 유효성 검사 설정
 */
function setupValidation() {
  const form = dom.qs("#sign-up-form");
  if (form) {
    setupRealtimeValidation(form, { pageId: PAGE_ID });
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  const form = dom.qs("#sign-up-form");
  const emailInput = dom.qs("#email");
  const passwordInput = dom.qs("#password");
  const password2Input = dom.qs("#password2");
  const nicknameInput = dom.qs("#nickname");
  const profileImageInput = dom.qs("#profileImage");
  const profileImageWrapper = dom.qs("#profileImageWrapper");
  const removeImageBtn = dom.qs("#removeImageBtn");
  
  if (form) {
    events.on(form, "submit", handleSignUp, { pageId: PAGE_ID });
  }
  
  // 비밀번호 확인 필드에 대한 추가 검증
  if (password2Input) {
    events.on(password2Input, "blur", () => {
      const passwordInput = dom.qs("#password");
      validatePasswordMatch(passwordInput, password2Input);
    }, { pageId: PAGE_ID });
  }
  
  // 프로필 이미지 이벤트
  if (profileImageWrapper) {
    events.on(profileImageWrapper, "click", handleImageWrapperClick, { pageId: PAGE_ID });
  }
  
  if (profileImageInput) {
    events.on(profileImageInput, "change", handleImageSelect, { pageId: PAGE_ID });
  }
  
  if (removeImageBtn) {
    events.on(removeImageBtn, "click", handleImageRemove, { pageId: PAGE_ID });
  }
}



/**
 * 프로필 이미지 영역 클릭 처리
 */
function handleImageWrapperClick(e) {
  // 제거 버튼 클릭은 무시
  if (e.target.closest('#removeImageBtn')) {
    return;
  }
  
  const profileImageInput = dom.qs("#profileImage");
  if (profileImageInput) {
    profileImageInput.click();
  }
}

/**
 * 이미지 파일 형식 검증
 * @param {File} file - 검증할 파일
 * @returns {boolean} 유효한 형식이면 true
 */
function isValidImageType(file) {
  if (!file) return false;
  
  // MIME 타입 확인
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return true;
  }
  
  // 확장자 확인 (MIME 타입이 없는 경우 대비)
  const fileName = file.name.toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));
}

/**
 * 이미지 선택 처리
 */
async function handleImageSelect(e) {
  const input = e.target;
  const file = input.files?.[0];
  
  if (!file) {
    // 파일 선택 취소 시 이전 선택 유지
    if (currentImageFile) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(currentImageFile);
      input.files = dataTransfer.files;
    }
    return;
  }
  
  // 파일 형식 검증
  if (!isValidImageType(file)) {
    showMessage("webp, jpeg, jpg, png 형식의 이미지만 업로드 가능합니다.", 'warning');
    input.value = '';
    
    // 이전 선택 복원
    if (currentImageFile) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(currentImageFile);
      input.files = dataTransfer.files;
    }
    return;
  }
  
  // 파일 크기 검증 (10MB 제한)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    showMessage("이미지 크기는 10MB 이하여야 합니다.", 'warning');
    input.value = '';
    
    // 이전 선택 복원
    if (currentImageFile) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(currentImageFile);
      input.files = dataTransfer.files;
    }
    return;
  }
  
  // 미리보기 먼저 표시
  showImagePreview(file);
  
  // 이미지 즉시 업로드
  await uploadProfileImage(file);
}

/**
 * 프로필 이미지 업로드
 * @param {File} file - 업로드할 이미지 파일
 */
async function uploadProfileImage(file) {
  try {
    // 로딩 표시 (선택사항)
    const profileImageWrapper = dom.qs("#profileImageWrapper");
    if (profileImageWrapper) {
      profileImageWrapper.style.opacity = '0.6';
      profileImageWrapper.style.pointerEvents = 'none';
    }
    
    // 이미지 업로드 API 호출
    const response = await ImagesAPI.uploadProfile(file);
    
    if (response.status >= 200 && response.status < 300) {
      // 업로드 성공
      uploadedImageId = response.data?.imageId;
      currentImageFile = file;
      
      console.log('Image uploaded successfully, imageId:', uploadedImageId);
    } else {
      // 업로드 실패
      console.error('Image upload failed:', response.error);
      showMessage("이미지 업로드에 실패했습니다. 다시 시도해주세요.", 'error');
      
      // 미리보기 제거
      handleImageRemove({ preventDefault: () => {}, stopPropagation: () => {} });
    }
  } catch (error) {
    console.error('Image upload error:', error);
    showMessage("이미지 업로드 중 오류가 발생했습니다.", 'error');
    
    // 미리보기 제거
    handleImageRemove({ preventDefault: () => {}, stopPropagation: () => {} });
  } finally {
    // 로딩 해제
    const profileImageWrapper = dom.qs("#profileImageWrapper");
    if (profileImageWrapper) {
      profileImageWrapper.style.opacity = '1';
      profileImageWrapper.style.pointerEvents = 'auto';
    }
  }
}

/**
 * 이미지 미리보기 표시
 * @param {File} file - 미리보기할 이미지 파일
 */
function showImagePreview(file) {
  const previewImg = dom.qs("#previewImg");
  const profilePlaceholder = dom.qs("#profilePlaceholder");
  const profileImageCircle = dom.qs("#profileImageCircle");
  const removeImageBtn = dom.qs("#removeImageBtn");
  
  if (!previewImg || !profilePlaceholder || !profileImageCircle) return;
  
  // FileReader로 이미지 읽기
  const reader = new FileReader();
  
  reader.onload = (e) => {
    // 이미지 표시
    previewImg.src = e.target.result;
    previewImg.classList.remove('d-none');
    
    // 플레이스홀더 숨기기
    profilePlaceholder.classList.add('d-none');
    
    // 원형 테두리 스타일 변경
    profileImageCircle.classList.add('has-image');
    
    // 제거 버튼 표시
    if (removeImageBtn) {
      removeImageBtn.classList.remove('d-none');
    }
  };
  
  reader.onerror = () => {
    showMessage("이미지를 불러오는데 실패했습니다.", 'error');
  };
  
  reader.readAsDataURL(file);
}

/**
 * 이미지 제거 처리
 */
function handleImageRemove(e) {
  e.preventDefault();
  e.stopPropagation(); // 부모 클릭 이벤트 방지
  
  const profileImageInput = dom.qs("#profileImage");
  const previewImg = dom.qs("#previewImg");
  const profilePlaceholder = dom.qs("#profilePlaceholder");
  const profileImageCircle = dom.qs("#profileImageCircle");
  const removeImageBtn = dom.qs("#removeImageBtn");
  
  // 파일 입력 초기화
  if (profileImageInput) {
    profileImageInput.value = '';
  }
  
  // 이미지 숨기기
  if (previewImg) {
    previewImg.src = '';
    previewImg.classList.add('d-none');
  }
  
  // 플레이스홀더 표시
  if (profilePlaceholder) {
    profilePlaceholder.classList.remove('d-none');
  }
  
  // 원형 테두리 스타일 복원
  if (profileImageCircle) {
    profileImageCircle.classList.remove('has-image');
  }
  
  // 제거 버튼 숨기기
  if (removeImageBtn) {
    removeImageBtn.classList.add('d-none');
  }
  
  // 업로드된 이미지 ID와 파일 초기화
  uploadedImageId = null;
  currentImageFile = null;
}

/**
 * 회원가입 폼 제출 처리
 * @param {Event} e - 폼 제출 이벤트
 */
async function handleSignUp(e) {
  e.preventDefault();

  const form = dom.qs("#sign-up-form");
  const emailInput = dom.qs("#email");
  const passwordInput = dom.qs("#password");
  const password2Input = dom.qs("#password2");
  const nicknameInput = dom.qs("#nickname");
  const submitBtn = dom.qs('button[type="submit"]');

  // 폼 유효성 검사
  if (!validateForm(form)) {
    showMessage("입력 항목을 확인해주세요.", 'warning');
    return;
  }

  // 비밀번호 일치 확인
  if (!validatePasswordMatch(passwordInput, password2Input)) {
    showMessage("비밀번호가 일치하지 않습니다.", 'warning');
    return;
  }

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  const password2 = password2Input?.value;
  const nickname = nicknameInput?.value.trim();

  // 로딩 상태 시작
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>회원가입 중...';

  try {
    // 이미지는 이미 업로드되어 uploadedImageId에 저장되어 있음

    // 회원가입 API 호출 (이미 업로드된 imageId 사용)
    const response = await UsersAPI.signUp({
      email,
      password,
      password2,
      nickname,
      profileImageId: uploadedImageId
    });

    if (response.status >= 200 && response.status < 300) {
      // 회원가입 성공 - 바로 로그인 페이지로 이동
      navigation.goTo(config.ROUTES.SIGNIN);
    } else if (response.status === null) {
      // 로딩 상태 종료
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      
      // 네트워크 에러
      showMessage("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.", 'error');
    } else {
      // 로딩 상태 종료
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      
      // 회원가입 실패 (400, 409 등)
      const errorMessage = response.error?.message || "회원가입에 실패했습니다.";
      showMessage(errorMessage, 'error');
    }
  } catch (error) {
    // 로딩 상태 종료
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    
    console.error("Sign up error:", error);
    showMessage("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 'error');
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
