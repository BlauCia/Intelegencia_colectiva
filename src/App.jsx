import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc, updateDoc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

const SESSIONS_COL = "sessions";

const makeDefault = (name = "Sesión 1") => ({
  status: "waiting", currentQuestion: 0, timerStart: null, timerDuration: 300,
  createdAt: Date.now(), participants: {}, responses: {}, analysis: {},
  streamingText: {}, wordFrequency: [], sentiment: {}, highlights: {},
  debateResponses: {}, debateAnalysis: {}, suggestedQuestions: {},
  questions: [
    { text: "¿Qué te ha parecido la formación de hoy?", keywords: ["inspiradora","reflexiva","práctica","sorprendente","profunda","cercana","retadora","transformadora"], prompt: "Analiza las respuestas sobre la experiencia. Destaca aspectos más mencionados e insights clave. Máximo 120 palabras. Sin asteriscos ni markdown." },
    { text: "¿Qué aprendizaje te llevas?", keywords: ["perspectiva","autoconocimiento","escucha","empatía","liderazgo","propósito","creatividad","conexión"], prompt: "Analiza los aprendizajes destacados. Identifica conceptos que más han resonado. Máximo 120 palabras. Sin asteriscos ni markdown." },
    { text: "¿Cómo vas a aplicar esto en tu día a día?", keywords: ["conversaciones","hábitos","equipo","decisiones","presencia","tiempo","relaciones","prioridades"], prompt: "Analiza cómo aplicarán lo aprendido. Identifica intenciones y patrones concretos. Máximo 120 palabras. Sin asteriscos ni markdown." },
  ],
  resultsPublished: {},
  debateActive: false, debateQuestion: null, debateTimerStart: null, debateTimerDuration: 120,
  sessionName: name,
  branding: { sessionTitle: "Inteligencia Colectiva" },
  anonymityMessage: "Tus respuestas son completamente anónimas.",
  sessionContext: "",
  aiConfig: {
    provider: "claude",
    claudeKey: "",
    openaiKey: "",
    geminiKey: "",
  },
});

// ─── FIRESTORE ────────────────────────────────────────────────────────────────
const sessionRef = (id) => doc(db, SESSIONS_COL, id);

const useSession = (sessionId) => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!sessionId) return;
    const ref = sessionRef(sessionId);
    getDoc(ref).then(s => { if (!s.exists()) setDoc(ref, makeDefault()); });
    return onSnapshot(ref, s => { if (s.exists()) { setState(s.data()); setLoading(false); } });
  }, [sessionId]);
  const update = useCallback(u => sessionId ? updateDoc(sessionRef(sessionId), u) : Promise.resolve(), [sessionId]);
  return { state, loading, update };
};

const listSessions = () =>
  getDocs(query(collection(db, SESSIONS_COL), orderBy("createdAt", "desc")))
    .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));

const createSession = async (name, copyFrom = null) => {
  const id = `session_${Date.now()}`;
  const base = copyFrom
    ? { ...makeDefault(name), questions: copyFrom.questions, branding: copyFrom.branding, anonymityMessage: copyFrom.anonymityMessage, timerDuration: copyFrom.timerDuration, sessionContext: copyFrom.sessionContext || "", aiConfig: copyFrom.aiConfig || makeDefault().aiConfig }
    : makeDefault(name);
  await setDoc(sessionRef(id), { ...base, sessionName: name, createdAt: Date.now() });
  return id;
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --black:#0a0a0a;--dark:#111;--dark2:#1a1a1a;--dark3:#222;
    --yellow:#ffe600;--yd:rgba(255,230,0,0.12);--yb:rgba(255,230,0,0.3);
    --white:#fff;--gray:#777;--gray2:#444;
    --red:#e63e2a;--green:#2ae67a;--blue:#3a8fff;
    --border:rgba(255,255,255,0.08);--border2:rgba(255,255,255,0.16);
  }
  html,body{background:var(--black);color:var(--white);font-family:'Barlow',sans-serif;min-height:100vh;overflow-x:hidden}
  .bc{font-family:'Barlow Condensed',sans-serif}
  *{-webkit-font-smoothing:antialiased}
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes ticker{0%{transform:translateX(100%)}100%{transform:translateX(-200%)}}
  .fu{animation:fadeUp .45s ease forwards}
  .fu2{animation:fadeUp .45s .08s ease forwards;opacity:0}
  .fu3{animation:fadeUp .45s .16s ease forwards;opacity:0}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--gray2)}
  button{font-family:'Barlow',sans-serif;cursor:pointer;transition:all .15s}
  textarea,input{font-family:'Barlow',sans-serif}
  textarea:focus,input:focus{outline:none}

  .btn{display:inline-flex;align-items:center;gap:.4rem;font-weight:700;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;border:none;padding:.6rem 1.2rem;transition:all .15s;white-space:nowrap}
  .by{background:var(--yellow);color:var(--black)}.by:hover{background:#fff}
  .bg{background:transparent;color:var(--white);border:1px solid var(--border2)}.bg:hover{border-color:var(--yellow);color:var(--yellow)}
  .br{background:var(--red);color:#fff}
  .bsm{padding:.38rem .8rem;font-size:.7rem}
  .btn:disabled{opacity:.4;cursor:not-allowed}

  .card{background:var(--dark2);border:1px solid var(--border);padding:1.5rem}
  .sl{font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gray);display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem}
  .sl::after{content:'';flex:1;height:1px;background:var(--border)}
  .tab{background:none;border:none;color:var(--gray);padding:.85rem 1.1rem;font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border-bottom:2px solid transparent;margin-bottom:-1px}
  .tab:hover{color:var(--white)}.tab.on{color:var(--yellow);border-bottom-color:var(--yellow)}

  .mc{border-right:1px solid var(--border);padding:1rem 1.5rem}
  .ml{font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gray);margin-bottom:.2rem}
  .mv{font-family:'Barlow Condensed',sans-serif;font-size:2.2rem;font-weight:800;line-height:1}

  .dot{width:7px;height:7px;border-radius:50%;display:inline-block}
  .dy{background:var(--yellow);animation:blink 1.5s infinite}.dg{background:var(--green)}.dx{background:var(--gray2)}

  .kc{background:transparent;border:1px solid var(--border2);color:var(--gray);padding:.28rem .65rem;font-size:.72rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
  .kc:hover{border-color:var(--yellow);color:var(--yellow);background:var(--yd)}

  .hbar{border-left:3px solid var(--yellow);padding:.65rem 1rem;background:var(--yd);font-size:.85rem;font-style:italic;margin-bottom:.4rem}
  .srow{display:flex;align-items:center;gap:.75rem;margin-bottom:.35rem}
  .slbl{font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:55px;text-align:right;color:var(--gray)}
  .strk{flex:1;height:3px;background:var(--dark3)}.sfil{height:100%;transition:width .6s ease}
  .sn{font-size:.65rem;color:var(--gray);width:18px}

  .cloud{display:flex;flex-wrap:wrap;gap:.25rem .7rem;justify-content:center;padding:1rem}
  .cw{font-family:'Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:.02em}

  .tbar{background:var(--yellow);color:var(--black);padding:.35rem 0;overflow:hidden;white-space:nowrap;font-weight:800;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase}
  .ti{display:inline-block;animation:ticker 25s linear infinite}

  .fl{font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gray);display:block;margin-bottom:.35rem}
  .fi{background:var(--dark3);border:1px solid var(--border);padding:.65rem .9rem;color:var(--white);font-size:.88rem;width:100%;transition:border-color .15s}
  .fi:focus{border-color:var(--yellow)}
  .fta{background:var(--dark3);border:1px solid var(--border);padding:.75rem .9rem;color:var(--white);font-size:.85rem;width:100%;resize:vertical;line-height:1.6;transition:border-color .15s}
  .fta:focus{border-color:var(--yellow)}

  .sc{background:var(--dark2);border:1px solid var(--border);padding:1rem 1.25rem;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:1rem}
  .sc:hover{border-color:var(--yb)}.sc.act{border-color:var(--yellow);border-left:3px solid var(--yellow)}

  .qed{background:var(--dark3);border:1px solid var(--border);padding:1.25rem;margin-bottom:1px;transition:border-color .15s}
  .qed:focus-within{border-color:var(--yb)}

  .spnr{width:28px;height:28px;border:2px solid var(--dark3);border-top-color:var(--yellow);border-radius:50%;animation:spin .8s linear infinite}

  .g4{display:grid;grid-template-columns:repeat(4,1fr)}
  .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border)}
  .g3>*{background:var(--dark)}

  .dbtn{flex:1;padding:.9rem;border:2px solid var(--border);background:transparent;color:var(--white);font-weight:700;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase}
  .dbtn:hover{border-color:var(--yellow)}
  .sa{border-color:var(--green)!important;background:rgba(42,230,122,.1)!important;color:var(--green)!important}
  .sn2{border-color:var(--yellow)!important;background:var(--yd)!important;color:var(--yellow)!important}
  .sd{border-color:var(--red)!important;background:rgba(230,62,42,.1)!important;color:var(--red)!important}

  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
  .modal{background:var(--dark);border:1px solid var(--border2);padding:2rem;width:100%;max-width:540px;max-height:85vh;overflow-y:auto}
  .tag{font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.2rem .5rem;border:1px solid var(--yb);color:var(--yellow);background:var(--yd)}

  .provider-btn{flex:1;padding:.75rem;border:2px solid var(--border);background:transparent;color:var(--gray);font-weight:700;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;transition:all .15s}
  .provider-btn.active{border-color:var(--yellow);background:var(--yd);color:var(--yellow)}
  .provider-btn:hover:not(.active){border-color:var(--border2);color:var(--white)}

  .key-input-wrap{position:relative}
  .key-input-wrap input{padding-right:3rem}
  .key-reveal{position:absolute;right:.75rem;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--gray);font-size:.75rem;font-weight:700;letter-spacing:.06em;padding:.2rem .4rem;text-transform:uppercase}
  .key-reveal:hover{color:var(--yellow)}

  .saved-badge{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--green);animation:fadeUp .3s ease forwards}
`;

// ─── UTILS ────────────────────────────────────────────────────────────────────
const useCountdown = (timerStart, duration) => {
  const [rem, setRem] = useState(duration || 300);
  useEffect(() => {
    if (!timerStart) { setRem(duration || 300); return; }
    const tick = () => setRem(Math.max(0, (duration || 300) - (Date.now() - timerStart) / 1000));
    tick();
    const id = setInterval(tick, 400);
    return () => clearInterval(id);
  }, [timerStart, duration]);
  return rem;
};

const fmt = s => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
const fmtDate = ts => ts ? new Date(ts).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STOP = new Set(["que","de","la","el","en","y","a","los","las","un","una","por","con","es","se","me","lo","le","más","pero","como","su","para","al","del","ha","he","mi","no","si","ya","muy","todo","este","esta","son","sus","fue","era","ser","hay","nos","les","esto","cuando","donde","porque","aunque","también","bien"]);

const calcWordFreq = responses => {
  const freq = {};
  Object.values(responses).forEach(r => Object.values(r).forEach(text => {
    if (!text || typeof text !== "string") return;
    text.toLowerCase().replace(/[^a-záéíóúüñ\s]/gi, "").split(/\s+/).forEach(w => {
      if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
  }));
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([word, count]) => ({ word, count }));
};

const stripMd = t => t ? t.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#{1,6}\s/g, "").trim() : t;

// ─── AI CALL (multi-provider) ─────────────────────────────────────────────────
const callAI = async (system, user, onChunk, aiConfig = {}) => {
  const provider = aiConfig.provider || "claude";

  if (provider === "claude") {
    const key = aiConfig.claudeKey;
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, stream: false, system, messages: [{ role: "user", content: user }], ...(key ? { apiKey: key } : {}) }),
      });
      if (!res.ok) { onChunk(`[Error ${res.status}]`); return; }
      const data = await res.json();
      onChunk(stripMd(data.content?.[0]?.text || ""));
    } catch (e) { onChunk(`[Error: ${e.message}]`); }

  } else if (provider === "openai") {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${aiConfig.openaiKey}` },
        body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: 1500 }),
      });
      if (!res.ok) { onChunk(`[Error OpenAI ${res.status}]`); return; }
      const data = await res.json();
      onChunk(stripMd(data.choices?.[0]?.message?.content || ""));
    } catch (e) { onChunk(`[Error: ${e.message}]`); }

  } else if (provider === "gemini") {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiConfig.geminiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${system}\n\n${user}` }] }], generationConfig: { maxOutputTokens: 1500 } }),
      });
      if (!res.ok) { onChunk(`[Error Gemini ${res.status}]`); return; }
      const data = await res.json();
      onChunk(stripMd(data.candidates?.[0]?.content?.parts?.[0]?.text || ""));
    } catch (e) { onChunk(`[Error: ${e.message}]`); }
  }
};

const callAIJSON = async (system, user, aiConfig) => {
  let full = "";
  await callAI(system + "\nResponde SOLO con JSON válido, sin markdown ni backticks.", user, c => full += c, aiConfig);
  try { return JSON.parse(full.replace(/```json|```/g, "").trim()); } catch { return null; }
};

// ─── ANALYSIS ─────────────────────────────────────────────────────────────────
const runAnalysis = async (state, qNum, sessionId) => {
  const { responses, questions, aiConfig } = state;
  const qKey = `q${qNum}`;
  const ref = sessionRef(sessionId);
  const q = questions[qNum - 1];
  const prompt = q?.prompt || "Analiza las respuestas. Máximo 120 palabras. Sin markdown.";
  const texts = Object.values(responses).map(r => r[qKey]).filter(Boolean);
  if (!texts.length) return;

  let summary = "";
  await callAI(
    `Eres analista de formación. ${prompt}\nSin asteriscos ni markdown.`,
    `Respuestas:\n\n${texts.join("\n---\n")}`,
    async chunk => { summary += chunk; await updateDoc(ref, { [`streamingText.${qKey}`]: summary }); },
    aiConfig
  );
  await updateDoc(ref, { [`analysis.${qKey}`]: summary, [`streamingText.${qKey}`]: "", wordFrequency: calcWordFreq(responses) });

  const enriched = await callAIJSON("Analista de feedback. SOLO JSON.",
    `JSON: {"sentiment":{"positive":N,"neutral":N,"critical":N},"highlights":["frase1","frase2","frase3"]}\nFrases literales (máx 10 palabras).\nRespuestas:\n\n${texts.join("\n---\n")}`,
    aiConfig);
  if (enriched) await updateDoc(ref, { [`sentiment.${qKey}`]: enriched.sentiment, [`highlights.${qKey}`]: enriched.highlights || [] });

  if (qNum < questions.length) {
    const nq = await callAIJSON("Facilitador experto. SOLO JSON.",
      `Sugiere pregunta de seguimiento para P${qNum + 1}. JSON: {"suggestion":"texto"}\nRespuestas:\n\n${texts.join("\n---\n")}`,
      aiConfig);
    if (nq?.suggestion) await updateDoc(ref, { [`suggestedQuestions.q${qNum}`]: nq.suggestion });
  }
};

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const Spinner = ({ size = 28 }) => <div className="spnr" style={{ width: size, height: size, borderWidth: size > 20 ? 2 : 1.5 }} />;
const LoadingScreen = () => (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--black)" }}><Spinner /></div>
);
const SavedBadge = ({ show }) => show ? <span className="saved-badge">✓ Guardado</span> : null;

const WordCloud = ({ words }) => {
  if (!words?.length) return <p style={{ color: "var(--gray2)", textAlign: "center", padding: "2rem", fontSize: ".75rem", letterSpacing: ".1em", textTransform: "uppercase" }}>Las palabras aparecerán aquí</p>;
  const max = words[0]?.count || 1;
  const colors = ["var(--yellow)", "var(--white)", "rgba(255,255,255,.55)", "rgba(255,230,0,.55)"];
  return (
    <div className="cloud">
      {words.map(({ word, count }, i) => (
        <span key={word} className="cw" style={{ fontSize: `${0.65 + (count / max) * 2}rem`, color: colors[i % colors.length], opacity: 0.3 + (count / max) * 0.7 }}>{word}</span>
      ))}
    </div>
  );
};

const SentimentBar = ({ sentiment }) => {
  if (!sentiment) return null;
  const total = (sentiment.positive || 0) + (sentiment.neutral || 0) + (sentiment.critical || 0) || 1;
  return (
    <div>
      {[["Positivo", sentiment.positive || 0, "var(--green)"], ["Neutro", sentiment.neutral || 0, "var(--yellow)"], ["Crítico", sentiment.critical || 0, "var(--red)"]].map(([l, c, color]) => (
        <div key={l} className="srow">
          <span className="slbl">{l}</span>
          <div className="strk"><div className="sfil" style={{ width: `${(c / total) * 100}%`, background: color }} /></div>
          <span className="sn">{c}</span>
        </div>
      ))}
    </div>
  );
};

const ResultsDisplay = ({ state, compact }) => {
  const { analysis, streamingText, wordFrequency, questions, responses, sentiment, highlights, resultsPublished } = state;
  const pCount = Object.keys(responses || {}).length;
  return (
    <div style={{ background: "var(--black)", padding: compact ? "1rem" : "2rem", maxWidth: compact ? 960 : 800, margin: "0 auto", width: "100%" }}>
      {!compact && (
        <div style={{ marginBottom: "3rem" }} className="fu">
          <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--yellow)", marginBottom: ".75rem" }}>
            <span className="dot dg" style={{ marginRight: ".5rem" }} />Sesión completada · {pCount} participantes
          </div>
          <h1 className="bc" style={{ fontSize: "clamp(2.5rem,6vw,4rem)", fontWeight: 900, textTransform: "uppercase", lineHeight: .9 }}>Resultados</h1>
        </div>
      )}
      {(questions || []).map((q, i) => {
        const qKey = `q${i + 1}`;
        const text = streamingText?.[qKey] || analysis?.[qKey];
        const streaming = !!streamingText?.[qKey];
        if (!text || (!compact && !resultsPublished?.[qKey])) return null;
        return (
          <div key={i} style={{ borderTop: "1px solid var(--border)", paddingTop: "1.75rem", marginBottom: "1.75rem" }}>
            <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--yellow)", marginBottom: ".4rem" }}>Pregunta {i + 1}</div>
            <div className="bc" style={{ fontSize: "1.15rem", fontWeight: 800, textTransform: "uppercase", marginBottom: ".9rem" }}>{q.text}</div>
            <p style={{ fontSize: ".9rem", lineHeight: 1.75, color: "rgba(255,255,255,.8)", marginBottom: "1.25rem" }}>
              {text}{streaming && <span style={{ animation: "blink 1s infinite", color: "var(--yellow)" }}>▌</span>}
            </p>
            {highlights?.[qKey]?.length > 0 && <><div className="sl">Voces destacadas</div>{highlights[qKey].map((h, j) => <div key={j} className="hbar">"{h}"</div>)}</>}
            {sentiment?.[qKey] && <><div className="sl" style={{ marginTop: ".9rem" }}>Sentimiento</div><SentimentBar sentiment={sentiment[qKey]} /></>}
          </div>
        );
      })}
      {wordFrequency?.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.75rem" }}>
          <div className="sl">Palabras más mencionadas</div>
          <WordCloud words={wordFrequency} />
        </div>
      )}
    </div>
  );
};

// ─── ROLE SELECTOR con password para ponente ──────────────────────────────────
// Reemplaza la función RoleSelector completa en src/App.jsx

const RoleSelector = ({ onSelect }) => {
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handlePresenter = () => {
    setShowPwdModal(true);
    setPwd("");
    setError(false);
  };

  const checkPassword = async () => {
    setChecking(true);
    // Load the stored password from the most recent session
    try {
      const sessions = await listSessions();
      const presenterPwd = sessions[0]?.presenterPassword || "1234";
      if (pwd === presenterPwd) {
        setShowPwdModal(false);
        onSelect("presenter");
      } else {
        setError(true);
        setPwd("");
      }
    } catch {
      // Fallback default password
      if (pwd === "1234") {
        setShowPwdModal(false);
        onSelect("presenter");
      } else {
        setError(true);
        setPwd("");
      }
    }
    setChecking(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--black)" }}>
      <div style={{ borderBottom: "1px solid var(--border)", padding: "1.1rem 2rem", display: "flex", alignItems: "center", gap: ".75rem" }}>
        <div style={{ width: 7, height: 7, background: "var(--yellow)" }} />
        <span className="bc" style={{ fontSize: "1rem", fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase" }}>Inteligencia Colectiva</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem" }}>
        <div style={{ marginBottom: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--yellow)", marginBottom: "1rem" }}>Plataforma de feedback formativo</div>
          <h1 className="bc fu" style={{ fontSize: "clamp(3rem,8vw,6rem)", fontWeight: 900, textTransform: "uppercase", lineHeight: .88, letterSpacing: "-.02em" }}>
            ¿Quién<br /><span style={{ color: "var(--yellow)" }}>eres?</span>
          </h1>
        </div>
        <div className="fu2" style={{ display: "flex", gap: "1px", background: "var(--border)", width: "100%", maxWidth: 580 }}>
          {[
            { role: "participant", label: "Participante", sub: "Accede a las preguntas", action: () => onSelect("participant") },
            { role: "presenter",   label: "Ponente",      sub: "Controla la sesión",    action: handlePresenter },
            { role: "client",      label: "Cliente",      sub: "Solo lectura",           action: () => onSelect("client") },
          ].map(({ role, label, sub, action }) => (
            <button key={role} onClick={action}
              style={{ flex: 1, background: "var(--dark)", border: "none", padding: "2rem 1rem", textAlign: "center", color: "var(--white)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--yellow)"; e.currentTarget.style.color = "var(--black)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--dark)"; e.currentTarget.style.color = "var(--white)"; }}>
              <div className="bc" style={{ fontSize: "1.4rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".03em", marginBottom: ".2rem" }}>{label}</div>
              <div style={{ fontSize: ".7rem", opacity: .55 }}>{sub}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="tbar"><span className="ti">FEEDBACK EN TIEMPO REAL &nbsp;·&nbsp; ANÁLISIS CON IA &nbsp;·&nbsp; REFLEXIÓN COLECTIVA &nbsp;·&nbsp; FEEDBACK EN TIEMPO REAL &nbsp;·&nbsp; ANÁLISIS CON IA &nbsp;·&nbsp;</span></div>

      {/* Password modal */}
      {showPwdModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowPwdModal(false); }}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="bc" style={{ fontSize: "1.5rem", fontWeight: 900, textTransform: "uppercase", marginBottom: ".5rem" }}>Acceso ponente</div>
            <p style={{ fontSize: ".78rem", color: "var(--gray)", marginBottom: "1.5rem" }}>Introduce la contraseña para acceder al panel de control.</p>
            <div style={{ marginBottom: "1rem" }}>
              <label className="fl">Contraseña</label>
              <input
                type="password"
                value={pwd}
                onChange={e => { setPwd(e.target.value); setError(false); }}
                onKeyDown={e => { if (e.key === "Enter") checkPassword(); }}
                className="fi"
                placeholder="••••••••"
                autoFocus
                style={{ borderColor: error ? "var(--red)" : undefined }}
              />
              {error && (
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--red)", marginTop: ".4rem", letterSpacing: ".04em" }}>
                  Contraseña incorrecta
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn by" onClick={checkPassword} disabled={checking || !pwd.trim()}>
                {checking ? <><Spinner size={14} /> Verificando…</> : "Entrar →"}
              </button>
              <button className="btn bg" onClick={() => setShowPwdModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ─── WAITING SCREEN ───────────────────────────────────────────────────────────
const WaitingScreen = ({ state }) => {
  const [dots, setDots] = useState(0);
  useEffect(() => { const id = setInterval(() => setDots(d => (d + 1) % 4), 800); return () => clearInterval(id); }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--black)" }}>
      <div style={{ borderBottom: "1px solid var(--border)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: ".75rem" }}>
        <div style={{ width: 6, height: 6, background: "var(--yellow)" }} />
        <span className="bc" style={{ fontSize: ".9rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" }}>{state.branding?.sessionTitle || "Inteligencia Colectiva"}</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem", textAlign: "center" }}>
        <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".2em", color: "var(--yellow)", textTransform: "uppercase", marginBottom: "1.5rem" }}>
          <span className="dot dx" style={{ marginRight: ".5rem" }} />Sesión no iniciada
        </div>
        <h2 className="bc fu2" style={{ fontSize: "clamp(2.5rem,6vw,4.5rem)", fontWeight: 900, textTransform: "uppercase", lineHeight: .9, marginBottom: "2rem" }}>
          Esperando<br />al ponente{".".repeat(dots)}
        </h2>
        <div className="fu3" style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", border: "1px solid var(--border2)", padding: ".55rem 1.2rem", fontSize: ".68rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gray)" }}>
          <div style={{ width: 6, height: 6, background: "var(--green)", borderRadius: "50%" }} />
          {state.anonymityMessage || "Respuestas anónimas"}
        </div>
      </div>
    </div>
  );
};

// ─── QUESTION SCREEN ──────────────────────────────────────────────────────────
const QuestionScreen = ({ state, update, participantId }) => {
  const { currentQuestion, timerStart, timerDuration, questions } = state;
  const totalQ = questions?.length || 3;
  const rem = useCountdown(timerStart, timerDuration);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const prevQ = useRef(currentQuestion);

  useEffect(() => { if (prevQ.current !== currentQuestion) { setText(""); setSubmitted(false); prevQ.current = currentQuestion; } }, [currentQuestion]);
  const submit = useCallback(() => {
    if (submitted) return;
    update({ [`responses.${participantId}.q${currentQuestion}`]: text });
    setSubmitted(true);
  }, [text, participantId, currentQuestion, submitted, update]);
  useEffect(() => { if (rem === 0 && !submitted) submit(); }, [rem, submitted, submit]);

  const q = questions?.[currentQuestion - 1];
  const isLast = rem < 60;
  const pct = (rem / timerDuration) * 100;
  if (!q) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--black)" }}>
      <div style={{ borderBottom: "1px solid var(--border)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: totalQ }).map((_, i) => (
            <div key={i} style={{ width: Math.max(20, Math.floor(120 / totalQ)), height: 3, background: i < currentQuestion - 1 ? "var(--green)" : i === currentQuestion - 1 ? "var(--yellow)" : "var(--dark3)", transition: "background .3s" }} />
          ))}
        </div>
        <div className="bc" style={{ fontSize: "1.8rem", fontWeight: 800, color: isLast ? "var(--red)" : "var(--yellow)", letterSpacing: "-.02em" }}>{fmt(rem)}</div>
      </div>
      <div style={{ height: 2, background: "var(--dark3)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: isLast ? "var(--red)" : "var(--yellow)", transition: "width .4s linear" }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "2rem 1.5rem", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gray)", marginBottom: ".75rem" }}>Pregunta {currentQuestion} de {totalQ}</div>
        <h2 className="bc fu" style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, marginBottom: "2rem" }}>{q.text}</h2>
        {submitted ? (
          <div className="fu" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1.5rem" }}>
            <div style={{ width: 64, height: 64, border: "2px solid var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "var(--green)", fontSize: 28, fontWeight: 900 }}>✓</span>
            </div>
            <div>
              <div className="bc" style={{ fontSize: "1.6rem", fontWeight: 900, textTransform: "uppercase", marginBottom: ".25rem" }}>Enviado</div>
              <div style={{ fontSize: ".78rem", color: "var(--gray)" }}>Espera a la siguiente pregunta</div>
            </div>
          </div>
        ) : (
          <>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Escribe tu respuesta aquí…"
              className="fta" style={{ flex: 1, minHeight: 160 }}
              onFocus={e => e.target.style.borderColor = "var(--yellow)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            <div style={{ marginTop: "1.25rem" }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray)", marginBottom: ".5rem" }}>Insertar palabra clave</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginBottom: "1.25rem" }}>
                {q.keywords?.map(kw => <button key={kw} className="kc btn" onClick={() => setText(t => t ? t + " " + kw : kw)}>{kw}</button>)}
              </div>
              <button className="btn by" style={{ width: "100%", justifyContent: "center" }} onClick={submit}>Enviar respuesta →</button>
            </div>
          </>
        )}
      </div>
      <div style={{ padding: ".65rem 1.5rem", borderTop: "1px solid var(--border)", fontSize: ".62rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gray2)", textAlign: "center" }}>Respuesta anónima</div>
    </div>
  );
};

// ─── DEBATE SCREEN ────────────────────────────────────────────────────────────
const DebateScreen = ({ state, update, participantId }) => {
  const { debateQuestion, debateTimerStart, debateTimerDuration, analysis, questions } = state;
  const rem = useCountdown(debateTimerStart, debateTimerDuration);
  const [stance, setStance] = useState(null);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const qKey = debateQuestion ? `q${debateQuestion}` : null;
  const submit = useCallback(() => {
    if (submitted || !stance) return;
    update({ [`debateResponses.${participantId}.${qKey}`]: { stance, text } });
    setSubmitted(true);
  }, [submitted, stance, text, participantId, qKey, update]);
  useEffect(() => { if (rem === 0 && !submitted && stance) submit(); }, [rem, submitted, submit, stance]);
  const summary = qKey ? analysis?.[qKey] : "";
  const q = debateQuestion ? questions?.[debateQuestion - 1] : null;
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--black)" }}>
      <div style={{ borderBottom: "1px solid var(--border)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--yellow)" }}>◎ Modo debate</span>
        <span className="bc" style={{ fontSize: "1.5rem", fontWeight: 800, color: rem < 30 ? "var(--red)" : "var(--white)" }}>{fmt(rem)}</span>
      </div>
      <div style={{ flex: 1, padding: "2rem 1.5rem", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <div style={{ background: "var(--dark2)", border: "1px solid var(--border)", borderLeft: "3px solid var(--yellow)", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--yellow)", marginBottom: ".4rem" }}>{q?.text}</div>
          <p style={{ fontSize: ".88rem", lineHeight: 1.65, color: "rgba(255,255,255,.8)" }}>{summary || "Cargando…"}</p>
        </div>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div className="bc" style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase", color: "var(--yellow)" }}>Registrado</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: "1px", background: "var(--border)", marginBottom: "1.25rem" }}>
              {[{ id: "agree", l: "De acuerdo" }, { id: "nuance", l: "Lo matizo" }, { id: "disagree", l: "Discrepo" }].map(s => (
                <button key={s.id} className={`dbtn ${stance === s.id ? (s.id === "agree" ? "sa" : s.id === "nuance" ? "sn2" : "sd") : ""}`} onClick={() => setStance(s.id)}>{s.l}</button>
              ))}
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Añade un matiz (opcional)…"
              className="fta" style={{ minHeight: 90, marginBottom: "1rem" }}
              onFocus={e => e.target.style.borderColor = "var(--yellow)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            <button className="btn by" style={{ width: "100%", justifyContent: "center", opacity: stance ? 1 : .4 }} onClick={submit} disabled={!stance}>Enviar reacción →</button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── SESSION PICKER ───────────────────────────────────────────────────────────
const SessionPicker = ({ onPick }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    listSessions().then(s => {
      const active = s.filter(x => x.status !== "results");
      if (active.length === 1) { onPick(active[0].id); return; }
      setSessions(s); setLoading(false);
    });
  }, []);
  if (loading) return <LoadingScreen />;
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--black)", padding: "2rem" }}>
      <div className="bc fu" style={{ fontSize: "clamp(1.5rem,4vw,2.5rem)", fontWeight: 900, textTransform: "uppercase", marginBottom: "2rem", textAlign: "center" }}>
        Selecciona<br /><span style={{ color: "var(--yellow)" }}>tu sesión</span>
      </div>
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
        {sessions.map(s => (
          <button key={s.id} onClick={() => onPick(s.id)}
            style={{ background: "var(--dark)", border: "none", borderLeft: "3px solid transparent", padding: "1.25rem 1.5rem", textAlign: "left", color: "var(--white)", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--dark2)"; e.currentTarget.style.borderLeftColor = "var(--yellow)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--dark)"; e.currentTarget.style.borderLeftColor = "transparent"; }}>
            <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: ".2rem" }}>{s.sessionName || s.id}</div>
            <div style={{ fontSize: ".7rem", color: "var(--gray)", display: "flex", gap: ".75rem" }}>
              <span>{fmtDate(s.createdAt)}</span>
              <span style={{ color: s.status === "results" ? "var(--green)" : s.status === "waiting" ? "var(--gray)" : "var(--yellow)" }}>
                {s.status === "results" ? "Completada" : s.status === "waiting" ? "En espera" : "Activa"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── KEY FIELD (password-style) ───────────────────────────────────────────────
const KeyField = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="fl">{label}</label>
      <div className="key-input-wrap">
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "sk-..."} className="fi" />
        <button className="key-reveal" onClick={() => setShow(s => !s)}>{show ? "Ocultar" : "Ver"}</button>
      </div>
    </div>
  );
};

// ─── SESSIONS TAB ─────────────────────────────────────────────────────────────
const SessionsTab = ({ state, update, sessionId, onSessionChange }) => {
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
  const MAX_Q = 5;

  useEffect(() => { listSessions().then(s => { setSessions(s); setLoadingSess(false); }); }, []);

  const saveQ = async () => {
    await update({ questions });
    setSavedQ(true); setTimeout(() => setSavedQ(false), 2000);
  };

  const genAI = async () => {
    if (!genCtx.trim()) return;
    setGenerating(true);
    const r = await callAIJSON("Experto en diseño de formaciones. SOLO JSON.",
      `Diseña 3 preguntas de feedback para: "${genCtx}". JSON exacto:
{"questions":[
  {"text":"pregunta","keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"],"prompt":"Instrucción de análisis específica para esta pregunta. Máximo 120 palabras. Sin markdown."},
  {"text":"pregunta","keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"],"prompt":"Instrucción de análisis específica para esta pregunta. Máximo 120 palabras. Sin markdown."},
  {"text":"pregunta","keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"],"prompt":"Instrucción de análisis específica para esta pregunta. Máximo 120 palabras. Sin markdown."}
]}`, state.aiConfig);
    if (r?.questions) { setQuestions(r.questions); update({ questions: r.questions, sessionContext: genCtx }); }
    setGenerating(false);
  };

  const addQ = () => {
    if (questions.length >= MAX_Q) return;
    setQuestions([...questions, { text: "", keywords: [], prompt: "Analiza las respuestas. Máximo 120 palabras. Sin markdown." }]);
  };

  const removeQ = (i) => { if (questions.length <= 1) return; setQuestions(questions.filter((_, j) => j !== i)); };

  const handleNew = async () => {
    if (!newName.trim()) return;
    const copy = copyFrom ? sessions.find(s => s.id === copyFrom) : null;
    const id = await createSession(newName, copy);
    setShowModal(false); setNewName(""); setCopyFrom(null);
    listSessions().then(setSessions); onSessionChange(id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Session list */}
      <div className="card">
        <div className="sl">Sesiones</div>
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

      {/* Question editor */}
      <div className="card">
        <div className="sl">Preguntas ({questions.length}/{MAX_Q})</div>

        {/* AI generator */}
        <div style={{ background: "var(--dark3)", border: "1px solid var(--yb)", padding: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--yellow)", marginBottom: ".5rem" }}>✦ Generar con IA</div>
          <textarea value={genCtx} onChange={e => setGenCtx(e.target.value)} placeholder="Describe el contexto de la formación…"
            className="fta" style={{ minHeight: 68, marginBottom: ".75rem" }}
            onFocus={e => e.target.style.borderColor = "var(--yellow)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          <button className="btn by bsm" onClick={genAI} disabled={generating || !genCtx.trim()}>
            {generating ? <><Spinner size={14} /> Generando…</> : "Generar →"}
          </button>
        </div>

        {/* Question cards */}
        {questions.map((q, i) => (
          <div key={i} className="qed">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".4rem" }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--yellow)" }}>Pregunta {i + 1}</div>
              {questions.length > 1 && (
                <button onClick={() => removeQ(i)} style={{ fontSize: ".62rem", color: "var(--red)", background: "none", border: "none", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>✕ Eliminar</button>
              )}
            </div>

            {/* Question text */}
            <label className="fl">Pregunta</label>
            <textarea value={q.text} onChange={e => { const qs = [...questions]; qs[i] = { ...qs[i], text: e.target.value }; setQuestions(qs); }}
              className="fta" style={{ minHeight: 52, marginBottom: ".75rem" }}
              onFocus={e => e.target.style.borderColor = "var(--yellow)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />

            {/* Keywords */}
            <label className="fl">Keywords</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".3rem", marginBottom: ".75rem" }}>
              {q.keywords?.map((kw, j) => (
                <button key={j} onClick={() => { const qs = [...questions]; qs[i].keywords = qs[i].keywords.filter((_, k) => k !== j); setQuestions(qs); }}
                  style={{ fontSize: ".68rem", fontWeight: 600, padding: ".22rem .55rem", background: "var(--yd)", border: "1px solid var(--yb)", color: "var(--yellow)", letterSpacing: ".04em", textTransform: "uppercase" }}
                  title="Click para eliminar">{kw} ✕</button>
              ))}
              {editingKw === i ? (
                <input value={kwDraft} onChange={e => setKwDraft(e.target.value)} autoFocus placeholder="palabra…"
                  onKeyDown={e => {
                    if (e.key === "Enter" && kwDraft.trim()) { const qs = [...questions]; qs[i].keywords = [...(qs[i].keywords || []), kwDraft.trim()]; setQuestions(qs); setKwDraft(""); setEditingKw(null); }
                    if (e.key === "Escape") setEditingKw(null);
                  }}
                  style={{ fontSize: ".68rem", background: "var(--dark)", border: "1px solid var(--yellow)", padding: ".2rem .5rem", color: "var(--white)", width: 90 }} />
              ) : (
                <button onClick={() => setEditingKw(i)} style={{ fontSize: ".68rem", padding: ".22rem .55rem", background: "transparent", border: "1px dashed var(--gray2)", color: "var(--gray)" }}>+ añadir</button>
              )}
            </div>

            {/* Prompt */}
            <label className="fl">Prompt de análisis</label>
            <textarea value={q.prompt || ""} onChange={e => { const qs = [...questions]; qs[i] = { ...qs[i], prompt: e.target.value }; setQuestions(qs); }}
              className="fta" style={{ minHeight: 72, fontSize: ".8rem" }}
              onFocus={e => e.target.style.borderColor = "var(--yellow)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
        ))}

        {/* Add question */}
        {questions.length < MAX_Q && (
          <button onClick={addQ} style={{ width: "100%", padding: ".75rem", background: "transparent", border: "1px dashed var(--gray2)", color: "var(--gray)", fontSize: ".75rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginTop: "1px" }}>
            + Añadir pregunta ({questions.length}/{MAX_Q})
          </button>
        )}

        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="btn by bsm" onClick={saveQ}>Guardar preguntas</button>
          <SavedBadge show={savedQ} />
        </div>
      </div>

      {/* New session modal */}
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

// ─── CONFIG TAB ───────────────────────────────────────────────────────────────
const ConfigTab = ({ state, update }) => {
  const [cfgName, setCfgName] = useState(state.sessionName || "");
  const [cfgTitle, setCfgTitle] = useState(state.branding?.sessionTitle || "Inteligencia Colectiva");
  const [cfgAnon, setCfgAnon] = useState(state.anonymityMessage || "");
  const [savedCfg, setSavedCfg] = useState(false);

  const ai = state.aiConfig || makeDefault().aiConfig;
  const [provider, setProvider] = useState(ai.provider || "claude");
  const [claudeKey, setClaudeKey] = useState(ai.claudeKey || "");
  const [openaiKey, setOpenaiKey] = useState(ai.openaiKey || "");
  const [geminiKey, setGeminiKey] = useState(ai.geminiKey || "");
  const [savedAI, setSavedAI] = useState(false);

  const saveCfg = async () => {
    await update({ sessionName: cfgName, branding: { ...state.branding, sessionTitle: cfgTitle }, anonymityMessage: cfgAnon });
    setSavedCfg(true); setTimeout(() => setSavedCfg(false), 2000);
  };

  const saveAI = async () => {
    await update({ aiConfig: { provider, claudeKey, openaiKey, geminiKey } });
    setSavedAI(true); setTimeout(() => setSavedAI(false), 2000);
  };

  const providers = [
    { id: "claude", label: "Claude", sub: "Anthropic" },
    { id: "openai", label: "GPT-4o", sub: "OpenAI" },
    { id: "gemini", label: "Gemini", sub: "Google" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* General settings */}
      <div className="card">
        <div className="sl">Configuración general</div>
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
          <button className="btn by bsm" onClick={saveCfg}>Guardar</button>
          <SavedBadge show={savedCfg} />
        </div>
      </div>

      {/* AI model */}
      <div className="card">
        <div className="sl">Modelo de IA</div>
        <p style={{ fontSize: ".78rem", color: "var(--gray)", marginBottom: "1rem", lineHeight: 1.6 }}>
          Selecciona el proveedor y añade tu API key. Las keys se guardan en la sesión y solo son visibles para el ponente.
          <br /><span style={{ color: "var(--red)", fontWeight: 700 }}>⚠ No compartas la URL del ponente.</span>
        </p>

        {/* Provider selector */}
        <div style={{ display: "flex", gap: "1px", background: "var(--border)", marginBottom: "1.25rem" }}>
          {providers.map(p => (
            <button key={p.id} className={`provider-btn ${provider === p.id ? "active" : ""}`} onClick={() => setProvider(p.id)}>
              <div>{p.label}</div>
              <div style={{ fontSize: ".62rem", opacity: .6, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{p.sub}</div>
            </button>
          ))}
        </div>

        {/* Key fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {provider === "claude" && (
            <KeyField label="Anthropic API Key" value={claudeKey} onChange={setClaudeKey} placeholder="sk-ant-..." />
          )}
          {provider === "openai" && (
            <KeyField label="OpenAI API Key" value={openaiKey} onChange={setOpenaiKey} placeholder="sk-..." />
          )}
          {provider === "gemini" && (
            <KeyField label="Google Gemini API Key" value={geminiKey} onChange={setGeminiKey} placeholder="AIza..." />
          )}
        </div>

        <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="btn by bsm" onClick={saveAI}>Guardar modelo</button>
          <SavedBadge show={savedAI} />
        </div>
      </div>
    </div>
  );
};

// ─── PRESENTER DASHBOARD ─────────────────────────────────────────────────────
const PresenterDashboard = ({ initialSessionId }) => {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [tab, setTab] = useState("control");
  const { state, loading, update } = useSession(sessionId);

  const timerStart = state?.timerStart || null;
  const timerDuration = state?.timerDuration || 300;
  const debateTimerStart = state?.debateTimerStart || null;
  const debateTimerDuration = state?.debateTimerDuration || 120;
  const rem = useCountdown(timerStart, timerDuration);
  const debateRem = useCountdown(debateTimerStart, debateTimerDuration);
  const [usingSugg, setUsingSugg] = useState({});

  if (loading || !state) return <LoadingScreen />;

  const { status, currentQuestion, responses, analysis, streamingText, wordFrequency,
    questions, sentiment, highlights, suggestedQuestions, resultsPublished,
    debateActive, debateQuestion, debateResponses, sessionName, aiConfig } = state;

  const totalQ = questions?.length || 3;
  const isProcessing = status === "processing";
  const isLive = status.startsWith("question");
  const pCount = Object.keys(responses || {}).length;
  const rCount = Object.values(responses || {}).reduce((a, r) => a + Object.keys(r).length, 0);
  const wCount = Object.values(responses || {}).reduce((a, r) => a + Object.values(r).filter(v => typeof v === "string").join(" ").split(" ").filter(Boolean).length, 0);

  const startSession = () => update({ status: "question_1", currentQuestion: 1, timerStart: Date.now() });

  const advance = async (close = false) => {
    await update({ status: "processing" });
    await runAnalysis(state, currentQuestion, sessionId);
    const next = currentQuestion + 1;
    if (!close && next <= totalQ) await update({ status: `question_${next}`, currentQuestion: next, timerStart: Date.now() });
    else await update({ status: "results" });
  };

  const regenerate = async qNum => {
    await update({ [`analysis.q${qNum}`]: "", [`streamingText.q${qNum}`]: "" });
    await runAnalysis(state, qNum, sessionId);
  };

  const togglePublish = qNum => update({ [`resultsPublished.q${qNum}`]: !resultsPublished?.[`q${qNum}`] });
  const startDebate = qNum => update({ debateActive: true, debateQuestion: qNum, debateTimerStart: Date.now() });

  const closeDebate = async () => {
    await update({ debateActive: false });
    const qKey = `q${debateQuestion}`;
    const entries = Object.values(debateResponses || {}).map(r => r?.[qKey]).filter(Boolean);
    if (!entries.length) return;
    const counts = { agree: 0, nuance: 0, disagree: 0 };
    entries.forEach(e => { counts[e.stance] = (counts[e.stance] || 0) + 1; });
    let meta = "";
    await callAI("Analista. Máx 80 palabras. Sin markdown.",
      `${counts.agree} de acuerdo, ${counts.nuance} matices, ${counts.disagree} desacuerdo. Meta-análisis.`,
      async c => { meta += c; await update({ [`debateAnalysis.q${debateQuestion}`]: meta }); }, aiConfig);
  };

  const addDemo = () => {
    const demos = [
      { q1: "Muy inspiradora. Ha cambiado mi perspectiva.", q2: "La escucha activa como base del liderazgo.", q3: "Cambiaré mis hábitos de comunicación.", q4: "Aplicaré la reflexión en mis reuniones.", q5: "Compartiré esto con mi equipo." },
      { q1: "Sorprendente. Conectar humanidades con empresa.", q2: "La creatividad como motor de decisiones.", q3: "Presencia en mis conversaciones.", q4: "Nuevas formas de escuchar a mi equipo.", q5: "Empezaré a practicar el silencio activo." },
    ];
    const id = `demo_${Date.now()}`;
    const qNum = currentQuestion || 1;
    const resp = demos[Math.floor(Math.random() * demos.length)];
    update({ [`responses.${id}.q${qNum}`]: resp[`q${qNum}`] || "Respuesta de ejemplo para esta sesión." });
  };

  const statusLabel = { waiting: "En espera", processing: "Analizando", results: "Completada" }[status] || (isLive ? `P${currentQuestion} activa` : status);

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 50, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 6, height: 6, background: "var(--yellow)" }} />
          <span className="bc" style={{ fontSize: ".95rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em" }}>Inteligencia Colectiva</span>
          <span style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gray2)", borderLeft: "1px solid var(--border)", paddingLeft: "1rem" }}>{sessionName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
          <span className={`dot ${isLive ? "dy" : status === "results" ? "dg" : "dx"}`} />
          <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gray)" }}>{statusLabel}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="g4" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {[{ l: "Participantes", v: pCount }, { l: "Respuestas", v: rCount }, { l: "Palabras", v: wCount }, { l: "Tiempo", v: isLive ? fmt(rem) : "—", alert: rem < 60 && isLive }].map(({ l, v, alert }) => (
          <div key={l} className="mc">
            <div className="ml">{l}</div>
            <div className="mv" style={{ color: alert ? "var(--red)" : "var(--white)" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0, padding: "0 1.5rem" }}>
        {[["control", "Control"], ["analysis", "Análisis"], ["wordcloud", "Nube"], ["sessions", "Sesiones"], ["config", "Config"]].map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "1.5rem", maxWidth: 1000, margin: "0 auto", width: "100%" }}>

        {/* CONTROL */}
        {tab === "control" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="card">
              <div className="sl">Control de sesión</div>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", alignItems: "center", marginBottom: isLive ? "1rem" : 0 }}>
                {status === "waiting" && <button className="btn by" onClick={startSession}>▶ Iniciar pregunta 1</button>}
                {isLive && currentQuestion < totalQ && <button className="btn by" onClick={() => advance()} disabled={isProcessing}>Siguiente →</button>}
                {isLive && currentQuestion === totalQ && <button className="btn br" onClick={() => advance(true)} disabled={isProcessing}>■ Cerrar y analizar</button>}
                {isProcessing && <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".75rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--yellow)" }}>
                  <Spinner size={16} /> Analizando…
                </div>}
                {isLive && <button className="btn bg bsm" onClick={addDemo}>+ Demo</button>}
              </div>
              {isLive && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".62rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gray)", marginBottom: ".4rem" }}>
                    <span>P{currentQuestion} de {totalQ}</span><span>{Math.round((1 - rem / timerDuration) * 100)}% transcurrido</span>
                  </div>
                  <div style={{ height: 2, background: "var(--dark3)" }}>
                    <div style={{ height: "100%", width: `${(rem / timerDuration) * 100}%`, background: rem < 60 ? "var(--red)" : "var(--yellow)", transition: "width .4s linear" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Question cards — dynamic grid */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(totalQ, 3)}, 1fr)`, gap: "1px", background: "var(--border)" }}>
              {(questions || []).map((q, i) => {
                const qNum = i + 1; const qKey = `q${qNum}`;
                const active = currentQuestion === qNum && isLive;
                const done = !!analysis?.[qKey];
                const suggestion = suggestedQuestions?.[`q${qNum - 1}`];
                return (
                  <div key={i} style={{ padding: "1.1rem", background: "var(--dark)", borderLeft: active ? "3px solid var(--yellow)" : "3px solid transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".4rem" }}>
                      <span style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: active ? "var(--yellow)" : "var(--gray2)" }}>P{qNum}</span>
                      <div style={{ display: "flex", gap: ".3rem", alignItems: "center" }}>
                        {done && <span style={{ color: "var(--green)", fontSize: ".72rem", fontWeight: 700 }}>✓</span>}
                        {active && <span className="tag">Activa</span>}
                      </div>
                    </div>
                    <p style={{ fontSize: ".8rem", lineHeight: 1.4, marginBottom: ".4rem", fontWeight: 600 }}>{q.text}</p>
                    <div style={{ fontSize: ".62rem", color: "var(--gray2)", marginBottom: suggestion ? ".6rem" : 0 }}>
                      {Object.values(responses || {}).filter(r => r?.[qKey]).length} respuestas
                    </div>
                    {suggestion && !usingSugg[qKey] && (
                      <div style={{ background: "var(--yd)", border: "1px solid var(--yb)", padding: ".55rem", marginTop: ".4rem" }}>
                        <div style={{ fontSize: ".58rem", fontWeight: 700, color: "var(--yellow)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".25rem" }}>✦ IA sugiere</div>
                        <p style={{ fontSize: ".72rem", lineHeight: 1.4, marginBottom: ".35rem", color: "rgba(255,255,255,.7)" }}>{suggestion}</p>
                        <button onClick={() => { const qs = [...(questions || [])]; qs[qNum - 1] = { ...qs[qNum - 1], text: suggestion }; update({ questions: qs }); setUsingSugg({ ...usingSugg, [qKey]: true }); }}
                          style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--yellow)", background: "none", border: "1px solid var(--yb)", padding: ".18rem .45rem", letterSpacing: ".06em", textTransform: "uppercase" }}>Adoptar</button>
                      </div>
                    )}
                    {done && (
                      <div style={{ marginTop: ".5rem", display: "flex", gap: ".3rem" }}>
                        <button onClick={() => togglePublish(qNum)} style={{ flex: 1, fontSize: ".6rem", padding: ".3rem", border: "1px solid", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", borderColor: resultsPublished?.[qKey] ? "var(--green)" : "var(--border2)", background: resultsPublished?.[qKey] ? "rgba(42,230,122,.08)" : "transparent", color: resultsPublished?.[qKey] ? "var(--green)" : "var(--gray)" }}>
                          {resultsPublished?.[qKey] ? "● Publicado" : "Publicar"}
                        </button>
                        {resultsPublished?.[qKey] && !debateActive && (
                          <button onClick={() => startDebate(qNum)} style={{ flex: 1, fontSize: ".6rem", padding: ".3rem", border: "1px solid var(--yb)", background: "var(--yd)", color: "var(--yellow)", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer" }}>Debate</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {debateActive && (
              <div style={{ background: "var(--dark2)", border: "1px solid var(--yb)", borderLeft: "3px solid var(--yellow)", padding: "1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--yellow)", marginBottom: ".2rem" }}>Debate activo · P{debateQuestion}</div>
                  <div style={{ fontSize: ".8rem", color: "var(--gray)" }}>{Object.values(debateResponses || {}).filter(r => r?.[`q${debateQuestion}`]).length} reacciones</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span className="bc" style={{ fontSize: "1.8rem", fontWeight: 800, color: debateRem < 30 ? "var(--red)" : "var(--yellow)" }}>{fmt(debateRem)}</span>
                  <button className="btn by bsm" onClick={closeDebate}>Cerrar</button>
                </div>
              </div>
            )}

            {wordFrequency?.length > 0 && (
              <div className="card">
                <div className="sl">Nube en tiempo real</div>
                <WordCloud words={wordFrequency} />
              </div>
            )}

            {status === "results" && <ResultsDisplay state={state} compact />}
          </div>
        )}

        {/* ANALYSIS */}
        {tab === "analysis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {(questions || []).map((q, i) => {
              const qNum = i + 1; const qKey = `q${qNum}`;
              const text = streamingText?.[qKey] || analysis?.[qKey];
              const streaming = !!streamingText?.[qKey];
              return (
                <div key={i} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".9rem" }}>
                    <div>
                      <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--yellow)", marginBottom: ".2rem" }}>Pregunta {qNum}</div>
                      <div className="bc" style={{ fontSize: "1.05rem", fontWeight: 800, textTransform: "uppercase" }}>{q.text}</div>
                    </div>
                    <div style={{ display: "flex", gap: ".4rem", flexShrink: 0 }}>
                      {analysis?.[qKey] && <button className="btn bg bsm" onClick={() => regenerate(qNum)}>↺ Regenerar</button>}
                      {analysis?.[qKey] && <button onClick={() => togglePublish(qNum)} style={{ fontSize: ".7rem", padding: ".38rem .8rem", border: "1px solid", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", borderColor: resultsPublished?.[qKey] ? "var(--green)" : "var(--border2)", background: resultsPublished?.[qKey] ? "rgba(42,230,122,.08)" : "transparent", color: resultsPublished?.[qKey] ? "var(--green)" : "var(--gray)" }}>
                        {resultsPublished?.[qKey] ? "Publicado ✓" : "Publicar"}
                      </button>}
                    </div>
                  </div>
                  {text ? (
                    <>
                      <p style={{ fontSize: ".88rem", lineHeight: 1.75, color: "rgba(255,255,255,.8)", marginBottom: "1rem" }}>
                        {text}{streaming && <span style={{ animation: "blink 1s infinite", color: "var(--yellow)" }}>▌</span>}
                      </p>
                      {highlights?.[qKey]?.length > 0 && <><div className="sl">Voces destacadas</div>{highlights[qKey].map((h, j) => <div key={j} className="hbar">"{h}"</div>)}</>}
                      {sentiment?.[qKey] && <><div className="sl" style={{ marginTop: ".9rem" }}>Sentimiento</div><SentimentBar sentiment={sentiment[qKey]} /></>}
                    </>
                  ) : (
                    <p style={{ fontSize: ".8rem", color: "var(--gray2)", fontStyle: "italic" }}>El análisis aparecerá al cerrar la pregunta</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* WORD CLOUD */}
        {tab === "wordcloud" && (
          <div className="card">
            <div className="sl">Nube de palabras en tiempo real</div>
            <WordCloud words={wordFrequency} />
          </div>
        )}

        {/* SESSIONS */}
        {tab === "sessions" && (
          <SessionsTab state={state} update={update} sessionId={sessionId} onSessionChange={id => setSessionId(id)} />
        )}

        {/* CONFIG */}
        {tab === "config" && (
          <ConfigTab state={state} update={update} />
        )}
      </div>
    </div>
  );
};

// ─── PARTICIPANT & CLIENT ─────────────────────────────────────────────────────
const ParticipantApp = ({ sessionId }) => {
  const { state, loading, update } = useSession(sessionId);
  const [pid] = useState(() => `p_${Math.random().toString(36).slice(2, 8)}`);
  useEffect(() => { if (state) update({ [`participants.${pid}`]: true }); }, [!!state]);
  if (loading || !state) return <LoadingScreen />;
  const { status, debateActive } = state;
  if (debateActive) return <DebateScreen state={state} update={update} participantId={pid} />;
  if (status === "waiting") return <WaitingScreen state={state} />;
  if (status.startsWith("question")) return <QuestionScreen state={state} update={update} participantId={pid} />;
  if (status === "processing") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--black)" }}>
      <div style={{ textAlign: "center" }}><Spinner /><div className="bc" style={{ fontSize: "1.5rem", fontWeight: 900, textTransform: "uppercase", marginTop: "1rem" }}>Analizando</div></div>
    </div>
  );
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--black)", textAlign: "center", padding: "2rem" }}>
      <div style={{ width: 64, height: 64, border: "2px solid var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
        <span style={{ color: "var(--green)", fontSize: 28, fontWeight: 900 }}>✓</span>
      </div>
      <h2 className="bc fu" style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, textTransform: "uppercase", marginBottom: ".75rem" }}>¡Gracias!</h2>
      <p className="fu2" style={{ color: "var(--gray)", fontSize: ".85rem" }}>El ponente está preparando los resultados.</p>
    </div>
  );
};

const ClientApp = ({ sessionId }) => {
  const { state, loading } = useSession(sessionId);
  if (loading || !state) return <LoadingScreen />;
  const { responses, resultsPublished, branding, sessionName } = state;
  const pCount = Object.keys(responses || {}).length;
  const anyPublished = Object.values(resultsPublished || {}).some(Boolean);
  return (
    <div style={{ minHeight: "100vh", background: "var(--black)" }}>
      <div style={{ borderBottom: "1px solid var(--border)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
          <div style={{ width: 6, height: 6, background: "var(--yellow)" }} />
          <span className="bc" style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em" }}>{branding?.sessionTitle || "Inteligencia Colectiva"}</span>
          <span style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gray2)", borderLeft: "1px solid var(--border)", paddingLeft: "1rem" }}>{sessionName}</span>
        </div>
        <span style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gray2)" }}>Vista cliente</span>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", gap: "1px", background: "var(--border)", marginBottom: "2rem" }}>
          {[["Participantes", pCount], ["Analizadas", Object.values(state.analysis || {}).filter(Boolean).length]].map(([l, v]) => (
            <div key={l} style={{ flex: 1, background: "var(--dark)", padding: "1.25rem" }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gray)", marginBottom: ".2rem" }}>{l}</div>
              <div className="bc" style={{ fontSize: "2rem", fontWeight: 800 }}>{v}</div>
            </div>
          ))}
        </div>
        {!anyPublished ? (
          <div style={{ textAlign: "center", padding: "4rem", border: "1px solid var(--border)" }}>
            <div className="bc" style={{ fontSize: "1.5rem", fontWeight: 900, textTransform: "uppercase", marginBottom: ".5rem" }}>Resultados pendientes</div>
            <p style={{ color: "var(--gray)", fontSize: ".82rem" }}>El ponente publicará los resultados cuando estén listos.</p>
          </div>
        ) : <ResultsDisplay state={state} compact={false} />}
      </div>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const handleRole = async r => {
    setRole(r);
    if (r === "presenter") {
      const sessions = await listSessions();
      const id = sessions.length === 0 ? await createSession("Sesión 1") : sessions[0].id;
      setSessionId(id);
    }
  };

  return (
    <>
      <style>{css}</style>
      {!role && <RoleSelector onSelect={handleRole} />}
      {role === "presenter" && !sessionId && <LoadingScreen />}
      {role === "presenter" && sessionId && <PresenterDashboard initialSessionId={sessionId} />}
      {role === "participant" && !sessionId && <SessionPicker onPick={setSessionId} />}
      {role === "participant" && sessionId && <ParticipantApp sessionId={sessionId} />}
      {role === "client" && !sessionId && <SessionPicker onPick={setSessionId} />}
      {role === "client" && sessionId && <ClientApp sessionId={sessionId} />}
    </>
  );
}
