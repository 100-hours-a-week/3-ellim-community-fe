/**
 * Posts List Page Module
 * 게시물 목록 페이지
 */

import { PostsAPI } from "../../api/posts.js";
import { events } from "../../utils/events.js";
import { dom } from "../../utils/dom.js";
import { navigation } from "../../utils/navigation.js";
import { auth } from "../../utils/auth.js";
import { createPostCard } from "../../components/card.js";
import { initHeader } from "../../components/header.js";
import { initFooter } from "../../components/footer.js";
import { Toast } from "../../components/toast.js";

const PAGE_ID = "posts-list";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="posts-list"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// 페이지 상태
let state = {
  isLoading: false,
  hasNext: true,
  lastPostId: null,
  posts: [], // 로드된 게시글 저장
};

// DOM 요소
let elements = {};

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

  // 무한 스크롤 설정
  setupInfiniteScroll();

  // 페이지 진입 방식 확인
  const navigationType = getNavigationType();
  console.log('Navigation type:', navigationType);

  // 뒤로가기/앞으로가기인 경우에만 상태 복원 시도
  let restored = false;
  if (navigationType === 'back_forward') {
    restored = restoreState();
  } else {
    // 새로고침이나 일반 진입 시 저장된 상태 삭제
    sessionStorage.removeItem('postListState');
  }
  
  if (!restored) {
    // 저장된 상태가 없거나 복원 실패 시 초기 게시물 로드
    await loadPosts();
  }
}

/**
 * 페이지 진입 방식 확인
 * @returns {string} 'navigate' | 'reload' | 'back_forward'
 */
function getNavigationType() {
  const navEntry = performance.getEntriesByType('navigation')[0];
  if (navEntry && navEntry.type) {
    return navEntry.type;
  }
  
  // 구형 브라우저 지원
  if (performance.navigation) {
    const type = performance.navigation.type;
    if (type === 0) return 'navigate';
    if (type === 1) return 'reload';
    if (type === 2) return 'back_forward';
  }
  
  return 'navigate';
}

/**
 * DOM 요소 캐싱
 */
function cacheElements() {
  elements = {
    postListContainer: dom.qs(".post-list-container"),
    createBtn: dom.qs(".post-create-btn"),
    loadingIndicator: dom.qs(".loading-indicator"),
    endMessage: dom.qs(".end-message"),
    scrollTrigger: dom.qs(".scroll-trigger"),
  };
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 게시물 작성 버튼
  if (elements.createBtn) {
    events.on(elements.createBtn, "click", handleCreateClick, { pageId: PAGE_ID });
  }

  // 게시물 카드 클릭 (이벤트 위임)
  events.on(elements.postListContainer, "click", handlePostCardClick, { pageId: PAGE_ID });
}

/**
 * 무한 스크롤 설정
 */
function setupInfiniteScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && state.hasNext && !state.isLoading) {
        loadPosts();
      }
    },
    {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    }
  );

  observer.observe(elements.scrollTrigger);

  // cleanup 시 observer 해제를 위해 저장
  state.observer = observer;
}

/**
 * 게시물 로드
 */
async function loadPosts() {
  if (state.isLoading || !state.hasNext) {
    return;
  }

  state.isLoading = true;
  showLoading();

  try {
    // 로컬 로딩 인디케이터를 사용하므로 전역 로딩 비활성화
    const response = await PostsAPI.getList(state.lastPostId, { showLoading: false });

    if (response.status >= 200 && response.status < 300 && response.data) {
      const { posts, lastPostId, hasNext } = response.data;

      // 게시물 렌더링
      renderPosts(posts);

      // 상태 업데이트
      state.lastPostId = lastPostId;
      state.hasNext = hasNext;

      // 더 이상 게시물이 없으면 종료 메시지 표시
      if (!hasNext) {
        showEndMessage();
      }
    } else {
      console.error("Failed to load posts:", response.error);
    }
  } catch (error) {
    console.error("Error loading posts:", error);
  } finally {
    state.isLoading = false;
    hideLoading();
  }
}

/**
 * 게시물 렌더링
 * @param {Array} posts - 게시물 배열
 */
function renderPosts(posts) {
  if (!posts || posts.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  posts.forEach((post) => {
    // 상태에 게시글 추가 (중복 방지)
    if (!state.posts.find(p => p.postId === post.postId)) {
      state.posts.push(post);
    }
    
    const card = createPostCard(post);
    fragment.appendChild(card);
  });

  elements.postListContainer.appendChild(fragment);
}

/**
 * 로딩 표시
 */
function showLoading() {
  if (elements.loadingIndicator) {
    elements.loadingIndicator.classList.remove("d-none");
  }
}

/**
 * 로딩 숨김
 */
function hideLoading() {
  if (elements.loadingIndicator) {
    elements.loadingIndicator.classList.add("d-none");
  }
}

/**
 * 종료 메시지 표시
 */
function showEndMessage() {
  if (elements.endMessage) {
    elements.endMessage.classList.remove("d-none");
  }
}

/**
 * 게시물 작성 버튼 클릭 핸들러
 */
function handleCreateClick() {
  navigation.goTo("/posts/create");
}

/**
 * 게시물 카드 클릭 핸들러 (이벤트 위임)
 * @param {Event} event - 클릭 이벤트
 */
function handlePostCardClick(event) {
  // 드롭다운 메뉴 아이템 클릭 처리
  const dropdownItem = event.target.closest('.dropdown-item[data-action]');
  if (dropdownItem) {
    event.preventDefault();
    event.stopPropagation();
    
    const action = dropdownItem.dataset.action;
    const card = event.target.closest(".post-card[data-post-id]");
    const postId = card?.dataset.postId;
    
    if (!postId) return;
    
    if (action === 'edit') {
      navigation.goTo(`/posts/edit/${postId}`);
    } else if (action === 'delete') {
      handleDeletePost(postId, card);
    }
    return;
  }

  // 드롭다운 버튼 클릭은 무시 (Bootstrap이 처리)
  if (event.target.closest('.dropdown button')) {
    event.stopPropagation();
    return;
  }

  // 카드 자체 클릭 (상세 페이지로 이동)
  const card = event.target.closest(".post-card[data-post-id]");
  if (!card) {
    return;
  }

  const postId = card.dataset.postId;

  // 게시물 상세 페이지로 이동
  navigation.goTo(`/posts/${postId}`);
}

/**
 * 게시물 삭제 핸들러
 * @param {string} postId - 게시물 ID
 * @param {HTMLElement} card - 게시물 카드 요소
 */
async function handleDeletePost(postId, card) {
  // Modal을 동적으로 import
  const { Modal } = await import("../../components/modal.js");
  
  const confirmed = await Modal.confirm(
    "게시물 삭제",
    "정말로 이 게시물을 삭제하시겠습니까?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await PostsAPI.delete(postId);

    if (response.status >= 200 && response.status < 300) {
      // 성공: 카드 제거 애니메이션
      card.style.transition = "opacity 0.3s, transform 0.3s";
      card.style.opacity = "0";
      card.style.transform = "translateX(-20px)";
      
      setTimeout(() => {
        card.remove();
      }, 300);

      // 현재 페이지에 머물므로 바로 Toast 표시
      Toast.success("게시물이 삭제되었습니다.");
    } else {
      // 에러는 현재 페이지에서 Toast로 표시
      Toast.error(response.error?.message || "게시물 삭제에 실패했습니다.");
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    Toast.error("게시물 삭제 중 오류가 발생했습니다.");
  }
}

/**
 * 정리 함수
 */
function cleanup() {
  // 이벤트 리스너 제거
  events.removeAllForPage(PAGE_ID);

  // IntersectionObserver 해제
  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }
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

/**
 * 상태 저장 (페이지 떠날 때)
 */
function saveState() {
  try {
    const stateToSave = {
      posts: state.posts,
      lastPostId: state.lastPostId,
      hasNext: state.hasNext,
      scrollY: window.scrollY,
      timestamp: Date.now()
    };
    sessionStorage.setItem('postListState', JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * 상태 복원 (페이지 돌아올 때)
 * @returns {boolean} 복원 성공 여부
 */
function restoreState() {
  try {
    const savedState = sessionStorage.getItem('postListState');
    if (!savedState) return false;

    const { posts, lastPostId, hasNext, scrollY, timestamp } = JSON.parse(savedState);
    
    // 5분 이상 지난 상태는 무시
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      sessionStorage.removeItem('postListState');
      return false;
    }

    // 상태 복원
    state.posts = posts;
    state.lastPostId = lastPostId;
    state.hasNext = hasNext;

    // 게시글 렌더링
    posts.forEach(post => {
      const card = createPostCard(post);
      elements.postListContainer.appendChild(card);
    });

    // 스크롤 위치 복원 (약간 지연)
    setTimeout(() => {
      window.scrollTo(0, scrollY);
    }, 100);

    // 종료 메시지 표시
    if (!hasNext) {
      showEndMessage();
    }

    console.log(`Restored ${posts.length} posts, scroll: ${scrollY}`);
    return true;
  } catch (error) {
    console.error('Failed to restore state:', error);
    sessionStorage.removeItem('postListState');
    return false;
  }
}

// 페이지 떠날 때 상태 저장
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'hidden') {
    saveState();
  }
});

// 페이지 언로드 시 상태 저장
window.addEventListener("pagehide", () => {
  saveState();
});
