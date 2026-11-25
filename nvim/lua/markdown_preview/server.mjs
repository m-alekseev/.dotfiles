import http from "node:http";
import net from "node:net";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

const port = Number(process.argv[2]);
const rendererPid = Number(process.argv[3]);
const host = "127.0.0.1";
const script = readFileSync(new URL("controls.js", import.meta.url));
const tabs = new Map();
let timeout;
let origin;

function expireAfter(ms) {
  clearTimeout(timeout);
  if (!tabs.size) timeout = setTimeout(() => process.exit(0), ms);
}

function localRequest(req) {
  return req.headers.host === new URL(origin).host &&
    (!req.headers.origin || req.headers.origin === origin);
}

const server = http.createServer((req, res) => {
  if (!localRequest(req)) {
    res.writeHead(403).end();
    return;
  }
  if (req.url === "/preview-controls.js") {
    res.writeHead(200, { "Content-Type": "text/javascript" }).end(script);
    return;
  }
  const tab = /^\/preview-tab\/(\d+)$/.exec(req.url);
  if (tab) {
    clearTimeout(timeout);
    const buffer = tab[1];
    tabs.set(res, buffer);
    console.log(`1 ${buffer}`);
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store" });
    res.write(": connected\n\n");
    res.on("close", () => {
      tabs.delete(res);
      // The renderer drops every same-buffer socket from its update list on a disconnect.
      let stillOpen = false;
      for (const [peer, peerBuffer] of tabs) {
        if (peerBuffer === buffer) {
          stillOpen = true;
          peer.write("event: reconnect\ndata: {}\n\n");
        }
      }
      if (!stillOpen) console.log(`0 ${buffer}`);
      expireAfter(2500);
    });
    return;
  }
  if (/^\/\d+$/.test(req.url)) {
    res.writeHead(302, { Location: "/page" + req.url }).end();
    return;
  }
  const page = /^\/page\/\d+(?:\?.*)?$/.test(req.url);
  if (page) expireAfter(30000);
  const upstream = http.request({ host, port, path: req.url, method: req.method,
    headers: { ...req.headers, "accept-encoding": "identity" } }, response => {
    res.on("close", () => response.destroy());
    if (!page || response.statusCode !== 200) {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
      return;
    }
    const chunks = [];
    response.on("data", chunk => chunks.push(chunk));
    response.on("end", () => {
      const html = Buffer.concat(chunks).toString().replace("</head>",
        '<script defer src="/preview-controls.js"></script></head>');
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }).end(html);
    });
  });
  upstream.on("error", () => res.writeHead(502).end());
  req.pipe(upstream);
});

server.on("upgrade", (req, socket, head) => {
  if (!localRequest(req) || !req.url.startsWith("/socket.io/")) return socket.destroy();
  const upstream = net.connect(port, host, () => {
    upstream.write(`GET ${req.url} HTTP/1.1\r\n`);
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      upstream.write(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`);
    }
    upstream.write("\r\n");
    upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  socket.on("error", () => upstream.destroy());
  upstream.on("error", () => socket.destroy());
  socket.on("close", () => upstream.destroy());
  upstream.on("close", () => socket.destroy());
});

server.listen(0, host, () => {
  origin = `http://${host}:${server.address().port}`;
  const input = createInterface({ input: process.stdin });
  input.on("line", buf => {
    if (/^\d+$/.test(buf)) {
      expireAfter(30000);
      console.log(`${origin}/page/${buf}`);
    }
  });
  input.on("close", () => process.exit(0));
  setInterval(() => {
    try { process.kill(rendererPid, 0); }
    catch { process.exit(0); }
  }, 1000);
});
