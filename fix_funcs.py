content = open('src/App.jsx').read()

# build'den once ekleyecegiz
old = '  const build = useCallback(async (pr, edit = false) => {'

new = '''  const notify = (m, t = "info") => { setToast({ m, t }); setTimeout(() => setToast(null), 3500); };

  const freeLeft = () => {
    if (daily.d !== today()) return FREE_DAILY;
    return Math.max(0, FREE_DAILY - daily.u);
  };

  const log = (a, c, n) => setTLog(p => [{ id: Date.now(), a, c, n, t: new Date().toLocaleString("tr-TR") }, ...p].slice(0, 80));

  const spend = (amt, act) => {
    const t = today();
    let d = daily.d === t ? { ...daily } : { d: t, u: 0 };
    if (d.u < FREE_DAILY && (act === "build" || act === "edit")) {
      d = { ...d, u: d.u + 1 };
      setDaily(d);
      log(act, 0, "Ucretsiz");
      return true;
    }
    if (tok < amt) { notify("Yetersiz kredi!", "error"); setShowPrice(true); return false; }
    setTok(p => p - amt);
    log(act, amt, amt + " kredi");
    return true;
  };

  const build = useCallback(async (pr, edit = false) => {'''

if old in content:
    content = content.replace(old, new)
    open('src/App.jsx','w').write(content)
    print('OK - functions added')
else:
    print('NOT FOUND')
    idx = content.find('useCallback')
    print('First useCallback at line:', content[:idx].count('\n')+1)
