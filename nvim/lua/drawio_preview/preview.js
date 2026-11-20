const diagram = document.querySelector("#diagram");
const select = document.querySelector("select");
const status = document.querySelector("[role=status]");
let pages = [];
let viewer;
let currentModel;
let currentKey;

function parse(xml) {
  const root = new DOMParser().parseFromString(xml, "application/xml").documentElement;
  if (root.localName === "parsererror" || root.querySelector("parsererror")) {
    throw new Error("Waiting for valid XML…");
  }
  return root;
}

function getPages(xml) {
  const root = parse(xml);
  if (root.localName === "mxGraphModel") {
    return [{ key: "0", name: "Page 1", node: root }];
  }
  const diagrams = [...root.children].filter(node => node.localName === "diagram");
  if (root.localName !== "mxfile" || diagrams.length === 0) {
    throw new Error("Waiting for a draw.io diagram…");
  }
  return diagrams.map((node, index) => ({
    key: node.getAttribute("id") || String(index),
    name: node.getAttribute("name") || ("Page " + (index + 1)),
    node,
  }));
}

function render(page) {
  let model = page.node;
  if (model.localName === "diagram") {
    model = model.firstElementChild || parse(Graph.decompress(model.textContent.trim()));
  }
  if (model.localName !== "mxGraphModel" || !model.querySelector("root")) {
    throw new Error("Waiting for a complete diagram page…");
  }

  // The codec indexes IDs across the XML document, so give each page its own document.
  const xml = new XMLSerializer().serializeToString(model);
  model = mxUtils.parseXml(xml).documentElement;
  if (viewer) {
    try {
      viewer.setGraphXml(model);
    } catch (error) {
      viewer.setGraphXml(currentModel);
      throw error;
    }
  } else {
    diagram.setAttribute("data-mxgraph", JSON.stringify({ xml, nav: false, lightbox: false, resize: false }));
    GraphViewer.createViewerForElement(diagram, instance => { viewer = instance; });
  }
  currentModel = model;
  currentKey = page.key;
}

function update(xml) {
  const nextPages = getPages(xml);
  const page = nextPages.find(item => item.key === select.value) || nextPages[0];
  render(page);
  pages = nextPages;
  select.replaceChildren(...pages.map(item => new Option(item.name, item.key)));
  select.value = page.key;
  select.hidden = pages.length < 2;
}

select.addEventListener("change", () => {
  const previous = currentKey;
  try {
    render(pages[select.selectedIndex]);
    status.textContent = "";
  } catch (error) {
    select.value = previous;
    status.textContent = error.message;
  }
});

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
  const pane = viewer?.graph.view.getDrawPane();
  if (!pane) return;
  const bounds = pane.getBoundingClientRect();
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

const diagrams = new EventSource("diagram");

diagrams.onmessage = event => {
  try {
    update(JSON.parse(event.data));
    status.textContent = "";
  } catch (error) {
    status.textContent = error.message;
  }
};

diagrams.onerror = () => {
  status.textContent = "Disconnected from Neovim";
};
