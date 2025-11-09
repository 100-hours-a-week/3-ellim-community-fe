/**
 * LocalStorage Manager
 * 로컬 스토리지를 안전하게 관리하는 유틸리티 모듈
 * 
 * 주요 기능:
 * - 자동 네임스페이스 (prefix) 추가
 * - JSON 자동 직렬화/역직렬화
 * - 에러 안전 처리
 * 
 * 보안 규칙:
 * - 절대 저장 금지: 액세스 토큰, 리프레시 토큰, 비밀번호
 * - 저장 가능: 현재 사용자 공개 프로필 데이터, UI 상태, 비민감 설정
 */

import { config } from "../config.js";

/**
 * 키에 prefix를 추가하여 네임스페이스 생성
 * @param {string} key - 원본 키
 * @returns {string} prefix가 추가된 키
 */
function getPrefixedKey(key) {
  return `${config.STORAGE_PREFIX}${key}`;
}

/**
 * LocalStorage Manager 객체
 */
export const storage = {
  /**
   * 데이터를 로컬 스토리지에 저장
   * @param {string} key - 저장할 키
   * @param {any} value - 저장할 값 (자동으로 JSON 직렬화됨)
   * @returns {boolean} 성공 여부
   */
  set(key, value) {
    try {
      const prefixedKey = getPrefixedKey(key);
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(prefixedKey, serializedValue);
      return true;
    } catch (error) {
      console.warn(`[Storage] Failed to set item "${key}":`, error);
      return false;
    }
  },

  /**
   * 로컬 스토리지에서 데이터 조회
   * @param {string} key - 조회할 키
   * @returns {any|null} 저장된 값 (자동으로 JSON 역직렬화됨) 또는 null
   */
  get(key) {
    try {
      const prefixedKey = getPrefixedKey(key);
      const serializedValue = localStorage.getItem(prefixedKey);
      
      if (serializedValue === null) {
        return null;
      }
      
      return JSON.parse(serializedValue);
    } catch (error) {
      console.warn(`[Storage] Failed to get item "${key}":`, error);
      return null;
    }
  },

  /**
   * 로컬 스토리지에서 데이터 삭제
   * @param {string} key - 삭제할 키
   * @returns {boolean} 성공 여부
   */
  remove(key) {
    try {
      const prefixedKey = getPrefixedKey(key);
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.warn(`[Storage] Failed to remove item "${key}":`, error);
      return false;
    }
  },

  /**
   * 앱 관련 데이터 전체 삭제 (prefix가 있는 항목만)
   * @returns {boolean} 성공 여부
   */
  clear() {
    try {
      const keysToRemove = [];
      
      // prefix가 있는 키만 찾기
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(config.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      // 찾은 키들 삭제
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      return true;
    } catch (error) {
      console.warn("[Storage] Failed to clear storage:", error);
      return false;
    }
  },

  /**
   * 데이터 존재 여부 확인
   * @param {string} key - 확인할 키
   * @returns {boolean} 존재 여부
   */
  has(key) {
    try {
      const prefixedKey = getPrefixedKey(key);
      return localStorage.getItem(prefixedKey) !== null;
    } catch (error) {
      console.warn(`[Storage] Failed to check item "${key}":`, error);
      return false;
    }
  }
};
