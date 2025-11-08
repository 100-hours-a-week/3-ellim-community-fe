/**
 * Card Component
 * 게시물 및 댓글 카드 렌더링
 * Bootstrap Card 구조 사용
 */

import { dom } from '../utils/dom.js';

/**
 * 날짜를 상대적 시간으로 변환
 * @param {string} dateString - ISO 8601 날짜 문자열
 * @returns {string} - 상대적 시간 표현
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return '방금 전';
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay < 7) {
    return `${diffDay}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR');
  }
}

/**
 * 게시물 카드 생성
 * @param {Object} post - 게시물 데이터
 * @returns {HTMLElement} - 게시물 카드 요소
 */
export function createPostCard(post) {
  const card = document.createElement('div');
  card.className = 'card mb-3';
  card.dataset.postId = post.postId;

  // 카드 헤더
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header d-flex justify-content-between align-items-center';

  const authorInfo = document.createElement('div');
  authorInfo.className = 'd-flex align-items-center';

  const authorImage = document.createElement('img');
  authorImage.src = post.author.profileImageUrl || '/assets/imgs/profile_icon.svg';
  authorImage.alt = 'Profile';
  authorImage.className = 'rounded-circle me-2';
  authorImage.style.width = '32px';
  authorImage.style.height = '32px';
  authorImage.style.objectFit = 'cover';

  const authorName = document.createElement('span');
  authorName.className = 'fw-bold';
  authorName.textContent = post.author.nickname;

  authorInfo.appendChild(authorImage);
  authorInfo.appendChild(authorName);

  const postDate = document.createElement('small');
  postDate.className = 'text-muted';
  postDate.textContent = formatRelativeTime(post.createdAt);

  cardHeader.appendChild(authorInfo);
  cardHeader.appendChild(postDate);

  // 카드 본문
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const cardTitle = document.createElement('h5');
  cardTitle.className = 'card-title';
  cardTitle.textContent = post.title;

  const cardText = document.createElement('p');
  cardText.className = 'card-text';
  cardText.textContent = post.content;

  cardBody.appendChild(cardTitle);
  cardBody.appendChild(cardText);

  // 이미지가 있는 경우
  if (post.imageUrls && post.imageUrls.length > 0) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'mb-3';

    post.imageUrls.forEach((imageUrl, index) => {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = `Post image ${index + 1}`;
      img.className = 'img-fluid mb-2';
      img.style.maxHeight = '400px';
      img.style.objectFit = 'cover';
      img.loading = 'lazy';
      imageContainer.appendChild(img);
    });

    cardBody.appendChild(imageContainer);
  }

  // 카드 푸터 (통계 정보)
  const cardFooter = document.createElement('div');
  cardFooter.className = 'card-footer d-flex justify-content-between align-items-center';

  const stats = document.createElement('div');
  stats.className = 'd-flex gap-3';

  const viewCount = document.createElement('span');
  viewCount.className = 'text-muted';
  viewCount.innerHTML = `<i class="bi bi-eye"></i> ${post.viewCount || 0}`;

  const likeCount = document.createElement('span');
  likeCount.className = post.isLiked ? 'text-danger' : 'text-muted';
  likeCount.innerHTML = `<i class="bi bi-heart${post.isLiked ? '-fill' : ''}"></i> ${post.likeCount || 0}`;

  const commentCount = document.createElement('span');
  commentCount.className = 'text-muted';
  commentCount.innerHTML = `<i class="bi bi-chat"></i> ${post.commentCount || 0}`;

  stats.appendChild(viewCount);
  stats.appendChild(likeCount);
  stats.appendChild(commentCount);

  cardFooter.appendChild(stats);

  // 작성자인 경우 수정/삭제 버튼
  if (post.isAuthor) {
    const actions = document.createElement('div');
    actions.className = 'd-flex gap-2';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-primary';
    editBtn.textContent = '수정';
    editBtn.dataset.action = 'edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.textContent = '삭제';
    deleteBtn.dataset.action = 'delete';

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    cardFooter.appendChild(actions);
  }

  // 카드 조립
  card.appendChild(cardHeader);
  card.appendChild(cardBody);
  card.appendChild(cardFooter);

  return card;
}

/**
 * 댓글 카드 생성
 * @param {Object} comment - 댓글 데이터
 * @returns {HTMLElement} - 댓글 카드 요소
 */
export function createCommentCard(comment) {
  const card = document.createElement('div');
  card.className = 'card mb-2';
  card.dataset.commentId = comment.commentId;

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  // 댓글 헤더
  const header = document.createElement('div');
  header.className = 'd-flex justify-content-between align-items-center mb-2';

  const authorInfo = document.createElement('div');
  authorInfo.className = 'd-flex align-items-center';

  const authorImage = document.createElement('img');
  authorImage.src = comment.author.profileImageUrl || '/assets/imgs/profile_icon.svg';
  authorImage.alt = 'Profile';
  authorImage.className = 'rounded-circle me-2';
  authorImage.style.width = '24px';
  authorImage.style.height = '24px';
  authorImage.style.objectFit = 'cover';

  const authorName = document.createElement('span');
  authorName.className = 'fw-bold small';
  authorName.textContent = comment.author.nickname;

  const commentDate = document.createElement('small');
  commentDate.className = 'text-muted ms-2';
  commentDate.textContent = formatRelativeTime(comment.createdAt);

  authorInfo.appendChild(authorImage);
  authorInfo.appendChild(authorName);
  authorInfo.appendChild(commentDate);

  header.appendChild(authorInfo);

  // 작성자인 경우 수정/삭제 버튼
  if (comment.isAuthor) {
    const actions = document.createElement('div');
    actions.className = 'd-flex gap-2';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-link text-primary p-0';
    editBtn.textContent = '수정';
    editBtn.dataset.action = 'edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-link text-danger p-0';
    deleteBtn.textContent = '삭제';
    deleteBtn.dataset.action = 'delete';

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    header.appendChild(actions);
  }

  // 댓글 내용
  const content = document.createElement('p');
  content.className = 'card-text mb-0';
  content.textContent = comment.content;

  cardBody.appendChild(header);
  cardBody.appendChild(content);
  card.appendChild(cardBody);

  return card;
}

/**
 * 여러 게시물 카드를 컨테이너에 추가
 * @param {HTMLElement} container - 컨테이너 요소
 * @param {Array<Object>} posts - 게시물 배열
 */
export function renderPostCards(container, posts) {
  const fragment = document.createDocumentFragment();
  
  posts.forEach(post => {
    const card = createPostCard(post);
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

/**
 * 여러 댓글 카드를 컨테이너에 추가
 * @param {HTMLElement} container - 컨테이너 요소
 * @param {Array<Object>} comments - 댓글 배열
 */
export function renderCommentCards(container, comments) {
  const fragment = document.createDocumentFragment();
  
  comments.forEach(comment => {
    const card = createCommentCard(comment);
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}
