import express from "express";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "lax",
      secure: false
    }
  })
);

// ===== Auth =====
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect("/admin-login");
}

// ===== Routes =====
app.get("/", (req, res) => {
  res.send(`<h1>SlideGenius Platform</h1><a href="/admin">Admin</a>`);
});

app.get("/admin-login", (req, res) => {
  res.send(`
    <h2>Admin Login</h2>
    <form method="POST" action="/admin-login">
      <input type="password" name="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  `);
});

app.post("/admin-login", (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect("/admin");
  } else {
    res.send("❌ Wrong password");
  }
});

app.get("/admin", requireAdmin, (req, res) => {
  res.send(`
    <h1>Admin Dashboard</h1>
    <p>✅ Logged in</p>
    <form method="POST" action="/logout">
      <button>Logout</button>
    </form>
  `);
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
