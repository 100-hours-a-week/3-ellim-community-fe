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
import { Toast } from "../../components/toast.js";
import { initFooter } from "../../components/footer.js";
import { config } from "../../config.js";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateNickname
} from "../../utils/validators.js";
import {
  showValidationFeedback,
  clearValidationFeedback,
  createPasswordRequirements,
  updatePasswordRequirements
} from "../../components/formValidation.js";

const PAGE_ID = "users-signup";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="users-signup"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// UI 요소 참조
let passwordRequirements = null;
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
  
  setupValidationUI();
  setupEventListeners();
}

/**
 * 검증 UI 설정
 */
function setupValidationUI() {
  const passwordInput = dom.qs("#password");
  
  if (passwordInput) {
    // 비밀번호 요구사항 체크리스트 생성
    passwordRequirements = createPasswordRequirements(passwordInput);
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
  
  // 실시간 검증 이벤트
  if (emailInput) {
    events.on(emailInput, "blur", handleEmailValidation, { pageId: PAGE_ID });
    events.on(emailInput, "input", () => clearValidationFeedback(emailInput), { pageId: PAGE_ID });
  }
  
  if (passwordInput) {
    events.on(passwordInput, "input", handlePasswordInput, { pageId: PAGE_ID });
    events.on(passwordInput, "blur", handlePasswordValidation, { pageId: PAGE_ID });
  }
  
  if (password2Input) {
    events.on(password2Input, "input", handlePassword2Input, { pageId: PAGE_ID });
    events.on(password2Input, "blur", handlePassword2Validation, { pageId: PAGE_ID });
  }
  
  if (nicknameInput) {
    events.on(nicknameInput, "blur", handleNicknameValidation, { pageId: PAGE_ID });
    events.on(nicknameInput, "input", () => clearValidationFeedback(nicknameInput), { pageId: PAGE_ID });
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
 * 이메일 검증 처리
 */
function handleEmailValidation(e) {
  const input = e.target;
  const result = validateEmail(input.value);
  showValidationFeedback(input, result);
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
  const password2Input = dom.qs("#password2");
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
  const password2Input = dom.qs("#password2");
  
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
  const passwordInput = dom.qs("#password");
  
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
 * 닉네임 검증 처리
 */
function handleNicknameValidation(e) {
  const input = e.target;
  const result = validateNickname(input.value);
  showValidationFeedback(input, result);
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
    Toast.show("webp, jpeg, jpg, png 형식의 이미지만 업로드 가능합니다.");
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
    Toast.show("이미지 크기는 10MB 이하여야 합니다.");
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
      Toast.show("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
      
      // 미리보기 제거
      handleImageRemove({ preventDefault: () => {}, stopPropagation: () => {} });
    }
  } catch (error) {
    console.error('Image upload error:', error);
    Toast.show("이미지 업로드 중 오류가 발생했습니다.");
    
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
    Toast.show("이미지를 불러오는데 실패했습니다.");
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

  const emailInput = dom.qs("#email");
  const passwordInput = dom.qs("#password");
  const password2Input = dom.qs("#password2");
  const nicknameInput = dom.qs("#nickname");
  const profileImageInput = dom.qs("#profileImage");
  const submitBtn = dom.qs('button[type="submit"]');

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  const password2 = password2Input?.value;
  const nickname = nicknameInput?.value.trim();

  // 전체 폼 검증
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const password2Validation = validatePasswordConfirm(password, password2);
  const nicknameValidation = validateNickname(nickname);

  // 검증 피드백 표시
  showValidationFeedback(emailInput, emailValidation);
  showValidationFeedback(passwordInput, passwordValidation);
  showValidationFeedback(password2Input, password2Validation);
  showValidationFeedback(nicknameInput, nicknameValidation);

  // 검증 실패 시 중단
  if (!emailValidation.isValid || !passwordValidation.isValid || 
      !password2Validation.isValid || !nicknameValidation.isValid) {
    Toast.show("입력 항목을 확인해주세요.");
    return;
  }

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
      // 회원가입 성공
      Toast.show("회원가입이 완료되었습니다. 로그인해주세요.");
      
      // 로그인 페이지로 이동
      setTimeout(() => {
        navigation.goTo(config.ROUTES.SIGNIN);
      }, 1000);
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
      
      // 회원가입 실패 (400, 409 등)
      const errorMessage = response.error?.message || "회원가입에 실패했습니다.";
      Toast.show(errorMessage);
    }
  } catch (error) {
    // 로딩 상태 종료
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    
    console.error("Sign up error:", error);
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
