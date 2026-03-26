import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://hbutzuuwigextzhkgabs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidXR6dXV3aWdleHR6aGtnYWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTE4NTUsImV4cCI6MjA4OTU4Nzg1NX0.3pqLluVATmMFMZWdC8Klqtrm81HJ8nuSSC0YT9qaa8Y"
);

const FREE_DAILY = 3;
const COSTS = { build: 50, edit: 30, test: 40 };
const today = () => new Date().toISOString().slice(0, 10);
const ls = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };

const TEMPLATES = [
  { icon: "👥", name: "CRM Sistemi", p: "Müşteri takip sistemi oluştur: müşteri listesi, detay sayfası, iletişim geçmişi, notlar, arama, filtreleme, istatistik kartları" },
  { icon: "🛒", name: "E-Ticaret Paneli", p: "E-ticaret yönetim paneli oluştur: ürün kataloğu, sipariş takibi, stok yönetimi, gelir grafikleri, müşteri listesi" },
  { icon: "✅", name: "Kanban Board", p: "Kanban görev yönetim uygulaması oluştur: sürükle-bırak kartlar, 3 sütun, etiketler, öncelik, renk kodlama" },
  { icon: "📊", name: "Analytics Dashboard", p: "Analitik dashboard oluştur: çizgi/bar grafikler, KPI kartları, filtreleme, tarih aralığı, gerçek zamanlı veri" },
  { icon: "💬", name: "Chat Uygulaması", p: "Sohbet uygulaması oluştur: mesaj balonları, kullanıcılar, emoji picker, online durumu, arama" },
  { icon: "💰", name: "Finans Takip", p: "Kişisel finans uygulaması oluştur: gelir/gider girişi, pasta/bar grafikler, aylık özet, bütçe hedefi" },
  { icon: "📅", name: "Takvim", p: "Takvim uygulaması oluştur: aylık/haftalık görünüm, etkinlik ekleme/düzenleme, renk kodlama, drag&drop" },
  { icon: "🚀", name: "Landing Page", p: "Modern SaaS landing page oluştur: hero, features grid, pricing table, testimonials, CTA, footer" },
];

const SYS_BUILD = `Sen profesyonel bir frontend geliştiricisin. Kullanıcının istediği uygulamayı TEK BİR HTML dosyası olarak oluştur.
KURALLAR:
- Sadece HTML, CSS ve vanilla JavaScript kullan, harici kütüphane KULLANMA
- Modern, profesyonel, görsel olarak etkileyici koyu tema tasarım (arka plan: #0a0a0f)
- Türkçe arayüz, tam çalışan interaktif uygulama, örnek veriler
- Responsive, animasyonlu, SADECE HTML kodu döndür
- Kod blokları KULLANMA, direkt <!DOCTYPE html> ile başla`;

async function callAI(messages, maxTokens = 4000) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: SYS_BUILD, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Hata: ${res.status}`); }
  const d = await res.json();
  return d.text || "";
}

const G = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;background:#07070c;color:#ededf5;font-family:'Sora',sans-serif;overflow:hidden}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#252538;border-radius:4px}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes msgIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,92,252,.2)}50%{box-shadow:0 0 40px rgba(124,92,252,.5)}}
@keyframes gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}}
@keyframes scanline{from{top:0}to{top:100%}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes morph{0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%}}
@keyframes orbit{from{transform:rotate(0deg) translateX(120px) rotate(0deg)}to{transform:rotate(360deg) translateX(120px) rotate(-360deg)}}
@keyframes pulseDot{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.5);opacity:1}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes card-hover{to{transform:translateY(-4px);border-color:#7c5cfc}}
.card-h{transition:all .3s ease}
.card-h:hover{transform:translateY(-4px)!important;border-color:#7c5cfc!important;box-shadow:0 12px 40px rgba(124,92,252,.15)!important}
.cmsg{animation:msgIn .45s cubic-bezier(.34,1.3,.64,1) both}
.pj:hover{background:#16161f!important}
.pj.active{background:rgba(124,92,252,.12)!important;border-color:rgba(124,92,252,.3)!important}
.hv:hover{background:#16161f!important}
.sugg:hover{border-color:#7c5cfc!important;background:rgba(124,92,252,.08)!important;transform:translateY(-2px)}
.sugg{transition:all .2s}
.send:hover:not(:disabled){transform:scale(1.08);box-shadow:0 4px 20px rgba(124,92,252,.4)!important}
.send:disabled{opacity:.35;cursor:not-allowed}
`;

export default function App() {
  // ── Auth ──
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authTab, setAuthTab] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // ── App ──
  const [projs, setProjs] = useState(() => ls("af_projs", []));
  const [actProj, setActProj] = useState(() => { const p = ls("af_projs", []); return p.length > 0 ? p[0].id : null; });
  const [tok, setTok] = useState(() => ls("af_tok", 99999));
  const [daily, setDaily] = useState(() => ls("af_daily", { d: today(), u: 0 }));
  const [pg, setPg] = useState("home");
  const [code, setCode] = useState("");
  const [gen, setGen] = useState(false);
  const [genSteps, setGenSteps] = useState([]);
  const [genPrompt, setGenPrompt] = useState("");
  const [preview, setPreview] = useState(null);
  const [codeView, setCodeView] = useState(false);
  const [input, setInput] = useState("");
  const [toast, setToast] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [sideOpen, setSideOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // ── Persist ──
  useEffect(() => { localStorage.setItem("af_projs", JSON.stringify(projs)); }, [projs]);
  useEffect(() => { localStorage.setItem("af_tok", JSON.stringify(tok)); }, [tok]);
  useEffect(() => { localStorage.setItem("af_daily", JSON.stringify(daily)); }, [daily]);

  // ── Auth listener ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) loadUserProjects(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUserProjects(session.user.id);
      else { setAuthLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [genSteps, gen]);

  const notify = (m, t = "info") => { setToast({ m, t }); setTimeout(() => setToast(null), 3000); };

  const freeLeft = () => {
    if (daily.d !== today()) return FREE_DAILY;
    return Math.max(0, FREE_DAILY - daily.u);
  };

  const loadUserProjects = async (uid) => {
    const { data } = await supabase.from("projects").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const mapped = data.map(p => ({ id: p.id, name: p.name, code: p.code, date: new Date(p.created_at).toLocaleString("tr-TR") }));
      setProjs(mapped);
      setActProj(mapped[0].id);
      setPreview(mapped[0]);
      setPg("preview");
    }
  };

  const saveProjectToDB = async (uid, proj) => {
    await supabase.from("projects").upsert({ id: proj.id, user_id: uid, name: proj.name, code: proj.code });
  };

  const handleLogin = async () => {
    setAuthBusy(true); setAuthErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPass });
    if (error) setAuthErr(error.message);
    setAuthBusy(false);
  };

  const handleRegister = async () => {
    setAuthBusy(true); setAuthErr("");
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPass });
    if (error) setAuthErr(error.message);
    else setAuthErr("OK:Doğrulama emaili gönderildi, kontrol edin.");
    setAuthBusy(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProjs([]); setActProj(null); setPreview(null); setPg("home");
    localStorage.clear();
  };

  // ── Build ──
  const STEP_MSGS = [
    { icon: "🧠", title: "İstek analiz ediliyor", detail: "Yapay zeka ne istediğinizi derinlemesine anlıyor, en iyi mimariyi planlıyor." },
    { icon: "🏗️", title: "Mimari tasarlanıyor", detail: "Bileşen yapısı, veri akışı ve kullanıcı deneyimi planı oluşturuluyor." },
    { icon: "⚡", title: "Kodlar yazılıyor", detail: "HTML, CSS ve JavaScript bileşenleri tek tek hayata geçiriliyor." },
    { icon: "🎨", title: "Tasarım uygulanıyor", detail: "Animasyonlar, renkler, tipografi ve responsive layout ekleniyor." },
    { icon: "🔧", title: "Son dokunuşlar yapılıyor", detail: "Performans optimizasyonu, hata kontrolü ve tarayıcı uyumu sağlanıyor." },
  ];

  const build = async (pr, isEdit = false) => {
    if (gen) return;

    // Token/free check
    const t = today();
    let d = daily.d === t ? { ...daily } : { d: t, u: 0 };
    if (d.u < FREE_DAILY) {
      d = { ...d, u: d.u + 1 };
      setDaily(d);
    } else if (tok < COSTS.build) {
      notify("Yetersiz kredi!", "error");
      return;
    } else {
      setTok(p => p - COSTS.build);
    }

    setGen(true);
    setGenPrompt(pr);
    setPg("gen");
    setGenSteps(STEP_MSGS.map(s => ({ ...s, done: false })));

    const msgs = isEdit && preview
      ? [{ role: "user", content: `Güncelle: ${pr}\n\nMevcut:\n${preview.code}\n\nTam HTML döndür.` }]
      : [{ role: "user", content: pr }];

    try {
      const aiPromise = callAI(msgs);
      let aiDone = false;
      aiPromise.then(() => { aiDone = true; }).catch(() => { aiDone = true; });

      // İlk adım hemen
      setGenSteps(p => p.map((s, i) => i === 0 ? { ...s, done: true } : s));

      let cur = 1;
      const ticker = setInterval(() => {
        if (cur < STEP_MSGS.length - 1) {
          setGenSteps(p => p.map((s, i) => i === cur ? { ...s, done: true } : s));
          cur++;
        } else if (aiDone) {
          clearInterval(ticker);
        }
      }, 4500);

      let c = await aiPromise;
      clearInterval(ticker);
      setGenSteps(p => p.map(s => ({ ...s, done: true })));
      await new Promise(r => setTimeout(r, 500));

      c = c.replace(/^```html?\n?/i, "").replace(/\n?```$/g, "").trim();
      if (!c.startsWith("<!DOCTYPE") && !c.startsWith("<html")) {
        const idx = c.indexOf("<!DOCTYPE"); if (idx > -1) c = c.substring(idx);
      }

      const now = new Date().toLocaleString("tr-TR");
      if (isEdit && actProj) {
        setProjs(p => p.map(x => x.id === actProj ? { ...x, code: c, date: now } : x));
        const updated = { id: actProj, name: pr.substring(0, 40), code: c, date: now };
        setPreview(updated);
        if (user) saveProjectToDB(user.id, updated);
      } else {
        const newProj = { id: Date.now(), name: pr.substring(0, 40) + (pr.length > 40 ? "…" : ""), code: c, date: now };
        setProjs(p => [newProj, ...p]);
        setActProj(newProj.id);
        setPreview(newProj);
        if (user) saveProjectToDB(user.id, newProj);
      }

      setPg("preview");
      notify("Uygulama hazır! 🎉", "ok");
    } catch (e) {
      notify("Hata: " + e.message, "error");
      setPg("home");
    } finally {
      setGen(false);
    }
  };

  const dl = (c) => { const b = new Blob([c], { type: "text/html" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "uygulama.html"; a.click(); URL.revokeObjectURL(u); };

  // ── LOADING ──
  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#07070c", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{G}</style>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #252538", borderTopColor: "#7c5cfc", animation: "spin 1s linear infinite" }} />
    </div>
  );

  // ── AUTH ──
  if (!user) return (
    <div style={{ minHeight: "100vh", background: "#07070c", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{G}</style>
      <div style={{ width: 400, animation: "fadeUp .5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#7c5cfc,#5ce0d6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 14px", animation: "glow 3s ease infinite" }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px" }}>AppForge<span style={{ background: "linear-gradient(135deg,#7c5cfc,#5ce0d6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>.ai</span></h1>
          <p style={{ fontSize: 13, color: "#55556e", marginTop: 6 }}>AI destekli uygulama oluşturucu</p>
        </div>
        <div style={{ background: "#0f0f18", border: "1px solid #252538", borderRadius: 20, padding: 28 }}>
          <div style={{ display: "flex", background: "#07070c", borderRadius: 12, padding: 4, marginBottom: 22 }}>
            {["login", "register"].map(t => (
              <button key={t} onClick={() => { setAuthTab(t); setAuthErr(""); }} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: authTab === t ? "#7c5cfc" : "transparent", color: authTab === t ? "#fff" : "#55556e", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>
                {t === "login" ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            ))}
          </div>
          <button onClick={handleGoogle} style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: "1px solid #252538", background: "#07070c", color: "#ededf5", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16, transition: "all .2s" }} className="hv">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/></svg>
            Google ile {authTab === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#252538" }} /><span style={{ fontSize: 11, color: "#55556e" }}>veya email ile</span><div style={{ flex: 1, height: 1, background: "#252538" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "#55556e", display: "block", marginBottom: 5 }}>Email</label>
            <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="ornek@email.com" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #252538", background: "#07070c", color: "#ededf5", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: "#55556e", display: "block", marginBottom: 5 }}>Şifre</label>
            <input type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} onKeyDown={e => e.key === "Enter" && (authTab === "login" ? handleLogin() : handleRegister())} placeholder="••••••••" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #252538", background: "#07070c", color: "#ededf5", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          {authErr && <div style={{ fontSize: 12, color: authErr.startsWith("OK:") ? "#22c55e" : "#ef4444", marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: authErr.startsWith("OK:") ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)" }}>{authErr.replace("OK:", "")}</div>}
          <button onClick={authTab === "login" ? handleLogin : handleRegister} disabled={authBusy || !authEmail || !authPass} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: (!authEmail || !authPass || authBusy) ? "#252538" : "linear-gradient(135deg,#7c5cfc,#5ce0d6)", color: (!authEmail || !authPass || authBusy) ? "#55556e" : "#fff", fontSize: 15, fontWeight: 700, cursor: (!authEmail || !authPass || authBusy) ? "default" : "pointer" }}>
            {authBusy ? "..." : authTab === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── GENERATING (Sohbet UI) ──
  if (pg === "gen") return (
    <div style={{ minHeight: "100vh", background: "#07070c", display: "flex", flexDirection: "column" }}>
      <style>{G + `
        @keyframes typing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-7px)}}
      `}</style>

      {/* Top bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "11px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(7,7,12,.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid #1a1a28" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7c5cfc,#5ce0d6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, animation: "glow 3s ease infinite" }}>⚡</div>
          <span style={{ fontSize: 16, fontWeight: 700 }}>AppForge<span style={{ background: "linear-gradient(135deg,#7c5cfc,#5ce0d6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>.ai</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 20, background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.2)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulseDot 1.4s infinite" }} />
          <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>AI Kodluyor</span>
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, maxWidth: 700, width: "100%", margin: "0 auto", padding: "88px 20px 110px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>

        {/* User bubble */}
        <div className="cmsg" style={{ display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "flex-end" }}>
          <div style={{ maxWidth: "72%", background: "linear-gradient(135deg,#7c5cfc,rgba(92,224,214,.8))", borderRadius: "18px 18px 4px 18px", padding: "12px 18px", fontSize: 14, lineHeight: 1.65, color: "#fff", boxShadow: "0 6px 28px rgba(124,92,252,.25)" }}>
            {genPrompt}
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#16161f", border: "1px solid #252538", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>👤</div>
        </div>

        {/* AI step messages */}
        {genSteps.map((s, i) => (
          <div key={i} className="cmsg" style={{ display: "flex", gap: 12, alignItems: "flex-start", animationDelay: `${i * .1}s` }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: s.done ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#7c5cfc,#5ce0d6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0, boxShadow: `0 4px 18px ${s.done ? "rgba(34,197,94,.22)" : "rgba(124,92,252,.22)"}`, transition: "all .6s", position: "relative" }}>
              {s.icon}
              {!s.done && <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#7c5cfc", animation: "spin 1s linear infinite" }} />}
            </div>
            <div style={{ flex: 1, background: s.done ? "rgba(34,197,94,.05)" : "#0f0f18", border: `1px solid ${s.done ? "rgba(34,197,94,.15)" : "#1a1a28"}`, borderRadius: "4px 18px 18px 18px", padding: "13px 17px", transition: "all .5s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.done ? "#22c55e" : "#7c5cfc", textTransform: "uppercase", letterSpacing: .6 }}>{s.done ? "✓ Tamamlandı" : "⟳ İşleniyor"}</span>
                {!s.done && <div style={{ display: "flex", gap: 3 }}>{[0, 1, 2].map(j => <span key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: "#7c5cfc", display: "inline-block", animation: "typing .9s ease infinite", animationDelay: `${j * .18}s`, opacity: .7 }} />)}</div>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#ededf5", marginBottom: s.done ? 5 : 0 }}>{s.title}</div>
              {s.done && <div style={{ fontSize: 12, color: "#55556e", lineHeight: 1.6, marginBottom: 8 }}>{s.detail}</div>}
              {s.done && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {["HTML", "CSS", "JavaScript", "Responsive", "Dark Theme"].slice(0, Math.min(i + 2, 5)).map(t => (
                    <span key={t} style={{ padding: "2px 9px", borderRadius: 6, background: "rgba(124,92,252,.1)", color: "#7c5cfc", fontSize: 10, fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live terminal - 2. adımdan sonra */}
        {genSteps.filter(s => s.done).length >= 2 && (
          <div className="cmsg" style={{ display: "flex", gap: 12, animationDelay: ".25s" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#0d1117", border: "1px solid #30363d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💻</div>
            <div style={{ flex: 1, background: "#0d1117", border: "1px solid #30363d", borderRadius: "4px 18px 18px 18px", padding: "14px 18px", fontFamily: "'Fira Code',monospace", fontSize: 11.5, lineHeight: 1.9, position: "relative", overflow: "hidden" }}>
              <div style={{ color: "#8b949e", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>▸ appforge / ai-code-generator</div>
              <div><span style={{ color: "#ff7b72" }}>const</span> <span style={{ color: "#79c0ff" }}>app</span> <span style={{ color: "#ff7b72" }}>=</span> <span style={{ color: "#d2a8ff" }}>await</span> <span style={{ color: "#ffa657" }}>forge</span>(<span style={{ color: "#a5d6ff" }}>"{genPrompt.substring(0, 28)}{genPrompt.length > 28 ? "..." : ""}"</span>);</div>
              <div><span style={{ color: "#d2a8ff" }}>await</span> app.<span style={{ color: "#7ee787" }}>generateUI</span>();</div>
              <div><span style={{ color: "#d2a8ff" }}>await</span> app.<span style={{ color: "#7ee787" }}>applyStyles</span>(<span style={{ color: "#a5d6ff" }}>"dark-pro"</span>);</div>
              {genSteps.filter(s => s.done).length >= 4 && <div><span style={{ color: "#d2a8ff" }}>await</span> app.<span style={{ color: "#7ee787" }}>optimize</span>();</div>}
              <div style={{ color: "#7ee787", marginTop: 6 }}><span style={{ color: "#e6edf3" }}>// Oluşturuluyor</span><span style={{ animation: "blink 1s infinite" }}>▌</span></div>
              <div style={{ position: "absolute", left: 0, right: 0, height: "1px", background: "linear-gradient(90deg,transparent,rgba(126,231,135,.1),transparent)", animation: "scanline 3s linear infinite", pointerEvents: "none" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Progress bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "13px 28px", background: "rgba(7,7,12,.95)", backdropFilter: "blur(20px)", borderTop: "1px solid #1a1a28", zIndex: 100 }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontSize: 12, color: "#55556e" }}>{genSteps.find(s => !s.done)?.title || "Tamamlanıyor..."}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7c5cfc" }}>{Math.round((genSteps.filter(s => s.done).length / Math.max(genSteps.length, 1)) * 100)}%</span>
          </div>
          <div style={{ height: 3, background: "#1a1a28", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#7c5cfc,#5ce0d6)", width: `${(genSteps.filter(s => s.done).length / Math.max(genSteps.length, 1)) * 100}%`, transition: "width .8s cubic-bezier(.4,0,.2,1)", boxShadow: "0 0 10px rgba(124,92,252,.4)" }} />
          </div>
        </div>
      </div>
    </div>
  );

  // ── HOME ──
  if (pg === "home") return (
    <div style={{ minHeight: "100vh", background: "#07070c", overflowY: "auto" }}>
      <style>{G}</style>

      {/* Orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,.07), transparent 70%)", top: `${-15 + mousePos.y * 8}%`, right: `${-8 + mousePos.x * 5}%`, transition: "top .8s, right .8s", animation: "morph 15s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(92,224,214,.05), transparent 70%)", bottom: `${-10 + mousePos.y * 6}%`, left: `${-5 + mousePos.x * 4}%`, transition: "bottom .8s, left .8s", animation: "morph 12s ease-in-out infinite reverse" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,92,252,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,.025) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      </div>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "10px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(7,7,12,.85)", backdropFilter: "blur(24px)", borderBottom: "1px solid #1a1a28" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c5cfc,#5ce0d6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, animation: "glow 3s ease infinite" }}>⚡</div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.5px" }}>AppForge<span style={{ background: "linear-gradient(135deg,#7c5cfc,#5ce0d6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>.ai</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.15)" }}>
            <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>◆ {tok.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 8, background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.15)" }}>
            <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>{freeLeft()} ücretsiz</span>
          </div>
          {projs.length > 0 && (
            <button onClick={() => { setPreview(projs[0]); setPg("preview"); }} className="hv" style={{ padding: "5px 14px", borderRadius: 9, border: "1px solid #252538", background: "transparent", color: "#9898b8", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              Projelerim ({projs.length})
            </button>
          )}
          <button onClick={handleLogout} className="hv" style={{ padding: "5px 10px", borderRadius: 9, border: "1px solid #252538", background: "transparent", color: "#55556e", fontSize: 13, cursor: "pointer" }}>⏻</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "120px 24px 40px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0 }}>
          {[0, 1, 2, 3].map(i => <div key={i} style={{ position: "absolute", width: 6, height: 6, borderRadius: "50%", background: `hsl(${260 + i * 25}, 80%, 65%)`, animation: `orbit ${10 + i * 3}s linear infinite`, animationDelay: `${i * -2}s`, opacity: .25 }} />)}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 100, background: "rgba(124,92,252,.08)", border: "1px solid rgba(124,92,252,.18)", marginBottom: 28, fontSize: 13, color: "#7c5cfc", fontWeight: 500, animation: "fadeUp .6s ease" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulseDot 2s infinite" }} />
          Yapay zeka ile anında uygulama oluştur
        </div>
        <h1 style={{ fontSize: "clamp(32px,5.5vw,64px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-3px", marginBottom: 18, animation: "fadeUp .6s ease .1s both" }}>
          Hayal et,<br />
          <span style={{ background: "linear-gradient(135deg,#7c5cfc,#5ce0d6,#fc5c8c,#7c5cfc)", backgroundSize: "300% 300%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gradient 6s ease infinite" }}>biz kodlayalım.</span>
        </h1>
        <p style={{ fontSize: 16, color: "#9898b8", maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.65, animation: "fadeUp .6s ease .2s both" }}>
          Saniyeler içinde tam çalışan web uygulamaları. Kodlama bilgisine gerek yok.
        </p>

        {/* Input */}
        <div style={{ background: "#0f0f18", border: "1px solid #252538", borderRadius: 20, padding: "4px 4px 4px 18px", maxWidth: 640, margin: "0 auto", animation: "fadeUp .6s ease .3s both", display: "flex", alignItems: "flex-end", gap: 8 }}>
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (input.trim()) { build(input.trim()); setInput(""); } } }}
            placeholder="Bir e-ticaret yönetim paneli oluştur..."
            rows={2}
            style={{ flex: 1, background: "transparent", border: "none", color: "#ededf5", fontSize: 15, fontFamily: "'Sora',sans-serif", resize: "none", outline: "none", lineHeight: 1.6, padding: "12px 0", maxHeight: 140, overflowY: "auto" }}
          />
          <button className="send" onClick={() => { if (input.trim()) { build(input.trim()); setInput(""); } }} disabled={!input.trim() || gen} style={{ width: 44, height: 44, borderRadius: 13, border: "none", background: "linear-gradient(135deg,#7c5cfc,#5ce0d6)", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s", boxShadow: "0 2px 12px rgba(124,92,252,.3)", cursor: "pointer" }}>↑</button>
        </div>
        <p style={{ fontSize: 11, color: "#55556e", marginTop: 10 }}>{freeLeft() > 0 ? `✨ ${freeLeft()} ücretsiz hak kaldı` : `◆ ${COSTS.build} kredi`} · Enter ile gönder</p>
      </div>

      {/* Templates */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,transparent,#252538,transparent)" }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: "#55556e", textTransform: "uppercase", letterSpacing: 3 }}>veya şablonla başla</span>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,transparent,#252538,transparent)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
          {TEMPLATES.map((t, i) => (
            <div key={i} className="card-h" onClick={() => { build(t.p); }} style={{ background: "#0f0f18", border: "1px solid #1a1a28", borderRadius: 14, padding: 18, cursor: "pointer", animation: `fadeUp .5s ease ${i * .04}s both` }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "#55556e", lineHeight: 1.5 }}>{t.p.substring(0, 55)}…</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── PREVIEW ──
  if (pg === "preview") return (
    <div style={{ height: "100vh", background: "#07070c", display: "flex", overflow: "hidden" }}>
      <style>{G}</style>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "10px 18px", borderRadius: 12, background: toast.t === "ok" ? "#22c55e" : toast.t === "error" ? "#ef4444" : "#7c5cfc", color: "#fff", fontWeight: 600, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,.4)", animation: "fadeUp .3s ease" }}>{toast.m}</div>}

      {/* Sidebar */}
      {sideOpen && (
        <div style={{ width: 260, minWidth: 260, background: "#0a0a12", borderRight: "1px solid #1a1a28", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "13px 14px 10px", borderBottom: "1px solid #1a1a28", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div onClick={() => setPg("home")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c5cfc,#5ce0d6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>AppForge</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={handleLogout} className="hv" style={{ background: "none", border: "none", color: "#55556e", cursor: "pointer", fontSize: 13, padding: "3px 7px", borderRadius: 6 }} title="Çıkış">⏻</button>
              <button onClick={() => setSideOpen(false)} className="hv" style={{ background: "none", border: "none", color: "#55556e", cursor: "pointer", fontSize: 16, padding: "3px 6px", borderRadius: 6 }}>✕</button>
            </div>
          </div>

          <div style={{ padding: "8px 10px" }}>
            <button onClick={() => setPg("home")} className="hv" style={{ width: "100%", padding: "8px 0", borderRadius: 9, border: "1px dashed #1a1a28", background: "transparent", color: "#9898b8", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>＋ Yeni Proje</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#55556e", textTransform: "uppercase", letterSpacing: 2, padding: "4px 8px 8px" }}>Projeler</div>
            {projs.map(p => (
              <div key={p.id} className={`pj ${p.id === actProj ? "active" : ""}`} onClick={() => { setActProj(p.id); setPreview(p); setCodeView(false); }} style={{ padding: "9px 10px", borderRadius: 9, cursor: "pointer", marginBottom: 3, border: "1px solid transparent", transition: "all .2s" }}>
                <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#55556e", marginTop: 2 }}>{p.date}</div>
              </div>
            ))}
          </div>

          {/* Edit input */}
          <div style={{ borderTop: "1px solid #1a1a28", padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#55556e", marginBottom: 7 }}>✏️ Değişiklik Yap</div>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              <textarea
                id="editInput"
                placeholder="Ne değiştirmek istiyorsun?"
                rows={2}
                style={{ flex: 1, background: "#07070c", border: "1px solid #1a1a28", borderRadius: 8, color: "#ededf5", fontSize: 11, fontFamily: "'Sora',sans-serif", padding: "7px 9px", resize: "none", outline: "none" }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const v = e.target.value.trim();
                    if (v) { build(v, true); e.target.value = ""; }
                  }
                }}
              />
              <button onClick={() => {
                const el = document.getElementById("editInput");
                if (el && el.value.trim()) { build(el.value.trim(), true); el.value = ""; }
              }} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#7c5cfc", color: "#fff", fontSize: 14, cursor: "pointer", flexShrink: 0 }}>↑</button>
            </div>
          </div>
        </div>
      )}

      {/* Main preview */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "7px 14px", borderBottom: "1px solid #1a1a28", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0a0a12", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!sideOpen && <button onClick={() => setSideOpen(true)} className="hv" style={{ background: "none", border: "1px solid #1a1a28", color: "#9898b8", cursor: "pointer", padding: "4px 10px", borderRadius: 7, fontSize: 14 }}>☰</button>}
            <div style={{ display: "flex", background: "#07070c", borderRadius: 8, border: "1px solid #1a1a28", overflow: "hidden" }}>
              <button onClick={() => setCodeView(false)} style={{ padding: "5px 14px", border: "none", fontSize: 12, fontWeight: 500, fontFamily: "'Sora',sans-serif", cursor: "pointer", background: !codeView ? "#7c5cfc" : "transparent", color: !codeView ? "#fff" : "#55556e", transition: "all .2s" }}>Önizleme</button>
              <button onClick={() => setCodeView(true)} style={{ padding: "5px 14px", border: "none", fontSize: 12, fontWeight: 500, fontFamily: "'Sora',sans-serif", cursor: "pointer", background: codeView ? "#7c5cfc" : "transparent", color: codeView ? "#fff" : "#55556e", transition: "all .2s" }}>{"</>"} Kod</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => preview && dl(preview.code)} className="hv" style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #1a1a28", background: "transparent", color: "#9898b8", cursor: "pointer", fontSize: 12 }}>⬇ İndir</button>
            <button onClick={() => { if (preview) { const w = window.open(); w.document.write(preview.code); w.document.close(); } }} className="hv" style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #1a1a28", background: "transparent", color: "#9898b8", cursor: "pointer", fontSize: 12 }}>↗ Aç</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {codeView
            ? <div style={{ height: "100%", overflow: "auto", background: "#08080e" }}><pre style={{ padding: 20, fontSize: 11, lineHeight: 1.7, fontFamily: "'Fira Code',monospace", color: "#b4b4cc", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{preview?.code || ""}</pre></div>
            : <iframe srcDoc={preview?.code || ""} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style={{ width: "100%", height: "100%", border: "none" }} title="preview" />
          }
        </div>
      </div>
    </div>
  );

  return null;
}
