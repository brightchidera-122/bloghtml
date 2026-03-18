const SUPABASE_URL = "https://deabqwvsqxshfitkctpe.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYWJxd3ZzcXhzaGZpdGtjdHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTkzMDksImV4cCI6MjA4NTY5NTMwOX0.c9tHUTTIJKMLp2o0E5AFtAbHHjJA075lwl1aZhdI_jg";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// AUTH GUARD
// ============================================================
async function checkAdminAccess() {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return false;
  }

  const { data: profile, error } = await client
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile || !profile.is_admin) {
    alert("Access denied. Admins only.");
    window.location.href = "login.html";
    return false;
  }

  const emailEl = document.getElementById("adminEmail");
  const initialEl = document.getElementById("adminInitial");
  if (emailEl) emailEl.textContent = user.email;
  if (initialEl) initialEl.textContent = user.email.charAt(0).toUpperCase();

  return true;
}

// ============================================================
// LOGOUT
// ============================================================
async function handleLogout() {
  const { error } = await client.auth.signOut();
  if (error) {
    alert("Logout failed: " + error.message);
  } else {
    window.location.href = "login.html";
  }
}

// ============================================================
// LOAD STATS
// ============================================================
async function loadStats() {
  const { count: postCount } = await client
    .from("blogpage")
    .select("*", { count: "exact", head: true });

  const totalEl = document.getElementById("totalPosts");
  const publishedEl = document.getElementById("publishedPosts");
  if (totalEl) totalEl.textContent = postCount ?? 0;
  if (publishedEl) publishedEl.textContent = postCount ?? 0;

  const { count: userCount } = await client
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const usersEl = document.getElementById("totalUsers");
  if (usersEl) usersEl.textContent = userCount ?? 0;
}

// ============================================================
// LOAD POSTS TABLE
// ============================================================
async function loadPostsTable() {
  const tbody = document.getElementById("postsTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#64748b;">Loading…</td></tr>`;

  const { data, error } = await client
    .from("blogpage")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:red;padding:20px;">Error loading posts.</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#64748b;">No posts yet. Add your first one above!</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  data.forEach((post) => {
    const landmark_title = post["landmark_title"] || "Untitled";
    const Image = post["Image"] || "";
    const Description = post["Description"] || "";
    const shortDesc =
      Description.length > 80
        ? Description.substring(0, 80) + "…"
        : Description;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        ${
          Image
            ? `<img class="post-thumb" src="${Image}" alt="${landmark_title}" onerror="this.style.display='none'">`
            : "—"
        }
      </td>
      <td>${landmark_title}</td>
      <td>${shortDesc || "—"}</td>
      <td>
        <button class="delete-btn" onclick="deletePost(${post.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================
// ADD POST
// FIX: column name must be "landmark title" to match Supabase table.
// Also includes the "image" column.
// ============================================================
async function handleAddPost(event) {
  event.preventDefault();

  const landmark_title = document.getElementById("landmarkTitle").value.trim();
  const Image = document.getElementById("landmarkImage").value.trim();
  const Description = document
    .getElementById("landmarkDescription")
    .value.trim();

  if (!landmark_title || !Description) {
    showMessage("Title and description are required.", "error");
    return;
  }

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "Publishing…";

  // Column name matches Supabase exactly: "landmark title"
  const { error } = await client
    .from("blogpage")
    .insert([{ landmark_title, Image, Description }]);

  btn.disabled = false;
  btn.textContent = "Publish Post";

  if (error) {
    showMessage(error.message, "error");
  } else {
    showMessage("Post published! It now appears on the blog.", "success");
    document.getElementById("landmarkTitle").value = "";
    document.getElementById("landmarkImage").value = "";
    document.getElementById("landmarkDescription").value = "";
    await loadPostsTable();
    await loadStats();
  }
}

// ============================================================
// DELETE POST
// ============================================================
async function deletePost(id) {
  if (!confirm("Delete this post? This cannot be undone.")) return;

  const { error } = await client.from("blogpage").delete().eq("id", id);

  if (error) {
    alert("Delete failed: " + error.message);
  } else {
    await loadPostsTable();
    await loadStats();
  }
}

// ============================================================
// SHOW MESSAGE
// ============================================================
function showMessage(text, type) {
  const el = document.getElementById("message");
  if (!el) return;
  el.textContent = text;
  el.className = type;
  setTimeout(() => {
    el.className = "";
    el.textContent = "";
  }, 5000);
}

// ============================================================
// AUTH STATE LISTENER
// ============================================================
client.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
});

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  const allowed = await checkAdminAccess();
  if (allowed) {
    await loadStats();
    await loadPostsTable();

    // Wire up the form submit
    const form = document.getElementById("addPostForm");
    if (form) form.addEventListener("submit", handleAddPost);
  }
});
