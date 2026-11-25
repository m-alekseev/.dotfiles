const buffer = location.pathname.split("/").pop();
const stream = new EventSource("/preview-tab/" + buffer);
stream.addEventListener("reconnect", () => {
  window.socket?.io.engine?.close();
});

const page = document.querySelector("#__next");
let scale = 1;
let drag;
let suppressClick = false;

function sizePage() {
  page.style.width = scale === 1 ? "" : document.documentElement.clientWidth + "px";
}

function zoomAt(next, x, y) {
  if (next === scale) return;
  const ratio = next / scale;
  const left = (window.scrollX + x) * ratio - x;
  const top = (window.scrollY + y) * ratio - y;
  scale = next;
  sizePage();
  page.style.zoom = scale === 1 ? "" : String(scale);
  window.scrollTo({ left, top, behavior: "instant" });
}

window.addEventListener("resize", sizePage);
document.addEventListener("wheel", event => {
  if (!event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  event.preventDefault();
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
  const next = Math.max(1, Math.min(8, scale * Math.exp(-event.deltaY * unit / 500)));
  zoomAt(next, event.clientX, event.clientY);
}, { passive: false });

document.addEventListener("pointerdown", event => {
  suppressClick = false;
  if (scale === 1 || event.button !== 0 || event.pointerType !== "mouse") return;
  const image = event.target.closest(".markdown-body img, .markdown-body svg");
  if (image && !image.closest(".katex, .octicon")) {
    drag = { id: event.pointerId, image, x: event.clientX, y: event.clientY };
  }
});
document.addEventListener("dragstart", event => {
  if (drag) event.preventDefault();
});
window.addEventListener("pointermove", event => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!suppressClick && Math.hypot(dx, dy) < 4) return;
  suppressClick = true;
  if (!drag.image.isConnected) return;
  drag.image.setPointerCapture(event.pointerId);
  window.scrollBy({ left: -dx, top: -dy, behavior: "instant" });
  drag.x = event.clientX;
  drag.y = event.clientY;
});
function endDrag(event) {
  if (drag?.id === event.pointerId) drag = undefined;
}
window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);
document.addEventListener("click", event => {
  if (suppressClick && event.detail) {
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }
}, true);
document.addEventListener("keydown", event => {
  if (scale === 1 || event.key !== "0" || event.ctrlKey || event.metaKey || event.altKey || event.target.isContentEditable) return;
  zoomAt(1, window.innerWidth / 2, window.innerHeight / 2);
  event.preventDefault();
});
