const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 7000);
const DATA_DIR = path.join(__dirname, "data");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit_trails.json");

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, "[]");
  }
  if (!fs.existsSync(AUDIT_FILE)) {
    fs.writeFileSync(AUDIT_FILE, "[]");
  }
}

function readJson(filePath) {
  ensureDataFiles();
  return JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
}

function writeJson(filePath, value) {
  ensureDataFiles();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}

function clean(value, fallback = "") {
  return String(value ?? fallback).trim().replace(/\s+/g, " ");
}

function normalizeLog(payload, existing = {}) {
  const now = new Date().toISOString();
  return {
    id: existing.id || `node-log-${Date.now()}`,
    actorEmail: clean(payload.actorEmail, existing.actorEmail || "node.user@audit.local"),
    actorType: clean(payload.actorType, existing.actorType || "USER").toUpperCase(),
    action: clean(payload.action, existing.action || "NODE_ACTIVITY"),
    severity: clean(payload.severity, existing.severity || "LOW").toUpperCase(),
    source: clean(payload.source, existing.source || "node-backend"),
    message: clean(payload.message, existing.message || "Node.js backend activity recorded."),
    ipAddress: clean(payload.ipAddress, existing.ipAddress || "127.0.0.1"),
    metadata: payload.metadata || existing.metadata || {},
    occurredAt: existing.occurredAt || now,
    updatedAt: existing.id ? now : undefined
  };
}

function createAudit(activityLogId, actorEmail, eventName, previousState, newState, changes) {
  const audits = readJson(AUDIT_FILE);
  audits.unshift({
    id: `node-audit-${Date.now()}`,
    activityLogId,
    actorEmail,
    eventName,
    previousState,
    newState,
    changes,
    createdAt: new Date().toISOString()
  });
  writeJson(AUDIT_FILE, audits);
}

function filterLogs(logs, query) {
  return logs.filter((log) => {
    const actionOk = !query.get("action") || log.action.toLowerCase().includes(query.get("action").toLowerCase());
    const severityOk = !query.get("severity") || log.severity === query.get("severity").toUpperCase();
    const text = `${log.action} ${log.severity} ${log.source} ${log.message}`.toLowerCase();
    const qOk = !query.get("q") || text.includes(query.get("q").toLowerCase());
    return actionOk && severityOk && qOk;
  });
}

async function handleLogs(request, response, url, id) {
  const logs = readJson(LOGS_FILE);

  if (request.method === "GET" && id) {
    const log = logs.find((item) => item.id === id);
    return log ? sendJson(response, 200, log) : sendJson(response, 404, { message: "Node log not found" });
  }

  if (request.method === "GET") {
    return sendJson(response, 200, filterLogs(logs, url.searchParams));
  }

  if (request.method === "POST") {
    const payload = await readBody(request);
    const log = normalizeLog(payload);
    logs.unshift(log);
    writeJson(LOGS_FILE, logs);
    createAudit(log.id, log.actorEmail, "NODE_LOG_CREATED", null, "CREATED", { action: log.action });
    return sendJson(response, 201, log);
  }

  if (request.method === "PUT" && id) {
    const index = logs.findIndex((item) => item.id === id);
    if (index === -1) {
      return sendJson(response, 404, { message: "Node log not found" });
    }
    const payload = await readBody(request);
    const previous = logs[index];
    logs[index] = normalizeLog(payload, previous);
    writeJson(LOGS_FILE, logs);
    createAudit(id, logs[index].actorEmail, "NODE_LOG_UPDATED", previous.severity, logs[index].severity, payload);
    return sendJson(response, 200, logs[index]);
  }

  if (request.method === "DELETE" && id) {
    const index = logs.findIndex((item) => item.id === id);
    if (index === -1) {
      return sendJson(response, 404, { message: "Node log not found" });
    }
    const [removed] = logs.splice(index, 1);
    writeJson(LOGS_FILE, logs);
    createAudit(id, removed.actorEmail, "NODE_LOG_DELETED", "ACTIVE", "DELETED", { action: removed.action });
    return sendJson(response, 200, { message: "Node log deleted", id });
  }

  return sendJson(response, 405, { message: "Method not allowed" });
}

async function route(request, response) {
  if (request.method === "OPTIONS") {
    return sendJson(response, 204, {});
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const logMatch = url.pathname.match(/^\/api\/node\/logs\/?([^/]*)$/);

  try {
    if (url.pathname === "/health") {
      return sendJson(response, 200, { status: "UP", service: "node-backend", port: PORT });
    }

    if (logMatch) {
      return await handleLogs(request, response, url, logMatch[1] || null);
    }

    if (request.method === "GET" && url.pathname === "/api/node/audit-trails") {
      return sendJson(response, 200, readJson(AUDIT_FILE));
    }

    return sendJson(response, 404, { message: "Node API route not found" });
  } catch (error) {
    return sendJson(response, 400, { message: error.message });
  }
}

ensureDataFiles();
http.createServer(route).listen(PORT, () => {
  console.log(`Node.js backend running at http://127.0.0.1:${PORT}`);
  console.log("Node CRUD APIs available under /api/node");
});
