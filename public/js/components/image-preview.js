/**
 * Image Preview Component
 * 이미지 미리보기 기능을 제공하는 재사용 가능한 컴포넌트
 * 
 * 기능:
 * - 파일 선택 시 미리보기 표시
 * - 다중 이미지 미리보기 지원
 * - 이미지 삭제 기능
 * - 드래그 앤 드롭 지원
 * 
 * 사용 예시:
 * ```javascript
 * import { createImagePreview } from './components/image-preview.js';
 * 
 * const preview = createImagePreview({
 *   fileInput: document.querySelector('#fileInput'),
 *   previewContainer: document.querySelector('#previewContainer'),
 *   maxFiles: 5,
 *   pageId: 'my-page',
 *   onAdd: (file, index) => {
 *     console.log('File added:', file.name);
 *     // 파일 업로드 로직 실행
 *   },
 *   onRemove: (file, index) => {
 *     console.log('File removed:', file.name);
 *   },
 *   onError: (message) => {
 *     alert(message);
 *   }
 * });
 * 
 * // 정리
 * preview.destroy();
 * ```
 * 
 * 참고: 현재 프로젝트의 이미지 업로드 페이지들(회원가입, 게시물 작성/수정, 회원정보 수정)은
 * 이미 자체적인 미리보기 구현을 가지고 있으며, 즉시 업로드 기능과 통합되어 있습니다.
 * 이 컴포넌트는 향후 새로운 페이지나 기능에서 재사용할 수 있도록 제공됩니다.
 */

import { events } from "../utils/events.js";
import { dom } from "../utils/dom.js";

/**
 * 이미지 미리보기 인스턴스 생성
 * @param {Object} options - 설정 옵션
 * @param {HTMLInputElement} options.fileInput - 파일 입력 요소
 * @param {HTMLElement} options.previewContainer - 미리보기 컨테이너 요소
 * @param {number} options.maxFiles - 최대 파일 개수 (기본값: 5)
 * @param {string[]} options.acceptedTypes - 허용된 MIME 타입 (기본값: 이미지 타입)
 * @param {string[]} options.acceptedExtensions - 허용된 확장자 (기본값: 이미지 확장자)
 * @param {number} options.maxFileSize - 최대 파일 크기 (바이트, 기본값: 10MB)
 * @param {Function} options.onAdd - 파일 추가 시 콜백 (file, index) => void
 * @param {Function} options.onRemove - 파일 제거 시 콜백 (file, index) => void
 * @param {Function} options.onError - 에러 발생 시 콜백 (message) => void
 * @param {string} options.pageId - 페이지 ID (이벤트 관리용)
 * @param {boolean} options.enableDragDrop - 드래그 앤 드롭 활성화 (기본값: true)
 * @returns {Object} 이미지 미리보기 인스턴스
 */
export function createImagePreview(options) {
  const {
    fileInput,
    previewContainer,
    maxFiles = 5,
    acceptedTypes = ['image/webp', 'image/jpeg', 'image/jpg', 'image/png'],
    acceptedExtensions = ['.webp', '.jpeg', '.jpg', '.png'],
    maxFileSize = 10 * 1024 * 1024, // 10MB
    onAdd = null,
    onRemove = null,
    onError = null,
    pageId = 'image-preview',
    enableDragDrop = true
  } = options;

  if (!fileInput || !previewContainer) {
    throw new Error('fileInput and previewContainer are required');
  }

  // 상태
  const state = {
    files: [], // { file: File, previewUrl: string, id: string }
    isDragging: false
  };

  /**
   * 파일 형식 검증
   * @param {File} file - 검증할 파일
   * @returns {boolean} 유효한 형식이면 true
   */
  function isValidFileType(file) {
    // MIME 타입 확인
    if (acceptedTypes.includes(file.type)) {
      return true;
    }
    
    // 확장자 확인 (MIME 타입이 없는 경우 대비)
    const fileName = file.name.toLowerCase();
    return acceptedExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * 파일 크기 검증
   * @param {File} file - 검증할 파일
   * @returns {boolean} 유효한 크기면 true
   */
  function isValidFileSize(file) {
    return file.size <= maxFileSize;
  }

  /**
   * 파일 추가
   * @param {File[]} files - 추가할 파일 배열
   */
  function addFiles(files) {
    const filesToAdd = Array.from(files);
    const availableSlots = maxFiles - state.files.length;

    if (availableSlots <= 0) {
      if (onError) {
        onError(`최대 ${maxFiles}개의 이미지만 업로드할 수 있습니다.`);
      }
      return;
    }

    // 파일 검증
    const validFiles = [];
    for (const file of filesToAdd) {
      if (!isValidFileType(file)) {
        if (onError) {
          const extensions = acceptedExtensions.join(', ').toUpperCase();
          onError(`${file.name}은(는) 지원하지 않는 형식입니다. ${extensions} 형식만 업로드 가능합니다.`);
        }
        continue;
      }

      if (!isValidFileSize(file)) {
        if (onError) {
          const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
          onError(`${file.name}의 크기가 너무 큽니다. ${sizeMB}MB 이하의 파일만 업로드 가능합니다.`);
        }
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    // 업로드 가능한 개수만큼만 선택
    const filesToProcess = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots) {
      if (onError) {
        onError(`최대 ${maxFiles}개까지만 업로드할 수 있어 ${availableSlots}개만 선택됩니다.`);
      }
    }

    // 파일 추가 및 미리보기 생성
    filesToProcess.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      const id = `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const fileData = {
        file,
        previewUrl,
        id
      };

      state.files.push(fileData);

      // 콜백 호출
      if (onAdd) {
        const index = state.files.length - 1;
        onAdd(file, index);
      }
    });

    // UI 업데이트
    render();
  }

  /**
   * 파일 제거
   * @param {number} index - 제거할 파일 인덱스
   */
  function removeFile(index) {
    if (index < 0 || index >= state.files.length) {
      return;
    }

    const fileData = state.files[index];
    
    // 미리보기 URL 해제
    if (fileData.previewUrl) {
      URL.revokeObjectURL(fileData.previewUrl);
    }

    // 콜백 호출
    if (onRemove) {
      onRemove(fileData.file, index);
    }

    // 배열에서 제거
    state.files.splice(index, 1);

    // UI 업데이트
    render();
  }

  /**
   * 모든 파일 제거
   */
  function clearAll() {
    // 모든 미리보기 URL 해제
    state.files.forEach(fileData => {
      if (fileData.previewUrl) {
        URL.revokeObjectURL(fileData.previewUrl);
      }
    });

    state.files = [];
    render();
  }

  /**
   * 미리보기 렌더링
   */
  function render() {
    // 컨테이너 초기화
    previewContainer.innerHTML = '';

    if (state.files.length === 0) {
      previewContainer.classList.add('d-none');
      return;
    }

    previewContainer.classList.remove('d-none');

    // 미리보기 아이템 생성
    state.files.forEach((fileData, index) => {
      const previewItem = dom.createElement('div', {
        className: 'position-relative',
        style: 'width: 100px; height: 100px; border-radius: 8px; overflow: hidden;'
      });

      const img = dom.createElement('img', {
        src: fileData.previewUrl,
        className: 'img-thumbnail',
        style: 'width: 100%; height: 100%; object-fit: cover; border: none;',
        alt: fileData.file.name
      });

      previewItem.appendChild(img);

      // 삭제 버튼
      const removeBtn = dom.createElement('button', {
        type: 'button',
        className: 'btn btn-danger position-absolute',
        style: 'top: 2px; right: 2px; width: 24px; height: 24px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; line-height: 1;',
        title: '이미지 삭제',
        dataset: { index: index.toString() }
      });
      removeBtn.innerHTML = '<i class="bi bi-x"></i>';

      // 삭제 버튼 이벤트
      events.on(removeBtn, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        removeFile(idx);
      }, { pageId });

      previewItem.appendChild(removeBtn);
      previewContainer.appendChild(previewItem);
    });
  }

  /**
   * 파일 입력 변경 핸들러
   * @param {Event} event - 변경 이벤트
   */
  function handleFileInputChange(event) {
    const files = Array.from(event.target.files || []);
    
    // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
    fileInput.value = '';

    if (files.length === 0) {
      return;
    }

    addFiles(files);
  }

  /**
   * 드래그 오버 핸들러
   * @param {DragEvent} event - 드래그 이벤트
   */
  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!state.isDragging) {
      state.isDragging = true;
      previewContainer.classList.add('drag-over');
    }
  }

  /**
   * 드래그 리브 핸들러
   * @param {DragEvent} event - 드래그 이벤트
   */
  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // 컨테이너를 완전히 벗어났을 때만 상태 변경
    if (!previewContainer.contains(event.relatedTarget)) {
      state.isDragging = false;
      previewContainer.classList.remove('drag-over');
    }
  }

  /**
   * 드롭 핸들러
   * @param {DragEvent} event - 드롭 이벤트
   */
  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    state.isDragging = false;
    previewContainer.classList.remove('drag-over');

    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length > 0) {
      addFiles(files);
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  function setupEventListeners() {
    // 파일 입력 변경
    events.on(fileInput, 'change', handleFileInputChange, { pageId });

    // 드래그 앤 드롭
    if (enableDragDrop) {
      events.on(previewContainer, 'dragover', handleDragOver, { pageId });
      events.on(previewContainer, 'dragleave', handleDragLeave, { pageId });
      events.on(previewContainer, 'drop', handleDrop, { pageId });
    }
  }

  /**
   * 정리 함수
   */
  function destroy() {
    // 모든 미리보기 URL 해제
    state.files.forEach(fileData => {
      if (fileData.previewUrl) {
        URL.revokeObjectURL(fileData.previewUrl);
      }
    });

    // 상태 초기화
    state.files = [];
    state.isDragging = false;

    // 컨테이너 초기화
    previewContainer.innerHTML = '';
    previewContainer.classList.remove('drag-over');
  }

  // 초기화
  setupEventListeners();

  // 공개 API
  return {
    addFiles,
    removeFile,
    clearAll,
    getFiles: () => state.files.map(f => f.file),
    getFileCount: () => state.files.length,
    destroy
  };
}
