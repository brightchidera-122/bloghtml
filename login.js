const SUPABASE_URL = "https://deabqwvsqxshfitkctpe.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYWJxd3ZzcXhzaGZpdGtjdHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTkzMDksImV4cCI6MjA4NTY5NTMwOX0.c9tHUTTIJKMLp2o0E5AFtAbHHjJA075lwl1aZhdI_jg";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById(
    "signup-confirm-password",
  ).value;

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  const { data, error } = await client.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.log(error);
    alert(error.message);
    return;
  }
  alert("account created successful, login now");
});

const signinForm = document.getElementById("signinForm");

signinForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("signin-email").value;
  const password = document.getElementById("signin-password").value;

  const { data, error } = await client.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Login successful!");

  window.location.href = "blog.html";
});
s;
