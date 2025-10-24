import { PostAPI } from "/js/api/posts.js";

const postCreateButton = document.querySelector(".post-create-button");
postCreateButton.addEventListener("click", () => {
    window.location.href = "/posts/create";
});

const postListElement = document.querySelector(".post-list");
const triggerElement = document.querySelector(".scroll-trigger");

let isLoading = false;
let hasNext = true;
let lastPostId = null;
let postTemplate = null;

async function loadPosts() {
    const response = await fetch("/pages/posts/components/postItem.html");
    postTemplate = await response.text();
}

function renderPostHTML(post){
    return Object.entries(post).reduce(
        (html, [key, value]) => html.replace(new RegExp(`{{${key}}}`, "g"), value ?? ""),
        postTemplate
    );
}

function appendPosts(posts){
    if (!Array.isArray(posts) || posts.length === 0) {
        triggerElement.textContent = "더 이상 불러올 게시물이 없습니다.";
        return;
    }
    const html = posts.map(renderPostHTML).join("");
    postListElement.insertAdjacentHTML("beforeend", html);
}

async function fetchPosts() {
    if (isLoading || !hasNext) return;
    isLoading = true;
    triggerElement.textContent = "불러오는 중...";
    try {
        const response = await PostAPI.getPosts(lastPostId);
        const { posts, lastPostId: newLastPostId, hasNext: newHasNext } = response.data;
        const processedPosts = posts.map(post => ({
            postId : post.postId,
            title : post.title,
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
        }));

        appendPosts(processedPosts);

        lastPostId = newLastPostId;
        hasNext = newHasNext;

        if (!hasNext) {
            triggerElement.textContent = "모든 게시물을 불러왔습니다.";
        } else {
            triggerElement.textContent = "";
        }
    } catch (error) {
        triggerElement.textContent = "게시물 불러오기에 실패했습니다.";
        console.error("게시물 불러오기 실패:", error);
    } finally {
        isLoading = false;
    }
}

const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && hasNext && !isLoading) {
        fetchPosts();
    }
});

observer.observe(triggerElement);

await loadPosts();
fetchPosts();