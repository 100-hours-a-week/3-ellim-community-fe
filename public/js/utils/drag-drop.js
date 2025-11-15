/**
 * Drag and Drop Utility
 * 드래그 앤 드롭으로 리스트 아이템 순서 변경 기능 제공
 * PC (마우스) 및 모바일 (터치) 지원
 */

import { events } from "./events.js";

/**
 * 드래그 가능한 리스트 생성
 * @param {Object} options - 설정 옵션
 * @param {HTMLElement} options.container - 리스트 컨테이너 요소
 * @param {Function} options.getItems - 현재 아이템 배열을 반환하는 함수
 * @param {Function} options.onReorder - 순서 변경 시 콜백 (oldIndex, newIndex) => void
 * @param {Function} options.onRender - 리렌더링 요청 콜백 () => void
 * @param {string} options.pageId - 페이지 ID (이벤트 관리용)
 * @param {string} options.itemSelector - 드래그 가능한 아이템 선택자 (기본: '[data-index]')
 * @returns {Object} - { destroy: Function }
 */
export function createDraggableList(options) {
  const {
    container,
    getItems,
    onReorder,
    onRender,
    pageId,
    itemSelector = '[data-index]'
  } = options;

  if (!container || !getItems || !onReorder || !onRender || !pageId) {
    throw new Error('createDraggableList: Required options missing');
  }

  // 드래그 상태
  let draggedIndex = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchedElement = null;

  /**
   * 드래그 시작 핸들러 (PC)
   */
  function handleDragStart(event) {
    draggedIndex = parseInt(event.currentTarget.getAttribute("data-index"), 10);
    event.currentTarget.style.opacity = "0.5";
    event.dataTransfer.effectAllowed = "move";
  }

  /**
   * 드래그 오버 핸들러 (PC)
   */
  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    
    const targetItem = event.currentTarget;
    const targetIndex = parseInt(targetItem.getAttribute("data-index"), 10);
    
    if (targetItem && draggedIndex !== null && draggedIndex !== targetIndex) {
      // 모든 border 초기화
      const allItems = container.querySelectorAll(itemSelector);
      allItems.forEach(item => {
        item.style.borderLeft = "";
        item.style.backgroundColor = "";
      });
      
      // 타겟에 시각적 피드백
      targetItem.style.borderLeft = "3px solid #0d6efd";
      targetItem.style.backgroundColor = "rgba(13, 110, 253, 0.1)";
    }
  }

  /**
   * 드롭 핸들러 (PC)
   */
  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const targetIndex = parseInt(event.currentTarget.getAttribute("data-index"), 10);
    
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      console.log(`드래그 앤 드롭 순서 변경: ${draggedIndex} → ${targetIndex}`);
      
      // 순서 변경 콜백 호출
      onReorder(draggedIndex, targetIndex);
      
      // 리렌더링 요청
      onRender();
    }
    
    // 스타일 초기화
    event.currentTarget.style.borderLeft = "";
    event.currentTarget.style.backgroundColor = "";
  }

  /**
   * 드래그 종료 핸들러 (PC)
   */
  function handleDragEnd(event) {
    event.currentTarget.style.opacity = "1";
    
    const allItems = container.querySelectorAll(itemSelector);
    allItems.forEach(item => {
      item.style.borderLeft = "";
      item.style.backgroundColor = "";
    });
    
    draggedIndex = null;
  }

  /**
   * 터치 시작 핸들러 (모바일)
   */
  function handleTouchStart(event) {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchedElement = event.currentTarget;
    draggedIndex = parseInt(touchedElement.getAttribute("data-index"), 10);
    touchedElement.style.opacity = "0.5";
    touchedElement.style.zIndex = "1000";
  }

  /**
   * 터치 이동 핸들러 (모바일)
   */
  function handleTouchMove(event) {
    if (!touchedElement) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    
    // 터치된 요소를 손가락 위치로 이동
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    touchedElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    touchedElement.style.transition = "none";
    
    // 현재 터치 위치 아래의 요소 찾기
    touchedElement.style.pointerEvents = "none";
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    touchedElement.style.pointerEvents = "auto";
    
    const targetItem = elementBelow?.closest(itemSelector);
    
    // 모든 border 초기화
    const allItems = container.querySelectorAll(itemSelector);
    allItems.forEach(item => {
      if (item !== touchedElement) {
        item.style.borderLeft = "";
        item.style.backgroundColor = "";
      }
    });
    
    // 타겟 아이템에 시각적 피드백만 제공
    if (targetItem && targetItem !== touchedElement) {
      targetItem.style.borderLeft = "3px solid #0d6efd";
      targetItem.style.backgroundColor = "rgba(13, 110, 253, 0.1)";
      
      // 현재 타겟 인덱스 저장
      const targetIndex = parseInt(targetItem.getAttribute("data-index"), 10);
      touchedElement.dataset.targetIndex = targetIndex;
    } else {
      delete touchedElement.dataset.targetIndex;
    }
  }

  /**
   * 터치 종료 핸들러 (모바일)
   */
  function handleTouchEnd(event) {
    if (!touchedElement) return;
    
    // 터치 종료 시점에 순서 변경
    const targetIndex = touchedElement.dataset.targetIndex;
    if (targetIndex !== undefined && draggedIndex !== null) {
      const finalTargetIndex = parseInt(targetIndex, 10);
      
      if (draggedIndex !== finalTargetIndex) {
        console.log(`터치 순서 변경: ${draggedIndex} → ${finalTargetIndex}`);
        
        // 순서 변경 콜백 호출
        onReorder(draggedIndex, finalTargetIndex);
      }
    }
    
    // 스타일 초기화
    touchedElement.style.opacity = "1";
    touchedElement.style.transform = "";
    touchedElement.style.zIndex = "";
    touchedElement.style.transition = "";
    touchedElement.style.pointerEvents = "auto";
    delete touchedElement.dataset.targetIndex;
    
    const allItems = container.querySelectorAll(itemSelector);
    allItems.forEach(item => {
      item.style.borderLeft = "";
      item.style.backgroundColor = "";
    });
    
    touchedElement = null;
    draggedIndex = null;
    
    // 리렌더링 요청
    onRender();
  }

  /**
   * 아이템에 드래그 이벤트 바인딩
   * @param {HTMLElement} item - 드래그 가능한 아이템
   * @param {boolean} isDraggable - 드래그 가능 여부
   */
  function bindDragEvents(item, isDraggable = true) {
    if (!isDraggable) return;

    // PC 드래그 이벤트
    events.on(item, "dragstart", handleDragStart, { pageId });
    events.on(item, "dragover", handleDragOver, { pageId });
    events.on(item, "drop", handleDrop, { pageId });
    events.on(item, "dragend", handleDragEnd, { pageId });
    
    // 모바일 터치 이벤트
    events.on(item, "touchstart", handleTouchStart, { pageId });
    events.on(item, "touchmove", handleTouchMove, { pageId });
    events.on(item, "touchend", handleTouchEnd, { pageId });
  }

  /**
   * 컨테이너의 모든 아이템에 이벤트 바인딩
   */
  function attachEvents() {
    const items = container.querySelectorAll(itemSelector);
    items.forEach(item => {
      const isDraggable = item.getAttribute("draggable") === "true";
      bindDragEvents(item, isDraggable);
    });
  }

  /**
   * 정리 함수
   */
  function destroy() {
    // 모든 이벤트 제거는 events.removeAllForPage(pageId)로 처리됨
    draggedIndex = null;
    touchedElement = null;
  }

  // 공개 API
  return {
    attachEvents,
    destroy
  };
}
