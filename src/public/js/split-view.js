/**
 * split-view.js
 * Maneja el drag (Touch & Mouse) para la barra divisora (resizer)
 * entre el panel superior (calendario) y el inferior (agenda).
 */

document.addEventListener('DOMContentLoaded', () => {
  const resizer = document.getElementById('split-resizer');
  const topPane = document.getElementById('split-top');
  const bottomPane = document.getElementById('split-bottom');
  
  if (!resizer || !topPane || !bottomPane) return;

  let isResizing = false;
  let startY;
  let startTopHeight;
  let containerHeight;

  // Initial calculation
  const container = resizer.parentElement;

  const onDragStart = (y) => {
    isResizing = true;
    startY = y;
    startTopHeight = topPane.getBoundingClientRect().height;
    containerHeight = container.getBoundingClientRect().height;
    
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
  };

  const onDragMove = (y) => {
    if (!isResizing) return;
    const dy = y - startY;
    let newTopHeight = startTopHeight + dy;
    
    // Convert to percentage
    let newFlexBasis = (newTopHeight / containerHeight) * 100;
    
    // Constraints (allow full screen top or bottom, but protect resizer visibility)
    // Keep at least 0% for top (agenda full screen).
    // Keep max to (containerHeight - 16px) so the 16px resizer doesn't overflow behind the bottom nav.
    let maxFlex = ((containerHeight - 20) / containerHeight) * 100;
    
    if (newFlexBasis < 0) newFlexBasis = 0;
    if (newFlexBasis > maxFlex) newFlexBasis = maxFlex;

    topPane.style.flex = `0 0 ${newFlexBasis}%`;
  };

  const onDragEnd = () => {
    isResizing = false;
    document.body.style.userSelect = '';
  };

  // --- Mouse Events ---
  resizer.addEventListener('mousedown', (e) => {
    onDragStart(e.clientY);
  });
  
  document.addEventListener('mousemove', (e) => {
    onDragMove(e.clientY);
  });
  
  document.addEventListener('mouseup', onDragEnd);

  // --- Touch Events ---
  resizer.addEventListener('touchstart', (e) => {
    onDragStart(e.touches[0].clientY);
  }, { passive: false });
  
  document.addEventListener('touchmove', (e) => {
    if (isResizing) {
      onDragMove(e.touches[0].clientY);
    }
  }, { passive: false });
  
  document.addEventListener('touchend', onDragEnd);
  
  // Double click/tap to toggle fullscreen
  let lastTap = 0;
  resizer.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      toggleMaximize();
    }
    lastTap = currentTime;
  });
  
  resizer.addEventListener('dblclick', () => {
    toggleMaximize();
  });

  let isMaximized = false;
  function toggleMaximize() {
    if (isMaximized) {
      topPane.style.flex = '0 0 55%';
      isMaximized = false;
    } else {
      const cHeight = container.getBoundingClientRect().height;
      const maxFlex = ((cHeight - 20) / cHeight) * 100;
      topPane.style.flex = `0 0 ${maxFlex}%`;
      isMaximized = true;
    }
  }
});
