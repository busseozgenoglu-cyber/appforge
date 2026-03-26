content = open('src/App.jsx').read()

old = '  const notify = useCallback((m, t = "info") => { setToast({ m, t }); setTimeout(() => setToast(null), 3500); }, []);'

new = '''  const notify = useCallback((m, t = "info") => { setToast({ m, t }); setTimeout(() => setToast(null), 3500); }, []);

  const freeLeft = useCallback(() => {
    if (daily.d !== today()) return FREE_DAILY;
    return Math.max(0, FREE_DAILY - daily.u);
  }, [daily]);

  const log = useCallback((a, c, n) => setTLog(p => [{ id: Date.now(), a, c, n, t: new Date().toLocaleString("tr-TR") }, ...p].slice(0, 80)), []);

  const spend = useCallback((amt, act) => {
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
  }, [daily, tok, log, notify]);'''

if old in content:
    content = content.replace(old, new)
    open('src/App.jsx','w').write(content)
    print('OK')
else:
    print('NOT FOUND - checking...')
    idx = content.find('const notify')
    print('notify at line:', content[:idx].count('\n')+1)
