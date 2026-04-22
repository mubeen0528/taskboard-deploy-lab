import { useDeferredValue, useEffect, useRef, useState } from "react";
import {
  ApiError,
  createTask,
  deleteTask,
  fetchSummary,
  fetchTasks,
  updateTask,
} from "./api";

const emptyForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
};

const emptySummary = {
  total: 0,
  todo: 0,
  in_progress: 0,
  done: 0,
};

function formatDate(value) {
  if (!value) {
    return "Recently updated";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function titleCase(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const deferredSearch = useDeferredValue(search);
  const summaryRequestRef = useRef(0);
  const tasksRequestRef = useRef(0);

  async function loadSummary(signal) {
    const requestId = summaryRequestRef.current + 1;
    summaryRequestRef.current = requestId;
    setLoadingSummary(true);
    setError("");
    try {
      const data = await fetchSummary({ signal });
      if (summaryRequestRef.current === requestId) {
        setSummary(data);
      }
    } catch (requestError) {
      if (requestError?.name === "AbortError") {
        return;
      }
      if (summaryRequestRef.current === requestId) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load summary.");
      }
    } finally {
      if (summaryRequestRef.current === requestId) {
        setLoadingSummary(false);
      }
    }
  }

  async function loadTasks(signal) {
    const requestId = tasksRequestRef.current + 1;
    tasksRequestRef.current = requestId;
    setLoadingTasks(true);
    setError("");
    try {
      const data = await fetchTasks(
        {
          search: deferredSearch.trim(),
          status: statusFilter,
          priority: priorityFilter,
        },
        signal,
      );
      if (tasksRequestRef.current === requestId) {
        setTasks(data);
      }
    } catch (requestError) {
      if (requestError?.name === "AbortError") {
        return;
      }
      if (tasksRequestRef.current === requestId) {
        setError(
          requestError instanceof Error ? requestError.message : "Failed to load your tasks.",
        );
      }
    } finally {
      if (tasksRequestRef.current === requestId) {
        setLoadingTasks(false);
      }
    }
  }

  async function refreshBoard() {
    await Promise.all([loadSummary(), loadTasks()]);
  }

  useEffect(() => {
    const controller = new AbortController();
    loadSummary(controller.signal);
    return () => {
      controller.abort();
      summaryRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadTasks(controller.signal);
    return () => {
      controller.abort();
      tasksRequestRef.current += 1;
    };
  }, [deferredSearch, statusFilter, priorityFilter]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
    };

    try {
      if (editingTaskId) {
        await updateTask(editingTaskId, payload);
      } else {
        await createTask(payload);
      }

      setForm(emptyForm);
      setEditingTaskId(null);
      await refreshBoard();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "We could not save that task right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(task) {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(task) {
    const confirmed = window.confirm(`Delete "${task.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await deleteTask(task.id);
      if (editingTaskId === task.id) {
        setEditingTaskId(null);
        setForm(emptyForm);
      }
      await refreshBoard();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "We could not delete that task right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditingTaskId(null);
    setForm(emptyForm);
  }

  const hasFilters = search.trim() || statusFilter !== "all" || priorityFilter !== "all";
  const isEmptyState = !loadingTasks && tasks.length === 0;

  return (
    <div className="app-shell">
      <main className="page">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">TaskFlow Board</p>
            <h1>Plan work, track progress, and ship with confidence.</h1>
            <p className="hero-text">
              A beginner-friendly full-stack app built with FastAPI, React, PostgreSQL, SQLAlchemy,
              and Docker.
            </p>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-label">Live stack</div>
            <ul>
              <li>FastAPI backend with validation</li>
              <li>React + Vite frontend</li>
              <li>PostgreSQL storage</li>
              <li>One-container production build</li>
            </ul>
          </div>
        </section>

        <section className="summary-grid" aria-label="Task summary">
          <StatCard label="Total" value={summary.total} loading={loadingSummary} tone="neutral" />
          <StatCard label="Todo" value={summary.todo} loading={loadingSummary} tone="blue" />
          <StatCard
            label="In Progress"
            value={summary.in_progress}
            loading={loadingSummary}
            tone="amber"
          />
          <StatCard label="Done" value={summary.done} loading={loadingSummary} tone="green" />
        </section>

        {error ? (
          <section className="alert" role="alert">
            <strong>Something needs attention.</strong>
            <span>{error}</span>
          </section>
        ) : null}

        <section className="workspace">
          <article className="panel form-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">{editingTaskId ? "Edit task" : "New task"}</p>
                <h2>{editingTaskId ? "Update a task" : "Create a task"}</h2>
              </div>

              {editingTaskId ? (
                <button className="ghost-button" type="button" onClick={handleCancelEdit}>
                  Cancel edit
                </button>
              ) : null}
            </div>

            <form className="task-form" onSubmit={handleSubmit}>
              <label>
                <span>Title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Plan next sprint"
                  maxLength={120}
                  required
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Add a short, clear description."
                  maxLength={500}
                  rows={5}
                />
              </label>

              <div className="field-grid">
                <label>
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </label>

                <label>
                  <span>Priority</span>
                  <select
                    value={form.priority}
                    onChange={(event) => setForm({ ...form, priority: event.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

              <button className="primary-button" type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingTaskId
                    ? "Save changes"
                    : "Add task"}
              </button>
            </form>
          </article>

          <article className="panel list-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Task list</p>
                <h2>Manage your board</h2>
              </div>
            </div>

            <div className="filters">
              <label className="search-field">
                <span className="sr-only">Search tasks</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title or description"
                />
              </label>

              <div className="filter-row">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                >
                  <option value="all">All priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {loadingTasks ? (
              <div className="loading-state">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
                <div className="skeleton-card" />
              </div>
            ) : isEmptyState ? (
              <EmptyState hasFilters={Boolean(hasFilters)} />
            ) : (
              <div className="task-list">
                {tasks.map((task) => (
                  <article className="task-card" key={task.id}>
                    <div className="task-card-top">
                      <div>
                        <h3>{task.title}</h3>
                        <p>{task.description || "No description added yet."}</p>
                      </div>

                      <div className="task-card-actions">
                        <button type="button" className="text-button" onClick={() => handleEdit(task)}>
                          Edit
                        </button>
                        <button type="button" className="text-button danger" onClick={() => handleDelete(task)}>
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="task-meta">
                      <span className={`chip status-${task.status}`}>{titleCase(task.status)}</span>
                      <span className={`chip priority-${task.priority}`}>{titleCase(task.priority)}</span>
                      <span className="task-updated">Updated {formatDate(task.updated_at)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, loading, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span className="stat-label">{label}</span>
      {loading ? <div className="stat-loading" /> : <strong className="stat-value">{value}</strong>}
    </article>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration" />
      <h3>{hasFilters ? "No tasks match your filters" : "No tasks yet"}</h3>
      <p>
        {hasFilters
          ? "Try a different search, status, or priority to reveal matching tasks."
          : "Create your first task using the form on the left to get started."}
      </p>
    </div>
  );
}

export default App;
