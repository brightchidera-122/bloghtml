const SUPABASE_URL = "https://deabqwvsqxshfitkctpe.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYWJxd3ZzcXhzaGZpdGtjdHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTkzMDksImV4cCI6MjA4NTY5NTMwOX0.c9tHUTTIJKMLp2o0E5AFtAbHHjJA075lwl1aZhdI_jg";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUser() {
  const { data, error } = await client.auth.getSession();

  if (error || !data.session) {
    window.location.href = "login.html";
  }
}

async function handleLogout() {
  const { error } = await client.auth.signOut();

  if (error) {
    alert("Logout failed");
  } else {
    alert("Logged out successfully");

    window.location.href = "login.html";
  }
}

const blogContainer = document.getElementById("blog-container");

async function loadBlogPosts() {
  blogContainer.innerHTML = "<p>Loading blog posts...</p>";

  const { data, error } = await client
    .from("blogpage")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    blogContainer.innerHTML = "<p>Error loading posts.</p>";
    return;
  }

  blogContainer.innerHTML = "";

  if (!data || data.length === 0) {
    blogContainer.innerHTML = "<p>No blog posts found.</p>";
    return;
  }

  data.forEach((post) => {
    const title = post["landmark title"];
    const description = post["description"];
    const image = post["image"];

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${image}" alt="${title}">
      <div class="card-content">
        <h2>${title}</h2>
        <p>${description}</p>
      </div>
    `;

    blogContainer.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await checkUser();
  await loadBlogPosts();
});
