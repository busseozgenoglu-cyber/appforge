import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# 1. State'leri değiştir
old = '''export default function App() {
  const [pg, setPg] = useState("home");
  const [prompt, setPrompt] = useState("");
  const [gen, setGen] = useState(false);
  const [code, setCode] = useState("");
  const [steps, setSteps] = useState([]);
  const [hist, setHist] = useState([]);
  const [editTxt, setEditTxt] = useState("");
  const [projs, setProjs] = useState([]);
  const [actProj, setActProj] = useState(null);
  const [side, setSide] = useState(true);
  const [codeV, setCodeV] = useState(false);
  const [tok, setTok] = useState(0);
  const [daily, setDaily] = useState({ d: today(), u: 0 });'''

new = '''export default function App() {
  const ls = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPg, setAuthPg] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [pg, setPg] = useState(() => { const p = ls("af_projs",[]); return p.length>0?"preview":"home"; });
  const [prompt, setPrompt] = useState("");
  const [gen, setGen] = useState(false);
  const [code, setCode] = useState(() => { const p = ls("af_projs",[]); return p.length>0?p[0].code:""; });
  const [steps, setSteps] = useState([]);
  const [hist, setHist] = useState([]);
  const [editTxt, setEditTxt] = useState("");
  const [projs, setProjs] = useState(() => ls("af_projs",[]));
  const [actProj, setActProj] = useState(() => { const p = ls("af_projs",[]); return p.length>0?p[0].id:null; });
  const [side, setSide] = useState(true);
  const [codeV, setCodeV] = useState(false);
  const [tok, setTok] = useState(() => ls("af_tok",99999));
  const [daily, setDaily] = useState(() => ls("af_daily",{ d: today(), u: 0 }));'''

if old in content:
    content = content.replace(old, new)
    print("States OK")
else:
    print("States NOT FOUND")

# 2. Mouse tracker'dan once auth ekle
old2 = '''  // Mouse tracker for parallax
  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);'''

new2 = '''  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) loadUserProjects(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUserProjects(session.user.id);
      else setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // LocalStorage kaydet
  useEffect(() => { try { localStorage.setItem("af_projs", JSON.stringify(projs)); } catch {} }, [projs]);
  useEffect(() => { try { localStorage.setItem("af_tok", JSON.stringify(tok)); } catch {} }, [tok]);
  useEffect(() => { try { localStorage.setItem("af_daily", JSON.stringify(daily)); } catch {} }, [daily]);

  const loadUserProjects = async (uid) => {
    const { data } = await supabase.from("projects").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const mapped = data.map(p => ({ id: p.id, name: p.name, code: p.code, date: new Date(p.created_at).toLocaleString("tr-TR") }));
      setProjs(mapped); setActProj(mapped[0].id); setCode(mapped[0].code); setPg("preview");
    }
    setAuthLoading(false);
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
    else setAuthErr("OK:Email doğrulama gönderildi, emailinizi kontrol edin.");
    setAuthBusy(false);
  };
  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProjs([]); setActProj(null); setCode(""); setPg("home"); localStorage.clear();
  };

  // Mouse tracker for parallax
  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);'''

if old2 in content:
    content = content.replace(old2, new2)
    print("Auth functions OK")
else:
    print("Mouse tracker NOT FOUND")

# 3. Auth ekrani + loading ekle - HOME'dan once
old3 = '''  // ════════════════════════════════════════
  // HOME
  // ════════════════════════════════════════
  if (pg === "home" && !gen) return ('''

new3 = '''  // Loading
  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:"#07070c", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #252538", borderTopColor:"#7c5cfc", animation:"spin 1s linear infinite" }} />
    </div>
  );

  // Auth ekrani
  if (!user) return (
    <div style={{ minHeight:"100vh", background:"#07070c", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora',sans-serif" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap'); @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}"}</style>
      <div style={{ width:400, animation:"fadeUp .5s ease" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:52, height:52, borderRadius:16, background:"linear-gradient(135deg,#7c5cfc,#5ce0d6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 12px" }}>⚡</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:"#ededf5", letterSpacing:"-1px" }}>AppForge<span style={{ background:"linear-gradient(135deg,#7c5cfc,#5ce0d6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>.ai</span></h1>
          <p style={{ fontSize:13, color:"#55556e", marginTop:4 }}>AI destekli uygulama oluşturucu</p>
        </div>
        <div style={{ background:"#0f0f18", border:"1px solid #252538", borderRadius:20, padding:28 }}>
          <div style={{ display:"flex", background:"#07070c", borderRadius:12, padding:4, marginBottom:22 }}>
            {["login","register"].map(t => (
              <button key={t} onClick={() => { setAuthPg(t); setAuthErr(""); }} style={{ flex:1, padding:"9px 0", borderRadius:9, border:"none", background: authPg===t ? "#7c5cfc" : "transparent", color: authPg===t ? "#fff" : "#55556e", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {t==="login" ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            ))}
          </div>
          <button onClick={handleGoogle} style={{ width:"100%", padding:"11px 0", borderRadius:12, border:"1px solid #252538", background:"#07070c", color:"#ededf5", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/></svg>
            Google ile {authPg==="login" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ flex:1, height:1, background:"#252538" }} /><span style={{ fontSize:11, color:"#55556e" }}>veya email ile</span><div style={{ flex:1, height:1, background:"#252538" }} />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:"#55556e", display:"block", marginBottom:5 }}>Email</label>
            <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="ornek@email.com" style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid #252538", background:"#07070c", color:"#ededf5", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:"#55556e", display:"block", marginBottom:5 }}>Şifre</label>
            <input type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} onKeyDown={e => e.key==="Enter" && (authPg==="login" ? handleLogin() : handleRegister())} placeholder="••••••••" style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid #252538", background:"#07070c", color:"#ededf5", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
          {authErr && <div style={{ fontSize:12, color: authErr.startsWith("OK:") ? "#22c55e" : "#ef4444", marginBottom:12, padding:"8px 12px", borderRadius:8, background: authErr.startsWith("OK:") ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)" }}>{authErr.replace("OK:","")}</div>}
          <button onClick={authPg==="login" ? handleLogin : handleRegister} disabled={authBusy||!authEmail||!authPass} style={{ width:"100%", padding:"12px 0", borderRadius:12, border:"none", background:(!authEmail||!authPass||authBusy)?"#252538":"linear-gradient(135deg,#7c5cfc,#5ce0d6)", color:(!authEmail||!authPass||authBusy)?"#55556e":"#fff", fontSize:15, fontWeight:700, cursor:(!authEmail||!authPass||authBusy)?"default":"pointer" }}>
            {authBusy ? "..." : authPg==="login" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════
  // HOME
  // ════════════════════════════════════════
  if (pg === "home" && !gen) return ('''

if old3 in content:
    content = content.replace(old3, new3)
    print("Auth screen OK")
else:
    print("HOME NOT FOUND")

# 4. Build'de DB'ye kaydet
old4 = '''      if (!edit) { setProjs(p => [pj, ...p]); setActProj(pj.id); } else { setProjs(p => p.map(x => x.id === actProj ? { ...x, code: c, date: pj.date } : x)); }
      setPg("preview"); notify(edit ? "Güncellendi!" : "Uygulama hazır!", "ok");'''

new4 = '''      if (!edit) { setProjs(p => [pj, ...p]); setActProj(pj.id); setCode(c); } else { setProjs(p => p.map(x => x.id === actProj ? { ...x, code: c, date: pj.date } : x)); setCode(c); }
      if (user) saveProjectToDB(user.id, { ...pj, id: edit ? actProj : pj.id, code: c });
      setPg("preview"); notify(edit ? "Güncellendi!" : "Uygulama hazır!", "ok");'''

if old4 in content:
    content = content.replace(old4, new4)
    print("Build save OK")
else:
    print("Build save NOT FOUND - trying alt")
    old4b = '''      if (!edit) { setProjs(p => [pj, ...p]); setActProj(pj.id); } else { setProjs(p => p.map(x => x.id === actProj ? { ...x, code: c, date: pj.date } : x)); }
      setPg("preview"); notify(edit ? "Güncellendi!" : "Uygulama hazır!", "ok");'''
    if old4b in content:
        content = content.replace(old4b, new4)
        print("Build save alt OK")

# 5. Logout butonu sidebar'a ekle
old5 = '''              <div onClick={() => setPg("home")} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,var(--ac),var(--ac2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, animation:"glow 3s ease infinite" }}>⚡</div>
                <span style={{ fontWeight:700, fontSize:14 }}>AppForge</span>
              </div>
              <button className="hv" onClick={() => setSide(false)} style={{ background:"none", border:"none", color:"var(--t3)", cursor:"pointer", fontSize:16, padding:"2px 6px", borderRadius:6 }}>✕</button>'''

new5 = '''              <div onClick={() => setPg("home")} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,var(--ac),var(--ac2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, animation:"glow 3s ease infinite" }}>⚡</div>
                <span style={{ fontWeight:700, fontSize:14 }}>AppForge</span>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={handleLogout} title="Çıkış" className="hv" style={{ background:"none", border:"none", color:"var(--t3)", cursor:"pointer", fontSize:13, padding:"2px 6px", borderRadius:6 }}>⏻</button>
                <button className="hv" onClick={() => setSide(false)} style={{ background:"none", border:"none", color:"var(--t3)", cursor:"pointer", fontSize:16, padding:"2px 6px", borderRadius:6 }}>✕</button>
              </div>'''

if old5 in content:
    content = content.replace(old5, new5)
    print("Logout button OK")
else:
    print("Sidebar NOT FOUND")

with open('src/App.jsx', 'w') as f:
    f.write(content)

print("DONE!")
