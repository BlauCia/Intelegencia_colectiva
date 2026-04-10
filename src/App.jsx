// ─── CONFIG TAB ───────────────────────────────────────────────────────────────
// Reemplaza la función ConfigTab completa en src/App.jsx
const ConfigTab = ({ state, update, sessionId, onSessionChange }) => {
  const [sessions, setSessions] = useState([]);
  const [loadingSess, setLoadingSess] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [copyFrom, setCopyFrom] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genCtx, setGenCtx] = useState(state.sessionContext || "");
  const [questions, setQuestions] = useState(state.questions || []);
  const [editingKw, setEditingKw] = useState(null);
  const [kwDraft, setKwDraft] = useState("");
  const [savedQ, setSavedQ] = useState(false);
  const [savedCfg, setSavedCfg] = useState(false);

  // Local config state (controlled inputs)
  const [cfgName, setCfgName] = useState(state.sessionName || "");
  const [cfgTitle, setCfgTitle] = useState(state.branding?.sessionTitle || "Inteligencia Colectiva");
  const [cfgAnon, setCfgAnon] = useState(state.anonymityMessage || "");

  useEffect(() => { listSessions().then(s => { setSessions(s); setLoadingSess(false); }); }, []);

  const saveQ = async () => {
    await update({ questions });
    setSavedQ(true);
    setTimeout(() => setSavedQ(false), 2000);
  };

  const saveCfg = async () => {
    await update({
      sessionName: cfgName,
      branding: { ...state.branding, sessionTitle: cfgTitle },
      anonymityMessage: cfgAnon,
    });
    setSavedCfg(true);
    setTimeout(() => setSavedCfg(false), 2000);
  };

  const genAI = async () => {
    if (!genCtx.trim()) return;
    setGenerating(true);
    const r = await callClaudeJSON("Experto en diseño de formaciones. SOLO JSON.",
      `Diseña 3 preguntas de feedback para: "${genCtx}". JSON exacto:
{"questions":[
  {"text":"pregunta 1","keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"]},
  {"text":"pregunta 2","keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"]},
  {"text":"pregunta 3","keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"]}
]}`);
    if (r?.questions) { setQuestions(r.questions); update({ questions: r.questions, sessionContext: genCtx }); }
    setGenerating(false);
  };

  const handleNew = async () => {
    if (!newName.trim()) return;
    const copy = copyFrom ? sessions.find(s => s.id === copyFrom) : null;
    const id = await createSession(newName, copy);
    setShowModal(false); setNewName(""); setCopyFrom(null);
    listSessions().then(setSessions);
    onSessionChange(id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Sessions */}
      <div className="card">
        <div className="sl">Gestión de sesiones</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ fontSize: ".78rem", color: "var(--gray)" }}>Activa: <strong style={{ color: "var(--white)" }}>{state.sessionName}</strong></span>
          <button className="btn by bsm" onClick={() => setShowModal(true)}>+ Nueva sesión</button>
        </div>
        {loadingSess ? <div style={{ textAlign: "center", padding: "1rem" }}><Spinner /></div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
            {sessions.map(s => (
              <div key={s.id} className={`sc ${s.id === sessionId ? "act" : ""}`} onClick={() => onSessionChange(s.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: ".88rem", marginBottom: ".2rem" }}>{s.sessionName || s.id}</div>
                  <div style={{ fontSize: ".7rem", color: "var(--gray)", display: "flex", gap: "1rem" }}>
                    <span>{fmtDate(s.createdAt)}</span>
                    <span>{Object.keys(s.participants || {}).length} part.</span>
                    <span>{Object.values(s.responses || {}).reduce((a, r) => a + Object.keys(r).length, 0)} resp.</span>
                  </div>
                </div>
                <span style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: s.status === "results" ? "var(--green)" : s.status === "waiting" ? "var(--gray)" : "var(--yellow)" }}>
                  {s.status === "results" ? "Completada" : s.status === "waiting" ? "En espera" : "Activa"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="card">
        <div className="sl">Preguntas</div>
        <div style={{ background: "var(--dark3)", border: "1px solid var(--yb)", padding: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--yellow)", marginBottom: ".5rem" }}>✦ Generar con IA</div>
          <textarea value={genCtx} onChange={e => setGenCtx(e.target.value)}
            placeholder="Describe el contexto de la formación…"
            className="fta" style={{ minHeight: 68, marginBottom: ".75rem" }}
            onFocus={e => e.target.style.borderColor = "var(--yellow)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"} />
          <button className="btn by bsm" onClick={genAI} disabled={generating || !genCtx.trim()}>
            {generating ? <><Spinner size={14} /> Generando…</> : "Generar →"}
          </button>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="qed">
            <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--yellow)", marginBottom: ".4rem" }}>Pregunta {i + 1}</div>
            <textarea value={q.text}
              onChange={e => { const qs = [...questions]; qs[i] = { ...qs[i], text: e.target.value }; setQuestions(qs); }}
              className="fta" style={{ minHeight: 56, marginBottom: ".6rem" }}
              onFocus={e => e.target.style.borderColor = "var(--yellow)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />
            <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gray)", marginBottom: ".4rem" }}>Keywords</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".3rem", marginBottom: ".4rem" }}>
              {q.keywords.map((kw, j) => (
                <button key={j}
                  onClick={() => { const qs = [...questions]; qs[i].keywords = qs[i].keywords.filter((_, k) => k !== j); setQuestions(qs); }}
                  style={{ fontSize: ".68rem", fontWeight: 600, padding: ".22rem .55rem", background: "var(--yd)", border: "1px solid var(--yb)", color: "var(--yellow)", letterSpacing: ".04em", textTransform: "uppercase" }}
                  title="Click para eliminar">{kw} ✕</button>
              ))}
              {editingKw === i ? (
                <input value={kwDraft} onChange={e => setKwDraft(e.target.value)} autoFocus placeholder="palabra…"
                  onKeyDown={e => {
                    if (e.key === "Enter" && kwDraft.trim()) {
                      const qs = [...questions]; qs[i].keywords = [...qs[i].keywords, kwDraft.trim()];
                      setQuestions(qs); setKwDraft(""); setEditingKw(null);
                    }
                    if (e.key === "Escape") setEditingKw(null);
                  }}
                  style={{ fontSize: ".68rem", background: "var(--dark)", border: "1px solid var(--yellow)", padding: ".2rem .5rem", color: "var(--white)", width: 90 }} />
              ) : (
                <button onClick={() => setEditingKw(i)}
                  style={{ fontSize: ".68rem", padding: ".22rem .55rem", background: "transparent", border: "1px dashed var(--gray2)", color: "var(--gray)" }}>
                  + añadir
                </button>
              )}
            </div>
          </div>
        ))}

        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="btn by bsm" onClick={saveQ}>Guardar preguntas</button>
          {savedQ && (
            <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--green)" }}>
              ✓ Guardado
            </span>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="card">
        <div className="sl">Configuración</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="fl">Nombre de sesión</label>
            <input value={cfgName} onChange={e => setCfgName(e.target.value)} className="fi" />
          </div>
          <div>
            <label className="fl">Título de la plataforma</label>
            <input value={cfgTitle} onChange={e => setCfgTitle(e.target.value)} className="fi" />
          </div>
          <div>
            <label className="fl">Mensaje de anonimato</label>
            <input value={cfgAnon} onChange={e => setCfgAnon(e.target.value)} className="fi" />
          </div>
          <div>
            <label className="fl">Tiempo por pregunta</label>
            <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
              {[[60, "1 min"], [120, "2 min"], [180, "3 min"], [300, "5 min"], [420, "7 min"], [600, "10 min"]].map(([secs, label]) => (
                <button key={secs} onClick={() => update({ timerDuration: secs })}
                  style={{ padding: ".4rem .9rem", border: `1px solid ${state.timerDuration === secs ? "var(--yellow)" : "var(--border2)"}`, background: state.timerDuration === secs ? "var(--yd)" : "transparent", color: state.timerDuration === secs ? "var(--yellow)" : "var(--gray)", fontSize: ".75rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="btn by bsm" onClick={saveCfg}>Guardar configuración</button>
          {savedCfg && (
            <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--green)" }}>
              ✓ Guardado
            </span>
          )}
        </div>
      </div>

      {/* Modal nueva sesión */}
      {showModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="bc" style={{ fontSize: "1.5rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "1.5rem" }}>Nueva sesión</div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="fl">Nombre</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="fi" placeholder="Ej: Grupo A — Mañana" />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="fl">Copiar configuración de</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)", maxHeight: 180, overflow: "auto" }}>
                <div className={`sc ${!copyFrom ? "act" : ""}`} onClick={() => setCopyFrom(null)}>
                  <div style={{ fontSize: ".82rem", fontWeight: 700 }}>Configuración por defecto</div>
                </div>
                {sessions.map(s => (
                  <div key={s.id} className={`sc ${copyFrom === s.id ? "act" : ""}`} onClick={() => setCopyFrom(s.id)}>
                    <div>
                      <div style={{ fontSize: ".82rem", fontWeight: 700 }}>{s.sessionName || s.id}</div>
                      <div style={{ fontSize: ".68rem", color: "var(--gray)" }}>{fmtDate(s.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn by" onClick={handleNew} disabled={!newName.trim()}>Crear →</button>
              <button className="btn bg" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
