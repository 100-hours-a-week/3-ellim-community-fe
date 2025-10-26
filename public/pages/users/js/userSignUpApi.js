import { UserAPI } from "/js/api/users.js";
import { ImageAPI } from "/js/api/images.js";
import { setupProfileImageField } from "/js/ui/profileImagePreview.js";

let profileImageId = null;

const imageInput = document.getElementById("profileImage");

if (imageInput) {
    imageInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) {return;}

        try {
            if (!file.type.startsWith("image/")) {
                throw new Error("이미지 파일만 업로드할 수 있습니다.");
            }
            
            const response = await ImageAPI.uploadProfileImage(file);

            profileImageId = response.data.imageId;
        } catch (error) {
            alert("프로필 이미지 업로드에 실패했습니다. 다시 시도해주세요.");
        }
    });
}

/** 회원가입 API 호출 및 데이터 처리 시작 */

const signUpForm = document.getElementById("sign-up-form");
setupProfileImageField({
    inputId: "profileImage",
    previewId: "profileImagePreview",
    triggerId: "profileImageTrigger",
});

signUpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(signUpForm);
    const nickname = formData.get("nickname");
    const email = formData.get("email");
    const password = formData.get("password");
    const password2 = formData.get("password2");

    try {
        await UserAPI.signUp(email, password, password2, nickname, profileImageId);
        alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
        window.location.href = "/users/signin";
    } catch (error) {
        console.error("회원가입 중 오류 발생:", error);
        alert("회원가입에 실패했습니다. 다시 시도해주세요.");
    }
});

/** 회원가입 API 호출 및 데이터 처리 끝 */
