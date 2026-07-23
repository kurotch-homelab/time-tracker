// Public, non-secret deployment endpoint. Change only for a self-hosted build.
const API_ORIGIN = "https://time-tracker.apps.silver-vine.jp";

const pageElement = document.querySelector("#page");
const statusElement = document.querySelector("#status");
const form = document.querySelector("#timer-form");
const projectInput = document.querySelector("#project-id");
const startButton = document.querySelector("#start");
const signInButton = document.querySelector("#sign-in");

let currentPage;

await loadCurrentPage();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const projectId = projectInput.value.trim();
  if (!currentPage || !projectId) {
    showStatus("Open an HTTP(S) page and enter a project ID.");
    return;
  }
  startButton.disabled = true;
  showStatus("");
  try {
    const response = await fetch(`${API_ORIGIN}/api/v1/active-timer`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        projectId,
        startAt: new Date().toISOString(),
        referenceUrl: currentPage.url,
        pageTitle: currentPage.title,
      }),
    });
    if (response.status === 401) {
      showStatus("Sign in first, then try again.");
      return;
    }
    if (!response.ok) {
      showStatus("The timer could not be started. Please try again.");
      return;
    }
    showStatus("Timer started.", false);
  } catch {
    showStatus("Could not reach Time Tracker.");
  } finally {
    startButton.disabled = false;
  }
});

signInButton.addEventListener("click", () => {
  void chrome.tabs.create({ url: `${API_ORIGIN}/auth/login` });
});

async function loadCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.url || !isHttpUrl(tab.url)) {
    pageElement.textContent = "Open an HTTP(S) page to start a timer from it.";
    startButton.disabled = true;
    return;
  }
  currentPage = { url: tab.url, title: (tab.title || tab.url).slice(0, 500) };
  // textContent keeps a hostile page title from becoming markup in the popup.
  pageElement.textContent = currentPage.title;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function showStatus(message, isError = true) {
  statusElement.textContent = message;
  statusElement.style.color = isError ? "#b91c1c" : "#166534";
}
