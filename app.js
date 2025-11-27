const API_BASE = "https://steep-limit-90ec.ngayeka-vuyo.workers.dev";

const loginBtn = document.getElementById("loginBtn");
const authStatus = document.getElementById("authStatus");
const importSection = document.getElementById("importSection");
const doiInput = document.getElementById("doiInput");
const importBtn = document.getElementById("importBtn");
const importStatus = document.getElementById("importStatus");
const logEl = document.getElementById("log");

function log(msg) {
  const line = document.createElement("div");
  line.textContent = msg;
  logEl.appendChild(line);
}

async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/api/me`, { credentials: "include" });
    if (!res.ok) {
      authStatus.textContent = "Not connected to ORCID yet.";
      importSection.classList.add("hidden");
      return;
    }
    const data = await res.json();
    authStatus.textContent = `Connected to ORCID: ${data.orcid || "unknown iD"}`;
    authStatus.classList.add("success");
    importSection.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    authStatus.textContent = "Unable to verify ORCID connection.";
    authStatus.classList.add("error");
  }
}

loginBtn.addEventListener("click", () => {
  window.location.href = `${API_BASE}/auth/start`;
});

importBtn.addEventListener("click", async () => {
  importStatus.textContent = "";
  importStatus.className = "status";
  logEl.innerHTML = "";

  const raw = doiInput.value.trim();
  if (!raw) {
    importStatus.textContent = "Please paste at least one DOI.";
    importStatus.classList.add("error");
    return;
  }

  const dois = raw
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

  if (!dois.length) {
    importStatus.textContent = "No valid DOIs detected.";
    importStatus.classList.add("error");
    return;
  }

  importBtn.disabled = true;
  importStatus.textContent = "Importing DOIs to ORCID...";
  log(`Sending ${dois.length} DOIs to server...`);

  try {
    const res = await fetch(`${API_BASE}/api/import-dois`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ dois })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      importStatus.textContent = data.error || "Import failed.";
      importStatus.classList.add("error");
      if (data.details) log(data.details);
      return;
    }

    importStatus.textContent = `Imported ${data.imported || 0} DOIs (skipped ${data.skipped || 0}).`;
    importStatus.classList.add("success");

    if (Array.isArray(data.logs)) {
      data.logs.forEach(msg => log(msg));
    }
  } catch (err) {
    console.error(err);
    importStatus.textContent = "Unexpected error during import.";
    importStatus.classList.add("error");
  } finally {
    importBtn.disabled = false;
  }
});

// If the Worker redirects back with ?auth=ok, show that nicely and check auth.
(function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("auth") === "ok") {
    authStatus.textContent = "Successfully connected to ORCID. You can now import DOIs.";
    authStatus.classList.add("success");
    // Clean URL
    window.history.replaceState({}, "", window.location.pathname);
  }
  checkAuth();
})();
