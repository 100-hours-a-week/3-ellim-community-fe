/**
 * Card Component
 * 게시물 및 댓글 카드 렌더링
 * Bootstrap Card 구조 사용
 */

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
 * 날짜를 전체 형식으로 변환 (년-월-일 시:분:초)
 * @param {string} dateString - ISO 8601 날짜 문자열
 * @returns {string} - 전체 날짜 시간 표현
 */
function formatFullDateTime(dateString) {
  const date = new Date(dateString);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 게시물 카드 생성 (Modern Minimal Design)
 * @param {Object} post - 게시물 데이터
 * @returns {HTMLElement} - 게시물 카드 요소
 */
export function createPostCard(post) {
  const card = document.createElement('article');
  card.className = 'post-card mb-4 p-4 bg-white rounded-3 shadow-sm';
  card.style.cursor = 'pointer';
  card.dataset.postId = post.postId;

  // 상단: 작성자 정보 + 날짜
  const header = document.createElement('div');
  header.className = 'd-flex justify-content-between align-items-start mb-3';

  const authorSection = document.createElement('div');
  authorSection.className = 'd-flex align-items-center gap-3';

  const authorImage = document.createElement('img');
  authorImage.src = post.author.profileImageUrl || '/assets/imgs/profile_icon.svg';
  authorImage.alt = post.author.nickname;
  authorImage.className = 'author-image rounded-circle';

  const authorDetails = document.createElement('div');
  
  const authorName = document.createElement('div');
  authorName.className = 'author-name fw-bold text-dark mb-1';
  authorName.textContent = post.author.nickname;

  const postDate = document.createElement('div');
  postDate.className = 'post-date text-muted';
  postDate.textContent = formatRelativeTime(post.createdAt);

  authorDetails.appendChild(authorName);
  authorDetails.appendChild(postDate);
  authorSection.appendChild(authorImage);
  authorSection.appendChild(authorDetails);

  header.appendChild(authorSection);

  // 작성자인 경우 드롭다운 메뉴
  if (post.isAuthor) {
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'dropdown';

    const dropdownBtn = document.createElement('button');
    dropdownBtn.className = 'btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0';
    dropdownBtn.type = 'button';
    dropdownBtn.setAttribute('data-bs-toggle', 'dropdown');
    dropdownBtn.setAttribute('aria-expanded', 'false');
    dropdownBtn.innerHTML = '<i class="bi bi-three-dots-vertical fs-5"></i>';

    const dropdownMenu = document.createElement('ul');
    dropdownMenu.className = 'dropdown-menu dropdown-menu-end';

    const editItem = document.createElement('li');
    const editLink = document.createElement('a');
    editLink.className = 'dropdown-item d-flex align-items-center';
    editLink.href = '#';
    editLink.innerHTML = '<i class="bi bi-pencil-square me-2"></i><span>수정하기</span>';
    editLink.dataset.action = 'edit';
    editItem.appendChild(editLink);

    const divider = document.createElement('li');
    divider.innerHTML = '<hr class="dropdown-divider">';

    const deleteItem = document.createElement('li');
    const deleteLink = document.createElement('a');
    deleteLink.className = 'dropdown-item d-flex align-items-center text-danger';
    deleteLink.href = '#';
    deleteLink.innerHTML = '<i class="bi bi-trash3 me-2"></i><span>삭제하기</span>';
    deleteLink.dataset.action = 'delete';
    deleteItem.appendChild(deleteLink);

    dropdownMenu.appendChild(editItem);
    dropdownMenu.appendChild(divider);
    dropdownMenu.appendChild(deleteItem);
    dropdownContainer.appendChild(dropdownBtn);
    dropdownContainer.appendChild(dropdownMenu);

    header.appendChild(dropdownContainer);
  }

  card.appendChild(header);

  // 본문: 제목 + 내용
  const contentSection = document.createElement('div');
  contentSection.className = 'mb-3';

  const title = document.createElement('h3');
  title.className = 'post-title fw-bold mb-2 text-dark';
  title.textContent = post.title;

  contentSection.appendChild(title);
  card.appendChild(contentSection);

  // 하단: 통계 (미니멀한 스타일)
  const footer = document.createElement('div');
  footer.className = 'post-footer d-flex align-items-center gap-4 pt-3 border-top';

  const stats = [
    { icon: 'eye', count: post.viewCount || 0, label: '조회', active: false },
    { icon: post.isLiked ? 'heart-fill' : 'heart', count: post.likeCount || 0, label: '좋아요', active: post.isLiked },
    { icon: 'chat', count: post.commentCount || 0, label: '댓글', active: false }
  ];

  stats.forEach(stat => {
    const statItem = document.createElement('div');
    statItem.className = 'stat-item d-flex align-items-center gap-2';
    
    const icon = document.createElement('i');
    icon.className = `bi bi-${stat.icon} ${stat.active ? 'text-danger' : 'text-muted'}`;
    
    const count = document.createElement('span');
    count.className = stat.active ? 'text-danger fw-semibold' : 'text-muted';
    count.textContent = stat.count;

    statItem.appendChild(icon);
    statItem.appendChild(count);
    footer.appendChild(statItem);
  });

  card.appendChild(footer);

  return card;
}

/**
 * 댓글 카드 생성
 * @param {Object} comment - 댓글 데이터
 * @param {boolean} isOptimistic - 낙관적 업데이트 여부
 * @returns {HTMLElement} - 댓글 카드 요소
 */
export function createCommentCard(comment, isOptimistic = false) {
  const card = document.createElement('div');
  card.className = 'card mb-2';
  card.dataset.commentId = comment.commentId || 'temp';
  
  // 낙관적 업데이트인 경우 투명도 적용
  if (isOptimistic) {
    card.style.opacity = '0.6';
  }

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
  commentDate.textContent = formatFullDateTime(comment.createdAt);

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
  content.className = 'card-text mb-0 comment-content';
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
