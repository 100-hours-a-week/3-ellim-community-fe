import { PostAPI } from "/js/api/posts.js";
import { ImageAPI } from "/js/api/images.js";

const POST_TITLE_MAX_LENGTH = 26;
const POST_CONTENT_MAX_LENGTH = 5000;
const pathParts = window.location.pathname.split('/');
const postId = pathParts[pathParts.length - 1];

/** 게시물 수정 API 호출 및 데이터 처리 시작 */

const postEditForm = document.getElementById("post-edit-form");
let validateContentLength = () => true;
let updateContentCounter = () => {};

if (postEditForm) {
    const titleInput = postEditForm.querySelector("#title");
    const contentTextarea = postEditForm.querySelector("#content");
    const titleLimiter = attachInputLimiter(titleInput, POST_TITLE_MAX_LENGTH);
    const contentLimiter = attachTextareaLimiter(contentTextarea, POST_CONTENT_MAX_LENGTH);
    validateContentLength = contentLimiter.validateLength;
    updateContentCounter = contentLimiter.updateCounter;

    postEditForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(postEditForm);
        const title = formData.get("title");
        const content = formData.get("content") ?? "";
        const imageFiles = formData.getAll("postImages");

        if (!titleLimiter.validateLength(title ?? "")) {
            alert(`제목은 최대 ${POST_TITLE_MAX_LENGTH}자까지 입력할 수 있습니다.`);
            return;
        }

        if (!validateContentLength(content)) {
            alert(`게시글 내용은 최대 ${POST_CONTENT_MAX_LENGTH}자까지 입력할 수 있습니다.`);
            return;
        }

        if (content.trim().length === 0) {
            alert("게시글 내용을 입력해주세요.");
            return;
        }

        if (imageFiles.length > 5) {
            alert("이미지는 최대 5개까지 업로드할 수 있습니다.");
            return;
        }

        let imageIds = [];
        for (const imageFile of imageFiles) {
            if (imageFile && imageFile.size > 0) {
                const imageUploadResponse = await ImageAPI.uploadPostImage(imageFile);
                const imageId = imageUploadResponse.data.imageId;
                if (imageId) {
                    imageIds.push(imageId);
                }
            }
        }

        try {
            await PostAPI.updatePost(postId, title, content, imageIds);
            alert("게시물이 성공적으로 수정되었습니다. 게시물 목록 페이지로 이동합니다.");
            window.location.href = "/posts";
        } catch (error) {
            console.error("게시물 수정 중 오류 발생:", error);
            alert("게시물 수정에 실패했습니다. 다시 시도해주세요.");
        }
    });
}

/** 게시물 수정 API 호출 및 데이터 처리 끝 */

/** 게시물 데이터 불러오기 시작 */

async function populatePostData() {
    if (!postEditForm) return;

    try {
        const response = await PostAPI.getPostById(postId);
        const post = response.data;
        const titleInput = document.getElementById("title");
        const contentTextarea = document.getElementById("content");
        if (titleInput) {
            titleInput.value = (post.title ?? "").slice(0, POST_TITLE_MAX_LENGTH);
        }
        if (contentTextarea) {
            const nextValue = (post.content ?? "").slice(0, POST_CONTENT_MAX_LENGTH);
            contentTextarea.value = nextValue;
            updateContentCounter();
        }
    } catch (error) {
        console.error("게시물 데이터 불러오기 실패:", error);
    } finally {
        /**
         * HTML이 먼저 로드되기 때문에 placeholder가 먼저 보이고 내용이 채워지는 현상을 막기 위해
         * 데이터를 불러온 후에 폼을 보이도록 처리함
         */
        postEditForm.style.display = "block";
    }
}

populatePostData();

/** 게시물 데이터 불러오기 끝 */

function attachTextareaLimiter(textarea, maxLength) {
    if (!textarea) {
        return {
            validateLength: () => true,
        };
    }

    textarea.setAttribute("maxlength", String(maxLength));

    const warningThreshold = Math.min(100, Math.floor(maxLength * 0.1));
    const counter = document.createElement("p");
    counter.className = "form-counter";
    counter.setAttribute("aria-live", "polite");
    textarea.insertAdjacentElement("afterend", counter);

    const updateCounter = () => {
        const currentLength = textarea.value.length;
        counter.textContent = `${currentLength} / ${maxLength}`;
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
    };
}

function attachInputLimiter(input, maxLength) {
    if (!input) {
        return {
            validateLength: () => true,
            updateCounter: () => {},
        };
    }

    input.setAttribute("maxlength", String(maxLength));

    let counter = input.parentElement?.querySelector(".form-counter");
    if (!counter) {
        counter = document.createElement("p");
        counter.className = "form-counter";
        counter.setAttribute("aria-live", "polite");
        input.insertAdjacentElement("afterend", counter);
    }

    const warningThreshold = Math.min(10, Math.floor(maxLength * 0.2));

    const updateCounter = () => {
        const currentLength = input.value.length;
        counter.textContent = `${currentLength} / ${maxLength}`;
        counter.classList.toggle("form-counter--warning", maxLength - currentLength <= warningThreshold);
    };

    input.addEventListener("input", () => {
        if (input.value.length > maxLength) {
            input.value = input.value.slice(0, maxLength);
        }
        updateCounter();
    });

    updateCounter();

    return {
        validateLength: (value) => (value?.length ?? 0) <= maxLength,
        updateCounter,
    };
}
