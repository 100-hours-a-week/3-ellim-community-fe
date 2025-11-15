/**
 * Posts Create Page Module
 * 게시물 작성 페이지
 */

import { PostsAPI } from "../../api/posts.js";
import { ImagesAPI } from "../../api/images.js";
import { events } from "../../utils/events.js";
import { dom } from "../../utils/dom.js";
import { navigation } from "../../utils/navigation.js";
import { auth } from "../../utils/auth.js";
import { initHeader } from "../../components/header.js";
import { initFooter } from "../../components/footer.js";
import { Modal } from "../../components/modal.js";
import { showMessage } from "../../utils/message.js";
import { setupRealtimeValidation, validateForm } from "../../utils/validation.js";
import { createDraggableList } from "../../utils/drag-drop.js";
import { validateImageFile, uploadImage, createImagePreview, revokeImagePreview } from "../../utils/image-upload.js";
import { createCharCounter, createFormController } from "../../utils/form-helpers.js";

const PAGE_ID = "posts-create";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="posts-create"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// 페이지 상태
let state = {
  isSubmitting: false,
  uploadedImages: [], // { file, imageId, previewUrl } 형태로 저장
};

// DOM 요소
let elements = {};

// 유틸리티 인스턴스
let draggableList = null;
let formController = null;
let titleCounter = null;
let contentCounter = null;

/**
 * 페이지 초기화
 */
async function init() {
  // 헤더 초기화
  await initHeader(PAGE_ID);

  // 푸터 초기화
  await initFooter();

  // 인증 필요 (서버에서 사용자 정보 가져옴)
  const user = await auth.requireAuth();
  if (!user) return;

  // DOM 요소 캐싱
  cacheElements();

  // 이벤트 리스너 설정
  setupEventListeners();
  
  // 폼 유효성 검사 설정
  setupValidation();
}

/**
 * 폼 유효성 검사 설정
 */
function setupValidation() {
  if (elements.form) {
    setupRealtimeValidation(elements.form, { pageId: PAGE_ID });
  }
}

/**
 * DOM 요소 캐싱
 */
function cacheElements() {
  elements = {
    form: dom.qs("#post-create-form"),
    titleInput: dom.qs("#title"),
    contentInput: dom.qs("#content"),
    imageInput: dom.qs("#postImages"),
    uploadBtn: dom.qs("#upload-btn"),
    imageCountText: dom.qs("#image-count-text"),
    imagePreviewContainer: dom.qs("#image-preview-container"),
    imagePreviewList: dom.qs("#image-preview-list"),
    cancelBtn: dom.qs("#cancel-btn"),
    submitBtn: dom.qs("#submit-btn"),
  };
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 폼 컨트롤러 생성
  formController = createFormController(elements.form, {
    submitButton: elements.submitBtn,
    additionalElements: [elements.uploadBtn],
    loadingHTML: '<span class="spinner-border spinner-border-sm me-1"></span>작성 중...'
  });

  // 폼 제출
  events.on(elements.form, "submit", handleFormSubmit, { pageId: PAGE_ID });

  // 취소 버튼
  events.on(elements.cancelBtn, "click", handleCancelClick, { pageId: PAGE_ID });

  // 커스텀 업로드 버튼 클릭 시 파일 입력 트리거
  events.on(elements.uploadBtn, "click", () => {
    elements.imageInput.click();
  }, { pageId: PAGE_ID });

  // 이미지 파일 선택
  events.on(elements.imageInput, "change", handleImageSelect, { pageId: PAGE_ID });

  // 제목 글자 수 카운터
  const titleCharCount = dom.qs("#title-char-count");
  if (elements.titleInput && titleCharCount) {
    titleCounter = createCharCounter(elements.titleInput, titleCharCount, 26, { pageId: PAGE_ID });
  }

  // 내용 글자 수 카운터
  const contentCharCount = dom.qs("#content-char-count");
  if (elements.contentInput && contentCharCount) {
    contentCounter = createCharCounter(elements.contentInput, contentCharCount, 5000, { pageId: PAGE_ID });
  }

  // 드래그 앤 드롭 리스트 생성
  draggableList = createDraggableList({
    container: elements.imagePreviewList,
    getItems: () => state.uploadedImages,
    onReorder: (oldIndex, newIndex) => {
      const item = state.uploadedImages[oldIndex];
      state.uploadedImages.splice(oldIndex, 1);
      state.uploadedImages.splice(newIndex, 0, item);
      console.log('이미지 순서 변경:', state.uploadedImages.map((img, idx) => ({
        index: idx,
        imageId: img.imageId,
        fileName: img.file.name
      })));
    },
    onRender: displayImagePreviews,
    pageId: PAGE_ID
  });
}

/**
 * 폼 제출 핸들러
 * @param {Event} event - 제출 이벤트
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  if (state.isSubmitting) {
    return;
  }

  // 폼 유효성 검사
  if (!validateForm(elements.form)) {
    showMessage("입력 항목을 확인해주세요.", 'warning');
    return;
  }

  // 폼 데이터 수집
  const title = elements.titleInput.value.trim();
  const content = elements.contentInput.value.trim();

  // 제출 시작
  state.isSubmitting = true;
  formController.disable();

  try {
    // 게시물 생성
    const postData = {
      title,
      content,
    };

    // 업로드된 이미지 ID가 있으면 추가 (순서대로)
    const imageIds = state.uploadedImages.map(img => img.imageId).filter(Boolean);
    console.log("Submitting images in order:", state.uploadedImages.map((img, idx) => ({
      index: idx,
      imageId: img.imageId,
      fileName: img.file.name
    })));
    console.log("Image IDs array:", imageIds);
    
    if (imageIds.length > 0) {
      postData.imageIds = imageIds;
    }

    const response = await PostsAPI.create(postData);

    console.log("Post create response:", response);

    if (response.status >= 200 && response.status < 300) {
      // 성공 - 바로 상세 페이지로 이동
      const postId = response.data?.postId || response.data?.id;
      if (postId) {
        navigation.goTo(`/posts/${postId}`);
      } else {
        // postId가 없으면 목록으로 이동
        navigation.goTo("/posts");
      }
    } else {
      // 실패
      const errorMessage = response.error?.message || "게시물 작성에 실패했습니다.";
      showMessage(errorMessage, 'error');
      formController.enable();
    }
  } catch (error) {
    console.error("Error creating post:", error);
    showMessage("게시물 작성 중 오류가 발생했습니다.", 'error');
    formController.enable();
  } finally {
    state.isSubmitting = false;
  }
}

/**
 * 취소 버튼 클릭 핸들러
 */
async function handleCancelClick() {
  const hasContent = 
    elements.titleInput.value.trim() || 
    elements.contentInput.value.trim() ||
    state.uploadedImages.length > 0;

  if (hasContent) {
    const confirmed = await Modal.confirm(
      "작성 취소",
      "작성 중인 내용이 있습니다. 정말 취소하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }
  }

  navigation.goBack();
}

/**
 * 이미지 선택 핸들러
 * @param {Event} event - 변경 이벤트
 */
async function handleImageSelect(event) {
  const files = event.target.files;
  
  // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
  elements.imageInput.value = "";

  if (!files || files.length === 0) {
    return;
  }

  // 파일 검증 및 필터링
  const validFiles = [];
  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showMessage(validation.error, 'warning');
    } else {
      validFiles.push(file);
    }
  }

  if (validFiles.length === 0) {
    return;
  }

  // 업로드 가능한 개수 확인
  const maxImages = 5;
  const currentCount = state.uploadedImages.length;
  const availableSlots = maxImages - currentCount;

  if (availableSlots <= 0) {
    showMessage(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`, 'warning');
    return;
  }

  const filesToUpload = validFiles.slice(0, availableSlots);

  if (validFiles.length > availableSlots) {
    showMessage(`최대 ${maxImages}개까지만 업로드할 수 있어 ${availableSlots}개만 선택됩니다.`, 'warning');
  }

  // 각 파일을 즉시 업로드
  for (const file of filesToUpload) {
    await uploadSingleImage(file);
  }
}

/**
 * 단일 이미지 업로드 및 미리보기 추가
 * @param {File} file - 업로드할 파일
 */
async function uploadSingleImage(file) {
  // 미리보기 URL 생성
  const previewUrl = createImagePreview(file);

  // 임시 이미지 객체 생성 (업로드 중 표시용)
  const tempImage = {
    file,
    imageId: null,
    previewUrl,
    isUploading: true,
  };

  state.uploadedImages.push(tempImage);
  const imageIndex = state.uploadedImages.length - 1;

  // UI 업데이트
  displayImagePreviews();

  try {
    // 서버에 업로드
    const result = await uploadImage(file, ImagesAPI, 'post');

    if (result.success) {
      // 업로드 성공: imageId 저장
      state.uploadedImages[imageIndex].imageId = result.imageId;
      state.uploadedImages[imageIndex].isUploading = false;

      // UI 업데이트 (로딩 표시 제거)
      displayImagePreviews();
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Failed to upload image:", error);
    
    // 실패한 이미지 제거
    state.uploadedImages.splice(imageIndex, 1);
    revokeImagePreview(previewUrl);
    
    showMessage(`${file.name} 업로드에 실패했습니다.`, 'error');
    
    // UI 업데이트
    displayImagePreviews();
  }
}

/**
 * 이미지 미리보기 표시
 */
function displayImagePreviews() {
  // 미리보기 컨테이너 초기화
  elements.imagePreviewList.innerHTML = "";

  // 이미지 개수 업데이트
  updateImageCount();

  if (state.uploadedImages.length === 0) {
    elements.imagePreviewContainer.classList.add("d-none");
    return;
  }

  elements.imagePreviewContainer.classList.remove("d-none");

  state.uploadedImages.forEach((imageData, index) => {
    const previewItem = document.createElement("div");
    previewItem.className = "position-relative";
    previewItem.style.width = "100px";
    previewItem.style.height = "100px";
    previewItem.style.borderRadius = "8px";
    previewItem.style.overflow = "hidden";
    previewItem.style.cursor = imageData.isUploading ? "default" : "move";
    previewItem.style.touchAction = imageData.isUploading ? "auto" : "none";
    previewItem.setAttribute("draggable", imageData.isUploading ? "false" : "true");
    previewItem.setAttribute("data-index", index);

    const img = document.createElement("img");
    img.src = imageData.previewUrl;
    img.className = "img-thumbnail";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.border = "none";
    img.style.pointerEvents = "none";
    img.alt = imageData.file.name;

    previewItem.appendChild(img);

    // 업로드 중이면 로딩 오버레이 표시
    if (imageData.isUploading) {
      const loadingOverlay = document.createElement("div");
      loadingOverlay.className = "position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
      loadingOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      loadingOverlay.style.borderRadius = "8px";
      loadingOverlay.innerHTML = '<div class="spinner-border spinner-border-sm text-light" role="status"><span class="visually-hidden">업로드 중...</span></div>';
      previewItem.appendChild(loadingOverlay);
    }

    // 삭제 버튼
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-danger position-absolute";
    removeBtn.style.top = "2px";
    removeBtn.style.right = "2px";
    removeBtn.style.width = "24px";
    removeBtn.style.height = "24px";
    removeBtn.style.padding = "0";
    removeBtn.style.borderRadius = "50%";
    removeBtn.style.display = "flex";
    removeBtn.style.alignItems = "center";
    removeBtn.style.justifyContent = "center";
    removeBtn.style.fontSize = "12px";
    removeBtn.style.lineHeight = "1";
    removeBtn.innerHTML = '<i class="bi bi-x"></i>';
    removeBtn.setAttribute("data-index", index);
    removeBtn.disabled = imageData.isUploading;
    removeBtn.title = "이미지 삭제";

    events.on(removeBtn, "click", handleRemoveImage, { pageId: PAGE_ID });

    previewItem.appendChild(removeBtn);
    elements.imagePreviewList.appendChild(previewItem);
  });

  // 드래그 앤 드롭 이벤트 바인딩
  if (draggableList) {
    draggableList.attachEvents();
  }
}

/**
 * 이미지 개수 텍스트 업데이트
 */
function updateImageCount() {
  const count = state.uploadedImages.length;
  if (elements.imageCountText) {
    elements.imageCountText.textContent = `${count} / 5개 선택됨`;
    
    // 5개 선택되면 버튼 비활성화
    if (elements.uploadBtn) {
      if (count >= 5) {
        elements.uploadBtn.disabled = true;
        elements.uploadBtn.classList.add("disabled");
      } else {
        elements.uploadBtn.disabled = false;
        elements.uploadBtn.classList.remove("disabled");
      }
    }
  }
}

/**
 * 이미지 제거 핸들러
 * @param {Event} event - 클릭 이벤트
 */
function handleRemoveImage(event) {
  const index = parseInt(event.currentTarget.getAttribute("data-index"), 10);

  // 미리보기 URL 해제
  const imageData = state.uploadedImages[index];
  if (imageData && imageData.previewUrl) {
    revokeImagePreview(imageData.previewUrl);
  }

  // 배열에서 제거
  state.uploadedImages.splice(index, 1);

  // 미리보기 다시 표시
  displayImagePreviews();
}

/**
 * 정리 함수
 */
function cleanup() {
  // 이벤트 리스너 제거
  events.removeAllForPage(PAGE_ID);

  // 미리보기 URL 해제
  state.uploadedImages.forEach(imageData => {
    if (imageData.previewUrl) {
      revokeImagePreview(imageData.previewUrl);
    }
  });

  // 유틸리티 정리
  if (draggableList) {
    draggableList.destroy();
    draggableList = null;
  }

  // 상태 초기화
  state = {
    isSubmitting: false,
    uploadedImages: [],
  };
  
  formController = null;
  titleCounter = null;
  contentCounter = null;
}

// 초기화 상태 추적
let isInitialized = false;

// 페이지 로드 시 자동 실행
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (!isInitialized) {
      isInitialized = true;
      init();
    }
  });
} else {
  if (!isInitialized) {
    isInitialized = true;
    init();
  }
}

// 뒤로가기/앞으로가기 시 페이지 복원 처리 (bfcache)
window.addEventListener("pageshow", (event) => {
  // bfcache에서 복원된 경우
  if (event.persisted) {
    console.log("Page restored from bfcache, reinitializing...");
    // 상태 초기화
    isInitialized = false;
    // 페이지 재초기화
    if (!isInitialized) {
      isInitialized = true;
      init();
    }
  }
});

// 페이지 언로드 시 정리
window.addEventListener("pagehide", cleanup);
