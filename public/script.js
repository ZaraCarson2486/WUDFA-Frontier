const STORAGE_KEY = "frontier-data";

const SEED = {
  articles: [
    {
      id: "a1",
      issue: "Vol. 3, No. 1",
      title: "A New World Order? Mapping the Fractures",
      author: "M. Okafor",
      excerpt:
        "Three decades on from the end of the Cold War, the institutions built to keep the peace are being tested by powers that no longer see themselves in the rules.",
      content:
        "Three decades on from the end of the Cold War, the institutions built to keep the peace are being tested by powers that no longer see themselves in the rules.\n\nThe language of a 'rules-based order' assumes agreement on who writes the rules. That agreement is thinning. Middle powers are hedging between blocs, multilateral forums are gridlocked, and the old assumption that economic integration guarantees political alignment has not held.\n\nWhat comes next is unlikely to be a single new order so much as several overlapping ones, each with its own centre of gravity. Understanding that plurality, rather than waiting for a single successor to emerge, is the more useful frame for the decade ahead.",
      date: "2026-07-02",
    },
    {
      id: "a2",
      issue: "Vol. 2, No. 4",
      title: "Refugee Policy After the Border Turn",
      author: "L. Vasquez",
      excerpt:
        "As European states harden their frontiers, the language of crisis has quietly replaced the language of obligation. What gets lost when protection becomes a policy of deterrence.",
      content:
        "As European states harden their frontiers, the language of crisis has quietly replaced the language of obligation.\n\nDeterrence is easy to measure. Fewer crossings, faster returns, lower headline numbers. What it does not measure is what happens to the people deterrence is designed to stop: journeys diverted to less visible and more dangerous routes.\n\nA policy framework built primarily around deterrence answers a domestic political question, not a protection question. Those two questions deserve separate answers, and current policy increasingly gives only one.",
      date: "2026-05-11",
    },
    {
      id: "a3",
      issue: "Vol. 2, No. 3",
      title: "Diplomacy Is Not a Board Game, But It Helps to Practise",
      author: "T. Ricci",
      excerpt:
        "What simulation exercises teach students that lectures cannot: the discomfort of holding a position you don't believe, and negotiating with someone who won't move.",
      content:
        "What simulation exercises teach students that lectures cannot: the discomfort of holding a position you don't believe, and negotiating with someone who won't move.\n\nIn a seminar, disagreement is usually resolved by better evidence. At the negotiating table, better evidence is often beside the point. Interests, domestic constituencies and plain stubbornness matter more.\n\nThat gap between the classroom and the table is exactly why simulation has a place in how we teach international affairs. It is the only exercise that punishes a good argument delivered to the wrong audience.",
      date: "2026-05-04",
    },
  ],
  issues: [],
  submissions: [
    {
      id: "s1",
      title: "Post-Disaster Response and the Politics of Aid Sequencing",
      pitch:
        "A look at how the order in which aid arrives after a disaster (search and rescue, then shelter, then reconstruction funding) is itself a political choice, not a neutral logistics problem.",
      name: "R. Singh",
      email: "r.singh@example.edu",
      fileName: "aid-sequencing.docx",
      status: "pending",
      date: "2026-08-14",
    },
  ],
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Couldn't read saved data, starting fresh.", e);
  }
  saveData(SEED);
  return structuredClone(SEED);
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Couldn't save data.", e);
  }
}

let data = loadData();
let currentView = "home";
let currentArticleId = null;

const el = (id) => document.getElementById(id);

function switchView(view) {
  currentView = view;
  ["home", "article", "submit", "find", "join", "editor"].forEach((v) => {
    el(`view-${v}`).style.display = v === view ? "" : "none";
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function renderHome() {
  const grid = el("articleGrid");
  const articles = data.articles.slice().reverse();
  if (articles.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No articles published yet. Check back soon.</p>`;
    return;
  }
  grid.innerHTML = articles
    .map(
      (a) => `
      <article class="card" data-id="${a.id}" tabindex="0" role="button">
        <span class="card-issue">${escapeHtml(a.issue)}</span>
        <h3 class="card-title">${escapeHtml(a.title)}</h3>
        <p class="card-excerpt">${escapeHtml(a.excerpt)}</p>
        <p class="card-meta">${escapeHtml(a.author)} · ${escapeHtml(a.date)}</p>
      </article>`
    )
    .join("");

  grid.querySelectorAll(".card").forEach((card) => {
    const open = () => openArticle(card.dataset.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => e.key === "Enter" && open());
  });
}

function openArticle(id) {
  currentArticleId = id;
  const article = data.articles.find((a) => a.id === id);
  const box = el("articleContent");
  if (!article) {
    box.innerHTML = `<p class="empty-msg">That dispatch isn't available.</p>`;
  } else {
    box.innerHTML = `
      <p class="article-issue">${escapeHtml(article.issue)}</p>
      <h1 class="article-title">${escapeHtml(article.title)}</h1>
      <p class="article-meta">By ${escapeHtml(article.author)} · ${escapeHtml(article.date)}</p>
      ${article.fileData ? `<button class="download-btn" data-download="${article.id}">Download article file</button>` : ""}
      <div class="article-body">
        ${article.content
          .split("\n\n")
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join("")}
      </div>`;
  }
  const download = box.querySelector("[data-download]");
  if (download) download.addEventListener("click", () => downloadFile(article.fileName, article.fileData));
  switchView("article");
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ---- Submit pitch form ----
function resetSubmitForm() {
  ["p-title", "p-pitch", "p-name", "p-email", "p-file"].forEach((id) => (el(id).value = ""));
  ["err-p-title", "err-p-pitch", "err-p-name", "err-p-file"].forEach((id) => (el(id).textContent = ""));
  el("submitFormWrap").style.display = "";
  el("submitThanks").style.display = "none";
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadFile(fileName, fileData) {
  const link = document.createElement("a");
  link.href = fileData;
  link.download = fileName || "frontier-file";
  link.click();
}

async function handleSendPitch() {
  const title = el("p-title").value.trim();
  const pitch = el("p-pitch").value.trim();
  const name = el("p-name").value.trim();
  const email = el("p-email").value.trim();
  const file = el("p-file").files[0];

  let hasError = false;
  el("err-p-title").textContent = "";
  el("err-p-pitch").textContent = "";
  el("err-p-name").textContent = "";
  el("err-p-file").textContent = "";

  if (!title) {
    el("err-p-title").textContent = "Enter a working title.";
    hasError = true;
  }
  if (!pitch || pitch.length < 30) {
    el("err-p-pitch").textContent = "Tell us the idea in at least a couple of sentences.";
    hasError = true;
  }
  if (!name) {
    el("err-p-name").textContent = "Enter your name.";
    hasError = true;
  }
  if (!file) {
    el("err-p-file").textContent = "Upload the article file before submitting.";
    hasError = true;
  } else if (file.size > 2 * 1024 * 1024) {
    el("err-p-file").textContent = "Keep the uploaded file under 2 MB.";
    hasError = true;
  }
  if (hasError) return;

  const fileData = await readFile(file);

  const submission = {
    id: "s" + Date.now(),
    title,
    pitch,
    name,
    email,
    fileName: file.name,
    fileData,
    status: "pending",
    date: new Date().toISOString().slice(0, 10),
  };
  data.submissions.push(submission);
  saveData(data);

  el("thanksText").textContent =
    `Thanks, ${name}. Your article is with the editors now. We'll be in touch after the editorial board has read it.`;
  el("submitFormWrap").style.display = "none";
  el("submitThanks").style.display = "";
  renderEditor();
}

// ---- Editor desk ----
function renderEditor() {
  const pending = data.submissions.filter((s) => s.status === "pending");
  const decided = data.submissions.filter((s) => s.status !== "pending");

  el("pendingCount").textContent = `Pending Articles (${pending.length})`;
  const pendingList = el("pendingList");
  if (pending.length === 0) {
    pendingList.innerHTML = `<p class="empty-msg">No articles waiting on review.</p>`;
  } else {
    pendingList.innerHTML = pending
      .map(
        (s) => `
        <div class="card editor-card">
          <span class="card-issue">${escapeHtml(s.date)}</span>
          <h3 class="card-title">${escapeHtml(s.title)}</h3>
          <p class="card-excerpt">${escapeHtml(s.pitch)}</p>
          <p class="card-meta">${escapeHtml(s.name)}${s.email ? " · " + escapeHtml(s.email) : ""}${s.fileName ? " · " + escapeHtml(s.fileName) : ""}</p>
          <div class="card-actions">
            ${s.fileData ? `<button class="download-btn" data-file-download="${s.id}">Download file</button>` : ""}
            <button class="approve-btn" data-id="${s.id}" data-action="approved">Approve</button>
            <button class="reject-btn" data-id="${s.id}" data-action="rejected">Reject</button>
          </div>
        </div>`
      )
      .join("");

    pendingList.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => decideSubmission(btn.dataset.id, btn.dataset.action));
    });
    pendingList.querySelectorAll("[data-file-download]").forEach((button) => {
      const submission = pending.find((item) => item.id === button.dataset.fileDownload);
      button.addEventListener("click", () => downloadFile(submission.fileName, submission.fileData));
    });
  }

  const reviewedWrap = el("reviewedWrap");
  if (decided.length === 0) {
    reviewedWrap.style.display = "none";
  } else {
    reviewedWrap.style.display = "";
    el("reviewedCount").textContent = `Reviewed (${decided.length})`;
    el("reviewedList").innerHTML = decided
      .map(
        (s) => `
        <div class="reviewed-row">
          <span>${escapeHtml(s.title)}</span>
          <span class="status-${s.status}">${s.status}</span>
        </div>`
      )
      .join("");
  }
}

function renderIssues() {
  const list = el("issueList");
  const issues = data.issues || [];
  list.innerHTML = issues.length
    ? issues.map((issue) => `<div class="reviewed-row"><span>${escapeHtml(issue.label)}</span><button class="download-btn" data-issue-download="${issue.id}">Download PDF</button></div>`).join("")
    : `<p class="empty-msg">Full issues will appear here when the editorial board publishes them.</p>`;
  list.querySelectorAll("[data-issue-download]").forEach((button) => {
    const issue = issues.find((item) => item.id === button.dataset.issueDownload);
    button.addEventListener("click", () => downloadFile(issue.fileName, issue.fileData));
  });
}

function decideSubmission(id, status) {
  const sub = data.submissions.find((s) => s.id === id);
  if (!sub) return;
  sub.status = status;
  saveData(data);
  renderEditor();
}

async function handlePublish() {
  const title = el("e-title").value.trim();
  const author = el("e-author").value.trim();
  const issue = el("e-issue").value.trim();
  const excerpt = el("e-excerpt").value.trim();
  const content = el("e-content").value.trim();
  const file = el("e-file").files[0];

  let hasError = false;
  el("err-e-title").textContent = "";
  el("err-e-author").textContent = "";
  el("err-e-content").textContent = "";
  el("err-e-file").textContent = "";

  if (!title) {
    el("err-e-title").textContent = "Give the dispatch a title.";
    hasError = true;
  }
  if (!author) {
    el("err-e-author").textContent = "Credit an author.";
    hasError = true;
  }
  if (!content || content.length < 40) {
    el("err-e-content").textContent = "Paste the full article text.";
    hasError = true;
  }
  if (!file) {
    el("err-e-file").textContent = "Upload the article file before publishing.";
    hasError = true;
  } else if (file.size > 2 * 1024 * 1024) {
    el("err-e-file").textContent = "Keep the uploaded file under 2 MB.";
    hasError = true;
  }
  if (hasError) return;

  const fileData = await readFile(file);

  const article = {
    id: "a" + Date.now(),
    title,
    author,
    issue: issue || "Unnumbered",
    excerpt: (excerpt || content).slice(0, 180),
    content,
    fileName: file.name,
    fileData,
    date: new Date().toISOString().slice(0, 10),
  };
  data.articles.push(article);
  saveData(data);

  ["e-title", "e-author", "e-issue", "e-excerpt", "e-content", "e-file"].forEach((id) => (el(id).value = ""));
  renderHome();

  const msg = el("publishedMsg");
  msg.style.display = "";
  setTimeout(() => (msg.style.display = "none"), 3000);
}

async function handleUploadIssue() {
  const label = el("e-issue-label").value.trim();
  const file = el("e-issue-file").files[0];
  el("err-e-issue-file").textContent = "";
  if (!label) {
    el("err-e-issue-file").textContent = "Add an issue label.";
    return;
  }
  if (!file || file.type !== "application/pdf") {
    el("err-e-issue-file").textContent = "Choose a PDF issue file.";
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    el("err-e-issue-file").textContent = "Keep the issue PDF under 10 MB.";
    return;
  }
  data.issues = data.issues || [];
  data.issues.push({ id: "i" + Date.now(), label, fileName: file.name, fileData: await readFile(file) });
  saveData(data);
  renderIssues();
  el("e-issue-label").value = "";
  el("e-issue-file").value = "";
  el("issueMsg").style.display = "";
  setTimeout(() => (el("issueMsg").style.display = "none"), 3000);
}

function handleJoin() {
  const name = el("j-name").value.trim();
  const email = el("j-email").value.trim();
  const interest = el("j-interest").value.trim();
  el("err-j-name").textContent = name ? "" : "Enter your name.";
  el("err-j-email").textContent = email.includes("@") ? "" : "Enter an email address.";
  el("err-j-interest").textContent = interest.length >= 30 ? "" : "Tell us a little more about your interest.";
  if (!name || !email.includes("@") || interest.length < 30) return;
  el("joinMsg").style.display = "";
  ["j-name", "j-email", "j-interest"].forEach((id) => (el(id).value = ""));
}

// ---- Wire up nav + actions ----
el("logoBtn").addEventListener("click", () => switchView("home"));
el("navHome").addEventListener("click", () => switchView("home"));
el("navSubmit").addEventListener("click", () => switchView("submit"));
el("navFind").addEventListener("click", () => { renderIssues(); switchView("find"); });
el("navJoin").addEventListener("click", () => switchView("join"));
el("navEditor").addEventListener("click", () => {
  renderEditor();
  switchView("editor");
});
el("backFromArticle").addEventListener("click", () => switchView("home"));
el("sendPitchBtn").addEventListener("click", handleSendPitch);
el("pitchAgainBtn").addEventListener("click", resetSubmitForm);
el("publishBtn").addEventListener("click", handlePublish);
el("uploadIssueBtn").addEventListener("click", handleUploadIssue);
el("joinBtn").addEventListener("click", handleJoin);
el("resetBtn").addEventListener("click", () => {
  data = structuredClone(SEED);
  saveData(data);
  renderHome();
  renderEditor();
  renderIssues();
  resetSubmitForm();
  switchView("home");
});

// ---- Initial render ----
renderHome();
renderEditor();
renderIssues();
switchView("home");
