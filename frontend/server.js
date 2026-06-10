const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const BACKEND_API = process.env.BACKEND_API || "http://127.0.0.1:8001/api";
const ROOT = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function serveFile(response, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    response.end(content);
  });
}

function proxyApi(request, response) {
  const apiPath = request.url.replace(/^\/api\/?/, "");
  const baseUrl = BACKEND_API.endsWith("/") ? BACKEND_API : `${BACKEND_API}/`;
  const target = new URL(apiPath, baseUrl);
  const options = {
    method: request.method,
    headers: {
      ...request.headers,
      host: target.host
    }
  };

  const proxy = http.request(target, options, (backendResponse) => {
    response.writeHead(backendResponse.statusCode || 502, backendResponse.headers);
    backendResponse.pipe(response);
  });

  proxy.on("error", () => {
    response.writeHead(503, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ message: "Spring Boot backend is not reachable" }));
  });

  request.pipe(proxy);
}

http.createServer((request, response) => {
  if (request.url.startsWith("/api/")) {
    proxyApi(request, response);
    return;
  }

  const cleanUrl = decodeURIComponent(request.url.split("?")[0]);
  const route = cleanUrl === "/"
    ? "/index.html"
    : cleanUrl === "/dashboard"
      ? "/dashboard.html"
      : cleanUrl;
  const filePath = path.normalize(path.join(ROOT, route.replace(/^\/static/, "")));

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  serveFile(response, filePath);
}).listen(PORT, () => {
  console.log(`Frontend running at http://127.0.0.1:${PORT}`);
  console.log(`Proxying API requests to ${BACKEND_API}`);
});
