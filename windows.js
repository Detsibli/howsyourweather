document.addEventListener("DOMContentLoaded", () => {
  const draggableWindows = document.querySelectorAll('.draggable');
  let topZ = 1000; // starting z-index
  const isMobile = window.innerWidth <= 768;

  draggableWindows.forEach(win => {
    // Reset positioning if stacked on mobile
    if (isMobile) {
      win.style.top = "auto";
      win.style.left = "auto";
      win.style.position = "relative";
    }
    makeDraggable(win);
  });

  function makeDraggable(elmnt) {
    const header = elmnt.querySelector('.title-bar') || elmnt;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    // Bring to front on click/tap
    elmnt.addEventListener('mousedown', bringToFront);
    elmnt.addEventListener('touchstart', bringToFront, { passive: true });

    // Enable dragging only if desktop/tablet
    if (!isMobile) {
      header.addEventListener('mousedown', dragMouseDown);
      header.addEventListener('touchstart', dragTouchStart, { passive: false });
    }

    function bringToFront(e) {
      if (e.target.tagName.toLowerCase() === 'button') return;
      topZ += 1;
      elmnt.style.zIndex = topZ;
    }

    // --- Mouse Drag ---
    function dragMouseDown(e) {
      if (e.target.tagName.toLowerCase() === 'button') return;
      e.preventDefault();
      bringToFront(e);

      pos3 = e.clientX;
      pos4 = e.clientY;

      document.addEventListener('mousemove', elementDrag);
      document.addEventListener('mouseup', closeDragElement);
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.removeEventListener('mousemove', elementDrag);
      document.removeEventListener('mouseup', closeDragElement);
    }

    // --- Touch Drag ---
    function dragTouchStart(e) {
      if (e.target.tagName.toLowerCase() === 'button') return;
      if (e.touches.length !== 1) return;
      e.preventDefault();

      bringToFront(e);

      pos3 = e.touches[0].clientX;
      pos4 = e.touches[0].clientY;

      document.addEventListener('touchmove', elementTouchDrag, { passive: false });
      document.addEventListener('touchend', closeTouchDrag);
    }

    function elementTouchDrag(e) {
      if (e.touches.length !== 1) return;
      e.preventDefault();

      pos1 = pos3 - e.touches[0].clientX;
      pos2 = pos4 - e.touches[0].clientY;
      pos3 = e.touches[0].clientX;
      pos4 = e.touches[0].clientY;

      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeTouchDrag() {
      document.removeEventListener('touchmove', elementTouchDrag);
      document.removeEventListener('touchend', closeTouchDrag);
    }
  }
});
