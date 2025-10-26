import { UserAPI } from "/js/api/users.js";

/** 비밀번호 수정 API 호출 및 데이터 처리 시작 */
const passwordEditForm = document.getElementById("user-edit-password-form");

passwordEditForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(passwordEditForm);
    const newPassword = formData.get("newPassword");
    const newPassword2 = formData.get("newPassword2");

    try {
        await UserAPI.updateCurrentUserPassword(newPassword, newPassword2);
        alert("비밀번호가 성공적으로 수정되었습니다.");
        window.location.href = "/users/signin";
    } catch (error) {
        console.error("비밀번호 수정 중 오류 발생:", error);
        alert("비밀번호 수정에 실패했습니다. 다시 시도해주세요.");
    }
});

/** 비밀번호 수정 API 호출 및 데이터 처리 끝 */