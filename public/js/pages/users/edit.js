/**
 * 회원정보 수정 페이지 모듈
 * 
 * 사용자 회원정보 수정 기능을 처리합니다.
 * - 현재 사용자 정보 로드 및 표시
 * - 닉네임 수정
 * - 프로필 이미지 변경
 * - 회원 탈퇴
 * - 에러 처리 및 사용자 피드백
 */

import { UsersAPI } from "../../api/users.js";
import { ImagesAPI } from "../../api/images.js";
import { events } from "../../utils/events.js";
import { dom } from "../../utils/dom.js";
import { navigation } from "../../utils/navigation.js";
import { auth } from "../../utils/auth.js";
import { Modal } from "../../components/modal.js";
import { showMessage, hideMessage } from "../../utils/message.js";
import { initHeader } from "../../components/header.js";
import { initFooter } from "../../components/footer.js";
import { config } from "../../config.js";

const PAGE_ID = "users-edit";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="users-edit"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// 상태 관리
let uploadedImageId = null; // 업로드된 이미지 ID 저장
let currentImageFile = null; // 현재 선택된 이미지 파일 (미리보기용)
let originalUserData = null; // 원본 사용자 데이터

// 허용된 이미지 형식
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_IMAGE_EXTENSIONS = ['.webp', '.jpeg', '.jpg', '.png'];

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

  await loadCurrentUserData(user);
  setupEventListeners();
}

/**
 * 현재 사용자 정보 로드 및 표시
 * @param {Object} currentUser - 서버에서 가져온 사용자 정보
 */
async function loadCurrentUserData(currentUser) {
  try {
    if (!currentUser) {
      showMessage("사용자 정보를 불러올 수 없습니다.", 'error');
      navigation.goTo(config.ROUTES.SIGNIN);
      return;
    }

    originalUserData = currentUser;

    // 폼에 데이터 채우기
    const nicknameInput = dom.qs("#nickname");
    if (nicknameInput) {
      nicknameInput.value = currentUser.nickname || '';
    }

    // 프로필 이미지 표시
    if (currentUser.profileImageUrl) {
      displayExistingProfileImage(currentUser.profileImageUrl);
    }
  } catch (error) {
    console.error("Failed to load user data:", error);
    showMessage("사용자 정보를 불러오는데 실패했습니다.", 'error');
  }
}

/**
 * 기존 프로필 이미지 표시
 * @param {string} imageUrl - 프로필 이미지 URL
 */
function displayExistingProfileImage(imageUrl) {
  const previewImg = dom.qs("#previewImg");
  const profilePlaceholder = dom.qs("#profilePlaceholder");
  const profileImageCircle = dom.qs("#profileImageCircle");
  const removeImageBtn = dom.qs("#removeImageBtn");
  
  if (!previewImg || !profilePlaceholder || !profileImageCircle) return;
  
  // 이미지 표시
  previewImg.src = imageUrl;
  previewImg.classList.remove('d-none');
  
  // 플레이스홀더 숨기기
  profilePlaceholder.classList.add('d-none');
  
  // 원형 테두리 스타일 변경
  profileImageCircle.classList.add('has-image');
  
  // 제거 버튼 표시
  if (removeImageBtn) {
    removeImageBtn.classList.remove('d-none');
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  const form = dom.qs("#user-edit-form");
  const deleteBtn = dom.qs("#user-delete-button");
  const profileImageWrapper = dom.qs("#profileImageWrapper");
  const profileImageInput = dom.qs("#profileImage");
  const removeImageBtn = dom.qs("#removeImageBtn");
  
  if (form) {
    events.on(form, "submit", handleUpdateUser, { pageId: PAGE_ID });
  }
  
  if (deleteBtn) {
    events.on(deleteBtn, "click", handleDeleteUser, { pageId: PAGE_ID });
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
    // 로딩 표시
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
  // null로 설정하여 이미지 제거 의도를 명시
  uploadedImageId = null;
  currentImageFile = null;
}

/**
 * 회원정보 수정 처리
 * @param {Event} e - 폼 제출 이벤트
 */
async function handleUpdateUser(e) {
  e.preventDefault();

  const nicknameInput = dom.qs("#nickname");
  const submitBtn = dom.qs('button[type="submit"]');

  const nickname = nicknameInput?.value.trim();

  if (!nickname) {
    showMessage("닉네임을 입력해주세요.", 'warning');
    return;
  }

  // 변경사항 확인
  const hasNicknameChanged = nickname !== originalUserData?.nickname;
  const hasImageChanged = uploadedImageId !== null; // 새 이미지 업로드
  const hasImageRemoved = uploadedImageId === null && !currentImageFile && originalUserData?.profileImageUrl; // 기존 이미지 제거

  if (!hasNicknameChanged && !hasImageChanged && !hasImageRemoved) {
    showMessage("변경된 내용이 없습니다.", 'warning');
    return;
  }

  // 로딩 상태 시작
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>수정 중...';

  try {
    // 회원정보 수정 API 호출
    const updateData = {};
    
    if (hasNicknameChanged) {
      updateData.nickname = nickname;
    }
    
    if (hasImageChanged) {
      updateData.profileImageId = uploadedImageId;
    } else if (hasImageRemoved) {
      // 이미지 제거 시 null로 설정
      updateData.profileImageId = null;
    }

    const response = await UsersAPI.updateCurrent(updateData);

    if (response.status >= 200 && response.status < 300) {
      // 수정 성공 - 바로 홈으로 이동
      navigation.goTo(config.ROUTES.HOME);
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
      
      // 수정 실패
      const errorMessage = response.error?.message || "회원정보 수정에 실패했습니다.";
      showMessage(errorMessage, 'error');
    }
  } catch (error) {
    // 로딩 상태 종료
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    
    console.error("Update user error:", error);
    showMessage("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 'error');
  }
}

/**
 * 회원 탈퇴 처리
 */
async function handleDeleteUser() {
  // 확인 모달 표시
  const confirmed = await Modal.confirm(
    "회원 탈퇴",
    "정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
  );

  if (!confirmed) {
    return;
  }

  try {
    // 회원 탈퇴 API 호출
    const response = await UsersAPI.deleteCurrent();

    if (response.status >= 200 && response.status < 300) {
      // 탈퇴 성공 - 인증 정보 클리어 후 로그인 페이지로 이동
      auth.clear();
      navigation.goTo(config.ROUTES.SIGNIN);
    } else if (response.status === null) {
      // 네트워크 에러
      showMessage("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.", 'error');
    } else {
      // 탈퇴 실패
      const errorMessage = response.error?.message || "회원 탈퇴에 실패했습니다.";
      showMessage(errorMessage, 'error');
    }
  } catch (error) {
    console.error("Delete user error:", error);
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
