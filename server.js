import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ كلمة مرور الأدمن من Render (Environment Variables)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "CHANGE_ME_NOW";

// ====== Paths ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// موقعك (الملفات عندك في جذر الريبو: index.html / app.js / styles.css ...)
const frontendDir = __dirname;

// ====== Middleware ======
app.set("trust proxy", 1);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "sgsid",
    secret: process.env.SESSION_SECRET || "CHANGE_THIS_SESSION_SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 12, // 12 hours
    },
  })
);

// ====== Helpers ======
function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  return res.redirect("/admin-login.html");
}

// ====== Routes ======
app.get("/health", (req, res) => res.json({ ok: true }));

// صفحة تسجيل دخول الأدمن (بدون ملف خارجي عشان ما تضيع)
app.get("/admin-login.html", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>دخول الأدمن</title>
  <style>
    body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#0b1116;color:#eaf2ff}
    .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:18px}
    .card{width:min(720px,100%);background:rgba(16,26,34,.92);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:18px}
    h1{margin:0 0 10px;font-size:22px}
    .muted{color:#9fb0bf;font-size:13px;margin:0 0 14px}
    .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    input{flex:1;min-width:240px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#0b1116;color:#fff}
    button{padding:12px 16px;border-radius:12px;border:none;background:#1e90ff;color:#fff;cursor:pointer}
    button:disabled{opacity:.6;cursor:not-allowed}
    .msg{margin-top:10px;min-height:22px;color:#9fb0bf;font-size:13px}
    .ok{color:#6bffb2}
    .err{color:#ff7b7b}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>لوحة الأدمن</h1>
      <p class="muted">الدخول محمي. اكتب كلمة المرور.</p>
      <div class="row">
        <input id="pw" type="password" placeholder="كلمة المرور" autocomplete="current-password" />
        <button id="btn" onclick="login()">دخول</button>
      </div>
      <div class="msg" id="msg"></div>
    </div>
  </div>

<script>
async function login(){
  const password = document.getElementById("pw").value;
  const msg = document.getElementById("msg");
  const btn = document.getElementById("btn");

  msg.className = "msg";
  msg.textContent = "جاري التحقق…";
  btn.disabled = true;

  try{
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      credentials: "include",
      body: JSON.stringify({ password })
    });

    const data = await res.json().catch(()=> ({}));

    if(res.ok && data.ok){
      msg.textContent = "✅ تم الدخول";
      msg.className = "msg ok";
      location.href = "/admin";
      return;
    }

    msg.textContent = data.message || "❌ كلمة المرور خطأ";
    msg.className = "msg err";
  }catch(e){
    msg.textContent = "❌ صار خطأ بالشبكة";
    msg.className = "msg err";
  }finally{
    btn.disabled = false;
  }
}
</script>
</body>
</html>`);
});

// API تسجيل دخول الأدمن
app.post("/api/admin/login", (req, res) => {
  const password = String(req.body?.password || "");
  if (password && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, message: "❌ كلمة المرور خطأ" });
});

// تسجيل خروج
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// لوحة الأدمن (احترافية + إدارة قوالب مؤقتًا في المتصفح)
app.get("/admin", requireAdmin, (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>لوحة الأدمن</title>
  <style>
    body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#0b1116;color:#eaf2ff}
    .wrap{max-width:980px;margin:0 auto;padding:24px}
    .top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}
    .brand{font-weight:800;letter-spacing:.5px}
    .btn{background:#1e90ff;color:#fff;border:0;border-radius:12px;padding:10px 14px;cursor:pointer}
    .btn2{background:transparent;color:#eaf2ff;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:10px 14px;cursor:pointer}
    .grid{display:grid;grid-template-columns:1fr;gap:14px}
    @media(min-width:900px){.grid{grid-template-columns:1.2fr .8fr}}
    .card{background:rgba(16,26,34,.9);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px}
    h1{font-size:22px;margin:0}
    h2{font-size:16px;margin:0 0 10px}
    .muted{color:#9fb0bf;font-size:13px}
    .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
    input{flex:1;min-width:220px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#0b1116;color:#fff}
    label{display:block;margin:10px 0 6px;color:#cfe3ff;font-size:13px}
    .list{margin-top:10px;display:grid;gap:10px}
    .item{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.25)}
    .pill{font-size:12px;color:#9fb0bf;border:1px solid rgba(255,255,255,.14);padding:4px 8px;border-radius:999px}
    .ok{color:#6bffb2}
    .err{color:#ff7b7b}
    .small{font-size:12px}
    .sep{height:1px;background:rgba(255,255,255,.08);margin:12px 0}
    img{max-width:100%;border-radius:12px;border:1px solid rgba(255,255,255,.10)}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <div class="brand">SlideGenius</div>
        <div class="muted">لوحة الأدمن — إدارة القوالب</div>
      </div>
      <form method="POST" action="/logout" style="margin:0">
        <button class="btn2" type="submit">تسجيل خروج</button>
      </form>
    </div>

    <div class="grid">
      <div class="card">
        <h2>إضافة قالب جديد</h2>
        <div class="muted">حالياً تحفظ القوالب في متصفحك (مؤقت). لاحقاً نربطها بقاعدة بيانات.</div>

        <div class="sep"></div>

        <label>اسم القالب</label>
        <input id="tplName" placeholder="مثال: قالب رقعة 1" />

        <label>السعر (بالريال)</label>
        <input id="tplPrice" type="number" placeholder="مثال: 29" />

        <label>رابط صورة المعاينة (اختياري)</label>
        <input id="tplImg" placeholder="https://..." />

        <div style="margin-top:12px" class="row">
          <button class="btn" onclick="addTemplate()">إضافة</button>
          <span id="msg" class="small muted"></span>
        </div>

        <div class="sep"></div>

        <h2>قائمة القوالب</h2>
        <div id="list" class="list"></div>
      </div>

      <div class="card">
        <h2>ملاحظات</h2>
        <div class="muted small">
          ✅ دخول الأدمن شغّال. <br/>
          ✅ اللوحة الآن مرتبة. <br/><br/>
          الخطوة القادمة (إذا تبين): نخلي القوالب تظهر للمستخدمين في الصفحة الرئيسية + نحفظها في السيرفر.
        </div>

        <div class="sep"></div>

        <div class="item">
          <div>
            <div>الخطوط العربية (رقعة/نسخ/كوفي/ديوان…)</div>
            <div class="muted small">بنضيفها في المحرر</div>
          </div>
          <span class="pill">بعدها</span>
        </div>

        <div class="item">
          <div>
            <div>الدفع والاشتراكات</div>
            <div class="muted small">PayPal الآن — وبوابات ثانية لاحقاً</div>
          </div>
          <span class="pill">بعدها</span>
        </div>
      </div>
    </div>
  </div>

<script>
  const KEY = "SG_TEMPLATES";

  function loadTemplates(){
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  }
  function saveTemplates(list){
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
  }

  function render(){
    const listEl = document.getElementById("list");
    const items = loadTemplates();

    if(!items.length){
      listEl.innerHTML = '<div class="muted small">لا يوجد قوالب بعد. أضيفي أول قالب.</div>';
      return;
    }

    listEl.innerHTML = items.map((t, idx) => \`
      <div class="item">
        <div style="flex:1">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <strong>\${escapeHtml(t.name)}</strong>
            <span class="pill">\${escapeHtml(t.price)} SAR</span>
          </div>
          \${t.img ? \`<div style="margin-top:10px"><img src="\${escapeHtml(t.img)}" alt=""></div>\`
                  : \`<div class="muted small" style="margin-top:6px">بدون صورة</div>\`}
        </div>
        <div class="row" style="justify-content:flex-end">
          <button class="btn2" onclick="removeTemplate(\${idx})">حذف</button>
        </div>
      </div>
    \`).join("");
  }

  function addTemplate(){
    const msg = document.getElementById("msg");
    const name = document.getElementById("tplName").value.trim();
    const price = Number(document.getElementById("tplPrice").value);
    const img = document.getElementById("tplImg").value.trim();

    msg.className = "small muted";

    if(!name){
      msg.textContent = "❌ اكتبي اسم القالب";
      msg.className = "small err";
      return;
    }
    if(!price || price <= 0){
      msg.textContent = "❌ اكتبي سعر صحيح";
      msg.className = "small err";
      return;
    }

    const items = loadTemplates();
    items.unshift({ name, price, img });
    saveTemplates(items);

    document.getElementById("tplName").value = "";
    document.getElementById("tplPrice").value = "";
    document.getElementById("tplImg").value = "";

    msg.textContent = "✅ تم إضافة القالب";
    msg.className = "small ok";
    render();
  }

  function removeTemplate(idx){
    const items = loadTemplates();
    items.splice(idx, 1);
    saveTemplates(items);
    render();
  }

  render();
</script>
</body>
</html>`);
});

// ====== Static site ======
app.use(express.static(frontendDir));

// fallback: أي مسار غير معروف يوديه للصفحة الرئيسية
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
