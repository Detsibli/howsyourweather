document.addEventListener("DOMContentLoaded", () => {
  const draggableWindows = document.querySelectorAll('.draggable');
  let topZ = 1000; // starting z-index for windows

  draggableWindows.forEach(win => {
    makeDraggable(win);
  });

  function makeDraggable(elmnt) {
    const header = elmnt.querySelector('.title-bar') || elmnt;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    // Bring to front on click anywhere in the window
    elmnt.addEventListener('mousedown', bringToFront);

    // Only drag when clicking the title bar
    header.addEventListener('mousedown', dragMouseDown);

    function bringToFront(e) {
      // Ignore clicks on buttons
      if (e.target.tagName.toLowerCase() === 'button') return;
      topZ += 1;
      elmnt.style.zIndex = topZ;
    }

    function dragMouseDown(e) {
      if (e.target.tagName.toLowerCase() === 'button') return;
      e.preventDefault();

      bringToFront(e); // ensure dragged window is on top

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
  }
});
