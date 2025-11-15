/**
 * Auth Manager
 * 인증 및 현재 사용자 정보 중앙 관리
 * 
 * 주요 기능:
 * - 현재 사용자 정보 조회 (항상 서버에서 최신 정보 가져옴)
 * - 로그인 상태 확인
 * - 인증 필수 페이지 보호
 * 
 * 보안 규칙:
 * - MPA 환경에서 매번 서버에서 최신 정보 조회
 * - 민감 정보(토큰, 비밀번호)는 절대 캐시하지 않음
 */

import { storage } from "./storage.js";
import { config } from "../config.js";

/**
 * Auth Manager 객체
 */
export const auth = {
  /**
   * 서버에서 현재 사용자 정보를 가져옴 (로그인 필수, 실패 시 리다이렉트)
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async requireAuth() {
    try {
      // UsersAPI를 동적으로 import하여 순환 참조 방지
      const { UsersAPI } = await import("../api/users.js");
      
      const response = await UsersAPI.getCurrent();
      
      if (response.status >= 200 && response.status < 300 && response.data) {
        return response.data;
      }
      
      // 인증 실패 시 로그인 페이지로 리다이렉트
      const currentPath = window.location.pathname + window.location.search;
      storage.set("redirect_after_signin", currentPath);
      window.location.href = config.ROUTES.SIGNIN;
      return null;
    } catch (error) {
      console.warn("[Auth] Authentication required but failed:", error);
      const currentPath = window.location.pathname + window.location.search;
      storage.set("redirect_after_signin", currentPath);
      window.location.href = config.ROUTES.SIGNIN;
      return null;
    }
  },

  /**
   * 서버에서 현재 사용자 정보를 가져옴 (로그인 선택, 실패 시 null 반환)
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async getAuthUser() {
    try {
      // UsersAPI를 동적으로 import하여 순환 참조 방지
      const { UsersAPI } = await import("../api/users.js");
      
      const response = await UsersAPI.getCurrent();
      
      if (response.status >= 200 && response.status < 300 && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.warn("[Auth] Failed to fetch current user:", error);
      return null;
    }
  },

  /**
   * 캐시 클리어 (로그아웃 시 호출)
   */
  clear() {
    storage.remove("redirect_after_signin");
  }
};
