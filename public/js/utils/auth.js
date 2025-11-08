/**
 * Auth Manager
 * 인증 및 현재 사용자 정보 중앙 관리
 * 
 * 주요 기능:
 * - 현재 사용자 정보 캐싱 (공개 정보만)
 * - 로그인 상태 확인
 * - 인증 필수 페이지 보호
 * 
 * 보안 규칙:
 * - 민감 정보(토큰, 비밀번호)는 절대 캐시하지 않음
 * - 공개 프로필 정보만 로컬 스토리지에 저장
 */

import { storage } from "./storage.js";
import { config } from "../config.js";

const CURRENT_USER_KEY = "current_user";

/**
 * Auth Manager 객체
 */
export const auth = {
  /**
   * 캐시된 현재 사용자 정보 반환
   * @returns {Object|null} 사용자 정보 또는 null
   */
  getCurrentUser() {
    return storage.get(CURRENT_USER_KEY);
  },

  /**
   * /users/me API를 호출하여 현재 사용자 정보를 가져오고 캐시
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async fetchAndCacheCurrentUser() {
    try {
      // UserAPI를 동적으로 import하여 순환 참조 방지
      const { UserAPI } = await import("../api/users.js");
      
      const userData = await UserAPI.getCurrentUser();
      
      if (userData) {
        // 공개 정보만 캐시 (민감 정보 제외)
        const publicUserData = {
          userId: userData.userId,
          email: userData.email,
          nickname: userData.nickname,
          profileImageUrl: userData.profileImageUrl,
          createdAt: userData.createdAt,
        };
        
        storage.set(CURRENT_USER_KEY, publicUserData);
        return publicUserData;
      }
      
      return null;
    } catch (error) {
      console.warn("[Auth] Failed to fetch current user:", error);
      // 인증 실패 시 캐시 클리어
      this.clear();
      return null;
    }
  },

  /**
   * 로그인 여부 확인
   * @returns {boolean} 로그인 상태
   */
  isSignedIn() {
    return this.getCurrentUser() !== null;
  },

  /**
   * 로그인 필수 체크 (미로그인 시 로그인 페이지로 리다이렉트)
   * @returns {boolean} 로그인 상태
   */
  requireSignIn() {
    if (!this.isSignedIn()) {
      // 현재 페이지를 저장하여 로그인 후 돌아올 수 있도록 함
      const currentPath = window.location.pathname + window.location.search;
      storage.set("redirect_after_signin", currentPath);
      
      // 로그인 페이지로 리다이렉트
      window.location.href = config.ROUTES.SIGNIN;
      return false;
    }
    return true;
  },

  /**
   * 캐시 클리어 (로그아웃 시 호출)
   */
  clear() {
    storage.remove(CURRENT_USER_KEY);
    storage.remove("redirect_after_signin");
  }
};
