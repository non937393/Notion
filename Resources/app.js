
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const STORAGE = {
    notes: "notion_lively_notes_v1",
    tasks: "notion_lively_tasks_v1",
    theme: "notion_lively_theme_v1"
  };

  const starterNotes = [
    {
      id: "welcome-note",
      title: "Welcome to your workspace ✦",
      body: "This is your space for ideas, notes, plans, and everything in between. Edit this note or create a new one to get started.",
      updatedAt: new Date().toISOString()
    },
    {
      id: "little-reminders",
      title: "Little reminders",
      body: "Take breaks. Keep exploring. Small progress is still progress.",
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("Could not read saved workspace data:", error);
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("Could not save workspace data:", error);
      showToast("Couldn't save. Check available storage.");
      return false;
    }
  }

  let notes = readStorage(STORAGE.notes, starterNotes);
  let tasks = readStorage(STORAGE.tasks, []);
  let currentPage = "Home";
  let editingNoteId = null;
  let toastTimer = null;
  let menuOpen = false;

  if (!Array.isArray(notes)) notes = starterNotes;
  if (!Array.isArray(tasks)) tasks = [];

  function makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function shortDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  }

  function relativeDate(value) {
    const date = new Date(value);
    const elapsed = Date.now() - date.getTime();
    if (!Number.isFinite(elapsed)) return "";
    if (elapsed < 60000) return "Just now";
    if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`;
    if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h ago`;
    return shortDate(value);
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function persistNotes() {
    saveStorage(STORAGE.notes, notes);
    updateStats();
  }

  function persistTasks() {
    saveStorage(STORAGE.tasks, tasks);
    updateStats();
  }

  function updateGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";

    $("#greeting").innerHTML =
      `${greeting} <span class="wave">✦</span>`;

    $("#dateChip").textContent = new Date().toLocaleDateString(
      undefined,
      { weekday: "short", month: "short", day: "numeric" }
    );
  }

  function updateStats() {
    const openTasks = tasks.filter(task => !task.completed).length;
    const completedTasks = tasks.filter(task => task.completed).length;

    $("#notesStat").textContent = notes.length;
    $("#tasksStat").textContent = openTasks;
    $("#doneStat").textContent = completedTasks;
    $("#taskCount").textContent = openTasks;
    $("#taskPill").textContent = `${openTasks} open`;

    $("#taskFooter").textContent = openTasks === 0
      ? "You're all caught up. ✦"
      : `${openTasks} little step${openTasks === 1 ? "" : "s"} to go.`;
  }

  function emptyState(symbol, title, description) {
    return `
      <div class="empty-state">
        <div class="empty-symbol">${symbol}</div>
        <strong>${escapeHTML(title)}</strong>
        <p>${escapeHTML(description)}</p>
      </div>
    `;
  }

  function renderNotes() {
    const list = $("#notesList");
    const title = $("#listTitle");
    const viewAll = $("#viewAll");

    if (currentPage === "Tasks") {
      title.textContent = "Your tasks";
      viewAll.hidden = true;
    } else {
      title.textContent = currentPage === "Notes"
        ? "All notes"
        : "Recent notes";
      viewAll.hidden = currentPage === "Notes";
    }

    let visibleNotes = [...notes].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    if (currentPage !== "Notes") visibleNotes = visibleNotes.slice(0, 4);

    if (visibleNotes.length === 0) {
      list.innerHTML = emptyState(
        "✧",
        "A blank page, full of possibility",
        "Create a note and your ideas will appear here."
      );
      return;
    }

    list.innerHTML = visibleNotes.map((note, index) => `
      <article class="note-row" data-note-id="${escapeHTML(note.id)}"
               tabindex="0" role="button"
               aria-label="Edit ${escapeHTML(note.title)}"
               style="animation-delay:${Math.min(index * 55, 250)}ms">
        <div class="note-icon c${index % 4}">${["▤", "✧", "◈", "✎"][index % 4]}</div>
        <div class="note-copy">
          <strong>${escapeHTML(note.title || "Untitled note")}</strong>
          <p>${escapeHTML((note.body || "No additional text").replace(/\s+/g, " ").trim())}</p>
        </div>
        <span class="note-date">${escapeHTML(relativeDate(note.updatedAt))}</span>
        <span class="row-arrow">›</span>
      </article>
    `).join("");
  }

  function renderTasks() {
    const list = $("#tasksList");

    if (tasks.length === 0) {
      list.innerHTML = emptyState(
        "✓",
        "Nothing on the list yet",
        "Add a task above to start building momentum."
      );
      return;
    }

    const sorted = [...tasks].sort((a, b) =>
      Number(a.completed) - Number(b.completed)
    );

    list.innerHTML = sorted.map((task, index) => `
      <div class="task-row ${task.completed ? "completed" : ""}"
           data-task-id="${escapeHTML(task.id)}"
           style="animation-delay:${Math.min(index * 35, 200)}ms">
        <button class="task-check" data-action="toggle"
                aria-label="${task.completed ? "Mark incomplete" : "Complete task"}"
                aria-pressed="${Boolean(task.completed)}">
          ✓
        </button>
        <span class="task-text">${escapeHTML(task.text)}</span>
        <button class="delete-task" data-action="delete"
                aria-label="Delete task">×</button>
      </div>
    `).join("");
  }

  function renderAll() {
    renderNotes();
    renderTasks();
    updateStats();
  }

  function navigate(page) {
    currentPage = page;
    $("#breadcrumb").textContent = page;

    $$(".nav-item").forEach(button => {
      const active = button.dataset.page === page;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    const hero = $(".hero-card");
    const stats = $(".stats-grid");
    const grid = $(".content-grid");

    if (page === "Home") {
      hero.hidden = false;
      stats.hidden = false;
      grid.hidden = false;
      $("#viewAll").hidden = false;
    } else {
      hero.hidden = true;
      stats.hidden = true;
      grid.hidden = false;
      $("#viewAll").hidden = true;
    }

    $(".tasks-panel").hidden = page === "Notes";
    $(".notes-panel").hidden = page === "Tasks";

    if (page === "Projects") {
      $(".notes-panel").hidden = false;
      $("#listTitle").textContent = "Project ideas";
      $("#viewAll").hidden = true;
    }

    renderNotes();
    closeMenu();
  }

  function openNote(note = null) {
    editingNoteId = note?.id ?? null;

    $("#dialogTitle").textContent = note ? "Edit your note" : "Create a note";
    $("#noteTitle").value = note?.title ?? "";
    $("#noteBody").value = note?.body ?? "";

    const dialog = $("#noteDialog");
    if (!dialog.open) dialog.showModal();

    requestAnimationFrame(() => $("#noteTitle").focus());
  }

  function closeNote() {
    $("#noteDialog").close();
    editingNoteId = null;
  }

  function saveNote(event) {
    event.preventDefault();

    const title = $("#noteTitle").value.trim();
    const body = $("#noteBody").value.trim();

    if (!title) {
      $("#noteTitle").focus();
      showToast("Give your note a title first.");
      return;
    }

    const existing = notes.find(note => note.id === editingNoteId);

    if (existing) {
      existing.title = title;
      existing.body = body;
      existing.updatedAt = new Date().toISOString();
      showToast("Your note has been updated ✦");
    } else {
      notes.unshift({
        id: makeId(),
        title,
        body,
        updatedAt: new Date().toISOString()
      });
      showToast("A new idea has found a home ✦");
    }

    persistNotes();
    closeNote();
    renderAll();
  }

  function addTask(event) {
    event.preventDefault();
    const input = $("#taskInput");
    const text = input.value.trim();

    if (!text) {
      input.focus();
      return;
    }

    tasks.unshift({
      id: makeId(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    });

    input.value = "";
    persistTasks();
    renderTasks();
    showToast("Task added. You've got this!");
    input.focus();
  }

  function toggleTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    task.completed = !task.completed;
    persistTasks();
    renderTasks();

    if (task.completed) showToast("Nice work! One step done ✦");
  }

  function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    persistTasks();
    renderTasks();
    showToast("Task removed.");
  }

  function openMenu() {
    menuOpen = true;
    $("#sidebar").classList.add("open");
  }

  function closeMenu() {
    menuOpen = false;
    $("#sidebar").classList.remove("open");
  }

  function toggleMenu() {
    menuOpen ? closeMenu() : openMenu();
  }

  function setTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("light-mode", isLight);

    try {
      localStorage.setItem(STORAGE.theme, theme);
    } catch (error) {
      console.warn("Theme preference couldn't be saved:", error);
    }

    $("#themeButton").setAttribute(
      "aria-label",
      isLight ? "Switch to dark theme" : "Switch to light theme"
    );
  }

  function bindEvents() {
    $$(".nav-item").forEach(button => {
      button.addEventListener("click", () => navigate(button.dataset.page));
    });

    $("#heroCreate").addEventListener("click", () => openNote());
    $("#workspaceButton").addEventListener("click", () => {
      showToast("Welcome to your personal workspace ✦");
    });

    $("#viewAll").addEventListener("click", () => navigate("Notes"));

    $("#notesList").addEventListener("click", event => {
      const row = event.target.closest("[data-note-id]");
      if (!row) return;
      const note = notes.find(item => item.id === row.dataset.noteId);
      if (note) openNote(note);
    });

    $("#notesList").addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const row = event.target.closest("[data-note-id]");
      if (!row) return;
      event.preventDefault();
      const note = notes.find(item => item.id === row.dataset.noteId);
      if (note) openNote(note);
    });

    $("#taskForm").addEventListener("submit", addTask);

    $("#tasksList").addEventListener("click", event => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const row = button.closest("[data-task-id]");
      if (!row) return;

      if (button.dataset.action === "toggle") toggleTask(row.dataset.taskId);
      if (button.dataset.action === "delete") deleteTask(row.dataset.taskId);
    });

    $("#noteForm").addEventListener("submit", saveNote);
    $("#closeDialog").addEventListener("click", closeNote);
    $("#cancelNote").addEventListener("click", closeNote);

    $("#noteDialog").addEventListener("click", event => {
      if (event.target === $("#noteDialog")) closeNote();
    });

    $("#menuButton").addEventListener("click", toggleMenu);
    $("#themeButton").addEventListener("click", () => {
      setTheme(document.body.classList.contains("light-mode") ? "dark" : "light");
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();

      const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        openNote();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !typing) {
        event.preventDefault();
        $("#taskInput").focus();
      }
    });
  }

  function init() {
    updateGreeting();
    setTheme(readStorage(STORAGE.theme, "dark"));
    bindEvents();
    renderAll();
    navigate("Home");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
