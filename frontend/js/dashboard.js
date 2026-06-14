const role = localStorage.getItem("role");
const fullName = localStorage.getItem("fullName");
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/";
}

document.getElementById("welcome-name").textContent = fullName || "Analyst";
document.getElementById("role-badge").textContent = role || "USER";
document.getElementById("role-description").textContent =
  role === "ADMIN"
    ? "Monitor all user and system activity across the audit platform."
    : "Record and inspect your own activity logs and audit trail.";

const viewButtons = document.querySelectorAll(".nav-item");
const viewPanels = document.querySelectorAll(".view-panel");
const summaryBody = document.getElementById("summary-body");
const logsBody = document.getElementById("logs-body");
const auditBody = document.getElementById("audit-body");
const searchBody = document.getElementById("search-body");
const nodeLogsBody = document.getElementById("node-logs-body");

viewButtons.forEach((button) => {
  button.addEventListener("click", () => openView(button.dataset.view));
});

document.getElementById("logout-button").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/";
});

document.getElementById("refresh-summary").addEventListener("click", loadSummary);
document.getElementById("refresh-logs").addEventListener("click", loadLogs);
document.getElementById("apply-filters").addEventListener("click", loadLogs);
document.getElementById("refresh-audit").addEventListener("click", loadAuditTrails);
document.getElementById("run-search").addEventListener("click", runSearch);
document.getElementById("refresh-node").addEventListener("click", loadNodeLogs);
nodeLogsBody.addEventListener("click", handleNodeLogAction);

function openView(viewId) {
  viewButtons.forEach((item) => item.classList.remove("active"));
  viewPanels.forEach((panel) => panel.classList.remove("active"));
  document.querySelector(`[data-view="${viewId}"]`)?.classList.add("active");
  document.getElementById(viewId)?.classList.add("active");
}

document.getElementById("log-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.getElementById("log-message");
  status.textContent = "Saving activity log...";
  status.className = "status-text";

  const payload = {
    action: document.getElementById("action").value.trim(),
    actorType: document.getElementById("actorType").value,
    severity: document.getElementById("severity").value,
    source: document.getElementById("source").value.trim(),
    ipAddress: document.getElementById("ipAddress").value.trim(),
    newState: document.getElementById("newState").value.trim(),
    message: document.getElementById("message").value.trim(),
    metadata: {
      browserTime: new Date().toISOString(),
      enteredFrom: "dashboard"
    }
  };

  try {
    await apiRequest("/logs", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    status.textContent = "Activity log saved.";
    status.className = "status-text status-success";
    event.target.reset();
    await Promise.all([loadLogs(), loadSummary(), loadAuditTrails()]);
    openView("logs");
  } catch (error) {
    status.textContent = error.message;
    status.className = "status-text status-error";
  }
});

document.getElementById("node-log-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.getElementById("node-message-status");
  status.textContent = "Creating Node.js log...";
  status.className = "status-text";

  const payload = {
    actorEmail: document.getElementById("node-actor-email").value.trim(),
    actorType: "USER",
    action: document.getElementById("node-action").value.trim(),
    severity: document.getElementById("node-severity").value,
    source: document.getElementById("node-source").value.trim(),
    message: document.getElementById("node-message").value.trim(),
    metadata: {
      createdFrom: "frontend-node-crud"
    }
  };

  try {
    await nodeApiRequest("/logs", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    status.textContent = "Node.js log created.";
    status.className = "status-text status-success";
    await loadNodeLogs();
  } catch (error) {
    status.textContent = error.message;
    status.className = "status-text status-error";
  }
});

async function loadSummary() {
  summaryBody.innerHTML = `<tr><td colspan="6">Loading summary...</td></tr>`;
  try {
    const items = await apiRequest("/logs/summary");
    summaryBody.innerHTML = items.length
      ? items.map((item) => `
          <tr>
            <td>${escapeHtml(item.actorEmail || "system")}</td>
            <td>${escapeHtml(item.action)}</td>
            <td><span class="severity ${item.severity}">${item.severity}</span></td>
            <td>${escapeHtml(item.source)}</td>
            <td>${item.totalEvents}</td>
            <td>${formatDate(item.lastEventAt)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="6">No summary records yet.</td></tr>`;
  } catch (error) {
    summaryBody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  }
}

async function loadLogs() {
  logsBody.innerHTML = `<tr><td colspan="6">Loading logs...</td></tr>`;
  const params = new URLSearchParams();
  addParam(params, "action", document.getElementById("filter-action").value);
  addParam(params, "severity", document.getElementById("filter-severity").value);
  addParam(params, "from", toLocalDateTime(document.getElementById("filter-from").value));
  addParam(params, "to", toLocalDateTime(document.getElementById("filter-to").value));

  try {
    const items = await apiRequest(`/logs${params.toString() ? `?${params}` : ""}`);
    renderLogs(items, logsBody);
    updateStats(items);
  } catch (error) {
    logsBody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  }
}

async function loadAuditTrails() {
  auditBody.innerHTML = `<tr><td colspan="6">Loading audit trails...</td></tr>`;
  try {
    const items = await apiRequest("/logs/audit-trails");
    document.getElementById("audit-count").textContent = String(items.length);
    auditBody.innerHTML = items.length
      ? items.map((item) => `
          <tr>
            <td>${formatDate(item.createdAt)}</td>
            <td>${escapeHtml(item.actorEmail || "-")}</td>
            <td>${escapeHtml(item.eventName)}</td>
            <td>${escapeHtml(item.previousState || "-")}</td>
            <td>${escapeHtml(item.newState || "-")}</td>
            <td>${escapeHtml(item.activityLogId || "-")}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="6">No audit trail records yet.</td></tr>`;
  } catch (error) {
    auditBody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  }
}

async function runSearch() {
  searchBody.innerHTML = `<tr><td colspan="5">Searching logs...</td></tr>`;
  const query = document.getElementById("semantic-query").value.trim();
  if (!query) {
    searchBody.innerHTML = `<tr><td colspan="5">Enter a search query.</td></tr>`;
    return;
  }

  try {
    const items = await apiRequest(`/logs/search?q=${encodeURIComponent(query)}`);
    searchBody.innerHTML = items.length
      ? items.map((item) => `
          <tr>
            <td>${item.score == null ? "-" : item.score.toFixed(3)}</td>
            <td>${formatDate(item.occurredAt)}</td>
            <td>${escapeHtml(item.action)}</td>
            <td><span class="severity ${item.severity}">${item.severity}</span></td>
            <td>${escapeHtml(item.message)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="5">No semantic matches found.</td></tr>`;
  } catch (error) {
    searchBody.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
  }
}

async function loadNodeLogs() {
  nodeLogsBody.innerHTML = `<tr><td colspan="6">Loading Node.js logs...</td></tr>`;
  try {
    const items = await nodeApiRequest("/logs");
    nodeLogsBody.innerHTML = items.length
      ? items.map((item) => `
          <tr>
            <td>${formatDate(item.occurredAt)}</td>
            <td>${escapeHtml(item.actorEmail || "-")}</td>
            <td>${escapeHtml(item.action)}</td>
            <td><span class="severity ${item.severity}">${item.severity}</span></td>
            <td>${escapeHtml(item.message)}</td>
            <td>
              <button class="ghost-button small-button node-edit" data-id="${escapeHtml(item.id)}">Edit</button>
              <button class="ghost-button small-button node-delete" data-id="${escapeHtml(item.id)}">Delete</button>
            </td>
          </tr>
        `).join("")
      : `<tr><td colspan="6">No Node.js records yet. Create one using the form above.</td></tr>`;
  } catch (error) {
    nodeLogsBody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  }
}

async function handleNodeLogAction(event) {
  const editButton = event.target.closest(".node-edit");
  const deleteButton = event.target.closest(".node-delete");
  const id = editButton?.dataset.id || deleteButton?.dataset.id;

  if (!id) {
    return;
  }

  const status = document.getElementById("node-message-status");

  try {
    if (editButton) {
      const current = await nodeApiRequest(`/logs/${encodeURIComponent(id)}`);
      const action = prompt("Update action", current.action || "");
      if (action === null) {
        return;
      }
      const message = prompt("Update message", current.message || "");
      if (message === null) {
        return;
      }

      await nodeApiRequest(`/logs/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({
          ...current,
          action,
          message
        })
      });
      status.textContent = "Node.js log updated.";
      status.className = "status-text status-success";
    }

    if (deleteButton) {
      const confirmed = confirm("Delete this Node.js log?");
      if (!confirmed) {
        return;
      }

      await nodeApiRequest(`/logs/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      status.textContent = "Node.js log deleted.";
      status.className = "status-text status-success";
    }

    await loadNodeLogs();
  } catch (error) {
    status.textContent = error.message;
    status.className = "status-text status-error";
  }
}

function renderLogs(items, target) {
  target.innerHTML = items.length
    ? items.map((item) => `
        <tr>
          <td>${formatDate(item.occurredAt)}</td>
          <td>${escapeHtml(item.actorEmail || "-")}</td>
          <td>${escapeHtml(item.action)}</td>
          <td><span class="severity ${item.severity}">${item.severity}</span></td>
          <td>${escapeHtml(item.source)}</td>
          <td>${escapeHtml(item.message)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="6">No activity logs yet.</td></tr>`;
}

function updateStats(items) {
  const highRisk = items.filter((item) => ["HIGH", "CRITICAL"].includes(item.severity)).length;
  document.getElementById("total-logs").textContent = String(items.length);
  document.getElementById("high-risk").textContent = String(highRisk);
}

function addParam(params, key, value) {
  if (value) {
    params.set(key, value);
  }
}

function toLocalDateTime(value) {
  return value ? value.replace("T", " ") .replace(" ", "T") : "";
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadLogs();
loadSummary();
loadAuditTrails();
loadNodeLogs();
