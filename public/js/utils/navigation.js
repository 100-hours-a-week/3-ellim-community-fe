/**
 * Navigation Manager
 * 안전한 페이지 네비게이션 제공
 * 
 * 외부 사이트로의 의도하지 않은 이동을 방지하고,
 * 일관된 네비게이션 인터페이스를 제공합니다.
 */

import { config } from "../config.js";

/**
 * URL이 내부 URL인지 확인
 * @param {string} url - 확인할 URL
 * @returns {boolean} 내부 URL이면 true
 */
function isInternalUrl(url) {
  if (!url) return false;

  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin === window.location.origin;
  } catch (e) {
    // 상대 경로인 경우 내부 URL로 간주
    return !url.startsWith("http://") && !url.startsWith("https://");
  }
}

/**
 * 안전한 뒤로가기
 * document.referrer를 확인하여 외부 사이트로 이동하는 것을 방지
 */
function goBack() {
  const referrer = document.referrer;

  // referrer가 없거나 외부 URL인 경우 홈으로 이동
  if (!referrer || !isInternalUrl(referrer)) {
    goTo(config.ROUTES.HOME);
    return;
  }

  // 내부 URL인 경우 뒤로가기
  window.history.back();
}

/**
 * 지정된 경로로 이동
 * @param {string} path - 이동할 경로
 */
function goTo(path) {
  if (!path) {
    console.warn("Navigation: Invalid path provided");
    return;
  }

  window.location.href = path;
}

/**
 * 현재 경로 반환
 * @returns {string} 현재 경로
 */
function getCurrentPath() {
  return window.location.pathname;
}

export const navigation = {
  goBack,
  goTo,
  isInternalUrl,
  getCurrentPath,
};
