const SUPABASE_URL = "https://deabqwvsqxshfitkctpe.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYWJxd3ZzcXhzaGZpdGtjdHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTkzMDksImV4cCI6MjA4NTY5NTMwOX0.c9tHUTTIJKMLp2o0E5AFtAbHHjJA075lwl1aZhdI_jg";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// AUTH GUARD — runs first before anything else loads
// Checks: (1) logged in, (2) is admin via profiles table
// ============================================================
async function checkAdminAccess() {
  const {
    data: { user },
  } = await client.auth.getUser();

  // Not logged in → send to login
  if (!user) {
    window.location.href = "login.html";
    return false;
  }

  // Check admin status in profiles table
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

  // ✅ Show admin's email in the sidebar
  const emailEl = document.getElementById("adminEmail");
  const initialEl = document.getElementById("adminInitial");
  if (emailEl) emailEl.textContent = user.email;
  if (initialEl) initialEl.textContent = user.email.charAt(0).toUpperCase();

  return true;
}

// ============================================================
// SIGN OUT — signs out of Supabase entirely.
// Because blog.js uses the same Supabase project + credentials,
// signing out here also invalidates the session on the blog page.
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
// LOAD STATS — post count for the dashboard cards
// ============================================================
async function loadStats() {
  const { count: postCount } = await client
    .from("blogpage")
    .select("*", { count: "exact", head: true });

  const totalEl = document.getElementById("totalPosts");
  const publishedEl = document.getElementById("publishedPosts");

  if (totalEl) totalEl.textContent = postCount ?? 0;
  if (publishedEl) publishedEl.textContent = postCount ?? 0;

  // User count from profiles table
  const { count: userCount } = await client
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const usersEl = document.getElementById("totalUsers");
  if (usersEl) usersEl.textContent = userCount ?? 0;
}

// ============================================================
// LOAD POSTS TABLE — shows existing posts with delete option
// ============================================================
async function loadPostsTable() {
  const tbody = document.getElementById("postsTableBody");
  tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Loading...</td></tr>`;

  const { data, error } = await client
    .from("blogpage")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Error loading posts.</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">No posts yet. Add your first one above!</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  data.forEach((post) => {
    const title = post["landmark title"] || "Untitled";
    const image = post["image"] || "";
    const description = post["description"] || "";
    const shortDesc =
      description.length > 80
        ? description.substring(0, 80) + "…"
        : description;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        ${
          image
            ? `<img class="post-thumb" src="${image}" alt="${title}" onerror="this.style.display='none'">`
            : "—"
        }
      </td>
      <td>${title}</td>
      <td>${shortDesc || "—"}</td>
      <td>
        <button class="delete-btn" onclick="deletePost(${post.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================
// ADD POST — inserts into "blogpage" table, appears on blog page
// Column names match your existing Supabase table exactly:
//   "landmark title", "image", "description"
// ============================================================
async function handleAddPost(event) {
  event.preventDefault();

  const landmark = document.getElementById("landmarkTitle").value.trim();
  const image = document.getElementById("landmarkImage").value.trim();
  const description = document
    .getElementById("landmarkDescription")
    .value.trim();

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "Publishing...";

  const { error } = await client
    .from("blogpage")
    .insert([{ landmark, description }]);

  btn.disabled = false;
  btn.textContent = "✦ Publish Post";

  if (error) {
    showMessage(error.message, "error");
  } else {
    showMessage("✅ Post published! It now appears on the blog.", "success");
    document.getElementById("landmarkTitle").value = "";
    document.getElementById("landmarkImage").value = "";
    document.getElementById("landmarkDescription").value = "";
    // Refresh the table and stats
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
// SHOW MESSAGE HELPER
// ============================================================
function showMessage(text, type) {
  const el = document.getElementById("message");
  el.textContent = text;
  el.className = type; // "success" or "error"
  setTimeout(() => {
    el.className = "";
    el.textContent = "";
  }, 5000);
}

// ============================================================
// LISTEN FOR AUTH CHANGES
// If the user signs out on the blog page, this tab also redirects.
// ============================================================
client.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
});

// ============================================================
// INIT — guard first, then load data
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  const allowed = await checkAdminAccess();
  if (allowed) {
    await loadStats();
    await loadPostsTable();
  }
});
