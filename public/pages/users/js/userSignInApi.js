import { UserAPI } from "/js/api/users.js";

/** 로그인 API 호출 및 데이터 처리 시작 */
const signInForm = document.getElementById("sign-in-form");

signInForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(signInForm);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
        const response = await UserAPI.signIn(email, password);
        const data = response.data;
        localStorage.setItem("profileImageUrl", data.profileImageUrl || "");
        alert("로그인에 성공했습니다. 메인 페이지로 이동합니다.");
        window.location.href = "/posts";
    } catch (error) {
        console.error("로그인 중 오류 발생:", error);
        alert("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    }
});

/** 로그인 API 호출 및 데이터 처리 끝 */