const viewport = document.querySelector("#viewport");
const canvas = document.querySelector("#canvas");
let scale = 1;
let panX = 0;
let panY = 0;
let drag;
let suppressClick = false;

function moveCanvas() {
  canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

window.addEventListener("keydown", event => {
  if (event.key !== "0" || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  const svg = canvas.querySelector("svg");
  if (!svg) return;
  const box = svg.viewBox.baseVal;
  const matrix = svg.getScreenCTM();
  if (!matrix) return;
  const start = new DOMPoint(box.x, box.y).matrixTransform(matrix);
  const end = new DOMPoint(box.x + box.width, box.y + box.height).matrixTransform(matrix);
  const bounds = new DOMRect(start.x, start.y, end.x - start.x, end.y - start.y);
  const frame = viewport.getBoundingClientRect();
  if (!bounds.width || !bounds.height || !frame.width || !frame.height) return;

  const ratio = Math.min(frame.width / bounds.width, frame.height / bounds.height);
  panX = (frame.width - bounds.width * ratio) / 2 - (bounds.left - frame.left - panX) * ratio;
  panY = (frame.height - bounds.height * ratio) / 2 - (bounds.top - frame.top - panY) * ratio;
  scale *= ratio;
  moveCanvas();
  event.preventDefault();
});

viewport.addEventListener("wheel", event => {
  event.preventDefault();
  const { left, top, height } = viewport.getBoundingClientRect();
  const x = event.clientX - left;
  const y = event.clientY - top;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
  const nextScale = Math.max(0.1, Math.min(8, scale * Math.exp(-event.deltaY * unit / 500)));
  const ratio = nextScale / scale;
  panX = x - (x - panX) * ratio;
  panY = y - (y - panY) * ratio;
  scale = nextScale;
  moveCanvas();
}, { passive: false });

viewport.addEventListener("pointerdown", event => {
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  suppressClick = false;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
});

window.addEventListener("pointermove", event => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!suppressClick) {
    if (Math.hypot(dx, dy) < 4) return;
    suppressClick = true;
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("panning");
  }
  panX += dx;
  panY += dy;
  drag.x = event.clientX;
  drag.y = event.clientY;
  moveCanvas();
});

function endDrag(event) {
  if (!drag || event.pointerId !== drag.id) return;
  drag = undefined;
  viewport.classList.remove("panning");
}

window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);
viewport.addEventListener("lostpointercapture", endDrag);
viewport.addEventListener("dragstart", event => event.preventDefault());
viewport.addEventListener("click", event => {
  if (!suppressClick || event.detail === 0) return;
  event.preventDefault();
  event.stopPropagation();
  suppressClick = false;
}, true);

const status = document.querySelector("[role=status]");
const stream = new EventSource("diagram");

stream.onmessage = event => {
  const { svg, err } = JSON.parse(event.data);
  if (svg) {
    const root = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
    const drawing = root.querySelector(".d2-svg") || root;
    canvas.replaceChildren(drawing);
  }
  status.textContent = err || "";
};

stream.onerror = () => { status.textContent = "Disconnected from D2"; };
