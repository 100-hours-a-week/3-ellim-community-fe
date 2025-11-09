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
};

// DOM 요소
let elements = {};

/**
 * 페이지 초기화
 */
async function init() {
  // 인증 필요
  auth.requireSignIn();

  // 헤더 초기화
  await initHeader(PAGE_ID);

  // DOM 요소 캐싱
  cacheElements();

  // 이벤트 리스너 설정
  setupEventListeners();

  // 무한 스크롤 설정
  setupInfiniteScroll();

  // 초기 게시물 로드
  await loadPosts();
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
    const response = await PostsAPI.getList(state.lastPostId);

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
