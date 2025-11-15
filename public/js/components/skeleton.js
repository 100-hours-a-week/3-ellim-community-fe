/**
 * Skeleton Loader Components
 * CLS 방지를 위한 스켈레톤 로더
 */

/**
 * 게시물 카드 스켈레톤 생성
 * @returns {HTMLElement} - 스켈레톤 카드 요소
 */
export function createPostCardSkeleton() {
  const skeleton = document.createElement('div');
  skeleton.className = 'post-card-skeleton';
  
  skeleton.innerHTML = `
    <div class="d-flex align-items-center gap-3 mb-3">
      <div class="skeleton skeleton-avatar"></div>
      <div class="flex-grow-1">
        <div class="skeleton skeleton-text mb-2" style="width: 120px;"></div>
        <div class="skeleton skeleton-text" style="width: 80px; height: 12px;"></div>
      </div>
    </div>
    <div class="skeleton skeleton-title mb-2" style="width: 80%;"></div>
    <div class="skeleton skeleton-title mb-3" style="width: 60%;"></div>
    <div class="d-flex gap-4">
      <div class="skeleton skeleton-text" style="width: 60px; height: 14px;"></div>
      <div class="skeleton skeleton-text" style="width: 60px; height: 14px;"></div>
      <div class="skeleton skeleton-text" style="width: 60px; height: 14px;"></div>
    </div>
  `;
  
  return skeleton;
}

/**
 * 여러 게시물 카드 스켈레톤 렌더링
 * @param {HTMLElement} container - 컨테이너 요소
 * @param {number} count - 스켈레톤 개수
 */
export function renderPostCardSkeletons(container, count = 3) {
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < count; i++) {
    const skeleton = createPostCardSkeleton();
    fragment.appendChild(skeleton);
  }
  
  container.appendChild(fragment);
}

/**
 * 스켈레톤 제거
 * @param {HTMLElement} container - 컨테이너 요소
 */
export function removeSkeletons(container) {
  const skeletons = container.querySelectorAll('.post-card-skeleton');
  skeletons.forEach(skeleton => skeleton.remove());
}
