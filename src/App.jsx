import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc, updateDoc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

// ─── SESSION MANAGEMENT ───────────────────────────────────────────────────────
const SESSIONS_COLLECTION = "sessions";

const makeDefaultState = (name = "Sesión 1") => ({
  status: "waiting",
  currentQuestion: 0,
  timerStart: null,
  timerDuration: 300,
  createdAt: Date.now(),
  participants: {},
  responses: {},
  analysis: {},
  streamingText: {},
  wordFrequency: [],
  sentiment: {},
  highlights: {},
  debateResponses: {},
  debateAnalysis: {},
  suggestedQuestions: {},
  questions: [
    { text: "¿Qué te ha parecido la formación de hoy?", keywords: ["inspiradora","reflexiva","práctica","sorprendente","profunda","cercana","retadora","transformadora"] },
    { text: "¿Qué aprendizaje te llevas?", keywords: ["perspectiva","autoconocimiento","escucha","empatía","liderazgo","propósito","creatividad","conexión"] },
    { text: "¿Cómo vas a aplicar esto en tu día a día?", keywords: ["conversaciones","hábitos","equipo","decisiones","presencia","tiempo","relaciones","prioridades"] },
  ],
  analysisPrompts: {
    1: "Analiza las respuestas sobre la experiencia en la formación. Destaca aspectos más mencionados, tono general e insights clave. Máximo 120 palabras. Sin asteriscos ni markdown.",
    2: "Analiza los aprendizajes que destacan los participantes. Identifica conceptos que más han resonado. Máximo 120 palabras. Sin asteriscos ni markdown.",
    3: "Analiza cómo aplicarán lo aprendido. Identifica intenciones concretas y patrones de aplicación. Máximo 120 palabras. Sin asteriscos ni markdown.",
  },
  resultsPublished: { q1: false, q2: false, q3: false },
  debateActive: false,
  debateQuestion: null,
  debateTimerStart: null,
  debateTimerDuration: 120,
  sessionName: name,
  branding: { sessionTitle: "Inteligencia Colectiva", accentColor: "#ffe600" },
  anonymityMessage: "Tus respuestas son completamente anónimas.",
  sessionContext: "",
});

const useSession = (sessionId) => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    const ref = doc(db, SESSIONS_COLLECTION, sessionId);
    getDoc(ref).then(snap => { if (!snap.exists()) setDoc(ref, makeDefaultState()); });
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) { setState(snap.data()); setLoading(false); }
    });
    return unsub;
  }, [sessionId]);

  const update = useCallback(u => {
    if (!sessionId) return;
    return updateDoc(doc(db, SESSIONS_COLLECTION, sessionId), u);
  }, [sessionId]);

  return { state, loading, update };
};

const listSessions = async () => {
  const snap = await getDocs(query(collection(db, SESSIONS_COLLECTION), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const createSession = async (name, copyFrom = null) => {
  const id = `session_${Date.now()}`;
  const base = copyFrom ? { ...makeDefaultState(name), questions: copyFrom.questions, analysisPrompts: copyFrom.analysisPrompts, branding: copyFrom.branding, anonymityMessage: copyFrom.anonymityMessage, timerDuration: copyFrom.timerDuration, sessionContext: copyFrom.sessionContext || "" } : makeDefaultState(name);
  await setDoc(doc(db, SESSIONS_COLLECTION, id), { ...base, sessionName: name, createdAt: Date.now() });
  return id;
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&family=Barlow+Condensed:wght@700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --black: #0a0a0a; --dark: #111111; --dark2: #1a1a1a; --dark3: #242424;
    --yellow: #ffe600; --yellow-dim: rgba(255,230,0,0.1); --yellow-border: rgba(255,230,0,0.3);
    --white: #ffffff; --gray: #888888; --gray2: #444444; --gray3: #2a2a2a;
    --red: #e63e2a; --green: #2ae67a; --blue: #3a8fff;
    --border: rgba(255,255,255,0.08); --border2: rgba(255,255,255,0.15);
  }
  html,body { background:var(--black); color:var(--white); font-family:'Barlow',sans-serif; min-height:100vh; overflow-x:hidden; }
  .bc { font-family:'Barlow Condensed',sans-serif; }
  * { -webkit-font-smoothing:antialiased; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
  @keyframes ticker { 0%{transform:translateX(100%)}100%{transform:translateX(-200%)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
  .fu  { animation:fadeUp .45s ease forwards; }
  .fu2 { animation:fadeUp .45s .08s ease forwards; opacity:0; }
  .fu3 { animation:fadeUp .45s .16s ease forwards; opacity:0; }
  ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:var(--gray2)}
  button{font-family:'Barlow',sans-serif;cursor:pointer;transition:all 0.15s}
  textarea,input{font-family:'Barlow',sans-serif}
  textarea:focus,input:focus{outline:none}

  .btn { display:inline-flex; align-items:center; gap:0.4rem; font-weight:700; font-size:0.78rem; letter-spacing:0.06em; text-transform:uppercase; border:none; padding:0.6rem 1.2rem; transition:all 0.15s; }
  .btn-y { background:var(--yellow); color:var(--black); }
  .btn-y:hover { background:white; }
  .btn-g { background:transparent; color:var(--white); border:1px solid var(--border2); }
  .btn-g:hover { border-color:var(--yellow); color:var(--yellow); }
  .btn-r { background:var(--red); color:white; }
  .btn-b { background:var(--blue); color:white; }
  .btn-sm { padding:0.38rem 0.8rem; font-size:0.7rem; }
  .btn:disabled { opacity:0.4; cursor:not-allowed; }

  .card { background:var(--dark2); border:1px solid var(--border); padding:1.5rem; }
  .card-sm { padding:1rem; }

  .tab { background:none; border:none; color:var(--gray); padding:0.85rem 1.1rem; font-size:0.72rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; border-bottom:2px solid transparent; margin-bottom:-1px; }
  .tab:hover{color:var(--white)} .tab.on{color:var(--yellow);border-bottom-color:var(--yellow)}

  .sl { font-size:0.6rem; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:var(--gray); display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem; }
  .sl::after{content:'';flex:1;height:1px;background:var(--border)}

  .metric-card{border-right:1px solid var(--border);padding:1rem 1.5rem}
  .metric-label{font-size:0.6rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--gray);margin-bottom:0.2rem}
  .metric-value{font-family:'Barlow Condensed',sans-serif;font-size:2.2rem;font-weight:800;line-height:1}

  .dot{width:7px;height:7px;border-radius:50%;display:inline-block}
  .dot-y{background:var(--yellow);animation:blink 1.5s infinite}
  .dot-g{background:var(--green)}
  .dot-x{background:var(--gray2)}

  .kw-chip{background:transparent;border:1px solid var(--border2);color:var(--gray);padding:0.28rem 0.65rem;font-size:0.72rem;font-weight:600;letter-spacing:0.04em;text-transform:uppercase}
  .kw-chip:hover{border-color:var(--yellow);color:var(--yellow);background:var(--yellow-dim)}

  .highlight-bar{border-left:3px solid var(--yellow);padding:0.65rem 1rem;background:var(--yellow-dim);font-size:0.85rem;font-style:italic;margin-bottom:0.4rem}

  .sent-row{display:flex;align-items:center;gap:0.75rem;margin-bottom:0.35rem}
  .sent-lbl{font-size:0.62rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;width:55px;text-align:right;color:var(--gray)}
  .sent-track{flex:1;height:3px;background:var(--dark3)}
  .sent-fill{height:100%;transition:width 0.6s ease}
  .sent-n{font-size:0.65rem;color:var(--gray);width:18px}

  .cloud{display:flex;flex-wrap:wrap;gap:0.25rem 0.7rem;justify-content:center;padding:1rem}
  .cloud-w{font-family:'Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:0.02em}

  .ticker-bar{background:var(--yellow);color:var(--black);padding:0.35rem 0;overflow:hidden;white-space:nowrap;font-weight:800;font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase}
  .ticker-inner{display:inline-block;animation:ticker 25s linear infinite}

  .field-label{font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);display:block;margin-bottom:0.35rem}
  .field-input{background:var(--dark3);border:1px solid var(--border);padding:0.65rem 0.9rem;color:var(--white);font-size:0.88rem;width:100%;transition:border-color 0.15s}
  .field-input:focus{border-color:var(--yellow)}
  .field-textarea{background:var(--dark3);border:1px solid var(--border);padding:0.75rem 0.9rem;color:var(--white);font-size:0.85rem;width:100%;resize:vertical;line-height:1.6;transition:border-color 0.15s}
  .field-textarea:focus{border-color:var(--yellow)}

  .session-card{background:var(--dark2);border:1px solid var(--border);padding:1rem 1.25rem;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:1rem}
  .session-card:hover{border-color:var(--yellow-border);background:var(--dark3)}
  .session-card.active-sess{border-color:var(--yellow);border-left:3px solid var(--yellow)}

  .q-editor{background:var(--dark3);border:1px solid var(--border);padding:1.25rem;margin-bottom:1px}
  .q-editor:focus-within{border-color:var(--yellow-border)}

  .spinner{width:28px;height:28px;border:2px solid var(--dark3);border-top-color:var(--yellow);border-radius:50%;animation:spin 0.8s linear infinite}

  .grid4{display:grid;grid-template-columns:repeat(4,1fr)}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border)}
  .grid3>*{background:var(--dark)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}

  .debate-btn{flex:1;padding:0.9rem;border:2px solid var(--border);background:transparent;color:var(--white);font-weight:700;font-size:0.78rem;letter-spacing:0.06em;text-transform:uppercase}
  .debate-btn:hover{border-color:var(--yellow)}
  .sel-agree{border-color:var(--green)!important;background:rgba(42,230,122,0.1)!important;color:var(--green)!important}
  .sel-nuance{border-color:var(--yellow)!important;background:var(--yellow-dim)!important;color:var(--yellow)!important}
  .sel-disagree{border-color:var(--red)!important;background:rgba(230,62,42,0.1)!important;color:var(--red)!important}

  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
  .modal{background:var(--dark);border:1px solid var(--border2);padding:2rem;width:100%;max-width:560px;max-height:85vh;overflow-y:auto}

  .tag{font-size:0.58rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:0.2rem 0.5rem;border:1px solid var(--yellow-border);color:var(--yellow);background:var(--yellow-dim)}
`;

// ─── UTILS ────────────────────────────────────────────────────────────────────
const useCountdown = (timerStart, duration) => {
  const [rem, setRem] = useState(duration);
  useEffect(() => {
    if (!timerStart) { setRem(duration); return; }
    const tick = () => setRem(Math.max(0, duration - (Date.now() - timerStart) / 1000));
    tick(); const id = setInterval(tick, 400);
    return () => clearInterval(id);
  }, [timerStart, duration]);
  return rem;
};

const fmt = s => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;

const STOP = new Set(["que","de","la","el","en","y","a","los","las","un","una","por","con","es","se","me","lo","le","más","pero","como","su","para","al","del","ha","he","mi","no","si","ya","muy","todo","este","esta","son","sus","fue","era","ser","hay","nos","les","esto","cuando","donde","porque","aunque","también","bien"]);

const calcWordFreq = responses => {
  const freq = {};
  Object.values(responses).forEach(r => Object.values(r).forEach(text => {
    if (!text || typeof text !== "string") return;
    text.toLowerCase().replace(/[^a-záéíóúüñ\s]/gi,"").split(/\s+/).forEach(w => {
      if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w]||0) + 1;
    });
  }));
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,50).map(([word,count])=>({word,count}));
};

const stripMd = t => t ? t.replace(/\*\*/g,"").replace(/\*/g,"").replace(/#{1,6}\s/g,"").trim() : t;

const fmtDate = ts => ts ? new Date(ts).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"}) : "—";

// ─── CLAUDE API ───────────────────────────────────────────────────────────────
const claude = async (system, user, onChunk) => {
  try {
    const res = await fetch("/api/claude", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1500, stream:false, system, messages:[{role:"user",content:user}] }),
    });
    if (!res.ok) { onChunk(`[Error ${res.status}]`); return; }
    const data = await res.json();
    onChunk(stripMd(data.content?.[0]?.text || ""));
  } catch(e) { onChunk(`[Error: ${e.message}]`); }
};

const claudeJSON = async (system, user) => {
  let full = "";
  await claude(system+"\nResponde SOLO con JSON válido, sin markdown ni backticks.", user, c => full+=c);
  try { return JSON.parse(full.replace(/```json|```/g,"").trim()); } catch { return null; }
};

// ─── ANALYSIS ENGINE ──────────────────────────────────────────────────────────
const runAnalysis = async (state, qNum, sessionId) => {
  const { responses, analysisPrompts } = state;
  const qKey = `q${qNum}`;
  const ref = doc(db, SESSIONS_COLLECTION, sessionId);
  const texts = Object.values(responses).map(r=>r[qKey]).filter(Boolean);
  if (!texts.length) return;

  let summary = "";
  const sys = `Eres analista de formación. ${analysisPrompts[qNum]}\nSin asteriscos, sin markdown.`;
  await claude(sys, `Respuestas:\n\n${texts.join("\n---\n")}`, async chunk => {
    summary += chunk;
    await updateDoc(ref, { [`streamingText.${qKey}`]: summary });
  });

  await updateDoc(ref, { [`analysis.${qKey}`]: summary, [`streamingText.${qKey}`]: "", wordFrequency: calcWordFreq(responses) });

  const enriched = await claudeJSON("Analista de feedback. SOLO JSON sin markdown.",
    `JSON exacto: {"sentiment":{"positive":N,"neutral":N,"critical":N},"highlights":["frase1","frase2","frase3"]}
Frases literales cortas (máx 10 palabras).\nRespuestas:\n\n${texts.join("\n---\n")}`);
  if (enriched) await updateDoc(ref, { [`sentiment.${qKey}`]: enriched.sentiment, [`highlights.${qKey}`]: enriched.highlights||[] });

  if (qNum < 3) {
    const nq = await claudeJSON("Facilitador experto. SOLO JSON.",
      `Sugiere pregunta de seguimiento para P${qNum+1}. JSON: {"suggestion":"texto"}\nRespuestas:\n\n${texts.join("\n---\n")}`);
    if (nq?.suggestion) await updateDoc(ref, { [`suggestedQuestions.q${qNum}`]: nq.suggestion });
  }
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const WordCloud = ({ words }) => {
  if(!words||!words.length) return <p style={{color:"var(--gray2)",textAlign:"center",padding:"2rem",fontSize:"0.75rem",letterSpacing:"0.1em",textTransform:"uppercase"}}>Las palabras aparecerán aquí</p>;
  const max = words[0]?.count||1;
  const colors = ["var(--yellow)","var(--white)","rgba(255,255,255,0.55)","rgba(255,230,0,0.55)"];
  return (
    <div className="cloud">
      {words.map(({word,count},i)=>(
        <span key={word} className="cloud-w" style={{fontSize:`${0.65+(count/max)*2}rem`,color:colors[i%colors.length],opacity:0.3+(count/max)*0.7}}>{word}</span>
      ))}
    </div>
  );
};

const SentimentBar = ({ sentiment }) => {
  if(!sentiment) return null;
  const total=(sentiment.positive||0)+(sentiment.neutral||0)+(sentiment.critical||0)||1;
  return (
    <div>
      {[["Positivo",sentiment.positive||0,"var(--green)"],["Neutro",sentiment.neutral||0,"var(--yellow)"],["Crítico",sentiment.critical||0,"var(--red)"]].map(([l,c,color])=>(
        <div key={l} className="sent-row">
          <span className="sent-lbl">{l}</span>
          <div className="sent-track"><div className="sent-fill" style={{width:`${(c/total)*100}%`,background:color}}/></div>
          <span className="sent-n">{c}</span>
        </div>
      ))}
    </div>
  );
};

const ResultsDisplay = ({ state, compact }) => {
  const { analysis, streamingText, wordFrequency, questions, responses, sentiment, highlights, resultsPublished } = state;
  const pCount = Object.keys(responses||{}).length;
  return (
    <div style={{background:"var(--black)",padding:compact?"1rem":"2rem",maxWidth:compact?960:800,margin:"0 auto",width:"100%"}}>
      {!compact&&(
        <div style={{marginBottom:"3rem"}} className="fu">
          <div style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.75rem"}}>
            <span className="dot dot-g" style={{marginRight:"0.5rem"}}/>Sesión completada · {pCount} participantes
          </div>
          <h1 className="bc" style={{fontSize:"clamp(2.5rem,6vw,4rem)",fontWeight:900,textTransform:"uppercase",lineHeight:0.9}}>Resultados</h1>
        </div>
      )}
      {(questions||[]).map((q,i)=>{
        const qKey=`q${i+1}`;
        const text=streamingText?.[qKey]||analysis?.[qKey];
        const streaming=!!streamingText?.[qKey];
        if(!text||(!compact&&!resultsPublished?.[qKey])) return null;
        return (
          <div key={i} style={{borderTop:"1px solid var(--border)",paddingTop:"1.75rem",marginBottom:"1.75rem"}}>
            <div style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.4rem"}}>Pregunta {i+1}</div>
            <div className="bc" style={{fontSize:"1.15rem",fontWeight:800,textTransform:"uppercase",marginBottom:"0.9rem"}}>{q.text}</div>
            <p style={{fontSize:"0.9rem",lineHeight:1.75,color:"rgba(255,255,255,0.8)",marginBottom:"1.25rem"}}>
              {text}{streaming&&<span style={{animation:"blink 1s infinite",color:"var(--yellow)"}}>▌</span>}
            </p>
            {highlights?.[qKey]?.length>0&&(
              <div style={{marginBottom:"1.25rem"}}>
                <div className="sl">Voces destacadas</div>
                {highlights[qKey].map((h,j)=><div key={j} className="highlight-bar">"{h}"</div>)}
              </div>
            )}
            {sentiment?.[qKey]&&<><div className="sl">Sentimiento</div><SentimentBar sentiment={sentiment[qKey]}/></>}
          </div>
        );
      })}
      {wordFrequency?.length>0&&(
        <div style={{borderTop:"1px solid var(--border)",paddingTop:"1.75rem"}}>
          <div className="sl">Palabras más mencionadas</div>
          <WordCloud words={wordFrequency}/>
        </div>
      )}
    </div>
  );
};

// ─── ROLE SELECTOR ────────────────────────────────────────────────────────────
const RoleSelector = ({ onSelect }) => (
  <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--black)"}}>
    <div style={{borderBottom:"1px solid var(--border)",padding:"1.1rem 2rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
      <div style={{width:7,height:7,background:"var(--yellow)"}}/>
      <span className="bc" style={{fontSize:"1rem",fontWeight:900,letterSpacing:"0.06em",textTransform:"uppercase"}}>Inteligencia Colectiva</span>
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem"}}>
      <div style={{marginBottom:"3rem",textAlign:"center"}}>
        <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"1rem"}}>Plataforma de feedback formativo</div>
        <h1 className="bc fu" style={{fontSize:"clamp(3rem,8vw,6rem)",fontWeight:900,textTransform:"uppercase",lineHeight:0.88,letterSpacing:"-0.02em"}}>
          ¿Quién<br/><span style={{color:"var(--yellow)"}}>eres?</span>
        </h1>
      </div>
      <div className="fu2" style={{display:"flex",gap:"1px",background:"var(--border)",width:"100%",maxWidth:580}}>
        {[
          {role:"participant",label:"Participante",sub:"Accede a las preguntas"},
          {role:"presenter",label:"Ponente",sub:"Controla la sesión"},
          {role:"client",label:"Cliente",sub:"Solo lectura"},
        ].map(({role,label,sub})=>(
          <button key={role} onClick={()=>onSelect(role)}
            style={{flex:1,background:"var(--dark)",border:"none",padding:"2rem 1rem",textAlign:"center",color:"var(--white)"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--yellow)";e.currentTarget.style.color="var(--black)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--dark)";e.currentTarget.style.color="var(--white)";}}>
            <div className="bc" style={{fontSize:"1.4rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.03em",marginBottom:"0.2rem"}}>{label}</div>
            <div style={{fontSize:"0.7rem",opacity:0.55}}>{sub}</div>
          </button>
        ))}
      </div>
    </div>
    <div className="ticker-bar"><span className="ticker-inner">FEEDBACK EN TIEMPO REAL &nbsp;·&nbsp; ANÁLISIS CON IA &nbsp;·&nbsp; REFLEXIÓN COLECTIVA &nbsp;·&nbsp; FEEDBACK EN TIEMPO REAL &nbsp;·&nbsp; ANÁLISIS CON IA &nbsp;·&nbsp; REFLEXIÓN COLECTIVA &nbsp;·&nbsp;</span></div>
  </div>
);

// ─── WAITING SCREEN ───────────────────────────────────────────────────────────
const WaitingScreen = ({ state }) => {
  const [dots,setDots]=useState(0);
  useEffect(()=>{const id=setInterval(()=>setDots(d=>(d+1)%4),800);return()=>clearInterval(id);},[]);
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--black)"}}>
      <div style={{borderBottom:"1px solid var(--border)",padding:"1rem 1.5rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
        <div style={{width:6,height:6,background:"var(--yellow)"}}/>
        <span className="bc" style={{fontSize:"0.9rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.08em"}}>{state.branding?.sessionTitle||"Inteligencia Colectiva"}</span>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem",textAlign:"center"}}>
        <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.2em",color:"var(--yellow)",textTransform:"uppercase",marginBottom:"1.5rem"}}>
          <span className="dot dot-x" style={{marginRight:"0.5rem"}}/>Sesión no iniciada
        </div>
        <h2 className="bc fu2" style={{fontSize:"clamp(2.5rem,6vw,4.5rem)",fontWeight:900,textTransform:"uppercase",lineHeight:0.9,marginBottom:"2rem"}}>
          Esperando<br/>al ponente{".".repeat(dots)}
        </h2>
        <div className="fu3" style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",border:"1px solid var(--border2)",padding:"0.55rem 1.2rem",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray)"}}>
          <div style={{width:6,height:6,background:"var(--green)",borderRadius:"50%"}}/>
          {state.anonymityMessage||"Respuestas anónimas"}
        </div>
      </div>
    </div>
  );
};

// ─── QUESTION SCREEN ──────────────────────────────────────────────────────────
const QuestionScreen = ({ state, update, participantId }) => {
  const { currentQuestion, timerStart, timerDuration, questions } = state;
  const q = questions[currentQuestion-1];
const rem = useCountdown(timerStart||null, timerDuration||300);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const prevQ = useRef(currentQuestion);

  useEffect(()=>{ if(prevQ.current!==currentQuestion){setText("");setSubmitted(false);prevQ.current=currentQuestion;} },[currentQuestion]);
  const submit = useCallback(()=>{
    if(submitted) return;
    update({[`responses.${participantId}.q${currentQuestion}`]: text});
    setSubmitted(true);
  },[text,participantId,currentQuestion,submitted,update]);
  useEffect(()=>{ if(rem===0&&!submitted) submit(); },[rem,submitted,submit]);

  const isLast=rem<60; const pct=(rem/timerDuration)*100;
  if(!q) return null;

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--black)"}}>
      <div style={{borderBottom:"1px solid var(--border)",padding:"1rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",gap:4}}>
          {[1,2,3].map(i=><div key={i} style={{width:36,height:3,background:i<currentQuestion?"var(--green)":i===currentQuestion?"var(--yellow)":"var(--dark3)",transition:"background 0.3s"}}/>)}
        </div>
        <div className="bc" style={{fontSize:"1.8rem",fontWeight:800,color:isLast?"var(--red)":"var(--yellow)",letterSpacing:"-0.02em"}}>{fmt(rem)}</div>
      </div>
      <div style={{height:2,background:"var(--dark3)"}}>
        <div style={{height:"100%",width:`${pct}%`,background:isLast?"var(--red)":"var(--yellow)",transition:"width 0.4s linear"}}/>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"2rem 1.5rem",maxWidth:640,margin:"0 auto",width:"100%"}}>
        <div style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--gray)",marginBottom:"0.75rem"}}>Pregunta {currentQuestion} de 3</div>
        <h2 className="bc fu" style={{fontSize:"clamp(1.6rem,4vw,2.4rem)",fontWeight:900,textTransform:"uppercase",lineHeight:1,marginBottom:"2rem"}}>{q.text}</h2>
        {submitted?(
          <div className="fu" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:"1.5rem"}}>
            <div style={{width:64,height:64,border:"2px solid var(--green)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"var(--green)",fontSize:28,fontWeight:900}}>✓</span>
            </div>
            <div>
              <div className="bc" style={{fontSize:"1.6rem",fontWeight:900,textTransform:"uppercase",marginBottom:"0.25rem"}}>Enviado</div>
              <div style={{fontSize:"0.78rem",color:"var(--gray)"}}>Espera a la siguiente pregunta</div>
            </div>
          </div>
        ):(
          <>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe tu respuesta aquí…"
              className="field-textarea" style={{flex:1,minHeight:160}}
              onFocus={e=>e.target.style.borderColor="var(--yellow)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            <div style={{marginTop:"1.25rem"}}>
              <div style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--gray)",marginBottom:"0.5rem"}}>Insertar palabra clave</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",marginBottom:"1.25rem"}}>
                {q.keywords.map(kw=><button key={kw} className="kw-chip btn" onClick={()=>setText(t=>t?t+" "+kw:kw)}>{kw}</button>)}
              </div>
              <button className="btn btn-y" style={{width:"100%",justifyContent:"center"}} onClick={submit}>Enviar respuesta →</button>
            </div>
          </>
        )}
      </div>
      <div style={{padding:"0.65rem 1.5rem",borderTop:"1px solid var(--border)",fontSize:"0.62rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray2)",textAlign:"center"}}>
        Respuesta anónima
      </div>
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
  const summary = qKey ? analysis?.[qKey] : "";
  const q = debateQuestion ? questions?.[debateQuestion-1] : null;

  const submit = useCallback(()=>{
    if(submitted||!stance) return;
    update({[`debateResponses.${participantId}.${qKey}`]:{stance,text}});
    setSubmitted(true);
  },[submitted,stance,text,participantId,qKey,update]);
  useEffect(()=>{ if(rem===0&&!submitted&&stance) submit(); },[rem,submitted,submit,stance]);

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--black)"}}>
      <div style={{borderBottom:"1px solid var(--border)",padding:"1rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--yellow)"}}>◎ Modo debate</span>
        <span className="bc" style={{fontSize:"1.5rem",fontWeight:800,color:rem<30?"var(--red)":"var(--white)"}}>{fmt(rem)}</span>
      </div>
      <div style={{flex:1,padding:"2rem 1.5rem",maxWidth:640,margin:"0 auto",width:"100%"}}>
        <div style={{background:"var(--dark2)",border:"1px solid var(--border)",borderLeft:"3px solid var(--yellow)",padding:"1.25rem",marginBottom:"1.5rem"}}>
          <div style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.4rem"}}>{q?.text}</div>
          <p style={{fontSize:"0.88rem",lineHeight:1.65,color:"rgba(255,255,255,0.8)"}}>{summary||"Cargando…"}</p>
        </div>
        {submitted?(
          <div style={{textAlign:"center",padding:"2rem"}}>
            <div className="bc" style={{fontSize:"2rem",fontWeight:900,textTransform:"uppercase",color:"var(--yellow)"}}>Registrado</div>
          </div>
        ):(
          <>
            <div style={{display:"flex",gap:"1px",background:"var(--border)",marginBottom:"1.25rem"}}>
              {[{id:"agree",l:"De acuerdo"},{id:"nuance",l:"Lo matizo"},{id:"disagree",l:"Discrepo"}].map(s=>(
                <button key={s.id} className={`debate-btn ${stance===s.id?`sel-${s.id}`:""}`} onClick={()=>setStance(s.id)}>{s.l}</button>
              ))}
            </div>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Añade un matiz (opcional)…"
              className="field-textarea" style={{minHeight:90,marginBottom:"1rem"}}
              onFocus={e=>e.target.style.borderColor="var(--yellow)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            <button className="btn btn-y" style={{width:"100%",justifyContent:"center",opacity:stance?1:0.4}} onClick={submit} disabled={!stance}>
              Enviar reacción →
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── CONFIG TAB ───────────────────────────────────────────────────────────────
const ConfigTab = ({ state, update, sessionId, onSessionChange }) => {
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [copyFrom, setCopyFrom] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genContext, setGenContext] = useState(state.sessionContext||"");
  const [questions, setQuestions] = useState(state.questions||[]);
  const [editingKw, setEditingKw] = useState(null);
  const [kwDraft, setKwDraft] = useState("");

  useEffect(()=>{
    listSessions().then(s=>{setSessions(s);setLoadingSessions(false);});
  },[]);

  const saveQuestions = () => update({ questions });
  const saveField = (field, val) => update({ [field]: val });

  const generateQuestionsAI = async () => {
    if (!genContext.trim()) return;
    setGenerating(true);
    const result = await claudeJSON(
      "Eres un experto en diseño de formaciones. Devuelve SOLO JSON válido.",
      `Diseña 3 preguntas de feedback para una formación con este contexto: "${genContext}".
Cada pregunta debe invitar a la reflexión profunda, ser abierta y relevante para el contexto.
JSON exacto:
{"questions":[
  {"text":"pregunta 1","keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"]},
  {"text":"pregunta 2","keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"]},
  {"text":"pregunta 3","keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"]}
]}`
    );
    if (result?.questions) {
      setQuestions(result.questions);
      update({ questions: result.questions, sessionContext: genContext });
    }
    setGenerating(false);
  };

  const handleNewSession = async () => {
    if (!newName.trim()) return;
    const copyData = copyFrom ? sessions.find(s=>s.id===copyFrom) : null;
    const id = await createSession(newName, copyData);
    setShowNewModal(false);
    setNewName("");
    setCopyFrom(null);
    listSessions().then(setSessions);
    onSessionChange(id);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>

      {/* Session management */}
      <div className="card">
        <div className="sl">Gestión de sesiones</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <span style={{fontSize:"0.78rem",color:"var(--gray)"}}>Sesión activa: <strong style={{color:"var(--white)"}}>{state.sessionName}</strong></span>
          <button className="btn btn-y btn-sm" onClick={()=>setShowNewModal(true)}>+ Nueva sesión</button>
        </div>
        {loadingSessions?(
          <div style={{textAlign:"center",padding:"1rem"}}><div className="spinner" style={{margin:"0 auto"}}/></div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:"1px",background:"var(--border)"}}>
            {sessions.map(s=>(
              <div key={s.id} className={`session-card ${s.id===sessionId?"active-sess":""}`} onClick={()=>onSessionChange(s.id)}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:"0.2rem"}}>{s.sessionName||s.id}</div>
                  <div style={{fontSize:"0.7rem",color:"var(--gray)",display:"flex",gap:"1rem"}}>
                    <span>{fmtDate(s.createdAt)}</span>
                    <span>{Object.keys(s.participants||{}).length} participantes</span>
                    <span>{Object.values(s.responses||{}).reduce((a,r)=>a+Object.keys(r).length,0)} respuestas</span>
                  </div>
                </div>
                <div>
                  <span style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:s.status==="results"?"var(--green)":s.status==="waiting"?"var(--gray)":"var(--yellow)"}}>
                    {s.status==="results"?"Completada":s.status==="waiting"?"En espera":"Activa"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions editor */}
      <div className="card">
        <div className="sl">Preguntas de la sesión</div>

        {/* AI generator */}
        <div style={{background:"var(--dark3)",border:"1px solid var(--yellow-border)",padding:"1rem",marginBottom:"1.25rem"}}>
          <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.5rem"}}>✦ Generar preguntas con IA</div>
          <textarea value={genContext} onChange={e=>setGenContext(e.target.value)}
            placeholder="Describe el contexto de la formación. Ej: 'Formación de liderazgo consciente para mandos intermedios de banca'…"
            className="field-textarea" style={{minHeight:72,marginBottom:"0.75rem"}}
            onFocus={e=>e.target.style.borderColor="var(--yellow)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          <button className="btn btn-y btn-sm" onClick={generateQuestionsAI} disabled={generating||!genContext.trim()}>
            {generating?<><div className="spinner" style={{width:14,height:14,borderWidth:1.5}}/> Generando…</>:"Generar preguntas →"}
          </button>
        </div>

        {/* Manual editor */}
        {questions.map((q,i)=>(
          <div key={i} className="q-editor">
            <div style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.4rem"}}>Pregunta {i+1}</div>
            <textarea value={q.text} onChange={e=>{const qs=[...questions];qs[i]={...qs[i],text:e.target.value};setQuestions(qs);}}
              className="field-textarea" style={{minHeight:60,marginBottom:"0.6rem"}}
              onFocus={e=>e.target.style.borderColor="var(--yellow)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            <div style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--gray)",marginBottom:"0.4rem"}}>Keywords</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",marginBottom:"0.4rem"}}>
              {q.keywords.map((kw,j)=>(
                <button key={j} onClick={()=>{const qs=[...questions];qs[i].keywords=qs[i].keywords.filter((_,k)=>k!==j);setQuestions(qs);}}
                  style={{fontSize:"0.68rem",fontWeight:600,padding:"0.22rem 0.55rem",background:"var(--yellow-dim)",border:"1px solid var(--yellow-border)",color:"var(--yellow)",letterSpacing:"0.04em",textTransform:"uppercase"}}
                  title="Click para eliminar">
                  {kw} ✕
                </button>
              ))}
              {editingKw===i?(
                <input value={kwDraft} onChange={e=>setKwDraft(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&kwDraft.trim()){const qs=[...questions];qs[i].keywords=[...qs[i].keywords,kwDraft.trim()];setQuestions(qs);setKwDraft("");setEditingKw(null);}if(e.key==="Escape")setEditingKw(null);}}
                  autoFocus placeholder="palabra…"
                  style={{fontSize:"0.68rem",background:"var(--dark)",border:"1px solid var(--yellow)",padding:"0.2rem 0.5rem",color:"var(--white)",width:90}}/>
              ):(
                <button onClick={()=>setEditingKw(i)} style={{fontSize:"0.68rem",padding:"0.22rem 0.55rem",background:"transparent",border:"1px dashed var(--gray2)",color:"var(--gray)"}}>+ añadir</button>
              )}
            </div>
          </div>
        ))}
        <div style={{marginTop:"1rem"}}>
          <button className="btn btn-y btn-sm" onClick={saveQuestions}>Guardar preguntas</button>
        </div>
      </div>

      {/* Session settings */}
      <div className="card">
        <div className="sl">Configuración de sesión</div>
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div>
            <label className="field-label">Nombre de sesión</label>
            <input defaultValue={state.sessionName} className="field-input"
              onBlur={e=>saveField("sessionName",e.target.value)}/>
          </div>
          <div>
            <label className="field-label">Título de la plataforma</label>
            <input defaultValue={state.branding?.sessionTitle||"Inteligencia Colectiva"} className="field-input"
              onBlur={e=>saveField("branding",{...state.branding,sessionTitle:e.target.value})}/>
          </div>
          <div>
            <label className="field-label">Mensaje de anonimato</label>
            <input defaultValue={state.anonymityMessage} className="field-input"
              onBlur={e=>saveField("anonymityMessage",e.target.value)}/>
          </div>
          <div>
            <label className="field-label">Tiempo por pregunta</label>
            <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
              {[[60,"1 min"],[120,"2 min"],[180,"3 min"],[300,"5 min"],[420,"7 min"],[600,"10 min"]].map(([secs,label])=>(
                <button key={secs} onClick={()=>saveField("timerDuration",secs)}
                  style={{padding:"0.4rem 0.9rem",border:`1px solid ${state.timerDuration===secs?"var(--yellow)":"var(--border2)"}`,background:state.timerDuration===secs?"var(--yellow-dim)":"transparent",color:state.timerDuration===secs?"var(--yellow)":"var(--gray)",fontSize:"0.75rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New session modal */}
      {showNewModal&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowNewModal(false)}}>
          <div className="modal">
            <div className="bc" style={{fontSize:"1.5rem",fontWeight:900,textTransform:"uppercase",marginBottom:"1.5rem"}}>Nueva sesión</div>
            <div style={{marginBottom:"1rem"}}>
              <label className="field-label">Nombre de la sesión</label>
              <input value={newName} onChange={e=>setNewName(e.target.value)} className="field-input" placeholder="Ej: Grupo A — Mañana"/>
            </div>
            <div style={{marginBottom:"1.5rem"}}>
              <label className="field-label">Copiar configuración de</label>
              <div style={{display:"flex",flexDirection:"column",gap:"1px",background:"var(--border)",maxHeight:200,overflow:"auto"}}>
                <div className={`session-card ${!copyFrom?"active-sess":""}`} onClick={()=>setCopyFrom(null)}>
                  <div style={{fontSize:"0.82rem",fontWeight:700}}>Configuración por defecto</div>
                </div>
                {sessions.map(s=>(
                  <div key={s.id} className={`session-card ${copyFrom===s.id?"active-sess":""}`} onClick={()=>setCopyFrom(s.id)}>
                    <div>
                      <div style={{fontSize:"0.82rem",fontWeight:700}}>{s.sessionName||s.id}</div>
                      <div style={{fontSize:"0.68rem",color:"var(--gray)"}}>{fmtDate(s.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:"0.5rem"}}>
              <button className="btn btn-y" onClick={handleNewSession} disabled={!newName.trim()}>Crear sesión →</button>
              <button className="btn btn-g" onClick={()=>setShowNewModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PRESENTER DASHBOARD ─────────────────────────────────────────────────────
const PresenterDashboard = ({ initialSessionId }) => {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const { state, loading, update } = useSession(sessionId);
  const [tab, setTab] = useState("control");
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [promptDraft, setPromptDraft] = useState("");
  const [usingSuggestion, setUsingSuggestion] = useState({});

  if(loading||!state) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--black)"}}><div className="spinner"/></div>;

  const { status, currentQuestion, timerStart, timerDuration, responses, analysis,
    wordFrequency, questions, analysisPrompts, sentiment, highlights, suggestedQuestions,
    resultsPublished, debateActive, debateQuestion, debateTimerStart, debateTimerDuration,
    debateResponses, sessionName } = state;

  const rem = useCountdown(timerStart, timerDuration);
 const debateRem = useCountdown(debateTimerStart||null, debateTimerDuration||120);
  const isProcessing = status==="processing";
  const isLive = status.startsWith("question");

  const pCount = Object.keys(responses||{}).length;
  const rCount = Object.values(responses||{}).reduce((a,r)=>a+Object.keys(r).length,0);
  const wCount = Object.values(responses||{}).reduce((a,r)=>a+Object.values(r).filter(v=>typeof v==="string").join(" ").split(" ").filter(Boolean).length,0);

  const startSession=()=>update({status:"question_1",currentQuestion:1,timerStart:Date.now()});
  const advance=async(close=false)=>{
    await update({status:"processing"});
    await runAnalysis(state,currentQuestion,sessionId);
    const next=currentQuestion+1;
    if(!close&&next<=3) await update({status:`question_${next}`,currentQuestion:next,timerStart:Date.now()});
    else await update({status:"results"});
  };
  const regenerate=async qNum=>{
    await update({[`analysis.q${qNum}`]:"", [`streamingText.q${qNum}`]:""});
    await runAnalysis(state,qNum,sessionId);
  };
  const togglePublish=qNum=>update({[`resultsPublished.q${qNum}`]:!resultsPublished?.[`q${qNum}`]});
  const startDebate=qNum=>update({debateActive:true,debateQuestion:qNum,debateTimerStart:Date.now()});
  const closeDebate=async()=>{
    await update({debateActive:false});
    const qKey=`q${debateQuestion}`;
    const entries=Object.values(debateResponses||{}).map(r=>r?.[qKey]).filter(Boolean);
    if(!entries.length) return;
    const counts={agree:0,nuance:0,disagree:0};
    entries.forEach(e=>{counts[e.stance]=(counts[e.stance]||0)+1;});
    let meta="";
    await claude("Analista de debates. Máx 80 palabras. Sin markdown.",
      `${counts.agree} de acuerdo, ${counts.nuance} matices, ${counts.disagree} en desacuerdo. Meta-análisis breve.`,
      async chunk=>{meta+=chunk;await update({[`debateAnalysis.q${debateQuestion}`]:meta});});
  };
  const addDemo=()=>{
    const demos=[
      {q1:"Muy inspiradora y profunda. Ha cambiado mi perspectiva.",q2:"La escucha activa como base del liderazgo.",q3:"Cambiaré mis hábitos de comunicación en el equipo."},
      {q1:"Sorprendente. Conectar humanidades con empresa es revelador.",q2:"La creatividad como motor de decisiones.",q3:"Presencia y reflexión en mis conversaciones diarias."},
      {q1:"Práctica y cercana. El ponente generó confianza.",q2:"El propósito como brújula profesional.",q3:"Conversaciones más honestas con mi equipo."},
    ];
    const id=`demo_${Date.now()}`;
    const qNum=currentQuestion||1;
    const resp=demos[Math.floor(Math.random()*demos.length)];
    update({[`responses.${id}.q${qNum}`]:resp[`q${qNum}`]});
  };

  const statusLabel={waiting:"En espera",question_1:"P1 activa",question_2:"P2 activa",question_3:"P3 activa",processing:"Analizando",results:"Completada"}[status]||status;

  return (
    <div style={{minHeight:"100vh",background:"var(--black)",display:"flex",flexDirection:"column"}}>
      {/* Top bar */}
      <div style={{borderBottom:"1px solid var(--border)",padding:"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:50,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
          <div style={{width:6,height:6,background:"var(--yellow)"}}/>
          <span className="bc" style={{fontSize:"0.95rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em"}}>Inteligencia Colectiva</span>
          <span style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray2)",borderLeft:"1px solid var(--border)",paddingLeft:"1rem"}}>{sessionName}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
          <span className={`dot ${isLive?"dot-y":status==="results"?"dot-g":"dot-x"}`}/>
          <span style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray)"}}>{statusLabel}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid4" style={{borderBottom:"1px solid var(--border)",flexShrink:0}}>
        {[{l:"Participantes",v:pCount},{l:"Respuestas",v:rCount},{l:"Palabras",v:wCount},{l:"Tiempo",v:isLive?fmt(rem):"—",alert:rem<60&&isLive}].map(({l,v,alert})=>(
          <div key={l} className="metric-card">
            <div className="metric-label">{l}</div>
            <div className="metric-value" style={{color:alert?"var(--red)":"var(--white)"}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid var(--border)",flexShrink:0,padding:"0 1.5rem"}}>
        {[["control","Control"],["analysis","Análisis"],["wordcloud","Nube"],["prompts","Prompts"],["config","Config"]].map(([id,label])=>(
          <button key={id} className={`tab ${tab===id?"on":""}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:"auto",padding:"1.5rem",maxWidth:1000,margin:"0 auto",width:"100%"}}>

        {/* CONTROL */}
        {tab==="control"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
            <div className="card">
              <div className="sl">Control de sesión</div>
              <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center",marginBottom:isLive?"1rem":0}}>
                {status==="waiting"&&<button className="btn btn-y" onClick={startSession}>▶ Iniciar pregunta 1</button>}
                {isLive&&currentQuestion<3&&<button className="btn btn-y" onClick={()=>advance()} disabled={isProcessing}>Siguiente →</button>}
                {isLive&&currentQuestion===3&&<button className="btn btn-r" onClick={()=>advance(true)} disabled={isProcessing}>■ Cerrar y analizar</button>}
                {isProcessing&&<div style={{display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.75rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"var(--yellow)"}}>
                  <div className="spinner" style={{width:16,height:16,borderWidth:1.5}}/> Analizando con Claude…
                </div>}
                {isLive&&<button className="btn btn-g btn-sm" onClick={addDemo}>+ Demo</button>}
              </div>
              {isLive&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray)",marginBottom:"0.4rem"}}>
                    <span>P{currentQuestion} de 3</span><span>{Math.round((1-rem/timerDuration)*100)}% transcurrido</span>
                  </div>
                  <div style={{height:2,background:"var(--dark3)"}}>
                    <div style={{height:"100%",width:`${(rem/timerDuration)*100}%`,background:rem<60?"var(--red)":"var(--yellow)",transition:"width 0.4s linear"}}/>
                  </div>
                </div>
              )}
            </div>

            <div className="grid3">
              {(questions||[]).map((q,i)=>{
                const qNum=i+1; const qKey=`q${qNum}`;
                const active=currentQuestion===qNum&&isLive;
                const done=!!analysis?.[qKey];
                const suggestion=suggestedQuestions?.[`q${qNum-1}`];
                return (
                  <div key={i} style={{padding:"1.1rem",borderLeft:active?"3px solid var(--yellow)":"3px solid transparent"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.4rem"}}>
                      <span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:active?"var(--yellow)":"var(--gray2)"}}>P{qNum}</span>
                      <div style={{display:"flex",gap:"0.3rem",alignItems:"center"}}>
                        {done&&<span style={{color:"var(--green)",fontSize:"0.72rem",fontWeight:700}}>✓</span>}
                        {active&&<span className="tag">Activa</span>}
                      </div>
                    </div>
                    <p style={{fontSize:"0.8rem",lineHeight:1.4,marginBottom:"0.4rem",fontWeight:600}}>{q.text}</p>
                    <div style={{fontSize:"0.62rem",color:"var(--gray2)",marginBottom:suggestion?"0.6rem":0}}>
                      {Object.values(responses||{}).filter(r=>r?.[qKey]).length} respuestas
                    </div>
                    {suggestion&&!usingSuggestion[qKey]&&(
                      <div style={{background:"var(--yellow-dim)",border:"1px solid var(--yellow-border)",padding:"0.55rem",marginTop:"0.4rem"}}>
                        <div style={{fontSize:"0.58rem",fontWeight:700,color:"var(--yellow)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.25rem"}}>✦ IA sugiere</div>
                        <p style={{fontSize:"0.72rem",lineHeight:1.4,marginBottom:"0.35rem",color:"rgba(255,255,255,0.7)"}}>{suggestion}</p>
                        <button onClick={()=>{const qs=[...(questions||[])];qs[qNum-1]={...qs[qNum-1],text:suggestion};update({questions:qs});setUsingSuggestion({...usingSuggestion,[qKey]:true});}}
                          style={{fontSize:"0.6rem",fontWeight:700,color:"var(--yellow)",background:"none",border:"1px solid var(--yellow-border)",padding:"0.18rem 0.45rem",letterSpacing:"0.06em",textTransform:"uppercase"}}>
                          Adoptar
                        </button>
                      </div>
                    )}
                    {done&&(
                      <div style={{marginTop:"0.5rem",display:"flex",gap:"0.3rem"}}>
                        <button onClick={()=>togglePublish(qNum)} style={{flex:1,fontSize:"0.6rem",padding:"0.3rem",border:"1px solid",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",borderColor:resultsPublished?.[qKey]?"var(--green)":"var(--border2)",background:resultsPublished?.[qKey]?"rgba(42,230,122,0.08)":"transparent",color:resultsPublished?.[qKey]?"var(--green)":"var(--gray)"}}>
                          {resultsPublished?.[qKey]?"● Publicado":"Publicar"}
                        </button>
                        {resultsPublished?.[qKey]&&!debateActive&&(
                          <button onClick={()=>startDebate(qNum)} style={{flex:1,fontSize:"0.6rem",padding:"0.3rem",border:"1px solid var(--yellow-border)",background:"var(--yellow-dim)",color:"var(--yellow)",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>
                            Debate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {debateActive&&(
              <div style={{background:"var(--dark2)",border:"1px solid var(--yellow-border)",borderLeft:"3px solid var(--yellow)",padding:"1.1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.2rem"}}>Debate activo · P{debateQuestion}</div>
                  <div style={{fontSize:"0.8rem",color:"var(--gray)"}}>{Object.values(debateResponses||{}).filter(r=>r?.[`q${debateQuestion}`]).length} reacciones</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
                  <span className="bc" style={{fontSize:"1.8rem",fontWeight:800,color:debateRem<30?"var(--red)":"var(--yellow)"}}>{fmt(debateRem)}</span>
                  <button className="btn btn-y btn-sm" onClick={closeDebate}>Cerrar</button>
                </div>
              </div>
            )}

            {wordFrequency?.length>0&&(
              <div className="card">
                <div className="sl">Nube en tiempo real</div>
                <WordCloud words={wordFrequency}/>
              </div>
            )}

            {status==="results"&&<ResultsDisplay state={state} compact/>}
          </div>
        )}

        {/* ANALYSIS */}
        {tab==="analysis"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            {(questions||[]).map((q,i)=>{
              const qNum=i+1; const qKey=`q${qNum}`;
              const text=state.streamingText?.[qKey]||analysis?.[qKey];
              const streaming=!!state.streamingText?.[qKey];
              return (
                <div key={i} className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.9rem"}}>
                    <div>
                      <div style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.2rem"}}>Pregunta {qNum}</div>
                      <div className="bc" style={{fontSize:"1.05rem",fontWeight:800,textTransform:"uppercase"}}>{q.text}</div>
                    </div>
                    <div style={{display:"flex",gap:"0.4rem",flexShrink:0}}>
                      {analysis?.[qKey]&&<button className="btn btn-g btn-sm" onClick={()=>regenerate(qNum)}>↺ Regenerar</button>}
                      {analysis?.[qKey]&&<button onClick={()=>togglePublish(qNum)} style={{fontSize:"0.7rem",padding:"0.38rem 0.8rem",border:"1px solid",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",borderColor:resultsPublished?.[qKey]?"var(--green)":"var(--border2)",background:resultsPublished?.[qKey]?"rgba(42,230,122,0.08)":"transparent",color:resultsPublished?.[qKey]?"var(--green)":"var(--gray)"}}>
                        {resultsPublished?.[qKey]?"Publicado ✓":"Publicar"}
                      </button>}
                    </div>
                  </div>
                  {text?(
                    <>
                      <p style={{fontSize:"0.88rem",lineHeight:1.75,color:"rgba(255,255,255,0.8)",marginBottom:"1rem"}}>
                        {text}{streaming&&<span style={{animation:"blink 1s infinite",color:"var(--yellow)"}}>▌</span>}
                      </p>
                      {highlights?.[qKey]?.length>0&&<><div className="sl">Voces destacadas</div>{highlights[qKey].map((h,j)=><div key={j} className="highlight-bar">"{h}"</div>)}</>}
                      {sentiment?.[qKey]&&<><div className="sl" style={{marginTop:"0.9rem"}}>Sentimiento</div><SentimentBar sentiment={sentiment[qKey]}/></>}
                    </>
                  ):(
                    <p style={{fontSize:"0.8rem",color:"var(--gray2)",fontStyle:"italic"}}>El análisis aparecerá al cerrar la pregunta</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* WORD CLOUD */}
        {tab==="wordcloud"&&(
          <div className="card">
            <div className="sl">Nube de palabras en tiempo real</div>
            <WordCloud words={wordFrequency}/>
          </div>
        )}

        {/* PROMPTS */}
        {tab==="prompts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <p style={{fontSize:"0.78rem",color:"var(--gray)",marginBottom:"0.25rem",lineHeight:1.6}}>Edita el prompt que usa el agente para cada pregunta. Sin markdown añade "Sin asteriscos ni markdown" si quieres texto limpio.</p>
            {[1,2,3].map(qNum=>(
              <div key={qNum} className="card card-sm">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.6rem"}}>
                  <span style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--gray)"}}>Pregunta {qNum}</span>
                  {editingPrompt===qNum?(
                    <div style={{display:"flex",gap:"0.35rem"}}>
                      <button className="btn btn-y btn-sm" onClick={()=>{update({[`analysisPrompts.${qNum}`]:promptDraft});setEditingPrompt(null);}}>Guardar</button>
                      <button className="btn btn-g btn-sm" onClick={()=>setEditingPrompt(null)}>Cancelar</button>
                    </div>
                  ):(
                    <button className="btn btn-g btn-sm" onClick={()=>{setEditingPrompt(qNum);setPromptDraft(analysisPrompts?.[qNum]||"");}}>Editar</button>
                  )}
                </div>
                {editingPrompt===qNum?(
                  <textarea value={promptDraft} onChange={e=>setPromptDraft(e.target.value)} className="field-textarea" style={{minHeight:85}}/>
                ):(
                  <p style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>{analysisPrompts?.[qNum]}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CONFIG */}
        {tab==="config"&&(
          <ConfigTab state={state} update={update} sessionId={sessionId} onSessionChange={id=>{setSessionId(id);}}/>
        )}
      </div>
    </div>
  );
};

// ─── PARTICIPANT APP ──────────────────────────────────────────────────────────
const ParticipantApp = ({ sessionId }) => {
  const { state, loading, update } = useSession(sessionId);
  const [pid] = useState(()=>`p_${Math.random().toString(36).slice(2,8)}`);
  useEffect(()=>{ if(state) update({[`participants.${pid}`]:true}); },[state]);

  if(loading||!state) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--black)"}}><div className="spinner"/></div>;

  const { status, debateActive } = state;
  if(debateActive) return <DebateScreen state={state} update={update} participantId={pid}/>;
  if(status==="waiting") return <WaitingScreen state={state}/>;
  if(status.startsWith("question")) return <QuestionScreen state={state} update={update} participantId={pid}/>;
  if(status==="processing") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--black)"}}>
      <div style={{textAlign:"center"}}>
        <div className="spinner" style={{margin:"0 auto 1rem"}}/>
        <div className="bc" style={{fontSize:"1.5rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.05em"}}>Analizando</div>
      </div>
    </div>
  );
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--black)",textAlign:"center",padding:"2rem"}}>
      <div style={{width:64,height:64,border:"2px solid var(--green)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem"}}>
        <span style={{color:"var(--green)",fontSize:28,fontWeight:900}}>✓</span>
      </div>
      <h2 className="bc fu" style={{fontSize:"clamp(2rem,5vw,3rem)",fontWeight:900,textTransform:"uppercase",marginBottom:"0.75rem"}}>¡Gracias!</h2>
      <p className="fu2" style={{color:"var(--gray)",fontSize:"0.85rem",letterSpacing:"0.04em"}}>El ponente está preparando los resultados.</p>
    </div>
  );
};

// ─── CLIENT VIEW ──────────────────────────────────────────────────────────────
const ClientView = ({ sessionId }) => {
  const { state, loading } = useSession(sessionId);
  if(loading||!state) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--black)"}}><div className="spinner"/></div>;
  const { responses, resultsPublished, branding, sessionName } = state;
  const pCount=Object.keys(responses||{}).length;
  const anyPublished=Object.values(resultsPublished||{}).some(Boolean);
  return (
    <div style={{minHeight:"100vh",background:"var(--black)"}}>
      <div style={{borderBottom:"1px solid var(--border)",padding:"1rem 2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <div style={{width:6,height:6,background:"var(--yellow)"}}/>
          <span className="bc" style={{fontSize:"1rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em"}}>{branding?.sessionTitle||"Inteligencia Colectiva"}</span>
          <span style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray2)",borderLeft:"1px solid var(--border)",paddingLeft:"1rem"}}>{sessionName}</span>
        </div>
        <span style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--gray2)"}}>Vista cliente</span>
      </div>
      <div style={{maxWidth:800,margin:"0 auto",padding:"2rem 1.5rem"}}>
        <div style={{display:"flex",gap:"1px",background:"var(--border)",marginBottom:"2rem"}}>
          {[["Participantes",pCount],["Preguntas analizadas",Object.values(state.analysis||{}).filter(Boolean).length]].map(([l,v])=>(
            <div key={l} style={{flex:1,background:"var(--dark)",padding:"1.25rem"}}>
              <div style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--gray)",marginBottom:"0.2rem"}}>{l}</div>
              <div className="bc" style={{fontSize:"2rem",fontWeight:800}}>{v}</div>
            </div>
          ))}
        </div>
        {!anyPublished?(
          <div style={{textAlign:"center",padding:"4rem",border:"1px solid var(--border)"}}>
            <div className="bc" style={{fontSize:"1.5rem",fontWeight:900,textTransform:"uppercase",marginBottom:"0.5rem"}}>Resultados pendientes</div>
            <p style={{color:"var(--gray)",fontSize:"0.82rem"}}>El ponente publicará los resultados cuando estén listos.</p>
          </div>
        ):<ResultsDisplay state={state} compact={false}/>}
      </div>
    </div>
  );
};

// ─── SESSION PICKER (for participants/clients) ────────────────────────────────
const SessionPicker = ({ role, onPick }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    listSessions().then(s=>{
      const active=s.filter(x=>x.status!=="results");
      if(active.length===1) { onPick(active[0].id); return; }
      setSessions(s); setLoading(false);
    });
  },[]);

  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--black)"}}><div className="spinner"/></div>;

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--black)",padding:"2rem"}}>
      <div className="bc fu" style={{fontSize:"clamp(1.5rem,4vw,2.5rem)",fontWeight:900,textTransform:"uppercase",marginBottom:"2rem",textAlign:"center"}}>
        Selecciona<br/><span style={{color:"var(--yellow)"}}>tu sesión</span>
      </div>
      <div style={{width:"100%",maxWidth:480,display:"flex",flexDirection:"column",gap:"1px",background:"var(--border)"}}>
        {sessions.map(s=>(
          <button key={s.id} onClick={()=>onPick(s.id)}
            style={{background:"var(--dark)",border:"none",padding:"1.25rem 1.5rem",textAlign:"left",color:"var(--white)",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--dark2)";e.currentTarget.style.borderLeft="3px solid var(--yellow)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--dark)";e.currentTarget.style.borderLeft="none";}}>
            <div style={{fontWeight:700,fontSize:"0.95rem",marginBottom:"0.2rem"}}>{s.sessionName||s.id}</div>
            <div style={{fontSize:"0.7rem",color:"var(--gray)",display:"flex",gap:"0.75rem"}}>
              <span>{fmtDate(s.createdAt)}</span>
              <span style={{color:s.status==="results"?"var(--green)":s.status==="waiting"?"var(--gray)":"var(--yellow)"}}>{s.status==="results"?"Completada":s.status==="waiting"?"En espera":"Activa"}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const handleRole = async (r) => {
    setRole(r);
    if(r==="presenter") {
      const sessions = await listSessions();
      if(sessions.length===0) {
        const id = await createSession("Sesión 1");
        setSessionId(id);
      } else {
        setSessionId(sessions[0].id);
      }
    }
  };

  return (
    <>
      <style>{css}</style>
      {!role&&<RoleSelector onSelect={handleRole}/>}
      {role==="presenter"&&sessionId&&<PresenterDashboard initialSessionId={sessionId}/>}
      {role==="presenter"&&!sessionId&&<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--black)"}}><div className="spinner"/></div>}
      {role==="participant"&&!sessionId&&<SessionPicker role={role} onPick={setSessionId}/>}
      {role==="participant"&&sessionId&&<ParticipantApp sessionId={sessionId}/>}
      {role==="client"&&!sessionId&&<SessionPicker role={role} onPick={setSessionId}/>}
      {role==="client"&&sessionId&&<ClientView sessionId={sessionId}/>}
    </>
  );
}
