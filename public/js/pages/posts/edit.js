/**
 * Posts Edit Page Module
 * 게시물 수정 페이지
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
import { showMessage, hideMessage } from "../../utils/message.js";
import { setupRealtimeValidation, validateForm } from "../../utils/validation.js";

const PAGE_ID = "posts-edit";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="posts-edit"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// 페이지 상태
let state = {
  postId: null,
  originalPost: null,
  isSubmitting: false,
  allImages: [], // 모든 이미지 통합 { imageUrl?, imageId, previewUrl?, file?, isUploading?, isExisting }
};

// DOM 요소
let elements = {};

/**
 * URL에서 postId 추출
 */
function getPostIdFromUrl() {
  const path = window.location.pathname; // "/posts/edit/15"
  const segments = path.split('/').filter(Boolean); // ["posts", "edit", "15"]
  const last = segments[segments.length - 1];
  return last || null;
}

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

  // postId 추출
  state.postId = getPostIdFromUrl();
  if (!state.postId) {
    console.error("Invalid post ID");
    navigation.goBack();
    return;
  }

  // DOM 요소 캐싱
  cacheElements();

  // 기존 게시물 데이터 로드
  await loadPostData();

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
    loadingSkeleton: dom.qs("#loading-skeleton"),
    form: dom.qs("#post-edit-form"),
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
 * 기존 게시물 데이터 로드
 */
async function loadPostData() {
  try {
    const response = await PostsAPI.getById(state.postId);

    if (response.status >= 200 && response.status < 300 && response.data) {
      const post = response.data;

      // 작성자가 아니면 접근 불가
      if (!post.isAuthor) {
        console.error("Unauthorized access");
        navigation.goBack();
        return;
      }

      state.originalPost = post;

      // 폼에 기존 데이터 채우기
      elements.titleInput.value = post.title || "";
      elements.contentInput.value = post.content || "";

      // 기존 이미지 처리 - 통합 배열에 추가
      if (post.images && post.images.length > 0) {
        // 새로운 API 응답 형식: images: [{ imageId, imageUrl }]
        state.allImages = post.images.map(img => ({
          imageUrl: img.imageUrl,
          imageId: img.imageId,
          previewUrl: img.imageUrl,
          isExisting: true,
          isUploading: false
        }));
        
        console.log('Loaded existing images:', state.allImages);
      } else if (post.imageUrls && post.imageUrls.length > 0) {
        // 이전 API 응답 형식 지원 (하위 호환성)
        state.allImages = post.imageUrls.map((url, index) => {
          let imageId = null;
          
          if (post.imageIds && post.imageIds[index]) {
            imageId = post.imageIds[index];
          } else {
            const match = url.match(/\/images\/(\d+)/);
            if (match) {
              imageId = parseInt(match[1], 10);
            }
          }
          
          return {
            imageUrl: url,
            imageId: imageId,
            previewUrl: url,
            isExisting: true,
            isUploading: false
          };
        });
        
        console.log('Loaded existing images (legacy format):', state.allImages);
      }
      
      // 이미지 표시
      displayAllImages();

      // 글자 수 카운터 초기화
      updateCharCount(elements.titleInput, dom.qs("#title-char-count"), 26);
      updateCharCount(elements.contentInput, dom.qs("#content-char-count"), 5000);

      // 로딩 스켈레톤 숨기고 폼 표시
      if (elements.loadingSkeleton) {
        elements.loadingSkeleton.style.display = "none";
      }
      if (elements.form) {
        elements.form.style.display = "block";
      }
    } else {
      console.error("Failed to load post");
      navigation.goBack();
    }
  } catch (error) {
    console.error("Failed to load post:", error);
    navigation.goBack();
  }
}

/**
 * 모든 이미지 표시 (기존 + 새 이미지 통합)
 */
function displayAllImages() {
  if (!elements.imagePreviewList) return;

  elements.imagePreviewList.innerHTML = "";
  updateImageCount();

  if (state.allImages.length === 0) {
    elements.imagePreviewContainer.classList.add("d-none");
    return;
  }

  elements.imagePreviewContainer.classList.remove("d-none");

  state.allImages.forEach((imageData, index) => {
    const imageItem = document.createElement("div");
    imageItem.className = "position-relative";
    imageItem.style.width = "100px";
    imageItem.style.height = "100px";
    imageItem.style.borderRadius = "8px";
    imageItem.style.overflow = "hidden";
    imageItem.style.cursor = imageData.isUploading ? "default" : "move";
    imageItem.style.touchAction = "none"; // 터치 스크롤 방지
    imageItem.setAttribute("draggable", imageData.isUploading ? "false" : "true");
    imageItem.setAttribute("data-index", index);

    const img = document.createElement("img");
    img.src = imageData.previewUrl;
    img.className = "img-thumbnail";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.border = "none";
    img.style.pointerEvents = "none";
    img.alt = imageData.isExisting ? `이미지 ${index + 1}` : imageData.file.name;

    imageItem.appendChild(img);

    // 업로드 중이면 로딩 오버레이 표시
    if (imageData.isUploading) {
      const loadingOverlay = document.createElement("div");
      loadingOverlay.className = "position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
      loadingOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      loadingOverlay.style.borderRadius = "8px";
      loadingOverlay.innerHTML = '<div class="spinner-border spinner-border-sm text-light" role="status"><span class="visually-hidden">업로드 중...</span></div>';
      imageItem.appendChild(loadingOverlay);
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

    // 드래그 앤 드롭 이벤트 (업로드 중이 아닐 때만)
    if (!imageData.isUploading) {
      events.on(imageItem, "dragstart", handleDragStart, { pageId: PAGE_ID });
      events.on(imageItem, "dragover", handleDragOver, { pageId: PAGE_ID });
      events.on(imageItem, "drop", handleDrop, { pageId: PAGE_ID });
      events.on(imageItem, "dragend", handleDragEnd, { pageId: PAGE_ID });
      
      // 모바일 터치 이벤트
      events.on(imageItem, "touchstart", handleTouchStart, { pageId: PAGE_ID });
      events.on(imageItem, "touchmove", handleTouchMove, { pageId: PAGE_ID });
      events.on(imageItem, "touchend", handleTouchEnd, { pageId: PAGE_ID });
    }

    imageItem.appendChild(removeBtn);
    elements.imagePreviewList.appendChild(imageItem);
  });
}

// 드래그 상태 저장
let draggedIndex = null;
let touchStartY = 0;
let touchStartX = 0;
let touchedElement = null;

/**
 * 드래그 시작 핸들러
 */
function handleDragStart(event) {
  draggedIndex = parseInt(event.currentTarget.getAttribute("data-index"), 10);
  event.currentTarget.style.opacity = "0.5";
  event.dataTransfer.effectAllowed = "move";
}

/**
 * 드래그 오버 핸들러
 */
function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  
  const targetItem = event.currentTarget;
  const targetIndex = parseInt(targetItem.getAttribute("data-index"), 10);
  
  if (targetItem && draggedIndex !== null && draggedIndex !== targetIndex) {
    // 모든 border 초기화
    const allItems = elements.imagePreviewList.querySelectorAll("[data-index]");
    allItems.forEach(item => {
      item.style.borderLeft = "";
      item.style.backgroundColor = "";
    });
    
    // 타겟에 시각적 피드백
    targetItem.style.borderLeft = "3px solid #0d6efd";
    targetItem.style.backgroundColor = "rgba(13, 110, 253, 0.1)";
  }
}

/**
 * 드롭 핸들러
 */
function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const targetIndex = parseInt(event.currentTarget.getAttribute("data-index"), 10);
  
  if (draggedIndex !== null && draggedIndex !== targetIndex) {
    console.log(`이미지 순서 변경: ${draggedIndex} → ${targetIndex}`);
    
    const draggedImage = state.allImages[draggedIndex];
    state.allImages.splice(draggedIndex, 1);
    state.allImages.splice(targetIndex, 0, draggedImage);
    
    console.log('변경 후 이미지 순서:', state.allImages.map((img, idx) => ({
      index: idx,
      imageId: img.imageId
    })));
    
    // 부드러운 애니메이션과 함께 UI 업데이트
    displayAllImages();
  }
  
  // 스타일 초기화
  event.currentTarget.style.borderLeft = "";
  event.currentTarget.style.backgroundColor = "";
}

/**
 * 드래그 종료 핸들러
 */
function handleDragEnd(event) {
  event.currentTarget.style.opacity = "1";
  
  const allItems = elements.imagePreviewList.querySelectorAll("[data-index]");
  allItems.forEach(item => {
    item.style.borderLeft = "";
    item.style.backgroundColor = "";
  });
  
  draggedIndex = null;
}

/**
 * 터치 시작 핸들러 (모바일)
 */
function handleTouchStart(event) {
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchedElement = event.currentTarget;
  draggedIndex = parseInt(touchedElement.getAttribute("data-index"), 10);
  touchedElement.style.opacity = "0.5";
  touchedElement.style.zIndex = "1000";
}

/**
 * 터치 이동 핸들러 (모바일)
 */
function handleTouchMove(event) {
  if (!touchedElement) return;
  
  event.preventDefault();
  const touch = event.touches[0];
  
  // 터치된 요소를 손가락 위치로 이동
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  touchedElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  touchedElement.style.transition = "none";
  
  // 현재 터치 위치 아래의 요소 찾기
  touchedElement.style.pointerEvents = "none";
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  touchedElement.style.pointerEvents = "auto";
  
  const targetItem = elementBelow?.closest('[data-index]');
  
  // 모든 border 초기화
  const allItems = elements.imagePreviewList.querySelectorAll("[data-index]");
  allItems.forEach(item => {
    if (item !== touchedElement) {
      item.style.borderLeft = "";
      item.style.backgroundColor = "";
    }
  });
  
  // 타겟 아이템에 시각적 피드백만 제공 (실제 순서 변경은 터치 종료 시)
  if (targetItem && targetItem !== touchedElement) {
    targetItem.style.borderLeft = "3px solid #0d6efd";
    targetItem.style.backgroundColor = "rgba(13, 110, 253, 0.1)";
    
    // 현재 타겟 인덱스 저장 (터치 종료 시 사용)
    const targetIndex = parseInt(targetItem.getAttribute("data-index"), 10);
    touchedElement.dataset.targetIndex = targetIndex;
  } else {
    delete touchedElement.dataset.targetIndex;
  }
}

/**
 * 터치 종료 핸들러 (모바일)
 */
function handleTouchEnd(event) {
  if (!touchedElement) return;
  
  // 터치 종료 시점에 순서 변경
  const targetIndex = touchedElement.dataset.targetIndex;
  if (targetIndex !== undefined && draggedIndex !== null) {
    const finalTargetIndex = parseInt(targetIndex, 10);
    
    if (draggedIndex !== finalTargetIndex) {
      console.log(`이미지 순서 변경 (터치): ${draggedIndex} → ${finalTargetIndex}`);
      
      const draggedImage = state.allImages[draggedIndex];
      state.allImages.splice(draggedIndex, 1);
      state.allImages.splice(finalTargetIndex, 0, draggedImage);
      
      console.log('변경 후 이미지 순서:', state.allImages.map((img, idx) => ({
        index: idx,
        imageId: img?.imageId || 'undefined'
      })));
    }
  }
  
  // 스타일 초기화
  touchedElement.style.opacity = "1";
  touchedElement.style.transform = "";
  touchedElement.style.zIndex = "";
  touchedElement.style.transition = "";
  touchedElement.style.pointerEvents = "auto";
  delete touchedElement.dataset.targetIndex;
  
  const allItems = elements.imagePreviewList.querySelectorAll("[data-index]");
  allItems.forEach(item => {
    item.style.borderLeft = "";
    item.style.backgroundColor = "";
  });
  
  touchedElement = null;
  draggedIndex = null;
  
  // UI 업데이트
  displayAllImages();
}

/**
 * 이미지 제거 핸들러
 */
function handleRemoveImage(event) {
  const index = parseInt(event.currentTarget.getAttribute("data-index"), 10);
  
  // 미리보기 URL 해제 (새 이미지인 경우)
  const imageData = state.allImages[index];
  if (imageData && !imageData.isExisting && imageData.previewUrl) {
    URL.revokeObjectURL(imageData.previewUrl);
  }
  
  state.allImages.splice(index, 1);
  displayAllImages();
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
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
    events.on(elements.titleInput, "input", () => {
      updateCharCount(elements.titleInput, titleCharCount, 26);
    }, { pageId: PAGE_ID });
  }

  // 내용 글자 수 카운터
  const contentCharCount = dom.qs("#content-char-count");
  if (elements.contentInput && contentCharCount) {
    events.on(elements.contentInput, "input", () => {
      updateCharCount(elements.contentInput, contentCharCount, 5000);
    }, { pageId: PAGE_ID });
  }
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
  disableForm();

  try {
    // 게시물 수정 데이터 준비
    const postData = {
      title,
      content,
    };

    // 모든 이미지 ID 수집 - 순서대로
    const allImageIds = state.allImages.map(img => img.imageId).filter(Boolean);

    console.log('=== 이미지 순서 확인 ===');
    console.log('전체 이미지 순서:', state.allImages.map((img, idx) => ({
      index: idx,
      imageId: img.imageId,
      isExisting: img.isExisting,
      fileName: img.file?.name || '기존 이미지'
    })));
    console.log('최종 imageIds 배열:', allImageIds);
    console.log('======================');

    // 이미지 ID 배열 설정 (빈 배열도 전송하여 이미지 삭제 반영)
    postData.imageIds = allImageIds;

    console.log(postData);

    const response = await PostsAPI.update(state.postId, postData);

    console.log("Post update response:", response);

    if (response.status >= 200 && response.status < 300) {
      // 성공 - 바로 상세 페이지로 이동
      navigation.goTo(`/posts/${state.postId}`);
    } else {
      // 실패
      const errorMessage = response.error?.message || "게시물 수정에 실패했습니다.";
      showMessage(errorMessage, 'error');
      enableForm();
    }
  } catch (error) {
    console.error("Error updating post:", error);
    showMessage("게시물 수정 중 오류가 발생했습니다.", 'error');
    enableForm();
  } finally {
    state.isSubmitting = false;
  }
}

/**
 * 취소 버튼 클릭 핸들러
 */
async function handleCancelClick() {
  const originalImageCount = state.originalPost?.images?.length || state.originalPost?.imageUrls?.length || 0;
  const hasChanges = 
    elements.titleInput.value.trim() !== (state.originalPost?.title || "") ||
    elements.contentInput.value.trim() !== (state.originalPost?.content || "") ||
    state.allImages.length !== originalImageCount ||
    state.allImages.some(img => !img.isExisting);

  if (hasChanges) {
    const confirmed = await Modal.confirm(
      "수정 취소",
      "수정 중인 내용이 있습니다. 정말 취소하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }
  }

  navigation.goBack();
}

/**
 * 파일 형식 검증
 * @param {File} file - 검증할 파일
 * @returns {boolean} - 유효한 형식이면 true
 */
function isValidImageFile(file) {
  const validTypes = ['image/webp', 'image/jpeg', 'image/jpg', 'image/png'];
  const validExtensions = ['.webp', '.jpg', '.jpeg', '.png'];
  
  // MIME 타입 확인
  if (validTypes.includes(file.type)) {
    return true;
  }
  
  // 확장자 확인 (MIME 타입이 없는 경우 대비)
  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * 이미지 선택 핸들러
 * @param {Event} event - 변경 이벤트
 */
async function handleImageSelect(event) {
  const files = Array.from(event.target.files || []);
  const maxImages = 5;

  elements.imageInput.value = "";

  if (files.length === 0) {
    return;
  }

  const currentCount = state.allImages.length;
  const availableSlots = maxImages - currentCount;

  if (availableSlots <= 0) {
    showMessage(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`, 'warning');
    return;
  }

  const validFiles = files.filter(file => {
    if (!isValidImageFile(file)) {
      showMessage(`${file.name}은(는) 지원하지 않는 형식입니다. WEBP, JPG, JPEG, PNG 형식만 업로드 가능합니다.`, 'warning');
      return false;
    }
    return true;
  });

  if (validFiles.length === 0) {
    return;
  }

  const filesToUpload = validFiles.slice(0, availableSlots);

  if (validFiles.length > availableSlots) {
    showMessage(`최대 ${maxImages}개까지만 업로드할 수 있어 ${availableSlots}개만 선택됩니다.`, 'warning');
  }

  for (const file of filesToUpload) {
    await uploadSingleImage(file);
  }
}

/**
 * 단일 이미지 업로드 및 미리보기 추가
 * @param {File} file - 업로드할 파일
 */
async function uploadSingleImage(file) {
  const previewUrl = URL.createObjectURL(file);

  const tempImage = {
    file,
    imageId: null,
    previewUrl,
    isUploading: true,
    isExisting: false
  };

  state.allImages.push(tempImage);
  const imageIndex = state.allImages.length - 1;

  displayAllImages();

  try {
    const response = await ImagesAPI.uploadPost(file);

    if (response.status >= 200 && response.status < 300 && response.data) {
      const imageId = response.data.imageId || response.data.id;
      state.allImages[imageIndex].imageId = imageId;
      state.allImages[imageIndex].isUploading = false;

      displayAllImages();
    } else {
      throw new Error(response.error?.message || "이미지 업로드에 실패했습니다.");
    }
  } catch (error) {
    console.error("Failed to upload image:", error);
    
    state.allImages.splice(imageIndex, 1);
    URL.revokeObjectURL(previewUrl);
    
    showMessage(`${file.name} 업로드에 실패했습니다.`, 'error');
    
    displayAllImages();
  }
}

/**
 * 이미지 개수 텍스트 업데이트
 */
function updateImageCount() {
  const totalCount = state.allImages.length;
  if (elements.imageCountText) {
    elements.imageCountText.textContent = `${totalCount} / 5개 선택됨`;
    
    if (elements.uploadBtn) {
      if (totalCount >= 5) {
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
 * 폼 비활성화
 */
function disableForm() {
  elements.titleInput.disabled = true;
  elements.contentInput.disabled = true;
  elements.imageInput.disabled = true;
  elements.uploadBtn.disabled = true;
  elements.cancelBtn.disabled = true;
  elements.submitBtn.disabled = true;
  elements.submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>수정 중...';
}

/**
 * 폼 활성화
 */
function enableForm() {
  elements.titleInput.disabled = false;
  elements.contentInput.disabled = false;
  elements.imageInput.disabled = false;
  elements.cancelBtn.disabled = false;
  elements.submitBtn.disabled = false;
  elements.submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>수정 완료';
  
  // 이미지 개수에 따라 업로드 버튼 상태 업데이트
  updateImageCount();
}

/**
 * 글자 수 카운터 업데이트
 * @param {HTMLElement} input - 입력 요소
 * @param {HTMLElement} countElement - 카운터 표시 요소
 * @param {number} maxLength - 최대 글자 수
 */
function updateCharCount(input, countElement, maxLength) {
  const currentLength = input.value.length;
  
  countElement.textContent = currentLength;
  
  // 글자 수에 따라 색상 변경
  if (currentLength >= maxLength) {
    countElement.className = "text-danger fw-bold";
  } else if (currentLength >= maxLength * 0.9) {
    countElement.className = "text-warning fw-bold";
  } else {
    countElement.className = "text-muted";
  }
}

/**
 * 정리 함수
 */
function cleanup() {
  // 이벤트 리스너 제거
  events.removeAllForPage(PAGE_ID);

  // 미리보기 URL 해제
  state.allImages.forEach(imageData => {
    if (!imageData.isExisting && imageData.previewUrl) {
      URL.revokeObjectURL(imageData.previewUrl);
    }
  });

  // 상태 초기화
  state = {
    postId: null,
    originalPost: null,
    isSubmitting: false,
    allImages: [],
  };
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
