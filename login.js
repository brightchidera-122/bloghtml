const SUPABASE_URL = "https://deabqwvsqxshfitkctpe.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYWJxd3ZzcXhzaGZpdGtjdHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTkzMDksImV4cCI6MjA4NTY5NTMwOX0.c9tHUTTIJKMLp2o0E5AFtAbHHjJA075lwl1aZhdI_jg";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Password toggle buttons ──────────────────────────────────────────────────
document.querySelectorAll(".password-toggle button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn.previousElementSibling;
    input.type = input.type === "password" ? "text" : "password";
    btn.textContent = input.type === "password" ? "Show" : "Hide";
  });
});

// ── Sign Up ──────────────────────────────────────────────────────────────────
const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById(
    "signup-confirm-password",
  ).value;

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  const submitBtn = signupForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account…";

  const { data, error } = await client.auth.signUp({ email, password });

  submitBtn.disabled = false;
  submitBtn.textContent = "Create Account";

  if (error) {
    alert(error.message);
    return;
  }

  alert("Account created! Please check your email to confirm, then sign in.");
  signupForm.reset();
});

// ── Sign In ──────────────────────────────────────────────────────────────────
const signinForm = document.getElementById("signinForm");

signinForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("signin-email").value.trim();
  const password = document.getElementById("signin-password").value;

  const submitBtn = signinForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in…";

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  submitBtn.disabled = false;
  submitBtn.textContent = "Sign In";

  if (error) {
    alert(error.message);
    return;
  }

  // Redirect admins to admin panel, regular users to blog
  const { data: profile } = await client
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();

  if (profile && profile.is_admin) {
    window.location.href = "admin.html";
  } else {
    window.location.href = "blog.html";
  }
});
