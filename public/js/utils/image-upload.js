/**
 * Image Upload Utility
 * 이미지 업로드 관련 공통 기능 제공
 */

/**
 * 이미지 파일 검증 옵션
 * @typedef {Object} ValidationOptions
 * @property {string[]} allowedTypes - 허용된 MIME 타입
 * @property {string[]} allowedExtensions - 허용된 확장자
 * @property {number} maxSize - 최대 파일 크기 (바이트)
 */

/**
 * 기본 검증 옵션
 */
const DEFAULT_VALIDATION = {
  allowedTypes: ['image/webp', 'image/jpeg', 'image/jpg', 'image/png'],
  allowedExtensions: ['.webp', '.jpeg', '.jpg', '.png'],
  maxSize: 10 * 1024 * 1024 // 10MB
};

/**
 * 이미지 파일 형식 검증
 * @param {File} file - 검증할 파일
 * @param {ValidationOptions} options - 검증 옵션
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file, options = {}) {
  const opts = { ...DEFAULT_VALIDATION, ...options };
  
  if (!file) {
    return { valid: false, error: '파일이 선택되지 않았습니다.' };
  }

  // MIME 타입 확인
  const hasValidType = opts.allowedTypes.includes(file.type);
  
  // 확장자 확인 (MIME 타입이 없는 경우 대비)
  const fileName = file.name.toLowerCase();
  const hasValidExtension = opts.allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidType && !hasValidExtension) {
    const extensions = opts.allowedExtensions.join(', ').toUpperCase();
    return { 
      valid: false, 
      error: `${file.name}은(는) 지원하지 않는 형식입니다. ${extensions} 형식만 업로드 가능합니다.` 
    };
  }

  // 파일 크기 확인
  if (file.size > opts.maxSize) {
    const sizeMB = (opts.maxSize / (1024 * 1024)).toFixed(0);
    return { 
      valid: false, 
      error: `${file.name}의 크기가 너무 큽니다. ${sizeMB}MB 이하의 파일만 업로드 가능합니다.` 
    };
  }

  return { valid: true };
}

/**
 * 이미지 미리보기 URL 생성
 * @param {File} file - 이미지 파일
 * @returns {string} - Blob URL
 */
export function createImagePreview(file) {
  return URL.createObjectURL(file);
}

/**
 * 이미지 미리보기 URL 해제
 * @param {string} url - Blob URL
 */
export function revokeImagePreview(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * 단일 이미지 업로드
 * @param {File} file - 업로드할 파일
 * @param {Object} api - API 객체 (uploadProfile 또는 uploadPost 메서드 필요)
 * @param {string} type - 업로드 타입 ('profile' | 'post')
 * @returns {Promise<{success: boolean, imageId?: number, error?: string}>}
 */
export async function uploadImage(file, api, type = 'post') {
  try {
    const uploadMethod = type === 'profile' ? api.uploadProfile : api.uploadPost;
    
    if (!uploadMethod) {
      throw new Error(`API does not have upload method for type: ${type}`);
    }

    const response = await uploadMethod.call(api, file);

    if (response.status >= 200 && response.status < 300 && response.data) {
      const imageId = response.data.imageId || response.data.id;
      return { success: true, imageId };
    } else {
      const errorMessage = response.error?.message || "이미지 업로드에 실패했습니다.";
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("Image upload error:", error);
    return { success: false, error: "이미지 업로드 중 오류가 발생했습니다." };
  }
}

/**
 * 다중 이미지 업로드 헬퍼
 * @param {File[]} files - 업로드할 파일 배열
 * @param {Object} api - API 객체
 * @param {Function} onProgress - 진행 상황 콜백 (uploadedCount, totalCount) => void
 * @param {Function} onEachComplete - 각 파일 업로드 완료 콜백 (file, result, index) => void
 * @returns {Promise<Array<{file: File, success: boolean, imageId?: number, error?: string}>>}
 */
export async function uploadMultipleImages(files, api, onProgress = null, onEachComplete = null) {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadImage(file, api, 'post');
    
    results.push({
      file,
      ...result
    });

    if (onEachComplete) {
      onEachComplete(file, result, i);
    }

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return results;
}

/**
 * 이미지 파일 선택 헬퍼
 * @param {FileList} fileList - 선택된 파일 목록
 * @param {Object} options - 옵션
 * @param {number} options.maxFiles - 최대 파일 개수
 * @param {number} options.currentCount - 현재 업로드된 파일 개수
 * @param {ValidationOptions} options.validation - 검증 옵션
 * @returns {{ valid: File[], invalid: Array<{file: File, error: string}>, availableSlots: number }}
 */
export function processFileSelection(fileList, options = {}) {
  const {
    maxFiles = 5,
    currentCount = 0,
    validation = {}
  } = options;

  const files = Array.from(fileList || []);
  const availableSlots = maxFiles - currentCount;

  if (availableSlots <= 0) {
    return {
      valid: [],
      invalid: [],
      availableSlots: 0,
      error: `최대 ${maxFiles}개의 이미지만 업로드할 수 있습니다.`
    };
  }

  const valid = [];
  const invalid = [];

  files.forEach(file => {
    const result = validateImageFile(file, validation);
    if (result.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: result.error });
    }
  });

  // 업로드 가능한 개수만큼만 선택
  const filesToUpload = valid.slice(0, availableSlots);
  const exceeded = valid.length > availableSlots;

  return {
    valid: filesToUpload,
    invalid,
    availableSlots,
    exceeded,
    exceededMessage: exceeded ? `최대 ${maxFiles}개까지만 업로드할 수 있어 ${availableSlots}개만 선택됩니다.` : null
  };
}
