import { initDropdown } from './dropdown.js';
import { UserAPI } from '/js/api/users.js';

function loadHeader(){
    return fetch('/components/header.html')
        .then(response => response.text())
        .then(data => {
            document.querySelector('header').outerHTML = data;
        });
}

document.addEventListener('DOMContentLoaded', () => {
    loadHeader().
        then(() => {
            initDropdown('.profile-btn', '.profile-dropdown');

            const logoutBtn = document.querySelector('.logout-btn');

            logoutBtn.addEventListener('click', async (event) => {
                event.preventDefault();
                try {
                    await UserAPI.signOut();
                    window.location.href = '/users/signin';
                } catch (error) {
                    console.error('로그아웃 중 오류 발생:', error);
                    alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
                }
            }); 
        });    
});