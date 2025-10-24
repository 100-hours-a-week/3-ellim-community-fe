import { PostAPI } from "/js/api/posts.js";
import { ImageAPI } from "/js/api/images.js";

const POST_TITLE_MAX_LENGTH = 26;
const POST_CONTENT_MAX_LENGTH = 5000;

/** 게시물 작성 API 호출 및 데이터 처리 시작 */

const postCreateForm = document.getElementById("post-create-form");

if (postCreateForm) {
    const titleInput = postCreateForm.querySelector("#title");
    const contentTextarea = postCreateForm.querySelector("#content");
    const { validateLength: validateTitleLength } = attachInputLimiter(titleInput, POST_TITLE_MAX_LENGTH);
    const { validateLength: validateContentLength } = attachTextareaLimiter(contentTextarea, POST_CONTENT_MAX_LENGTH);

    postCreateForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(postCreateForm);
        const title = formData.get("title");
        const content = formData.get("content") ?? "";
        const imageFiles = formData.getAll("postImages");

        if (!validateTitleLength(title ?? "")) {
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
            await PostAPI.createPost(title, content, imageIds);
            alert("게시물이 성공적으로 작성되었습니다. 게시물 목록 페이지로 이동합니다.");
            window.location.href = "/posts";
        } catch (error) {
            console.error("게시물 작성 중 오류 발생:", error);
            alert("게시물 작성에 실패했습니다. 다시 시도해주세요.");
        }
    });
}

/** 게시물 작성 API 호출 및 데이터 처리 끝 */

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
    };
}

function attachInputLimiter(input, maxLength) {
    if (!input) {
        return {
            validateLength: () => true,
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
    };
}
