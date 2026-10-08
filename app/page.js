"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Tambah task
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit task
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete task
  const [deletingId, setDeletingId] = useState(null);

  // =========================
  // LOAD USER + TASKS
  // =========================
  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login";
      return;
    }

    setUser(user);

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error mengambil tasks:", error);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setTasks(data || []);
    setLoading(false);
  }

  // =========================
  // TAMBAH TASK
  // =========================
  async function addTask(e) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Judul task wajib diisi.");
      return;
    }

    if (!user) {
      setErrorMessage("User belum login.");
      return;
    }

    setAdding(true);
    setErrorMessage("");

    const { error } = await supabase.from("tasks").insert([
      {
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        deadline: deadline || null,
        completed: false,
      },
    ]);

    if (error) {
      console.error("Error menambah task:", error);
      setErrorMessage(error.message);
      setAdding(false);
      return;
    }

    setTitle("");
    setDescription("");
    setDeadline("");
    setAdding(false);

    await loadData();
  }

  // =========================
  // SELESAI / BELUM SELESAI
  // =========================
  async function toggleTask(task) {
    setErrorMessage("");

    const { error } = await supabase
      .from("tasks")
      .update({
        completed: !task.completed,
      })
      .eq("id", task.id);

    if (error) {
      console.error("Error update status:", error);
      setErrorMessage(error.message);
      return;
    }

    await loadData();
  }

  // =========================
  // MULAI EDIT
  // =========================
  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditDeadline(task.deadline || "");
    setErrorMessage("");
  }

  // =========================
  // BATAL EDIT
  // =========================
  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDeadline("");
  }

  // =========================
  // SIMPAN EDIT
  // =========================
  async function saveEdit(taskId) {
    if (!editTitle.trim()) {
      alert("Judul task wajib diisi.");
      return;
    }

    setSavingEdit(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("tasks")
      .update({
        title: editTitle.trim(),
        description: editDescription.trim(),
        deadline: editDeadline || null,
      })
      .eq("id", taskId);

    if (error) {
      console.error("Error mengedit task:", error);
      setErrorMessage(error.message);
      setSavingEdit(false);
      return;
    }

    setSavingEdit(false);
    cancelEdit();

    await loadData();
  }

  // =========================
  // HAPUS TASK
  // =========================
  async function deleteTask(task) {
    const yakin = window.confirm(`Yakin ingin menghapus task "${task.title}"?`);

    if (!yakin) return;

    setDeletingId(task.id);
    setErrorMessage("");

    const { error } = await supabase.from("tasks").delete().eq("id", task.id);

    if (error) {
      console.error("Error menghapus task:", error);
      setErrorMessage(error.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);

    await loadData();
  }

  // =========================
  // LOGOUT
  // =========================
  async function logout() {
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.location.href = "/login";
  }

  // =========================
  // LOAD AWAL
  // =========================
  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">
          Memuat CloudTask...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              CloudTask
            </p>

            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              Task Management
            </h1>

            <p className="mt-2 text-gray-600">
              Data tugas tersimpan di Supabase Cloud Database.
            </p>

            {user && (
              <p className="mt-2 text-sm text-gray-500">
                Login sebagai: {user.email}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black"
          >
            Logout
          </button>
        </div>

        {/* TAMBAH TASK */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Tambah Task</h2>

          <form onSubmit={addTask} className="space-y-4">
            <input
              type="text"
              placeholder="Judul task"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            <textarea
              placeholder="Deskripsi task"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Menyimpan..." : "Tambah Task"}
            </button>
          </form>
        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* STATISTIK */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Total Task</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Selesai</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {tasks.filter((task) => task.completed).length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Belum Selesai</p>
            <p className="mt-2 text-3xl font-bold text-orange-500">
              {tasks.filter((task) => !task.completed).length}
            </p>
          </div>
        </div>

        {/* MY TASKS */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="text-gray-500">Belum ada task di database.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-xl bg-white p-6 shadow">
                {editingId === task.id ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      Edit Task
                    </h3>

                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />

                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows="3"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />

                    <input
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => saveEdit(task.id)}
                        disabled={savingEdit}
                        className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={savingEdit}
                        className="rounded-lg bg-gray-200 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-300"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    {/* STATUS */}
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className={`mt-1 h-6 w-6 flex-shrink-0 rounded-full border-2 transition ${
                        task.completed
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300 bg-white hover:border-blue-500"
                      }`}
                    />

                    <div className="flex-1">
                      <h3
                        className={`text-xl font-bold ${
                          task.completed
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </h3>

                      <p className="mt-2 text-gray-600">
                        {task.description || "Tidak ada deskripsi"}
                      </p>

                      <p className="mt-3 text-sm text-gray-500">
                        Deadline: {task.deadline || "-"}
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        Status:{" "}
                        <span
                          className={
                            task.completed
                              ? "text-green-600"
                              : "text-orange-500"
                          }
                        >
                          {task.completed ? "Selesai" : "Belum selesai"}
                        </span>
                      </p>

                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(task)}
                          className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteTask(task)}
                          disabled={deletingId === task.id}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === task.id
                            ? "Menghapus..."
                            : "Hapus Task"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
