/**
 * Header Component
 * 공통 헤더 로드 및 초기화
 */

import { dom } from '../utils/dom.js';
import { events } from '../utils/events.js';
import { navigation } from '../utils/navigation.js';
import { auth } from '../utils/auth.js';
import { UsersAPI } from '../api/users.js';
import { Modal } from './modal.js';

/**
 * 헤더 초기화
 * @param {string} pageId - 페이지 식별자 (이벤트 정리용)
 * @returns {Promise<void>}
 */
export async function initHeader(pageId) {
  const headerContainer = dom.qs('header');
  
  if (!headerContainer) {
    console.warn('Header container not found');
    return;
  }

  // header.html 로드
  try {
    const headerHTML = await dom.loadComponent('/components/header.html');
    headerContainer.innerHTML = headerHTML;
  } catch (error) {
    console.error('Failed to load header:', error);
    return;
  }

  // 뒤로가기 버튼 설정
  const backBtn = dom.qs('.back-btn', headerContainer);
  if (backBtn) {
    events.on(backBtn, 'click', (e) => {
      e.preventDefault();
      navigation.goBack();
    }, { pageId });
  }

  // 프로필 드롭다운 초기화
  const profileBtn = dom.qs('.profile-btn', headerContainer);
  const profileDropdown = dom.qs('.profile-dropdown', headerContainer);
  
  if (profileBtn && profileDropdown) {
    // 프로필 버튼 클릭
    events.on(profileBtn, 'click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    }, { pageId });

    // 드롭다운 외부 클릭 시 닫기
    events.on(document, 'click', (e) => {
      if (!headerContainer.contains(e.target)) {
        closeDropdown();
      }
    }, { pageId });

    // ESC 키로 드롭다운 닫기
    events.on(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        closeDropdown();
      }
    }, { pageId });
  }

  // 로그아웃 버튼 설정
  const logoutBtn = dom.qs('.logout-btn', headerContainer);
  if (logoutBtn) {
    events.on(logoutBtn, 'click', handleLogout, { pageId });
  }

  // 드롭다운 토글
  function toggleDropdown() {
    const isExpanded = profileBtn.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  // 드롭다운 열기
  function openDropdown() {
    profileBtn.setAttribute('aria-expanded', 'true');
    profileDropdown.setAttribute('aria-hidden', 'false');
    profileDropdown.style.display = 'block';
    
    // 첫 번째 메뉴 항목에 포커스
    const firstItem = profileDropdown.querySelector('a, button');
    if (firstItem) {
      firstItem.focus();
    }
  }

  // 드롭다운 닫기
  function closeDropdown() {
    profileBtn.setAttribute('aria-expanded', 'false');
    profileDropdown.setAttribute('aria-hidden', 'true');
    profileDropdown.style.display = 'none';
  }

  // 로그아웃 처리
  async function handleLogout(e) {
    e.preventDefault();
    
    const confirmed = await Modal.confirm('로그아웃', '로그아웃 하시겠습니까?');
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await UsersAPI.signOut();
      
      if (response.status >= 200 && response.status < 300) {
        // 인증 정보 클리어
        auth.clear();
        
        // 로그인 페이지로 이동
        navigation.goTo('/users/signin');
      } else {
        await Modal.alert('오류', response.error?.message || '로그아웃에 실패했습니다.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      await Modal.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    }
  }
}
