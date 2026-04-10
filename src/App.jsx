import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from "firebase/firestore";

const SESSION_ID = "session_001";
const SESSION_REF = doc(db, "sessions", SESSION_ID);

const DEFAULT_STATE = {
  status: "waiting",
  currentQuestion: 0,
  timerStart: null,
  timerDuration: 300,
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
  sessionName: "Sesión 1",
  branding: { sessionTitle: "Inteligencia Colectiva" },
  anonymityMessage: "Tus respuestas son completamente anónimas.",
};

const useSession = () => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getDoc(SESSION_REF).then(snap => { if (!snap.exists()) setDoc(SESSION_REF, DEFAULT_STATE); });
    const unsub = onSnapshot(SESSION_REF, snap => { if (snap.exists()) { setState(snap.data()); setLoading(false); } });
    return unsub;
  }, []);
  const update = useCallback(u => updateDoc(SESSION_REF, u), []);
  return { state, loading, update };
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&family=Barlow+Condensed:wght@700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --black: #0a0a0a;
    --dark: #111111;
    --dark2: #1a1a1a;
    --dark3: #242424;
    --yellow: #ffe600;
    --yellow-dim: rgba(255,230,0,0.15);
    --yellow-border: rgba(255,230,0,0.3);
    --white: #ffffff;
    --gray: #888888;
    --gray2: #444444;
    --gray3: #2a2a2a;
    --red: #e63e2a;
    --green: #2ae67a;
    --border: rgba(255,255,255,0.08);
    --border2: rgba(255,255,255,0.15);
  }
  html, body { background: var(--black); color: var(--white); font-family: 'Barlow', sans-serif; min-height: 100vh; overflow-x: hidden; }
  .bc { font-family: 'Barlow Condensed', sans-serif; }
  * { -webkit-font-smoothing: antialiased; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
  @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
  @keyframes ticker { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }

  .fu  { animation: fadeUp .5s ease forwards; }
  .fu2 { animation: fadeUp .5s .1s ease forwards; opacity:0; }
  .fu3 { animation: fadeUp .5s .2s ease forwards; opacity:0; }
  .fu4 { animation: fadeUp .5s .3s ease forwards; opacity:0; }

  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-track { background:var(--dark); }
  ::-webkit-scrollbar-thumb { background:var(--gray2); }

  button { font-family:'Barlow',sans-serif; cursor:pointer; transition:all 0.15s; }
  textarea, input { font-family:'Barlow',sans-serif; }
  textarea:focus, input:focus { outline:none; }

  .btn-primary {
    background: var(--yellow); color: var(--black); border: none;
    padding: 0.7rem 1.5rem; font-weight: 700; font-size: 0.85rem;
    letter-spacing: 0.05em; text-transform: uppercase;
  }
  .btn-primary:hover { background: white; }
  .btn-ghost {
    background: transparent; color: var(--white); border: 1px solid var(--border2);
    padding: 0.7rem 1.5rem; font-weight: 600; font-size: 0.85rem;
    letter-spacing: 0.05em; text-transform: uppercase;
  }
  .btn-ghost:hover { border-color: var(--yellow); color: var(--yellow); }
  .btn-danger {
    background: var(--red); color: white; border: none;
    padding: 0.7rem 1.5rem; font-weight: 700; font-size: 0.85rem;
    letter-spacing: 0.05em; text-transform: uppercase;
  }
  .btn-sm { padding: 0.45rem 1rem; font-size: 0.75rem; }
  .btn-disabled { opacity: 0.4; cursor: not-allowed !important; }

  .tag {
    display: inline-block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 0.25rem 0.6rem; border: 1px solid var(--yellow-border);
    color: var(--yellow); background: var(--yellow-dim);
  }
  .metric-card {
    border-right: 1px solid var(--border);
    padding: 1rem 1.5rem;
  }
  .metric-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gray); margin-bottom: 0.25rem; }
  .metric-value { font-family:'Barlow Condensed',sans-serif; font-size: 2.2rem; font-weight: 800; line-height: 1; }

  .section-label {
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--gray); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;
  }
  .section-label::after { content:''; flex:1; height:1px; background:var(--border); }

  .card {
    background: var(--dark2); border: 1px solid var(--border);
    padding: 1.5rem;
  }

  .tab-bar { display:flex; border-bottom: 1px solid var(--border); }
  .tab {
    background: none; border: none; color: var(--gray);
    padding: 0.85rem 1.25rem; font-size: 0.78rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
    transition: all 0.15s;
  }
  .tab:hover { color: var(--white); }
  .tab.active { color: var(--yellow); border-bottom-color: var(--yellow); }

  .highlight-bar {
    border-left: 3px solid var(--yellow);
    padding: 0.75rem 1rem;
    background: var(--yellow-dim);
    font-size: 0.88rem; font-style: italic; color: var(--white);
    margin-bottom: 0.5rem;
  }

  .sentiment-row { display:flex; align-items:center; gap:0.75rem; margin-bottom:0.4rem; }
  .sentiment-label { font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; width:60px; text-align:right; color:var(--gray); }
  .sentiment-track { flex:1; height:4px; background:var(--dark3); }
  .sentiment-fill { height:100%; transition:width 0.6s ease; }
  .sentiment-count { font-size:0.7rem; color:var(--gray); width:20px; }

  .word-cloud { display:flex; flex-wrap:wrap; gap:0.3rem 0.8rem; justify-content:center; padding:1rem; }
  .cloud-word { font-family:'Barlow Condensed',sans-serif; font-weight:800; text-transform:uppercase; letter-spacing:0.02em; transition:all 0.3s; }

  .q-progress { display:flex; gap:4px; }
  .q-pip { height:3px; flex:1; transition:background 0.3s; }

  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); }
  .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--border); }
  .grid-3 > * { background:var(--dark); }

  .status-dot {
    width:8px; height:8px; border-radius:50%; display:inline-block;
  }
  .status-dot.live { background:var(--yellow); animation:blink 1.5s infinite; }
  .status-dot.done { background:var(--green); }
  .status-dot.idle { background:var(--gray2); }

  .keyword-chip {
    background: transparent; border: 1px solid var(--border2); color: var(--gray);
    padding: 0.3rem 0.75rem; font-size: 0.78rem; font-weight: 600;
    letter-spacing: 0.04em; text-transform: uppercase;
    transition: all 0.15s;
  }
  .keyword-chip:hover { border-color:var(--yellow); color:var(--yellow); background:var(--yellow-dim); }

  .ticker-bar {
    background: var(--yellow); color: var(--black);
    padding: 0.4rem 0; overflow: hidden; white-space: nowrap;
    font-weight: 800; font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase;
  }
  .ticker-inner { display:inline-block; animation: ticker 20s linear infinite; }

  .loading-screen {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:var(--black);
  }
  .spinner { width:32px; height:32px; border:2px solid var(--dark3); border-top-color:var(--yellow); border-radius:50%; animation:spin 0.8s linear infinite; }

  .debate-stance {
    flex:1; padding:1rem; border:2px solid var(--border);
    background:transparent; color:var(--white); font-weight:700;
    font-size:0.82rem; letter-spacing:0.06em; text-transform:uppercase;
    transition:all 0.2s;
  }
  .debate-stance:hover { border-color:var(--yellow); }
  .debate-stance.selected-agree { border-color:var(--green); background:rgba(42,230,122,0.1); color:var(--green); }
  .debate-stance.selected-nuance { border-color:var(--yellow); background:var(--yellow-dim); color:var(--yellow); }
  .debate-stance.selected-disagree { border-color:var(--red); background:rgba(230,62,42,0.1); color:var(--red); }
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

const stripMarkdown = t => t ? t.replace(/\*\*/g,"").replace(/\*/g,"").replace(/#{1,6}\s/g,"").trim() : t;

// ─── CLAUDE API ───────────────────────────────────────────────────────────────
const claude = async (system, user, onChunk) => {
  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1500, stream:false, system, messages:[{role:"user",content:user}] }),
    });
    if (!res.ok) { onChunk(`[Error ${res.status}]`); return; }
    const data = await res.json();
    onChunk(stripMarkdown(data.content?.[0]?.text || ""));
  } catch(e) { onChunk(`[Error: ${e.message}]`); }
};

const claudeJSON = async (system, user) => {
  let full = "";
  await claude(system+"\nResponde SOLO con JSON válido, sin markdown.", user, c => full+=c);
  try { return JSON.parse(full.replace(/```json|```/g,"").trim()); } catch { return null; }
};

// ─── ANALYSIS ─────────────────────────────────────────────────────────────────
const runAnalysis = async (state, qNum) => {
  const { responses, analysisPrompts } = state;
  const qKey = `q${qNum}`;
  const texts = Object.values(responses).map(r=>r[qKey]).filter(Boolean);
  if (!texts.length) return;

  let summary = "";
  const sys = `Eres analista de formación. ${analysisPrompts[qNum]}\nSin asteriscos, sin markdown, sin formato especial.`;
  await claude(sys, `Respuestas:\n\n${texts.join("\n---\n")}`, async chunk => {
    summary += chunk;
    await updateDoc(SESSION_REF, { [`streamingText.${qKey}`]: summary });
  });

  await updateDoc(SESSION_REF, { [`analysis.${qKey}`]: summary, [`streamingText.${qKey}`]: "", wordFrequency: calcWordFreq(responses) });

  const enriched = await claudeJSON("Analista de feedback. SOLO JSON.",
    `Devuelve JSON: {"sentiment":{"positive":N,"neutral":N,"critical":N},"highlights":["frase1","frase2","frase3"]}
Frases literales cortas (máx 10 palabras). Sin markdown.\nRespuestas:\n\n${texts.join("\n---\n")}`);
  if (enriched) await updateDoc(SESSION_REF, { [`sentiment.${qKey}`]: enriched.sentiment, [`highlights.${qKey}`]: enriched.highlights||[] });

  if (qNum < 3) {
    const nq = await claudeJSON("Facilitador experto. SOLO JSON.",
      `Sugiere pregunta de seguimiento para P${qNum+1}. JSON: {"suggestion":"texto"}\nRespuestas:\n\n${texts.join("\n---\n")}`);
    if (nq?.suggestion) await updateDoc(SESSION_REF, { [`suggestedQuestions.q${qNum}`]: nq.suggestion });
  }
};

// ─── ROLE SELECTOR ────────────────────────────────────────────────────────────
const RoleSelector = ({ onSelect }) => (
  <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--black)"}}>
    <div style={{borderBottom:"1px solid var(--border)",padding:"1.25rem 2rem",display:"flex",alignItems:"center",gap:"1rem"}}>
      <div style={{width:8,height:8,background:"var(--yellow)"}}/>
      <span className="bc" style={{fontSize:"1.1rem",fontWeight:900,letterSpacing:"0.05em",textTransform:"uppercase"}}>Inteligencia Colectiva</span>
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem"}}>
      <div className="fu" style={{marginBottom:"3rem",textAlign:"center"}}>
        <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"1rem"}}>Plataforma de feedback formativo</div>
        <h1 className="bc fu" style={{fontSize:"clamp(3rem,8vw,6rem)",fontWeight:900,textTransform:"uppercase",lineHeight:0.9,letterSpacing:"-0.02em"}}>
          ¿Quién<br/><span style={{color:"var(--yellow)"}}>eres?</span>
        </h1>
      </div>
      <div className="fu2" style={{display:"flex",gap:"1px",background:"var(--border)",width:"100%",maxWidth:600}}>
        {[
          {role:"participant",label:"Participante",sub:"Accede a las preguntas"},
          {role:"presenter",label:"Ponente",sub:"Controla la sesión"},
          {role:"client",label:"Cliente",sub:"Solo lectura"},
        ].map(({role,label,sub})=>(
          <button key={role} onClick={()=>onSelect(role)}
            style={{flex:1,background:"var(--dark)",border:"none",padding:"2rem 1rem",textAlign:"center",color:"var(--white)",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--yellow)";e.currentTarget.style.color="var(--black)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--dark)";e.currentTarget.style.color="var(--white)";}}>
            <div className="bc" style={{fontSize:"1.4rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.03em",marginBottom:"0.25rem"}}>{label}</div>
            <div style={{fontSize:"0.72rem",opacity:0.6,letterSpacing:"0.04em"}}>{sub}</div>
          </button>
        ))}
      </div>
    </div>
    <div className="ticker-bar">
      <span className="ticker-inner">FEEDBACK EN TIEMPO REAL &nbsp;·&nbsp; ANÁLISIS CON IA &nbsp;·&nbsp; REFLEXIÓN COLECTIVA &nbsp;·&nbsp; FEEDBACK EN TIEMPO REAL &nbsp;·&nbsp; ANÁLISIS CON IA &nbsp;·&nbsp; REFLEXIÓN COLECTIVA &nbsp;·&nbsp;</span>
    </div>
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
        <div className="fu" style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.2em",color:"var(--yellow)",textTransform:"uppercase",marginBottom:"1.5rem"}}>
          <span className="status-dot idle" style={{marginRight:"0.5rem"}}/>
          Sesión no iniciada
        </div>
        <h2 className="bc fu2" style={{fontSize:"clamp(2.5rem,6vw,4.5rem)",fontWeight:900,textTransform:"uppercase",lineHeight:0.9,letterSpacing:"-0.01em",marginBottom:"2rem"}}>
          Esperando<br/>al ponente{".".repeat(dots)}
        </h2>
        <div className="fu3" style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",border:"1px solid var(--border2)",padding:"0.6rem 1.25rem",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray)"}}>
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
  const rem = useCountdown(timerStart, timerDuration);
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

  const isLast = rem<60;
  const pct = (rem/timerDuration)*100;
  if(!q) return null;

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--black)"}}>
      {/* Header */}
      <div style={{borderBottom:"1px solid var(--border)",padding:"1rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div className="q-progress" style={{width:120}}>
          {[1,2,3].map(i=><div key={i} className="q-pip" style={{background:i<currentQuestion?"var(--green)":i===currentQuestion?"var(--yellow)":"var(--dark3)"}}/>)}
        </div>
        <div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:"1.8rem",fontWeight:800,color:isLast?"var(--red)":"var(--yellow)",letterSpacing:"-0.02em"}}>
          {fmt(rem)}
        </div>
      </div>
      {/* Timer bar */}
      <div style={{height:2,background:"var(--dark3)"}}>
        <div style={{height:"100%",width:`${pct}%`,background:isLast?"var(--red)":"var(--yellow)",transition:"width 0.4s linear, background 0.4s"}}/>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"2rem 1.5rem",maxWidth:640,margin:"0 auto",width:"100%"}}>
        <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--gray)",marginBottom:"0.75rem"}}>
          Pregunta {currentQuestion} de 3
        </div>
        <h2 className="bc fu" style={{fontSize:"clamp(1.6rem,4vw,2.4rem)",fontWeight:900,textTransform:"uppercase",lineHeight:1,letterSpacing:"-0.01em",marginBottom:"2rem"}}>
          {q.text}
        </h2>

        {submitted ? (
          <div className="fu" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:"1.5rem"}}>
            <div style={{width:64,height:64,border:"2px solid var(--green)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"var(--green)",fontSize:28,fontWeight:900}}>✓</span>
            </div>
            <div>
              <div className="bc" style={{fontSize:"1.6rem",fontWeight:900,textTransform:"uppercase",marginBottom:"0.25rem"}}>Enviado</div>
              <div style={{fontSize:"0.8rem",color:"var(--gray)"}}>Espera a la siguiente pregunta</div>
            </div>
          </div>
        ) : (
          <>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe tu respuesta aquí…"
              style={{flex:1,minHeight:160,background:"var(--dark2)",border:"1px solid var(--border)",padding:"1.25rem",fontSize:"1rem",color:"var(--white)",resize:"none",lineHeight:1.65,transition:"border-color 0.2s"}}
              onFocus={e=>e.target.style.borderColor="var(--yellow)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>

            <div style={{marginTop:"1.25rem"}}>
              <div style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--gray)",marginBottom:"0.6rem"}}>Insertar palabra clave</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",marginBottom:"1.25rem"}}>
                {q.keywords.map(kw=>(
                  <button key={kw} className="keyword-chip" onClick={()=>setText(t=>t?t+" "+kw:kw)}>{kw}</button>
                ))}
              </div>
              <button className="btn-primary" style={{width:"100%"}} onClick={submit}>
                Enviar respuesta →
              </button>
            </div>
          </>
        )}
      </div>
      <div style={{padding:"0.75rem 1.5rem",borderTop:"1px solid var(--border)",fontSize:"0.65rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray2)",textAlign:"center"}}>
        Respuesta anónima — no vinculada a tu identidad
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
        <span style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--yellow)"}}>◎ Modo debate</span>
        <span style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:"1.5rem",fontWeight:800,color:rem<30?"var(--red)":"var(--white)"}}>{fmt(rem)}</span>
      </div>
      <div style={{flex:1,padding:"2rem 1.5rem",maxWidth:640,margin:"0 auto",width:"100%"}}>
        <div style={{background:"var(--dark2)",border:"1px solid var(--border)",borderLeft:"3px solid var(--yellow)",padding:"1.25rem",marginBottom:"1.5rem"}}>
          <div style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.5rem"}}>{q?.text}</div>
          <p style={{fontSize:"0.9rem",lineHeight:1.65,color:"rgba(255,255,255,0.8)"}}>{summary||"Cargando resumen…"}</p>
        </div>
        {submitted ? (
          <div style={{textAlign:"center",padding:"2rem"}}>
            <div className="bc" style={{fontSize:"2rem",fontWeight:900,textTransform:"uppercase",color:"var(--yellow)"}}>Registrado</div>
          </div>
        ) : (
          <>
            <div style={{display:"flex",gap:"1px",background:"var(--border)",marginBottom:"1.25rem"}}>
              {[
                {id:"agree",label:"De acuerdo"},
                {id:"nuance",label:"Lo matizo"},
                {id:"disagree",label:"Discrepo"},
              ].map(s=>(
                <button key={s.id} onClick={()=>setStance(s.id)}
                  className={`debate-stance ${stance===s.id?`selected-${s.id}`:""}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Añade un matiz (opcional)…"
              style={{width:"100%",minHeight:100,background:"var(--dark2)",border:"1px solid var(--border)",padding:"1rem",fontSize:"0.9rem",color:"var(--white)",resize:"none",marginBottom:"1rem"}}
              onFocus={e=>e.target.style.borderColor="var(--yellow)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            <button className="btn-primary" style={{width:"100%",opacity:stance?1:0.4,cursor:stance?"pointer":"not-allowed"}} onClick={submit} disabled={!stance}>
              Enviar reacción →
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── WORD CLOUD ───────────────────────────────────────────────────────────────
const WordCloud = ({ words }) => {
  if(!words||!words.length) return <p style={{color:"var(--gray2)",textAlign:"center",padding:"2rem",fontSize:"0.8rem",letterSpacing:"0.08em",textTransform:"uppercase"}}>Las palabras aparecerán aquí</p>;
  const max = words[0]?.count||1;
  const colors = ["var(--yellow)","var(--white)","rgba(255,255,255,0.6)","rgba(255,230,0,0.6)"];
  return (
    <div className="word-cloud">
      {words.map(({word,count},i)=>(
        <span key={word} className="cloud-word"
          style={{fontSize:`${0.65+(count/max)*2}rem`,color:colors[i%colors.length],opacity:0.3+(count/max)*0.7}}>
          {word}
        </span>
      ))}
    </div>
  );
};

// ─── SENTIMENT BAR ────────────────────────────────────────────────────────────
const SentimentBar = ({ sentiment }) => {
  if(!sentiment) return null;
  const total=(sentiment.positive||0)+(sentiment.neutral||0)+(sentiment.critical||0)||1;
  return (
    <div>
      {[["Positivo",sentiment.positive||0,"var(--green)"],["Neutro",sentiment.neutral||0,"var(--yellow)"],["Crítico",sentiment.critical||0,"var(--red)"]].map(([l,c,color])=>(
        <div key={l} className="sentiment-row">
          <span className="sentiment-label">{l}</span>
          <div className="sentiment-track"><div className="sentiment-fill" style={{width:`${(c/total)*100}%`,background:color}}/></div>
          <span className="sentiment-count">{c}</span>
        </div>
      ))}
    </div>
  );
};

// ─── RESULTS DISPLAY ──────────────────────────────────────────────────────────
const ResultsDisplay = ({ state, compact }) => {
  const { analysis, streamingText, wordFrequency, questions, responses, sentiment, highlights, resultsPublished } = state;
  const pCount = Object.keys(responses||{}).length;

  return (
    <div style={{background:"var(--black)",padding:compact?"1rem":"2rem",maxWidth:compact?960:800,margin:"0 auto",width:"100%"}}>
      {!compact&&(
        <div style={{marginBottom:"3rem"}} className="fu">
          <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"1rem"}}>
            <span className="status-dot done" style={{marginRight:"0.5rem"}}/>
            Sesión completada · {pCount} participantes
          </div>
          <h1 className="bc" style={{fontSize:"clamp(2.5rem,6vw,4rem)",fontWeight:900,textTransform:"uppercase",lineHeight:0.9}}>
            Resultados
          </h1>
        </div>
      )}
      {(questions||[]).map((q,i)=>{
        const qKey=`q${i+1}`;
        const text=streamingText?.[qKey]||analysis?.[qKey];
        const streaming=!!streamingText?.[qKey];
        if(!text||(!compact&&!resultsPublished?.[qKey])) return null;
        return (
          <div key={i} style={{borderTop:"1px solid var(--border)",paddingTop:"2rem",marginBottom:"2rem"}}>
            <div style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.5rem"}}>Pregunta {i+1}</div>
            <div className="bc" style={{fontSize:"1.2rem",fontWeight:800,textTransform:"uppercase",marginBottom:"1rem"}}>{q.text}</div>
            <p style={{fontSize:"0.95rem",lineHeight:1.75,color:"rgba(255,255,255,0.8)",marginBottom:"1.5rem"}}>
              {text}{streaming&&<span style={{animation:"blink 1s infinite",color:"var(--yellow)"}}>▌</span>}
            </p>
            {highlights?.[qKey]?.length>0&&(
              <div style={{marginBottom:"1.5rem"}}>
                <div className="section-label">Voces destacadas</div>
                {highlights[qKey].map((h,j)=><div key={j} className="highlight-bar">"{h}"</div>)}
              </div>
            )}
            {sentiment?.[qKey]&&(
              <div>
                <div className="section-label">Sentimiento</div>
                <SentimentBar sentiment={sentiment[qKey]}/>
              </div>
            )}
          </div>
        );
      })}
      {wordFrequency?.length>0&&(
        <div style={{borderTop:"1px solid var(--border)",paddingTop:"2rem"}}>
          <div className="section-label">Palabras más mencionadas</div>
          <WordCloud words={wordFrequency}/>
        </div>
      )}
    </div>
  );
};

// ─── PRESENTER DASHBOARD ─────────────────────────────────────────────────────
const PresenterDashboard = ({ state, update }) => {
  const { status, currentQuestion, timerStart, timerDuration, responses, analysis,
    wordFrequency, questions, analysisPrompts, sentiment, highlights, suggestedQuestions,
    resultsPublished, debateActive, debateQuestion, debateTimerStart, debateTimerDuration,
    debateResponses, sessionName } = state;

  const rem = useCountdown(timerStart, timerDuration);
  const debateRem = useCountdown(debateTimerStart, debateTimerDuration);
  const [tab, setTab] = useState("control");
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [promptDraft, setPromptDraft] = useState("");
  const [usingSuggestion, setUsingSuggestion] = useState({});
  const isProcessing = status === "processing";

  const pCount = Object.keys(responses||{}).length;
  const rCount = Object.values(responses||{}).reduce((a,r)=>a+Object.keys(r).length,0);
  const wCount = Object.values(responses||{}).reduce((a,r)=>a+Object.values(r).filter(v=>typeof v==="string").join(" ").split(" ").filter(Boolean).length,0);

  const startSession = () => update({status:"question_1",currentQuestion:1,timerStart:Date.now()});
  const advance = async (close=false) => {
    await update({status:"processing"});
    await runAnalysis(state, currentQuestion);
    const next = currentQuestion+1;
    if(!close&&next<=3) await update({status:`question_${next}`,currentQuestion:next,timerStart:Date.now()});
    else await update({status:"results"});
  };
  const regenerate = async qNum => {
    await update({[`analysis.q${qNum}`]:"", [`streamingText.q${qNum}`]:""});
    await runAnalysis(state, qNum);
  };
  const togglePublish = qNum => update({[`resultsPublished.q${qNum}`]:!resultsPublished?.[`q${qNum}`]});
  const startDebate = qNum => update({debateActive:true,debateQuestion:qNum,debateTimerStart:Date.now()});
  const closeDebate = async () => {
    await update({debateActive:false});
    const qKey=`q${debateQuestion}`;
    const entries=Object.values(debateResponses||{}).map(r=>r?.[qKey]).filter(Boolean);
    if(!entries.length) return;
    const counts={agree:0,nuance:0,disagree:0};
    entries.forEach(e=>{counts[e.stance]=(counts[e.stance]||0)+1;});
    let meta="";
    await claude("Analista de debates. Máx 80 palabras. Sin markdown.",
      `${counts.agree} de acuerdo, ${counts.nuance} matices, ${counts.disagree} en desacuerdo. Meta-análisis breve.`,
      async chunk=>{meta+=chunk;await update({[`debateAnalysis.${qKey}`]:meta});});
  };
  const addDemo = () => {
    const demos=[
      {q1:"Muy inspiradora y profunda. Ha cambiado mi perspectiva.",q2:"La escucha activa como base del liderazgo.",q3:"Cambiaré mis hábitos de comunicación en el equipo."},
      {q1:"Sorprendente. Conectar humanidades con empresa es un puente nuevo.",q2:"La creatividad como motor de decisiones.",q3:"Presencia y reflexión en mis conversaciones diarias."},
      {q1:"Práctica y cercana. El ponente generó confianza.",q2:"El propósito como brújula profesional.",q3:"Conversaciones más honestas con mi equipo."},
    ];
    const id=`demo_${Date.now()}`;
    const qNum=currentQuestion||1;
    const resp=demos[Math.floor(Math.random()*demos.length)];
    update({[`responses.${id}.q${qNum}`]:resp[`q${qNum}`]});
  };

  const statusLabel={waiting:"En espera",question_1:"P1 activa",question_2:"P2 activa",question_3:"P3 activa",processing:"Analizando",results:"Completada"}[status]||status;
  const isLive = status.startsWith("question");

  return (
    <div style={{minHeight:"100vh",background:"var(--black)",display:"flex",flexDirection:"column"}}>
      {/* Top bar */}
      <div style={{borderBottom:"1px solid var(--border)",padding:"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
          <div style={{width:6,height:6,background:"var(--yellow)"}}/>
          <span className="bc" style={{fontSize:"1rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em"}}>Inteligencia Colectiva</span>
          <span style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray2)",borderLeft:"1px solid var(--border)",paddingLeft:"1rem"}}>{sessionName}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
          <span className={`status-dot ${isLive?"live":status==="results"?"done":"idle"}`}/>
          <span style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray)"}}>{statusLabel}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid-4" style={{borderBottom:"1px solid var(--border)",flexShrink:0}}>
        {[
          {l:"Participantes",v:pCount},
          {l:"Respuestas",v:rCount},
          {l:"Palabras",v:wCount},
          {l:"Tiempo",v:isLive?fmt(rem):"—",alert:rem<60&&isLive},
        ].map(({l,v,alert})=>(
          <div key={l} className="metric-card">
            <div className="metric-label">{l}</div>
            <div className="metric-value" style={{color:alert?"var(--red)":"var(--white)"}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{flexShrink:0,padding:"0 1.5rem"}}>
        {[["control","Control"],["analysis","Análisis"],["wordcloud","Nube"],["prompts","Prompts"]].map(([id,label])=>(
          <button key={id} className={`tab ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:"auto",padding:"1.5rem",maxWidth:1000,margin:"0 auto",width:"100%"}}>

        {/* CONTROL */}
        {tab==="control"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
            {/* Controls */}
            <div className="card">
              <div className="section-label">Control de sesión</div>
              <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center",marginBottom:isLive?"1rem":0}}>
                {status==="waiting"&&<button className="btn-primary" onClick={startSession}>▶ Iniciar pregunta 1</button>}
                {isLive&&currentQuestion<3&&<button className={`btn-primary ${isProcessing?"btn-disabled":""}`} onClick={()=>advance()} disabled={isProcessing}>Siguiente pregunta →</button>}
                {isLive&&currentQuestion===3&&<button className={`btn-danger ${isProcessing?"btn-disabled":""}`} onClick={()=>advance(true)} disabled={isProcessing}>■ Cerrar y analizar</button>}
                {isProcessing&&<div style={{display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.78rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"var(--yellow)"}}>
                  <div className="spinner" style={{width:16,height:16,borderWidth:1.5}}/> Analizando con Claude…
                </div>}
                {isLive&&<button className="btn-ghost btn-sm" onClick={addDemo}>+ Demo</button>}
              </div>
              {isLive&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray)",marginBottom:"0.4rem"}}>
                    <span>P{currentQuestion} de 3</span><span>{Math.round((1-rem/timerDuration)*100)}% transcurrido</span>
                  </div>
                  <div style={{height:2,background:"var(--dark3)"}}>
                    <div style={{height:"100%",width:`${(rem/timerDuration)*100}%`,background:rem<60?"var(--red)":"var(--yellow)",transition:"width 0.4s linear"}}/>
                  </div>
                </div>
              )}
            </div>

            {/* Question cards */}
            <div className="grid-3">
              {(questions||[]).map((q,i)=>{
                const qNum=i+1; const qKey=`q${qNum}`;
                const active=currentQuestion===qNum&&isLive;
                const done=!!analysis?.[qKey];
                const suggestion=suggestedQuestions?.[`q${qNum-1}`];
                return (
                  <div key={i} style={{padding:"1.25rem",borderLeft:active?"3px solid var(--yellow)":"3px solid transparent",transition:"all 0.3s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"}}>
                      <span style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:active?"var(--yellow)":"var(--gray2)"}}>P{qNum}</span>
                      <div style={{display:"flex",gap:"0.4rem",alignItems:"center"}}>
                        {done&&<span style={{color:"var(--green)",fontSize:"0.75rem",fontWeight:700}}>✓</span>}
                        {active&&<span className="tag" style={{fontSize:"0.55rem",padding:"0.15rem 0.4rem"}}>Activa</span>}
                      </div>
                    </div>
                    <p style={{fontSize:"0.82rem",lineHeight:1.4,marginBottom:"0.5rem",fontWeight:600}}>{q.text}</p>
                    <div style={{fontSize:"0.65rem",color:"var(--gray2)",marginBottom:suggestion?"0.75rem":0}}>
                      {Object.values(responses||{}).filter(r=>r?.[qKey]).length} respuestas
                    </div>
                    {suggestion&&!usingSuggestion[qKey]&&(
                      <div style={{background:"var(--yellow-dim)",border:"1px solid var(--yellow-border)",padding:"0.6rem",marginTop:"0.5rem"}}>
                        <div style={{fontSize:"0.6rem",fontWeight:700,color:"var(--yellow)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.3rem"}}>✦ IA sugiere</div>
                        <p style={{fontSize:"0.75rem",lineHeight:1.4,marginBottom:"0.4rem",color:"rgba(255,255,255,0.7)"}}>{suggestion}</p>
                        <button onClick={()=>{
                          const qs=[...(questions||[])]; qs[qNum-1]={...qs[qNum-1],text:suggestion};
                          update({questions:qs}); setUsingSuggestion({...usingSuggestion,[qKey]:true});
                        }} style={{fontSize:"0.62rem",fontWeight:700,color:"var(--yellow)",background:"none",border:"1px solid var(--yellow-border)",padding:"0.2rem 0.5rem",cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase"}}>
                          Adoptar
                        </button>
                      </div>
                    )}
                    {done&&(
                      <div style={{marginTop:"0.6rem",display:"flex",gap:"0.4rem"}}>
                        <button onClick={()=>togglePublish(qNum)} style={{flex:1,fontSize:"0.62rem",padding:"0.35rem",border:"1px solid",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s",borderColor:resultsPublished?.[qKey]?"var(--green)":"var(--border2)",background:resultsPublished?.[qKey]?"rgba(42,230,122,0.1)":"transparent",color:resultsPublished?.[qKey]?"var(--green)":"var(--gray)"}}>
                          {resultsPublished?.[qKey]?"● Publicado":"Publicar"}
                        </button>
                        {resultsPublished?.[qKey]&&!debateActive&&(
                          <button onClick={()=>startDebate(qNum)} style={{flex:1,fontSize:"0.62rem",padding:"0.35rem",border:"1px solid var(--yellow-border)",background:"var(--yellow-dim)",color:"var(--yellow)",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>
                            Debate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Debate control */}
            {debateActive&&(
              <div style={{background:"var(--dark2)",border:"1px solid var(--yellow-border)",borderLeft:"3px solid var(--yellow)",padding:"1.25rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.25rem"}}>Debate activo · P{debateQuestion}</div>
                  <div style={{fontSize:"0.82rem",color:"var(--gray)"}}>{Object.values(debateResponses||{}).filter(r=>r?.[`q${debateQuestion}`]).length} reacciones recibidas</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
                  <span className="bc" style={{fontSize:"1.8rem",fontWeight:800,color:debateRem<30?"var(--red)":"var(--yellow)"}}>{fmt(debateRem)}</span>
                  <button className="btn-primary btn-sm" onClick={closeDebate}>Cerrar</button>
                </div>
              </div>
            )}

            {/* Word cloud preview */}
            {wordFrequency?.length>0&&(
              <div className="card">
                <div className="section-label">Nube en tiempo real</div>
                <WordCloud words={wordFrequency}/>
              </div>
            )}

            {status==="results"&&<ResultsDisplay state={state} compact/>}
          </div>
        )}

        {/* ANALYSIS */}
        {tab==="analysis"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
            {(questions||[]).map((q,i)=>{
              const qNum=i+1; const qKey=`q${qNum}`;
              const text=state.streamingText?.[qKey]||analysis?.[qKey];
              const streaming=!!state.streamingText?.[qKey];
              return (
                <div key={i} className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
                    <div>
                      <div style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--yellow)",marginBottom:"0.25rem"}}>Pregunta {qNum}</div>
                      <div className="bc" style={{fontSize:"1.1rem",fontWeight:800,textTransform:"uppercase"}}>{q.text}</div>
                    </div>
                    <div style={{display:"flex",gap:"0.4rem",flexShrink:0}}>
                      {analysis?.[qKey]&&<button className="btn-ghost btn-sm" onClick={()=>regenerate(qNum)}>↺ Regenerar</button>}
                      {analysis?.[qKey]&&<button onClick={()=>togglePublish(qNum)} style={{fontSize:"0.72rem",padding:"0.4rem 0.8rem",border:"1px solid",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",borderColor:resultsPublished?.[qKey]?"var(--green)":"var(--border2)",background:resultsPublished?.[qKey]?"rgba(42,230,122,0.1)":"transparent",color:resultsPublished?.[qKey]?"var(--green)":"var(--gray)"}}>
                        {resultsPublished?.[qKey]?"Publicado ✓":"Publicar"}
                      </button>}
                    </div>
                  </div>
                  {text?(
                    <>
                      <p style={{fontSize:"0.9rem",lineHeight:1.75,color:"rgba(255,255,255,0.8)",marginBottom:"1.25rem"}}>
                        {text}{streaming&&<span style={{animation:"blink 1s infinite",color:"var(--yellow)"}}>▌</span>}
                      </p>
                      {highlights?.[qKey]?.length>0&&(
                        <div style={{marginBottom:"1.25rem"}}>
                          <div className="section-label">Voces destacadas</div>
                          {highlights[qKey].map((h,j)=><div key={j} className="highlight-bar">"{h}"</div>)}
                        </div>
                      )}
                      {sentiment?.[qKey]&&(
                        <div>
                          <div className="section-label">Sentimiento</div>
                          <SentimentBar sentiment={sentiment[qKey]}/>
                        </div>
                      )}
                    </>
                  ):(
                    <p style={{fontSize:"0.82rem",color:"var(--gray2)",fontStyle:"italic",letterSpacing:"0.04em"}}>El análisis aparecerá al cerrar la pregunta</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* WORD CLOUD */}
        {tab==="wordcloud"&&(
          <div className="card">
            <div className="section-label">Nube de palabras en tiempo real</div>
            <WordCloud words={wordFrequency}/>
          </div>
        )}

        {/* PROMPTS */}
        {tab==="prompts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <p style={{fontSize:"0.78rem",color:"var(--gray)",marginBottom:"0.5rem",lineHeight:1.6}}>Edita el prompt que usa el agente para analizar cada pregunta.</p>
            {[1,2,3].map(qNum=>(
              <div key={qNum} className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
                  <span style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--gray)"}}>Pregunta {qNum}</span>
                  {editingPrompt===qNum?(
                    <div style={{display:"flex",gap:"0.4rem"}}>
                      <button className="btn-primary btn-sm" onClick={()=>{update({[`analysisPrompts.${qNum}`]:promptDraft});setEditingPrompt(null);}}>Guardar</button>
                      <button className="btn-ghost btn-sm" onClick={()=>setEditingPrompt(null)}>Cancelar</button>
                    </div>
                  ):(
                    <button className="btn-ghost btn-sm" onClick={()=>{setEditingPrompt(qNum);setPromptDraft(analysisPrompts?.[qNum]||"");}}>Editar</button>
                  )}
                </div>
                {editingPrompt===qNum?(
                  <textarea value={promptDraft} onChange={e=>setPromptDraft(e.target.value)}
                    style={{width:"100%",minHeight:90,background:"var(--dark3)",border:"1px solid var(--border2)",padding:"0.75rem",color:"var(--white)",fontSize:"0.85rem",resize:"vertical"}}/>
                ):(
                  <p style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>{analysisPrompts?.[qNum]}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── PARTICIPANT APP ──────────────────────────────────────────────────────────
const ParticipantApp = ({ state, update }) => {
  const [pid] = useState(()=>`p_${Math.random().toString(36).slice(2,8)}`);
  useEffect(()=>{ update({[`participants.${pid}`]:true}); },[]);
  const { status, debateActive } = state;

  if(debateActive) return <DebateScreen state={state} update={update} participantId={pid}/>;
  if(status==="waiting") return <WaitingScreen state={state}/>;
  if(status.startsWith("question")) return <QuestionScreen state={state} update={update} participantId={pid}/>;
  if(status==="processing") return (
    <div className="loading-screen">
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
      <p className="fu2" style={{color:"var(--gray)",fontSize:"0.88rem",letterSpacing:"0.04em"}}>El ponente está preparando los resultados.</p>
    </div>
  );
};

// ─── CLIENT VIEW ──────────────────────────────────────────────────────────────
const ClientView = ({ state }) => {
  const { responses, resultsPublished, branding, sessionName } = state;
  const pCount = Object.keys(responses||{}).length;
  const anyPublished = Object.values(resultsPublished||{}).some(Boolean);
  return (
    <div style={{minHeight:"100vh",background:"var(--black)"}}>
      <div style={{borderBottom:"1px solid var(--border)",padding:"1rem 2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <div style={{width:6,height:6,background:"var(--yellow)"}}/>
          <span className="bc" style={{fontSize:"1rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.06em"}}>{branding?.sessionTitle||"Inteligencia Colectiva"}</span>
          <span style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--gray2)",borderLeft:"1px solid var(--border)",paddingLeft:"1rem"}}>{sessionName}</span>
        </div>
        <span style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--gray2)"}}>Vista cliente</span>
      </div>
      <div style={{maxWidth:800,margin:"0 auto",padding:"2rem 1.5rem"}}>
        <div style={{display:"flex",gap:"1px",background:"var(--border)",marginBottom:"2rem"}}>
          {[["Participantes",pCount],["Analizadas",Object.values(state.analysis||{}).filter(Boolean).length]].map(([l,v])=>(
            <div key={l} style={{flex:1,background:"var(--dark)",padding:"1.25rem"}}>
              <div style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--gray)",marginBottom:"0.25rem"}}>{l}</div>
              <div className="bc" style={{fontSize:"2rem",fontWeight:800}}>{v}</div>
            </div>
          ))}
        </div>
        {!anyPublished?(
          <div style={{textAlign:"center",padding:"4rem",border:"1px solid var(--border)"}}>
            <div className="bc" style={{fontSize:"1.5rem",fontWeight:900,textTransform:"uppercase",marginBottom:"0.5rem"}}>Resultados pendientes</div>
            <p style={{color:"var(--gray)",fontSize:"0.85rem"}}>El ponente publicará los resultados cuando estén listos.</p>
          </div>
        ):<ResultsDisplay state={state} compact={false}/>}
      </div>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { state, loading, update } = useSession();
  const [role, setRole] = useState(null);

  if(loading) return (
    <div className="loading-screen">
      <div style={{textAlign:"center"}}>
        <div className="spinner" style={{margin:"0 auto 1rem"}}/>
        <div style={{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--gray)"}}>Conectando…</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      {!role&&<RoleSelector onSelect={setRole}/>}
      {role==="participant"&&<ParticipantApp state={state} update={update}/>}
      {role==="presenter" &&<PresenterDashboard state={state} update={update}/>}
      {role==="client"    &&<ClientView state={state}/>}
    </>
  );
}
