/**
 * Footer Component
 * 공통 푸터 로드 및 초기화
 */

import { dom } from '../utils/dom.js';

/**
 * 푸터 초기화
 * @returns {Promise<void>}
 */
export async function initFooter() {
  const footerContainer = dom.qs('footer');
  
  if (!footerContainer) {
    console.warn('Footer container not found');
    return;
  }

  // footer.html 로드
  try {
    const footerHTML = await dom.loadComponent('/components/footer.html');
    footerContainer.innerHTML = footerHTML;
  } catch (error) {
    console.error('Failed to load footer:', error);
    return;
  }
}
