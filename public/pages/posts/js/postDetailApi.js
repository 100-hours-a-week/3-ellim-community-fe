import { PostAPI } from "/js/api/posts.js";

const pathParts = window.location.pathname.split('/');
const postIdFromPath = pathParts[pathParts.length - 1];

/** Post Detail API 호출 및 데이터 처리 시작 */

const postDetailElement = document.querySelector(".post-detail");
const modalBackdrop = document.querySelector('[data-modal="confirm"]');
const modalTitleElement = modalBackdrop?.querySelector('.modal-title');
const modalDescriptionElement = modalBackdrop?.querySelector('.modal-description');
const modalConfirmButton = modalBackdrop?.querySelector('.modal-confirm-button');
const modalCancelButton = modalBackdrop?.querySelector('.modal-cancel-button');
const FOCUSABLE_MODAL_SELECTORS = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
let isModalActive = false;

let isPostLoading = false;
let postTemplate = null;
let isPostLike = null;
let isLikeProcessing = false;
const COMMENT_MAX_LENGTH = 300;
let commentCount = 0;
let commentCountValueElement = null;
let editingCommentState = null;

function showConfirmationModal({
    title,
    description,
    confirmText = '확인',
    cancelText = '취소',
} = {}) {
    if (!modalBackdrop || !modalConfirmButton || !modalCancelButton) {
        const fallbackMessage = [title, description].filter(Boolean).join('\n');
        return Promise.resolve(window.confirm(fallbackMessage || '확인하시겠습니까?'));
    }

    return new Promise((resolve) => {
        if (isModalActive) {
            resolve(false);
            return;
        }
        isModalActive = true;

        if (modalTitleElement) modalTitleElement.textContent = title ?? '';
        if (modalDescriptionElement) modalDescriptionElement.textContent = description ?? '';
        modalConfirmButton.textContent = confirmText ?? '확인';
        modalCancelButton.textContent = cancelText ?? '취소';

        const focusableElements = Array.from(
            modalBackdrop.querySelectorAll(FOCUSABLE_MODAL_SELECTORS)
        ).filter((el) => !el.hasAttribute('disabled'));

        const previouslyFocusedElement = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        const cleanup = () => {
            isModalActive = false;
            modalBackdrop.classList.remove('is-active');
            document.body.classList.remove('is-modal-open');
            modalConfirmButton.removeEventListener('click', handleConfirm);
            modalCancelButton.removeEventListener('click', handleCancel);
            modalBackdrop.removeEventListener('keydown', handleKeydown);
            modalBackdrop.removeEventListener('click', handleBackdropClick);
            if (previouslyFocusedElement) previouslyFocusedElement.focus();
        };

        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const handleBackdropClick = (event) => {
            if (event.target === modalBackdrop) {
                event.stopPropagation();
            }
        };

        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                handleCancel();
                return;
            }

            if (event.key === 'Tab' && focusableElements.length > 0) {
                const first = focusableElements[0];
                const last = focusableElements[focusableElements.length - 1];

                if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                } else if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                }
            }
        };

        modalConfirmButton.addEventListener('click', handleConfirm);
        modalCancelButton.addEventListener('click', handleCancel);
        modalBackdrop.addEventListener('keydown', handleKeydown);
        modalBackdrop.addEventListener('click', handleBackdropClick);

        document.body.classList.add('is-modal-open');
        modalBackdrop.classList.add('is-active');

        if (modalConfirmButton) {
            modalConfirmButton.focus();
        }
    });
}

async function loadPostDetail(postId) {
    const response = await fetch("/pages/posts/components/postDetail.html");
    postTemplate = await response.text();
}

function renderPostDetailHTML(post){
    let html = Object.entries(post).reduce(
        (html, [key, value]) => html.replace(new RegExp(`{{${key}}}`, "g"), value ?? ""),
        postTemplate
    );

    /**
     * 게시물 작성자가 아닌 경우, 수정 및 삭제 버튼 제거
     * 현재 템플릿에서 data-post-id="{{postId}}" 속성으로 문자열이 바뀔 수 있으므로 정규표현식으로 처리
     */
    if (!post.isAuthor) {
        html = html
            .replace(/<button[^>]*class="btn btn-outline update-post"[^>]*>[\s\S]*?<\/button>/, '')
            .replace(/<button[^>]*class="btn btn-danger delete-post"[^>]*>[\s\S]*?<\/button>/, '');
    }
    return html;
}

async function fetchPostDetail(postId) {
    if (isPostLoading) return;
    isPostLoading = true;
    try {
        const response = await PostAPI.getPostById(postId);
        const post = response.data;
        const processedPost = {
            postId : postIdFromPath,
            title : post.title,
            postImageUrls : post.imageUrls ?? [],
            content : post.content,
            profileImageUrl : post.profileImageUrl ?? '/assets/imgs/profile_icon.svg',
            author : post.author.nickname,
            date : new Date(post.createdAt).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }),
            views : post.viewCount ?? 0,
            likes : post.likeCount ?? 0,
            comments : post.commentCount ?? 0,
            isAuthor : post.isAuthor,
            isLiked : post.isLiked,
        };

        isPostLike = processedPost.isLiked;

        const postHTML = renderPostDetailHTML(processedPost);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = postHTML;

        const imageContainer = tempDiv.querySelector('.post-images');
        if (processedPost.postImageUrls.length > 0) {
            processedPost.postImageUrls.forEach(url => {
                const img = document.createElement('img');
                img.src = url;
                img.alt = 'Post Image';
                imageContainer.appendChild(img);
            });
        } else {
            imageContainer.style.display = 'none';
        }

        postDetailElement.innerHTML = tempDiv.innerHTML;
        initializePostDetailInteractions(processedPost);
        initializePostDetailStats(processedPost);
    } catch (error) {
        console.error("게시물 상세 불러오기 실패:", error);
    } finally {
        isPostLoading = false;
    }
}

await loadPostDetail();

if (postIdFromPath) {
    await fetchPostDetail(postIdFromPath);
} else {
    console.error("postId 파라미터가 없습니다.");
}

/** Post Detail API 호출 및 데이터 처리 끝 */

function initializePostDetailInteractions(post) {
    const likeButton = postDetailElement.querySelector(".post-like-toggle");
    if (!likeButton) return;

    const likeValueElement = likeButton.querySelector(".stat-value");

    const updateLikePresentation = (liked, likeCount) => {
        isPostLike = liked;
        likeButton.dataset.liked = String(liked);
        likeButton.setAttribute("aria-pressed", String(liked));
        likeButton.classList.toggle("is-liked", liked);
        likeValueElement.textContent = String(likeCount);
    };

    updateLikePresentation(Boolean(post.isLiked), Number(post.likes ?? 0));

    likeButton.addEventListener("click", async () => {
        if (isLikeProcessing) return;
        isLikeProcessing = true;
        likeButton.disabled = true;

        const currentCount = Number(likeValueElement.textContent) || 0;

        try {
            if (isPostLike) {
                await PostAPI.cancelLikePost(postIdFromPath);
                updateLikePresentation(false, Math.max(currentCount - 1, 0));
            } else {
                await PostAPI.likePost(postIdFromPath);
                updateLikePresentation(true, currentCount + 1);
            }
        } catch (error) {
            console.error("게시글 좋아요 토글 실패:", error);
            alert("좋아요 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            isLikeProcessing = false;
            likeButton.disabled = false;
        }
    });
}

function initializePostDetailStats(post) {
    commentCount = Number(post.comments ?? 0);
    commentCountValueElement = findStatValueElement("댓글");
    updateCommentCountDisplay();
}

function findStatValueElement(labelText) {
    const statElements = postDetailElement.querySelectorAll(".post-detail-stat");
    for (const stat of statElements) {
        const labelEl = stat.querySelector(".stat-label");
        if (labelEl && labelEl.textContent?.trim().startsWith(labelText)) {
            return stat.querySelector(".stat-value");
        }
    }
    return null;
}

function updateCommentCountDisplay() {
    if (commentCountValueElement) {
        commentCountValueElement.textContent = String(commentCount);
    }
}

/** Post 수정 API 호출 및 데이터 처리 시작 */

postDetailElement.addEventListener("click", async (event) => {
    if (event.target.classList.contains("update-post")) {
        const postId = event.target.dataset.postId;
        if (!postId) return;

        window.location.href = `/posts/edit/${postId}`;
    }
});

/** Post 수정 API 호출 및 데이터 처리 끝 */

/** Post 삭제 API 호출 및 데이터 처리 시작 */

postDetailElement.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-post")) {
        const postId = event.target.dataset.postId;
        if (!postId) return;

        const confirmed = await showConfirmationModal({
            title: '게시글을 삭제하시겠습니까?',
            description: '삭제한 내용은 복구할 수 없습니다.',
            confirmText: '삭제',
            cancelText: '취소',
        });
        if (!confirmed) return;

        try {
            await PostAPI.deletePost(postId);
            window.location.href = "/posts";
        } catch (error) {
            console.error("게시물 삭제 실패:", error);
            alert("게시물 삭제에 실패했습니다. 다시 시도해주세요.");
        }
    }
});
/** Post 삭제 API 호출 및 데이터 처리 끝 */

/** 댓글 리스트 API 호출 및 데이터 처리 시작 */

const commentListElement = document.querySelector(".post-comments-list");
const triggerElement = document.querySelector(".scroll-trigger");

let isCommentLoading = false;
let hasNextComments = true;
let lastCommentId = null;
let commentTemplate = null;

async function loadComments() {
    const response = await fetch("/pages/posts/components/postDetailCommentItem.html");
    commentTemplate = await response.text();
}

function renderCommentHTML(comment){
    let html = Object.entries(comment).reduce(
        (html, [key, value]) => html.replace(new RegExp(`{{${key}}}`, "g"), value ?? ""),
        commentTemplate
    );

    /**
     * 댓글 작성자가 아닌 경우, 수정 및 삭제 버튼 제거
     * 현재 템플릿에서 data-comment-id="{{commentId}}" 속성으로 문자열이 바뀔 수 있으므로 정규표현식으로 처리
     */
    if (!comment.isAuthor) {
        html = html
            .replace(/<button[^>]*class="btn btn-outline update-comment"[^>]*>[\s\S]*?<\/button>/, "")
            .replace(/<button[^>]*class="btn btn-danger delete-comment"[^>]*>[\s\S]*?<\/button>/, "");
    }

    return html;
}

function appendComments(comments){
    if (!Array.isArray(comments) || comments.length === 0) {
        triggerElement.textContent = "더 이상 불러올 댓글이 없습니다.";
        return;
    }
    const html = comments.map(renderCommentHTML).join("");
    commentListElement.insertAdjacentHTML("beforeend", html);
    // triggerElement.textContent = "";
}

function appendOptimisticComment(comment) {
    if (!comment) return;
    const html = renderCommentHTML(comment);
    commentListElement.insertAdjacentHTML("beforeend", html);
    // triggerElement.textContent = "";
}

async function fetchComments(postId) {
    if (isCommentLoading || !hasNextComments) return;
    isCommentLoading = true;
    triggerElement.textContent = "불러오는 중...";
    try {
        const response = await PostAPI.getCommentsOnPost(postId, lastCommentId, 5);
        const { comments, lastCommentId: newLastCommentId, hasNext: newHasNext } = response.data;
        const processedComments = comments.map(comment => ({
            commentId : comment.commentId,
            content : comment.content,
            profileImageUrl : comment.profileImageUrl ?? '/assets/imgs/profile_icon.svg',
            author : comment.author.nickname,
            date : new Date(comment.createdAt).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }),
            isAuthor : comment.isAuthor,
        }));

        appendComments(processedComments);

        lastCommentId = newLastCommentId;
        hasNextComments = newHasNext;

        if (!hasNextComments) {
            triggerElement.textContent = "모든 댓글을 불러왔습니다.";
        } else {
            // triggerElement.textContent = "";
        }
    } catch (error) {
        console.error("댓글 불러오기 실패:", error);
    } finally {
        isCommentLoading = false;
    }
}

const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && hasNextComments && !isCommentLoading) {
        fetchComments(postIdFromPath);
    }
});

observer.observe(triggerElement);

await loadComments();
fetchComments(postIdFromPath);

/** 댓글 리스트 API 호출 및 데이터 처리 끝 */

function attachTextareaLimiter(textarea, maxLength, options = {}) {
    if (!textarea) {
        return {
            validateLength: () => true,
            updateCounter: () => {},
        };
    }

    const warningThreshold = options.warningThreshold ?? Math.min(100, Math.floor(maxLength * 0.1));
    const labelPrefix = options.labelPrefix ?? "";
    const counterClassName = options.counterClassName ?? "form-counter";

    let counter = options.counterElement;
    if (!counter) {
        counter = document.createElement("p");
        counter.className = counterClassName;
        counter.setAttribute("aria-live", "polite");
        textarea.insertAdjacentElement("afterend", counter);
    }

    textarea.setAttribute("maxlength", String(maxLength));

    const updateCounter = () => {
        const currentLength = textarea.value.length;
        counter.textContent = `${labelPrefix}${labelPrefix ? " " : ""}${currentLength} / ${maxLength}`;
        counter.classList.toggle("form-counter--warning", maxLength - currentLength <= warningThreshold);
    };

    textarea.addEventListener("input", () => {
        if (textarea.value.length > maxLength) {
            textarea.value = textarea.value.slice(0, maxLength);
        }
        updateCounter();
    });

    updateCounter();

    return {
        validateLength: (value) => (value?.length ?? 0) <= maxLength,
        updateCounter,
        counterElement: counter,
    };
}

/** 댓글 작성 API 호출 및 데이터 처리 시작 */
const commentForm = document.querySelector(".post-comment-form");
const commentTextarea = commentForm?.querySelector('textarea[name="content"]');
const commentSubmitButton = commentForm?.querySelector('button[type="submit"]');
let syncCommentSubmitState = () => {};

const { validateLength: validateCommentLength, updateCounter: updateCommentCounter } =
    attachTextareaLimiter(commentTextarea, COMMENT_MAX_LENGTH, {
        warningThreshold: 30,
    });

if (commentTextarea && commentSubmitButton) {
    syncCommentSubmitState = () => {
        commentSubmitButton.disabled = commentTextarea.value.trim().length === 0;
    };
    commentTextarea.addEventListener("input", syncCommentSubmitState);
    syncCommentSubmitState();
    updateCommentCounter();
}

if (commentForm) {
    commentForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const content = (commentTextarea?.value ?? "").trim();
        if (content.length === 0) {
            alert("댓글 내용을 입력해주세요.");
            return;
        }

        if (!validateCommentLength(content)) {
            alert(`댓글은 최대 ${COMMENT_MAX_LENGTH}자까지 입력할 수 있습니다.`);
            return;
        }

        if (commentSubmitButton) {
            commentSubmitButton.disabled = true;
        }

        let isSuccess = false;

        try {
            const response = await PostAPI.createCommentOnPost(postIdFromPath, content);
            const comment = response?.data;
            let displayComment = null;

            if (comment && comment.commentId) {
                displayComment = {
                    commentId : comment.commentId,
                    content : comment.content,
                    profileImageUrl : comment.profileImageUrl ?? '/assets/imgs/profile_icon.svg',
                    author : comment.author?.nickname ?? "익명",
                    date : new Date(comment.createdAt ?? Date.now()).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    }),
                    isAuthor : Boolean(comment.isAuthor ?? true),
                };
            }

            if (displayComment) {
                appendOptimisticComment(displayComment);
            } else {
                await fetchComments(postIdFromPath);
            }

            commentCount += 1;
            updateCommentCountDisplay();

            if (commentTextarea) {
                commentTextarea.value = "";
                updateCommentCounter();
                commentTextarea.focus();
            }
            // triggerElement.textContent = "";
            isSuccess = true;
        } catch (error) {
            console.error("댓글 작성 실패:", error);
            alert("댓글 작성에 실패했습니다. 다시 시도해주세요.");
        } finally {
            if (isSuccess) {
                syncCommentSubmitState();
            } else if (commentSubmitButton) {
                commentSubmitButton.disabled = false;
            }
        }
    });
}
/** 댓글 작성 API 호출 및 데이터 처리 끝 */

/** 댓글 수정 API 호출 및 데이터 처리 시작 */

const commentListContainer = document.querySelector(".post-comments-list");

commentListContainer.addEventListener("click", async (event) => {
    const updateButton = event.target.closest(".update-comment");
    if (updateButton) {
        const commentId = updateButton.dataset.commentId;
        if (!commentId) return;

        if (updateButton.classList.contains("confirm-update")) {
            await submitCommentEdit(commentId, updateButton);
        } else {
            enterCommentEditMode(commentId, updateButton);
        }
        return;
    }

    if (event.target.classList.contains("cancel-comment-edit")) {
        event.preventDefault();
        cancelCommentEdit();
        return;
    }

    if (!event.target.classList.contains("delete-comment")) return;

    const commentId = event.target.dataset.commentId;
    if (!commentId) return;

    const confirmed = await showConfirmationModal({
        title: '댓글을 삭제하시겠습니까?',
        description: '삭제한 내용은 복구할 수 없습니다.',
        confirmText: '삭제',
        cancelText: '취소',
    });
    if (!confirmed) return;

    try {
        await PostAPI.deleteComment(postIdFromPath, commentId);

        /**
         * 현재 댓글 삭제 API에서 해당 댓글에 대한 Response를 주지 않으므로
         * 댓글 삭제 후 새로고침을 통해 댓글 리스트를 다시 불러오는 방식으로 처리
         * 추후 API에서 삭제된 댓글 데이터를 반환하도록 수정 시, 해당 부분을 수정할 예정
         */
        window.location.reload();
    } catch (error) {
        console.error("댓글 삭제 실패:", error);
        alert("댓글 삭제에 실패했습니다. 다시 시도해주세요.");
    }
});

/** 댓글 수정/삭제 API 호출 및 데이터 처리 끝 */

function enterCommentEditMode(commentId, updateButton) {
    const commentItem = updateButton.closest('.post-comment');
    if (!commentItem) return;

    if (editingCommentState && editingCommentState.commentId === commentId) {
        return;
    }

    if (editingCommentState) {
        cancelCommentEdit();
    }

    const contentElement = commentItem.querySelector('.comment-content');
    if (!contentElement) return;

    const originalContentRaw = contentElement.textContent ?? '';
    const originalContentTrimmed = originalContentRaw.trim();
    const textarea = document.createElement('textarea');
    textarea.className = 'comment-edit-textarea';
    textarea.value = originalContentRaw;
    const limiter = attachTextareaLimiter(textarea, COMMENT_MAX_LENGTH, {
        warningThreshold: 30,
    });

    textarea.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            cancelCommentEdit();
        } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'enter') {
            event.preventDefault();
            submitCommentEdit(commentId, updateButton);
        }
    });

    const commentRight = commentItem.querySelector('.comment-right');
    const deleteButton = commentRight?.querySelector('.delete-comment') ?? null;

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-ghost cancel-comment-edit';
    cancelButton.dataset.commentId = commentId;
    cancelButton.textContent = '취소';

    contentElement.replaceWith(textarea);
    commentItem.classList.add('is-editing');

    if (deleteButton) {
        deleteButton.disabled = true;
    }

    if (commentRight) {
        commentRight.insertBefore(cancelButton, deleteButton ?? null);
    }

    updateButton.classList.add('confirm-update');
    updateButton.textContent = '수정완료';

    editingCommentState = {
        commentId,
        textarea,
        updateButton,
        cancelButton,
        deleteButton,
        originalContentRaw,
        originalContentTrimmed,
        commentItem,
        counterElement: limiter.counterElement,
        validateLength: limiter.validateLength,
    };

    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
}

function cancelCommentEdit() {
    if (!editingCommentState) return;

    const { commentItem, textarea, updateButton, cancelButton, deleteButton, originalContentRaw, counterElement } = editingCommentState;
    const restoredContent = document.createElement('div');
    restoredContent.className = 'comment-content';
    restoredContent.textContent = originalContentRaw;
    textarea.replaceWith(restoredContent);

    if (counterElement) {
        counterElement.remove();
    }

    updateButton.classList.remove('confirm-update');
    updateButton.textContent = '수정';
    updateButton.disabled = false;

    if (cancelButton) {
        cancelButton.remove();
    }

    if (deleteButton) {
        deleteButton.disabled = false;
    }

    commentItem.classList.remove('is-editing');
    editingCommentState = null;
    updateButton.focus();
}

async function submitCommentEdit(commentId, updateButton) {
    if (!editingCommentState || editingCommentState.commentId !== commentId) return;

    const { textarea, cancelButton, deleteButton, originalContentTrimmed, commentItem, counterElement, validateLength } = editingCommentState;
    const newContent = textarea.value.trim();

    if (newContent.length === 0) {
        alert('댓글 내용을 입력해주세요.');
        textarea.focus();
        return;
    }

    if (!(validateLength ? validateLength(newContent) : validateCommentLength(newContent))) {
        alert(`댓글은 최대 ${COMMENT_MAX_LENGTH}자까지 입력할 수 있습니다.`);
        textarea.focus();
        return;
    }

    if (newContent === originalContentTrimmed) {
        cancelCommentEdit();
        return;
    }

    updateButton.disabled = true;
    if (cancelButton) cancelButton.disabled = true;
    if (deleteButton) deleteButton.disabled = true;

    try {
        await PostAPI.updateComment(postIdFromPath, commentId, newContent);

        const updatedContent = document.createElement('div');
        updatedContent.className = 'comment-content';
        updatedContent.textContent = newContent;
        textarea.replaceWith(updatedContent);

        if (counterElement) {
            counterElement.remove();
        }

        updateButton.classList.remove('confirm-update');
        updateButton.textContent = '수정';
        updateButton.disabled = false;

        if (cancelButton) {
            cancelButton.remove();
        }

        if (deleteButton) {
            deleteButton.disabled = false;
        }

        commentItem.classList.remove('is-editing');
        editingCommentState = null;
        updateButton.focus();
    } catch (error) {
        console.error('댓글 수정 실패:', error);
        alert('댓글 수정에 실패했습니다. 다시 시도해주세요.');
        updateButton.disabled = false;
        if (cancelButton) cancelButton.disabled = false;
        if (deleteButton) deleteButton.disabled = false;
        textarea.focus();
    }
}
