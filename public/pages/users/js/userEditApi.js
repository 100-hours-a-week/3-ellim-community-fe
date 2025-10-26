import { UserAPI } from "/js/api/users.js";
import { ImageAPI } from "/js/api/images.js";
import { setupProfileImageField, setProfileImagePreview } from "/js/ui/profileImagePreview.js";

/** 회원 정보 수정 API 호출 및 데이터 처리 시작 */

const userEditForm = document.getElementById("user-edit-form");

setupProfileImageField({
    inputId: "profileImage",
    previewId: "profileImagePreview",
    triggerId: "profileImageTrigger",
});

userEditForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(userEditForm);
    const nickname = formData.get("nickname");
    const profileImageFile = formData.get("profileImage");
    let profileImageId = null;
    if (profileImageFile && profileImageFile.size > 0) {
        const imageUploadResponse = await ImageAPI.uploadProfileImage(profileImageFile);
        profileImageId = imageUploadResponse.data.imageId ?? null;
    }
    try {
        const updateResponse = await UserAPI.updateCurrentUser(nickname, profileImageId);
        localStorage.setItem("profileImageUrl", updateResponse.data.profileImageUrl ?? "");
        alert("회원 정보가 성공적으로 수정되었습니다.");
        window.location.href = "/posts";
    } catch (error) {
        console.error("회원 정보 수정 중 오류 발생:", error);
        alert("회원 정보 수정에 실패했습니다. 다시 시도해주세요.");
    }
});

/** 회원 정보 수정 API 호출 및 데이터 처리 끝 */

/** 회원 데이터 불러오기 시작 */

async function populateUserData() {
    try {
        const response = await UserAPI.getCurrentUser();
        const user = response.data;
        document.getElementById("nickname").value = user.nickname;
        if (user.profileImageUrl) {
            setProfileImagePreview("profileImage", user.profileImageUrl);
        }
    } catch (error) {
        console.error("회원 데이터 불러오기 실패:", error);
    } finally {
        /**
         * HTML이 먼저 로드되기 때문에 placeholder가 먼저 보이고 내용이 채워지는 현상을 막기 위해
         * 데이터를 불러온 후에 폼을 보이도록 처리함
         */
        userEditForm.style.display = "block";
    }
}  

populateUserData();

/** 회원 데이터 불러오기 끝 */

/** 회원 탈퇴 API 호출 및 데이터 처리 시작 */

const userDeleteButton = document.getElementById("user-delete-button");
userDeleteButton.addEventListener("click", async () => {

    /**
     * 현재는 간단히 confirm 창으로만 확인하지만,
     * 추후 모달 창이나 별도의 입력 폼을 통해 수정할 수 있도록 개선 예정
     */

    if (!confirm("정말로 회원 탈퇴를 진행하시겠습니까?")) return;
    try {
        await UserAPI.deleteCurrentUser();
        alert("회원 탈퇴가 완료되었습니다. 로그인 페이지로 이동합니다.");
        window.location.href = "/users/signin";
    } catch (error) {
        console.error("회원 탈퇴 중 오류 발생:", error);
        alert("회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
    }
});

/** 회원 탈퇴 API 호출 및 데이터 처리 끝 */
