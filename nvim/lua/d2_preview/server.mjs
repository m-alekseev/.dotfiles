import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createInterface } from "node:readline";

const prefix = "/" + randomUUID() + "/";
const assets = new Map([
  ["", ["text/html; charset=utf-8", readFileSync(new URL("preview.html", import.meta.url))]],
  ["preview.js", ["text/javascript", readFileSync(new URL("preview.js", import.meta.url))]],
]);
const clients = new Set();
let snapshot;
let compilerError;
let closeTimer;
let socket;
let stopping = false;
let diagnostics = "";

const watcher = spawn("d2", ["--watch", "--host", "127.0.0.1", "--port", "0", "--browser", "0", process.argv[2]], {
  stdio: ["ignore", "ignore", "pipe"],
});

function stop(error) {
  if (stopping) return;
  stopping = true;
  if (error) {
    console.error(error);
    process.exitCode = 1;
  }
  clearTimeout(closeTimer);
  process.stdin.pause();
  for (const response of clients) response.end();
  server.close();
  socket?.close();
  watcher.kill();
}

const server = createServer((req, res) => {
  const host = "127.0.0.1:" + server.address().port;
  if (req.method !== "GET" || req.headers.host !== host || !req.url.startsWith(prefix)) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  const route = req.url.slice(prefix.length);
  if (assets.has(route)) {
    const [type, body] = assets.get(route);
    res.writeHead(200, { "Content-Type": type }).end(body);
  } else if (route === "diagram") {
    clearTimeout(closeTimer);
    clients.add(res);
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.write("retry: 500\n\n");
    if (snapshot) res.write(snapshot);
    if (compilerError) res.write(compilerError);
    res.on("close", () => {
      clients.delete(res);
      if (!stopping && !clients.size) closeTimer = setTimeout(stop, 2000);
    });
  } else {
    res.writeHead(404).end();
  }
});

createInterface({ input: watcher.stderr }).on("line", line => {
  diagnostics = (diagnostics + line + "\n").slice(-4000);
  const address = line.match(/listening on http:\/\/(127\.0\.0\.1:\d+)/);
  if (!address || socket || stopping) return;
  socket = new WebSocket("ws://" + address[1] + "/watch");
  socket.onopen = () => {
    if (!stopping) server.listen(0, "127.0.0.1", () => {
      console.log("http://127.0.0.1:" + server.address().port + prefix);
    });
  };
  socket.onmessage = event => {
    const update = JSON.parse(event.data);
    const frame = "data: " + JSON.stringify(update) + "\n\n";
    if (update.svg) snapshot = frame;
    compilerError = update.err ? frame : undefined;
    for (const client of clients) client.write(frame);
  };
  socket.onerror = () => stop("Could not connect to the D2 watcher");
  socket.onclose = () => stop("D2 watcher disconnected");
});

watcher.on("error", error => stop(error.message));
watcher.on("exit", () => stop(diagnostics.trim() || "D2 watcher exited"));
server.on("error", error => stop(error.message));
process.on("SIGTERM", () => stop());
process.on("SIGINT", () => stop());
process.stdin.on("end", () => stop());
process.stdin.resume();
