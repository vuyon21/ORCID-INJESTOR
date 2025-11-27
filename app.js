
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
      authStatus.textContent = "Unable to verify ORCID connection.";
      importSection.classList.add("hidden");
      return;
    }
    const data = await res.json();
    authStatus.textContent = `Connected to ORCID: ${data.orcid}`;
    authStatus.classList.add("success");
    importSection.classList.remove("hidden");
  } catch (err) {
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

    const data = await res.json();

    if (!res.ok) {
      importStatus.textContent = data.error || "Import failed.";
      importStatus.classList.add("error");
      return;
    }

    importStatus.textContent = `Imported ${data.imported} DOIs (skipped ${data.skipped}).`;
    importStatus.classList.add("success");

    data.logs.forEach(msg => log(msg));
  } catch (err) {
    importStatus.textContent = "Unexpected error during import.";
    importStatus.classList.add("error");
  } finally {
    importBtn.disabled = false;
  }
});

(function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("auth") === "ok") {
    authStatus.textContent = "Successfully connected to ORCID!";
    authStatus.classList.add("success");
    window.history.replaceState({}, "", window.location.pathname);
  }
  checkAuth();
})();
