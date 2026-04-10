import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── STORE ────────────────────────────────────────────────────────────────────
const createStore = () => {
  let state = {
    // Session
    status: "waiting", // waiting|question_1|question_2|question_3|processing|results
    currentQuestion: 0,
    timerStart: null,
    timerDuration: 300,
    // Data
    participants: {},
    responses: {},
    analysis: {},
    streamingText: {},
    wordFrequency: [],
    sentiment: {}, // { q1: { positive:N, neutral:N, critical:N }, ... }
    highlights: {}, // { q1: ["cita1","cita2",...] }
    debateResponses: {}, // { participantId: { q1: { stance, text } } }
    debateAnalysis: {},
    suggestedQuestions: {}, // { q1: "texto sugerido" }
    // Config
    questions: [
      { text: "¿Qué te ha parecido la formación de hoy?", keywords: ["inspiradora","reflexiva","práctica","sorprendente","profunda","cercana","retadora","transformadora"], type: "open" },
      { text: "¿Qué aprendizaje te llevas?", keywords: ["perspectiva","autoconocimiento","escucha","empatía","liderazgo","propósito","creatividad","conexión"], type: "open" },
      { text: "¿Cómo vas a aplicar esto en tu día a día?", keywords: ["conversaciones","hábitos","equipo","decisiones","presencia","tiempo","relaciones","prioridades"], type: "open" },
    ],
    analysisPrompts: {
      1: "Analiza las respuestas sobre la experiencia en la formación. Destaca aspectos más mencionados, tono general e insights clave. Máximo 150 palabras.",
      2: "Analiza los aprendizajes que destacan los participantes. Identifica conceptos que más han resonado. Máximo 150 palabras.",
      3: "Analiza cómo aplicarán lo aprendido. Identifica intenciones concretas y patrones de aplicación. Máximo 150 palabras.",
    },
    // Phase 2
    resultsPublished: { q1: false, q2: false, q3: false },
    debateActive: false,
    debateQuestion: null,
    debateTimerStart: null,
    debateTimerDuration: 120,
    // Phase 3 - multi-session
    sessions: [], // histórico
    currentSessionId: `session_${Date.now()}`,
    sessionName: "Sesión 1",
    // Branding
    branding: { logo: null, primaryColor: "#c8813a", sessionTitle: "Reflexiones" },
    // Language
    language: "es",
    // Anonymity message
    anonymityMessage: "Tus respuestas son completamente anónimas y no se asocian a tu identidad.",
  };
  const listeners = new Set();
  return {
    get: () => ({ ...state }),
    set: (updates) => { state = { ...state, ...updates }; listeners.forEach(fn => fn({ ...state })); },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
};

const store = createStore();

const useStore = () => {
  const [s, setS] = useState(store.get());
  useEffect(() => store.subscribe(setS), []);
  return s;
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #12100e;
    --paper: #f7f3ed;
    --cream: #ede7db;
    --primary: #c8813a;
    --primary-light: #e8a85a;
    --primary-pale: #f5e6d0;
    --primary-dark: #9e6028;
    --sage: #6b7d5f;
    --rust: #b04a2a;
    --sky: #3a7ab0;
    --muted: #8a7d6e;
    --border: rgba(18,16,14,0.1);
    --border-strong: rgba(18,16,14,0.2);
    --shadow-sm: 0 1px 8px rgba(18,16,14,0.06);
    --shadow: 0 2px 20px rgba(18,16,14,0.08);
    --shadow-lg: 0 8px 40px rgba(18,16,14,0.14);
  }
  body { font-family: 'Outfit', sans-serif; background: var(--paper); color: var(--ink); min-height: 100vh; overflow-x: hidden; }
  .cg { font-family: 'Cormorant Garamond', serif; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse-ring { 0% { transform:scale(1); opacity:.5; } 100% { transform:scale(1.6); opacity:0; } }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
  @keyframes slide-in { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
  @keyframes count-up { from { transform:scale(0.8); opacity:0; } to { transform:scale(1); opacity:1; } }
  .fu  { animation: fadeUp  .45s ease forwards; }
  .fu2 { animation: fadeUp  .45s .08s ease forwards; opacity:0; }
  .fu3 { animation: fadeUp  .45s .16s ease forwards; opacity:0; }
  .fu4 { animation: fadeUp  .45s .24s ease forwards; opacity:0; }
  ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }
  textarea:focus, input:focus { outline:none; }
  button { font-family:'Outfit',sans-serif; }
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

const fmt = (s) => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;

const STOP = new Set(["que","de","la","el","en","y","a","los","las","un","una","por","con","es","se","me","lo","le","más","pero","como","su","para","al","del","ha","he","mi","no","si","ya","muy","todo","este","esta","son","sus","fue","era","ser","hay","nos","les","este","esto","cuando","donde","como","porque","aunque","también","bien","más"]);

const wordFreq = (responses) => {
  const freq = {};
  Object.values(responses).forEach(r => Object.values(r).forEach(text => {
    if (!text || typeof text !== "string") return;
    text.toLowerCase().replace(/[^a-záéíóúüñ\s]/gi,"").split(/\s+/).forEach(w => {
      if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w]||0) + 1;
    });
  }));
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,50).map(([word,count])=>({word,count}));
};

// ─── CLAUDE API ───────────────────────────────────────────────────────────────
const claude = async (system, user, onChunk) => {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1500, stream:true, system, messages:[{role:"user",content:user}] })
    });
    if (!res.ok) { const e = await res.text(); onChunk(`[Error API: ${res.status}]`); return; }
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf="";
    while(true) {
      const {done,value} = await reader.read(); if(done) break;
      buf += dec.decode(value,{stream:true});
      const lines = buf.split("\n"); buf = lines.pop();
      for(const line of lines) {
        if(!line.startsWith("data: ")) continue;
        const d = line.slice(6); if(d==="[DONE]") continue;
        try { const p=JSON.parse(d); if(p.type==="content_block_delta"&&p.delta?.text) onChunk(p.delta.text); } catch{}
      }
    }
  } catch(e) { onChunk(`[Error: ${e.message}]`); }
};

const claudeJSON = async (system, user) => {
  let full = "";
  await claude(system + "\nResponde SOLO con JSON válido, sin markdown ni backticks.", user, c => full += c);
  try { return JSON.parse(full.replace(/```json|```/g,"").trim()); } catch { return null; }
};

// ─── SHARED BUTTON ────────────────────────────────────────────────────────────
const Btn = ({ onClick, children, variant="primary", disabled, small, full }) => {
  const styles = {
    primary: { bg:"var(--primary)", color:"white", border:"none" },
    danger:  { bg:"var(--rust)",    color:"white", border:"none" },
    ghost:   { bg:"transparent",   color:"var(--muted)", border:"1px solid var(--border-strong)" },
    outline: { bg:"transparent",   color:"var(--primary)", border:"1px solid var(--primary)" },
    dark:    { bg:"var(--ink)",     color:"white", border:"none" },
    sage:    { bg:"var(--sage)",    color:"white", border:"none" },
    sky:     { bg:"var(--sky)",     color:"white", border:"none" },
  }[variant]||{};
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...styles, borderRadius:10, padding:small?"0.4rem 0.9rem":"0.65rem 1.25rem", fontSize:small?"0.78rem":"0.85rem",
        fontWeight:500, cursor:disabled?"not-allowed":"pointer", opacity:disabled?.5:1, whiteSpace:"nowrap",
        transition:"all 0.15s", width:full?"100%":undefined }}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity="0.85"; }}
      onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; }}>
      {children}
    </button>
  );
};

// ─── ROLE SELECTOR ────────────────────────────────────────────────────────────
const RoleSelector = ({ onSelect }) => {
  const { branding } = useStore();
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",background:"var(--paper)"}}>
      <div className="fu" style={{textAlign:"center",marginBottom:"3rem"}}>
        <div style={{width:60,height:60,background:"var(--primary)",borderRadius:"50%",margin:"0 auto 1.5rem",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(200,129,58,0.35)"}}>
          <span style={{fontSize:26,color:"white"}}>◈</span>
        </div>
        <h1 className="cg" style={{fontSize:"2.4rem",fontWeight:400,marginBottom:"0.4rem",letterSpacing:"-0.01em"}}>{branding.sessionTitle}</h1>
        <p style={{color:"var(--muted)",fontSize:"0.85rem",letterSpacing:"0.04em"}}>Plataforma de feedback formativo · v2</p>
      </div>
      <div className="fu2" style={{display:"flex",gap:"1.25rem",flexWrap:"wrap",justifyContent:"center"}}>
        {[
          {role:"participant",label:"Soy participante",icon:"◉",desc:"Accede a las preguntas de la sesión"},
          {role:"presenter",  label:"Soy ponente",    icon:"◈",desc:"Controla y visualiza la sesión"},
          {role:"client",     label:"Vista cliente",  icon:"◎",desc:"Acceso de lectura a informes"},
        ].map(({role,label,icon,desc})=>(
          <button key={role} onClick={()=>onSelect(role)}
            style={{background:"white",border:"1px solid var(--border)",borderRadius:16,padding:"1.75rem 2rem",cursor:"pointer",textAlign:"center",width:200,transition:"all 0.2s",boxShadow:"var(--shadow)",fontFamily:"Outfit,sans-serif"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="var(--shadow-lg)";e.currentTarget.style.borderColor="var(--primary)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="var(--shadow)";e.currentTarget.style.borderColor="var(--border)";}}>
            <div style={{fontSize:28,marginBottom:"0.75rem"}}>{icon}</div>
            <div style={{fontWeight:500,marginBottom:"0.4rem",fontSize:"0.9rem"}}>{label}</div>
            <div style={{fontSize:"0.75rem",color:"var(--muted)",lineHeight:1.4}}>{desc}</div>
          </button>
        ))}
      </div>
      <p className="fu3" style={{marginTop:"3rem",fontSize:"0.75rem",color:"var(--muted)"}}>Todas las respuestas son anónimas · Powered by Claude AI</p>
    </div>
  );
};

// ─── WAITING SCREEN ───────────────────────────────────────────────────────────
const WaitingScreen = () => {
  const { branding, anonymityMessage } = useStore();
  const [dots,setDots] = useState(0);
  useEffect(()=>{ const id=setInterval(()=>setDots(d=>(d+1)%4),700); return()=>clearInterval(id); },[]);
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",background:"var(--paper)"}}>
      <div style={{textAlign:"center",maxWidth:360}}>
        <div style={{position:"relative",width:88,height:88,margin:"0 auto 2.5rem"}}>
          {[0,1].map(i=>(
            <div key={i} style={{position:"absolute",inset:i*10,borderRadius:"50%",border:"1.5px solid var(--primary)",animation:`pulse-ring 2.4s ${i*0.6}s ease-out infinite`}}/>
          ))}
          <div style={{position:"absolute",inset:22,borderRadius:"50%",background:"var(--primary)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(200,129,58,0.4)"}}>
            <span style={{fontSize:20,color:"white"}}>◈</span>
          </div>
        </div>
        <h2 className="cg fu" style={{fontSize:"1.8rem",fontWeight:400,marginBottom:"0.75rem"}}>{branding.sessionTitle}</h2>
        <p className="fu2" style={{color:"var(--muted)",lineHeight:1.65,marginBottom:"2rem"}}>
          La sesión comenzará en breve{".".repeat(dots)}
        </p>
        <div className="fu3" style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",background:"var(--primary-pale)",padding:"0.6rem 1.1rem",borderRadius:100,fontSize:"0.78rem",color:"var(--primary)"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"var(--primary)",display:"inline-block",animation:"blink 1.6s infinite"}}/>
          {anonymityMessage.split(" ").slice(0,5).join(" ")}…
        </div>
      </div>
    </div>
  );
};

// ─── QUESTION SCREEN (PARTICIPANT) ────────────────────────────────────────────
const QuestionScreen = ({ participantId }) => {
  const { currentQuestion, timerStart, timerDuration, questions, anonymityMessage } = useStore();
  const q = questions[currentQuestion - 1];
  const rem = useCountdown(timerStart, timerDuration);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const prevQ = useRef(currentQuestion);

  useEffect(()=>{
    if(prevQ.current !== currentQuestion) { setText(""); setSubmitted(false); prevQ.current=currentQuestion; }
  },[currentQuestion]);

  const submit = useCallback(()=>{
    if(submitted) return;
    const cur = store.get();
    store.set({ responses: { ...cur.responses, [participantId]: { ...(cur.responses[participantId]||{}), [`q${currentQuestion}`]: text } } });
    setSubmitted(true);
  },[text, participantId, currentQuestion, submitted]);

  useEffect(()=>{ if(rem===0 && !submitted) submit(); },[rem, submitted, submit]);

  const isLast = rem < 60;
  const pct = (rem / timerDuration) * 100;

  if(!q) return null;

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--paper)",padding:"1.5rem",maxWidth:600,margin:"0 auto",width:"100%"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
        <div style={{display:"flex",gap:5}}>
          {[1,2,3].map(i=>(
            <div key={i} style={{width:32,height:4,borderRadius:2,background:i<currentQuestion?"var(--sage)":i===currentQuestion?"var(--primary)":"var(--border)",transition:"background 0.3s"}}/>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.4rem",color:isLast?"var(--rust)":"var(--muted)",fontSize:"0.88rem",fontWeight:isLast?600:400,transition:"color 0.3s"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          {fmt(rem)}
        </div>
      </div>
      {/* Timer bar */}
      <div style={{height:3,background:"var(--border)",borderRadius:2,marginBottom:"2rem",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:isLast?"var(--rust)":"var(--primary)",borderRadius:2,transition:"width 0.4s linear, background 0.4s"}}/>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"}}>
          <span style={{fontSize:"0.7rem",color:"var(--muted)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Pregunta {currentQuestion} de 3</span>
          {isLast && <span style={{fontSize:"0.7rem",color:"var(--rust)",fontWeight:500,animation:"blink 1s infinite"}}>● Tiempo casi agotado</span>}
        </div>
        <h2 className="cg fu" style={{fontSize:"1.6rem",fontWeight:400,lineHeight:1.35,marginBottom:"1.5rem"}}>{q.text}</h2>

        {submitted ? (
          <div className="fu" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:"1.25rem"}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:"var(--sage)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(107,125,95,0.35)"}}>
              <span style={{color:"white",fontSize:24}}>✓</span>
            </div>
            <div>
              <p className="cg" style={{fontSize:"1.3rem",marginBottom:"0.4rem"}}>Respuesta enviada</p>
              <p style={{color:"var(--muted)",fontSize:"0.85rem"}}>Espera a la siguiente pregunta</p>
            </div>
            <div style={{display:"flex",gap:5,marginTop:"0.5rem"}}>
              {[1,2,3].map(i=>(
                <div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<=currentQuestion?"var(--primary)":"var(--border)"}}/>
              ))}
            </div>
          </div>
        ) : (
          <>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe tu respuesta aquí…"
              style={{flex:1,minHeight:140,border:"1.5px solid var(--border)",borderRadius:12,padding:"1rem",fontSize:"0.95rem",fontFamily:"Outfit,sans-serif",background:"white",resize:"none",color:"var(--ink)",lineHeight:1.65,transition:"border-color 0.2s",boxShadow:"var(--shadow-sm)"}}
              onFocus={e=>e.target.style.borderColor="var(--primary)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            {/* Keywords */}
            <div style={{marginTop:"1rem"}}>
              <p style={{fontSize:"0.72rem",color:"var(--muted)",marginBottom:"0.5rem",textTransform:"uppercase",letterSpacing:"0.06em"}}>Palabras de referencia — pulsa para insertar</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
                {q.keywords.map(kw=>(
                  <button key={kw} onClick={()=>setText(t=>t?t+" "+kw:kw)}
                    style={{background:"var(--primary-pale)",border:"1px solid rgba(200,129,58,0.25)",borderRadius:100,padding:"0.28rem 0.7rem",fontSize:"0.78rem",color:"var(--primary)",cursor:"pointer",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--primary)";e.currentTarget.style.color="white";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="var(--primary-pale)";e.currentTarget.style.color="var(--primary)";}}>
                    {kw}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={submit}
              style={{marginTop:"1.25rem",background:"var(--ink)",color:"white",border:"none",borderRadius:12,padding:"0.9rem",fontSize:"0.95rem",cursor:"pointer",fontWeight:500,transition:"opacity 0.2s",fontFamily:"Outfit,sans-serif"}}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              Enviar respuesta →
            </button>
          </>
        )}
      </div>
      <p style={{textAlign:"center",fontSize:"0.7rem",color:"var(--muted)",marginTop:"1rem",lineHeight:1.5}}>{anonymityMessage}</p>
    </div>
  );
};

// ─── DEBATE SCREEN (PARTICIPANT) ──────────────────────────────────────────────
const DebateScreen = ({ participantId }) => {
  const { debateQuestion, debateTimerStart, debateTimerDuration, analysis, streamingText, questions } = useStore();
  const rem = useCountdown(debateTimerStart, debateTimerDuration);
  const [stance, setStance] = useState(null);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const qKey = debateQuestion ? `q${debateQuestion}` : null;
  const summary = qKey ? (streamingText[qKey] || analysis[qKey]) : "";
  const q = debateQuestion ? questions[debateQuestion-1] : null;

  const submit = useCallback(()=>{
    if(submitted || !stance) return;
    const cur = store.get();
    store.set({ debateResponses: { ...cur.debateResponses, [participantId]: { ...(cur.debateResponses[participantId]||{}), [qKey]: { stance, text } } } });
    setSubmitted(true);
  },[submitted, stance, text, participantId, qKey]);

  useEffect(()=>{ if(rem===0 && !submitted && stance) submit(); },[rem, submitted, submit, stance]);

  const stances = [
    { id:"agree",    label:"De acuerdo",  color:"var(--sage)",    icon:"✓" },
    { id:"nuance",   label:"Lo matizo",   color:"var(--primary)", icon:"◎" },
    { id:"disagree", label:"Discrepo",    color:"var(--rust)",    icon:"✕" },
  ];

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--paper)",padding:"1.5rem",maxWidth:600,margin:"0 auto",width:"100%"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
        <span style={{fontSize:"0.72rem",color:"var(--primary)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>◎ Modo debate</span>
        <span style={{fontSize:"0.88rem",color:rem<30?"var(--rust)":"var(--muted)"}}>{fmt(rem)}</span>
      </div>
      <div style={{background:"white",border:"1px solid var(--border)",borderRadius:14,padding:"1.25rem",marginBottom:"1.5rem",boxShadow:"var(--shadow-sm)"}}>
        <p style={{fontSize:"0.7rem",textTransform:"uppercase",color:"var(--muted)",letterSpacing:"0.08em",marginBottom:"0.5rem"}}>Resumen generado · {q?.text}</p>
        <p className="cg" style={{fontSize:"1rem",lineHeight:1.65,fontStyle:"italic",color:"var(--ink)"}}>{summary||"Cargando resumen…"}</p>
      </div>
      {submitted ? (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
          <div>
            <div style={{fontSize:36,marginBottom:"1rem"}}>{stances.find(s=>s.id===stance)?.icon}</div>
            <p className="cg" style={{fontSize:"1.2rem"}}>Reacción registrada</p>
          </div>
        </div>
      ) : (
        <>
          <p style={{fontSize:"0.8rem",color:"var(--muted)",marginBottom:"1rem"}}>¿Cómo reaccionas al resumen?</p>
          <div style={{display:"flex",gap:"0.75rem",marginBottom:"1.25rem"}}>
            {stances.map(s=>(
              <button key={s.id} onClick={()=>setStance(s.id)}
                style={{flex:1,padding:"0.75rem",borderRadius:12,border:`2px solid ${stance===s.id?s.color:"var(--border)"}`,background:stance===s.id?s.color:"white",color:stance===s.id?"white":"var(--ink)",cursor:"pointer",transition:"all 0.2s",fontFamily:"Outfit,sans-serif",fontWeight:stance===s.id?600:400}}>
                <div style={{fontSize:18,marginBottom:"0.25rem"}}>{s.icon}</div>
                <div style={{fontSize:"0.78rem"}}>{s.label}</div>
              </button>
            ))}
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Añade un matiz o comentario (opcional)…"
            style={{width:"100%",minHeight:100,border:"1.5px solid var(--border)",borderRadius:12,padding:"0.9rem",fontSize:"0.9rem",fontFamily:"Outfit,sans-serif",background:"white",resize:"none",lineHeight:1.6,transition:"border-color 0.2s"}}
            onFocus={e=>e.target.style.borderColor="var(--primary)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          <button onClick={submit} disabled={!stance}
            style={{marginTop:"1rem",background:"var(--ink)",color:"white",border:"none",borderRadius:12,padding:"0.85rem",fontSize:"0.9rem",cursor:stance?"pointer":"not-allowed",opacity:stance?1:0.4,fontFamily:"Outfit,sans-serif",fontWeight:500}}>
            Enviar reacción →
          </button>
        </>
      )}
    </div>
  );
};

// ─── WORD CLOUD ───────────────────────────────────────────────────────────────
const WordCloud = ({ words, dark }) => {
  if(!words.length) return <p style={{color:dark?"rgba(255,255,255,0.2)":"var(--muted)",textAlign:"center",padding:"1.5rem",fontSize:"0.82rem"}}>Las palabras aparecerán conforme lleguen respuestas</p>;
  const max = words[0]?.count||1;
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem 0.7rem",justifyContent:"center",padding:"0.75rem"}}>
      {words.map(({word,count},i)=>(
        <span key={word} className="fu"
          style={{fontSize:`${0.7+(count/max)*1.5}rem`,color:dark?"var(--primary-light)":"var(--primary)",opacity:0.35+(count/max)*0.65,fontFamily:"Cormorant Garamond,serif",fontStyle:i%4===0?"italic":"normal",fontWeight:count/max>0.6?600:400,transition:"all 0.3s",lineHeight:1.3}}>
          {word}
        </span>
      ))}
    </div>
  );
};

// ─── SENTIMENT CHART ──────────────────────────────────────────────────────────
const SentimentBar = ({ sentiment, dark }) => {
  if(!sentiment) return null;
  const total = (sentiment.positive||0)+(sentiment.neutral||0)+(sentiment.critical||0)||1;
  const bars = [
    { label:"Positivo", count:sentiment.positive||0, color:"var(--sage)" },
    { label:"Neutro",   count:sentiment.neutral||0,  color:"var(--primary)" },
    { label:"Crítico",  count:sentiment.critical||0, color:"var(--rust)" },
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
      {bars.map(({label,count,color})=>(
        <div key={label} style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <span style={{fontSize:"0.72rem",color:dark?"rgba(255,255,255,0.5)":"var(--muted)",width:55,textAlign:"right"}}>{label}</span>
          <div style={{flex:1,height:8,background:dark?"rgba(255,255,255,0.08)":"var(--border)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${(count/total)*100}%`,background:color,borderRadius:4,transition:"width 0.6s ease"}}/>
          </div>
          <span style={{fontSize:"0.72rem",color:dark?"rgba(255,255,255,0.5)":"var(--muted)",width:20}}>{count}</span>
        </div>
      ))}
    </div>
  );
};

// ─── RESULTS DISPLAY (PARTICIPANT / FULL SCREEN) ───────────────────────────────
const ResultsDisplay = ({ dark, compact }) => {
  const { analysis, streamingText, wordFrequency, questions, responses, sentiment, highlights, resultsPublished } = useStore();
  const pCount = Object.keys(responses).length;
  const bg = dark?"#1a1410":"var(--paper)";
  const cardBg = dark?"rgba(255,255,255,0.04)":"white";
  const cardBorder = dark?"rgba(255,255,255,0.08)":"var(--border)";
  const textColor = dark?"rgba(255,255,255,0.8)":"var(--ink)";
  const mutedColor = dark?"rgba(255,255,255,0.35)":"var(--muted)";

  return (
    <div style={{background:bg,padding:compact?"1rem":"2rem",maxWidth:compact?900:780,margin:"0 auto",width:"100%"}}>
      {!compact&&(
        <div style={{textAlign:"center",marginBottom:"2.5rem"}} className="fu">
          <div style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",background:"var(--sage)",color:"white",padding:"0.4rem 1rem",borderRadius:100,fontSize:"0.72rem",marginBottom:"1rem"}}>
            ✓ Sesión completada · {pCount} participantes
          </div>
          <h1 className="cg" style={{fontSize:"2.2rem",fontWeight:400,color:textColor}}>Resultados de la sesión</h1>
        </div>
      )}
      {questions.map((q,i)=>{
        const qKey=`q${i+1}`;
        const text = streamingText[qKey]||analysis[qKey];
        const streaming = !!streamingText[qKey];
        const isPublished = resultsPublished[qKey];
        if(!text || (!compact && !isPublished)) return null;
        return (
          <div key={i} className="fu" style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:16,padding:"1.5rem",marginBottom:"1.25rem",boxShadow:dark?"none":"var(--shadow)"}}>
            <p style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:mutedColor,marginBottom:"0.4rem"}}>Pregunta {i+1}</p>
            <p className="cg" style={{fontSize:"1.05rem",marginBottom:"1rem",color:textColor}}>{q.text}</p>
            <p style={{color:textColor,lineHeight:1.75,fontSize:"0.9rem",marginBottom:"1rem"}}>
              {text}{streaming&&<span style={{animation:"blink 1s infinite",color:"var(--primary)"}}>▌</span>}
            </p>
            {/* Highlights */}
            {highlights[qKey]?.length>0&&(
              <div style={{borderTop:`1px solid ${cardBorder}`,paddingTop:"1rem",marginTop:"0.5rem"}}>
                <p style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.08em",color:mutedColor,marginBottom:"0.6rem"}}>Voces destacadas</p>
                <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                  {highlights[qKey].map((h,j)=>(
                    <div key={j} style={{padding:"0.6rem 0.9rem",background:dark?"rgba(200,129,58,0.08)":"var(--primary-pale)",borderLeft:`2px solid var(--primary)`,borderRadius:"0 8px 8px 0"}}>
                      <p className="cg" style={{fontSize:"0.9rem",fontStyle:"italic",color:dark?"var(--primary-light)":"var(--primary-dark)"}}>"{h}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Sentiment */}
            {sentiment[qKey]&&(
              <div style={{borderTop:`1px solid ${cardBorder}`,paddingTop:"1rem",marginTop:"1rem"}}>
                <p style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.08em",color:mutedColor,marginBottom:"0.6rem"}}>Distribución de sentimiento</p>
                <SentimentBar sentiment={sentiment[qKey]} dark={dark}/>
              </div>
            )}
          </div>
        );
      })}
      {wordFrequency.length>0&&(
        <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:16,padding:"1.5rem",boxShadow:dark?"none":"var(--shadow)"}}>
          <p style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:mutedColor,marginBottom:"1rem"}}>Palabras más mencionadas</p>
          <WordCloud words={wordFrequency} dark={dark}/>
        </div>
      )}
    </div>
  );
};

// ─── ANALYSIS ENGINE ──────────────────────────────────────────────────────────
const runFullAnalysis = async (qNum) => {
  const { responses, analysisPrompts } = store.get();
  const qKey = `q${qNum}`;
  const texts = Object.values(responses).map(r=>r[qKey]).filter(Boolean);
  if(!texts.length) return;

  store.set({ streamingText: { ...store.get().streamingText, [qKey]:"" } });

  // 1. Streaming summary
  let summary = "";
  const sysMain = `Eres un analista experto en formación y desarrollo humano. ${analysisPrompts[qNum]}
Filtra contenido inapropiado u ofensivo. Responde directamente sin introducción.`;
  await claude(sysMain, `Respuestas:\n\n${texts.join("\n---\n")}`, chunk => {
    summary += chunk;
    store.set({ streamingText: { ...store.get().streamingText, [qKey]: summary } });
  });

  store.set({ analysis: { ...store.get().analysis, [qKey]: summary }, streamingText: {} });

  // 2. Sentiment + highlights (JSON)
  const enriched = await claudeJSON(
    "Eres un analista de feedback formativo. Responde SOLO con JSON.",
    `Analiza estas respuestas y devuelve JSON con esta estructura exacta:
{
  "sentiment": { "positive": N, "neutral": N, "critical": N },
  "highlights": ["cita textual 1","cita textual 2","cita textual 3"]
}
Las citas deben ser frases literales interesantes de las respuestas (máx 15 palabras cada una). Filtra contenido inapropiado.
Respuestas:\n\n${texts.join("\n---\n")}`
  );

  if(enriched) {
    store.set({
      sentiment: { ...store.get().sentiment, [qKey]: enriched.sentiment },
      highlights: { ...store.get().highlights, [qKey]: enriched.highlights||[] },
    });
  }

  // 3. Suggested next question
  if(qNum < 3) {
    const nextQ = await claudeJSON(
      "Eres un facilitador experto en formaciones de humanidades. Responde SOLO con JSON.",
      `Basándote en estas respuestas de la pregunta ${qNum}, sugiere una pregunta de seguimiento alternativa para la pregunta ${qNum+1} que profundice en los temas emergentes. JSON: {"suggestion":"texto de la pregunta sugerida"}
Respuestas:\n\n${texts.join("\n---\n")}`
    );
    if(nextQ?.suggestion) {
      store.set({ suggestedQuestions: { ...store.get().suggestedQuestions, [qKey]: nextQ.suggestion } });
    }
  }

  // 4. Update word frequency
  store.set({ wordFrequency: wordFreq(store.get().responses) });
};

// ─── PRESENTER DASHBOARD ─────────────────────────────────────────────────────
const PresenterDashboard = () => {
  const state = useStore();
  const { status, currentQuestion, timerStart, timerDuration, responses, analysis, streamingText,
    wordFrequency, questions, analysisPrompts, sentiment, highlights, suggestedQuestions,
    resultsPublished, debateActive, debateQuestion, debateTimerStart, debateTimerDuration,
    debateResponses, debateAnalysis, branding, sessionName, anonymityMessage } = state;

  const rem = useCountdown(timerStart, timerDuration);
  const debateRem = useCountdown(debateTimerStart, debateTimerDuration);
  const [tab, setTab] = useState("control");
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [promptDraft, setPromptDraft] = useState("");
  const [editingBranding, setEditingBranding] = useState(false);
  const [brandingDraft, setBrandingDraft] = useState({...branding});
  const [editingAnonymity, setEditingAnonymity] = useState(false);
  const [anonymityDraft, setAnonymityDraft] = useState(anonymityMessage);
  const [sessionNameDraft, setSessionNameDraft] = useState(sessionName);
  const [usingSuggestion, setUsingSuggestion] = useState({});
  const isProcessing = status === "processing";

  const pCount = Object.keys(responses).length;
  const rCount = Object.values(responses).reduce((a,r)=>a+Object.keys(r).length,0);
  const wCount = Object.values(responses).reduce((a,r)=>a+Object.values(r).filter(v=>typeof v==="string").join(" ").split(" ").filter(Boolean).length,0);

  const startSession = () => store.set({ status:"question_1", currentQuestion:1, timerStart:Date.now() });

  const advanceOrClose = async (close=false) => {
    store.set({ status:"processing" });
    await runFullAnalysis(currentQuestion);
    const next = currentQuestion + 1;
    if(!close && next<=3) {
      store.set({ status:`question_${next}`, currentQuestion:next, timerStart:Date.now() });
    } else {
      store.set({ status:"results" });
    }
  };

  const regenerate = async (qNum) => {
    const qKey=`q${qNum}`;
    store.set({ streamingText:{...store.get().streamingText,[qKey]:""}, analysis:{...store.get().analysis,[qKey]:""} });
    await runFullAnalysis(qNum);
  };

  const togglePublish = (qNum) => {
    const qKey=`q${qNum}`;
    store.set({ resultsPublished:{...store.get().resultsPublished,[qKey]:!store.get().resultsPublished[qKey]} });
  };

  const startDebate = (qNum) => {
    store.set({ debateActive:true, debateQuestion:qNum, debateTimerStart:Date.now() });
  };

  const closeDebate = async () => {
    store.set({ debateActive:false });
    const qKey=`q${debateQuestion}`;
    const dresp = store.get().debateResponses;
    const entries = Object.values(dresp).map(r=>r[qKey]).filter(Boolean);
    if(!entries.length) return;
    const counts = { agree:0, nuance:0, disagree:0 };
    const comments = [];
    entries.forEach(e=>{ counts[e.stance]=(counts[e.stance]||0)+1; if(e.text) comments.push(e.text); });
    let meta="";
    await claude(
      "Analista de debates formativos. Sé conciso, máx 100 palabras.",
      `Reacciones al resumen de la pregunta ${debateQuestion}: ${counts.agree} de acuerdo, ${counts.nuance} con matices, ${counts.disagree} en desacuerdo. Comentarios: ${comments.join(" | ")}. Genera un meta-análisis breve.`,
      chunk => { meta+=chunk; store.set({ debateAnalysis:{...store.get().debateAnalysis,[qKey]:meta} }); }
    );
  };

  const addDemo = () => {
    const demos=[
      {q1:"Me ha parecido muy inspiradora. Ha cambiado mi perspectiva sobre el liderazgo.",q2:"La escucha activa y el autoconocimiento como bases del liderazgo efectivo.",q3:"Voy a cambiar mis hábitos de comunicación con el equipo."},
      {q1:"Sorprendente y profunda. Conectar humanidades con empresa es un puente nuevo.",q2:"La creatividad como motor de decisiones. No lo había visto así.",q3:"Presencia en conversaciones y más espacio para la reflexión diaria."},
      {q1:"Muy práctica y cercana. El ponente supo generar confianza desde el principio.",q2:"El propósito como brújula. Necesito reconectar con el mío.",q3:"Conversaciones más honestas y revisar mis prioridades reales."},
      {q1:"Retadora e inspiradora. Me sacó de la zona de confort de forma constructiva.",q2:"La empatía radical como herramienta de gestión de equipos.",q3:"Incorporar reflexión estructurada en mis reuniones de equipo semanales."},
    ];
    const id=`demo_${Date.now()}`; const qNum=store.get().currentQuestion;
    const resp=demos[Math.floor(Math.random()*demos.length)];
    store.set({responses:{...store.get().responses,[id]:{[`q${qNum}`]:resp[`q${qNum}`]}}});
  };

  const statusLabel={ waiting:"Esperando",question_1:"P1 activa",question_2:"P2 activa",question_3:"P3 activa",processing:"Analizando",results:"Resultados" }[status]||status;
  const statusColor={ waiting:"#888",question_1:"var(--primary)",question_2:"var(--primary)",question_3:"var(--primary)",processing:"var(--primary-light)",results:"var(--sage)" }[status]||"#888";

  const TabBtn = ({id,label}) => (
    <button onClick={()=>setTab(id)}
      style={{background:"none",border:"none",color:tab===id?"var(--primary-light)":"rgba(255,255,255,0.35)",padding:"0.7rem 0.9rem",fontSize:"0.8rem",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontWeight:tab===id?600:400,borderBottom:tab===id?"2px solid var(--primary)":"2px solid transparent",marginBottom:-1,transition:"all 0.15s"}}>
      {label}
    </button>
  );

  return (
    <div style={{minHeight:"100vh",background:"#12100e",color:"white",fontFamily:"Outfit,sans-serif"}}>
      {/* Top bar */}
      <div style={{background:"rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"0.8rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:"var(--primary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>◈</div>
          <span className="cg" style={{fontSize:"1.1rem",letterSpacing:"0.01em"}}>{branding.sessionTitle} · Dashboard</span>
          <span style={{fontSize:"0.72rem",background:"rgba(255,255,255,0.07)",padding:"0.2rem 0.6rem",borderRadius:100,color:"rgba(255,255,255,0.4)"}}>{sessionName}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:statusColor,animation:status!=="waiting"&&status!=="results"?"blink 1.5s infinite":"none"}}/>
          <span style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.5)"}}>{statusLabel}</span>
        </div>
      </div>

      {/* Metrics bar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        {[
          {l:"Participantes",v:pCount},
          {l:"Respuestas",v:rCount},
          {l:"Palabras",v:wCount},
          {l:"Tiempo",v:status.startsWith("question")?fmt(rem):"—",alert:rem<60&&status.startsWith("question")},
        ].map(({l,v,alert})=>(
          <div key={l} style={{padding:"0.9rem 1.25rem",borderRight:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.35)",marginBottom:"0.2rem",textTransform:"uppercase",letterSpacing:"0.08em"}}>{l}</div>
            <div style={{fontSize:"1.6rem",fontWeight:300,color:alert?"#e8856a":"white",fontFamily:"Cormorant Garamond,serif",animation:alert?"count-up 0.3s ease":"none"}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"0 1.25rem",overflowX:"auto"}}>
        {[["control","Control"],["analysis","Análisis"],["wordcloud","Nube"],["debate","Debate"],["prompts","Prompts"],["settings","Config"]].map(([id,label])=>(
          <TabBtn key={id} id={id} label={label}/>
        ))}
      </div>

      <div style={{padding:"1.25rem",maxWidth:960,margin:"0 auto"}}>

        {/* ── CONTROL TAB ── */}
        {tab==="control"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            {/* Session control */}
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.25rem"}}>
              <h3 style={{fontSize:"0.72rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",marginBottom:"0.9rem"}}>Control de sesión</h3>
              <div style={{display:"flex",gap:"0.6rem",flexWrap:"wrap",alignItems:"center",marginBottom:"1rem"}}>
                {status==="waiting"&&<Btn onClick={startSession}>▶ Iniciar pregunta 1</Btn>}
                {status.startsWith("question")&&currentQuestion<3&&<Btn onClick={()=>advanceOrClose()} disabled={isProcessing}>⟶ Cerrar · Siguiente pregunta</Btn>}
                {status.startsWith("question")&&currentQuestion===3&&<Btn onClick={()=>advanceOrClose(true)} disabled={isProcessing} variant="danger">■ Cerrar sesión y analizar</Btn>}
                {isProcessing&&<div style={{display:"flex",alignItems:"center",gap:"0.5rem",color:"var(--primary-light)",fontSize:"0.82rem"}}>
                  <div style={{width:13,height:13,border:"2px solid var(--primary)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Analizando con Claude…
                </div>}
                {status.startsWith("question")&&<Btn onClick={addDemo} variant="ghost" small>+ Demo</Btn>}
              </div>
              {status.startsWith("question")&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.72rem",color:"rgba(255,255,255,0.35)",marginBottom:"0.35rem"}}>
                    <span>Pregunta {currentQuestion} de 3 · {fmt(rem)}</span>
                    <span>{Math.round((1-rem/timerDuration)*100)}% transcurrido</span>
                  </div>
                  <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:2}}>
                    <div style={{height:"100%",width:`${(rem/timerDuration)*100}%`,background:rem<60?"var(--rust)":"var(--primary)",borderRadius:2,transition:"width 0.4s linear"}}/>
                  </div>
                </div>
              )}
            </div>

            {/* Question cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.75rem"}}>
              {questions.map((q,i)=>{
                const qNum=i+1; const qKey=`q${qNum}`;
                const active=currentQuestion===qNum&&status.startsWith("question");
                const done=!!analysis[qKey]; const isProcessingThis=status==="processing"&&currentQuestion===qNum;
                const suggestion=suggestedQuestions[`q${qNum-1}`];
                return (
                  <div key={i} style={{background:active?"rgba(200,129,58,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${active?"rgba(200,129,58,0.35)":"rgba(255,255,255,0.07)"}`,borderRadius:12,padding:"1rem",transition:"all 0.3s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"}}>
                      <span style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.1em",color:active?"var(--primary)":"rgba(255,255,255,0.25)"}}>P{qNum}</span>
                      <div style={{display:"flex",gap:"0.4rem",alignItems:"center"}}>
                        {done&&<span style={{color:"var(--sage)",fontSize:"0.72rem"}}>✓</span>}
                        {active&&<span style={{color:"var(--primary)",fontSize:"0.68rem",animation:"blink 1.5s infinite"}}>● activa</span>}
                        {isProcessingThis&&<div style={{width:10,height:10,border:"1.5px solid var(--primary)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
                      </div>
                    </div>
                    <p style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.55)",lineHeight:1.4,marginBottom:"0.5rem"}}>{q.text}</p>
                    <div style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.25)",marginBottom:suggestion?"0.6rem":0}}>
                      {Object.values(responses).filter(r=>r[qKey]).length} respuestas
                    </div>
                    {/* Suggested question */}
                    {suggestion&&!usingSuggestion[qKey]&&(
                      <div style={{background:"rgba(200,129,58,0.1)",border:"1px solid rgba(200,129,58,0.2)",borderRadius:8,padding:"0.5rem 0.6rem",marginTop:"0.5rem"}}>
                        <p style={{fontSize:"0.65rem",color:"var(--primary-light)",marginBottom:"0.3rem"}}>✦ Sugerida por IA</p>
                        <p style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.6)",lineHeight:1.4,marginBottom:"0.4rem"}}>{suggestion}</p>
                        <button onClick={()=>{
                          const qs=[...store.get().questions]; qs[qNum-1]={...qs[qNum-1],text:suggestion};
                          store.set({questions:qs}); setUsingSuggestion({...usingSuggestion,[qKey]:true});
                        }} style={{fontSize:"0.65rem",color:"var(--primary-light)",background:"none",border:"1px solid rgba(200,129,58,0.3)",borderRadius:6,padding:"0.2rem 0.5rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>
                          Adoptar
                        </button>
                      </div>
                    )}
                    {/* Publish toggle */}
                    {done&&(
                      <div style={{marginTop:"0.6rem",display:"flex",gap:"0.4rem"}}>
                        <button onClick={()=>togglePublish(qNum)}
                          style={{flex:1,fontSize:"0.65rem",padding:"0.3rem",borderRadius:6,border:"1px solid rgba(255,255,255,0.15)",background:resultsPublished[qKey]?"var(--sage)":"transparent",color:resultsPublished[qKey]?"white":"rgba(255,255,255,0.4)",cursor:"pointer",fontFamily:"Outfit,sans-serif",transition:"all 0.2s"}}>
                          {resultsPublished[qKey]?"● Publicado":"○ Publicar"}
                        </button>
                        {resultsPublished[qKey]&&!debateActive&&(
                          <button onClick={()=>startDebate(qNum)}
                            style={{flex:1,fontSize:"0.65rem",padding:"0.3rem",borderRadius:6,border:"1px solid rgba(58,122,176,0.4)",background:"rgba(58,122,176,0.15)",color:"var(--sky)",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>
                            ◎ Debate
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
              <div style={{background:"rgba(58,122,176,0.08)",border:"1px solid rgba(58,122,176,0.25)",borderRadius:16,padding:"1.25rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
                  <div>
                    <span style={{fontSize:"0.72rem",color:"var(--sky)",textTransform:"uppercase",letterSpacing:"0.08em"}}>◎ Modo debate activo · Pregunta {debateQuestion}</span>
                    <p style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.5)",marginTop:"0.2rem"}}>
                      {Object.values(debateResponses).filter(r=>r[`q${debateQuestion}`]).length} reacciones recibidas
                    </p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:"1.2rem",fontFamily:"Cormorant Garamond,serif",color:debateRem<30?"var(--rust)":"var(--sky)"}}>{fmt(debateRem)}</div>
                    <Btn onClick={closeDebate} variant="sky" small>Cerrar debate</Btn>
                  </div>
                </div>
                {debateAnalysis[`q${debateQuestion}`]&&(
                  <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"0.9rem",marginTop:"0.75rem"}}>
                    <p style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.4rem"}}>Meta-análisis</p>
                    <p style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.7)",lineHeight:1.65}}>{debateAnalysis[`q${debateQuestion}`]}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYSIS TAB ── */}
        {tab==="analysis"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            {questions.map((q,i)=>{
              const qNum=i+1; const qKey=`q${qNum}`;
              const text=streamingText[qKey]||analysis[qKey];
              const streaming=!!streamingText[qKey];
              return (
                <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.25rem"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.75rem"}}>
                    <div>
                      <span style={{fontSize:"0.65rem",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em"}}>Pregunta {qNum}</span>
                      <p className="cg" style={{fontSize:"1rem",marginTop:"0.2rem"}}>{q.text}</p>
                    </div>
                    <div style={{display:"flex",gap:"0.4rem",flexShrink:0}}>
                      {analysis[qKey]&&<button onClick={()=>regenerate(qNum)}
                        style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"0.35rem 0.7rem",color:"rgba(255,255,255,0.4)",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>↺</button>}
                      {analysis[qKey]&&<button onClick={()=>togglePublish(qNum)}
                        style={{background:resultsPublished[qKey]?"var(--sage)":"none",border:`1px solid ${resultsPublished[qKey]?"var(--sage)":"rgba(255,255,255,0.15)"}`,borderRadius:8,padding:"0.35rem 0.7rem",color:resultsPublished[qKey]?"white":"rgba(255,255,255,0.4)",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>
                        {resultsPublished[qKey]?"Publicado ✓":"Publicar"}
                      </button>}
                    </div>
                  </div>
                  {text?(
                    <>
                      <p style={{color:"rgba(255,255,255,0.72)",lineHeight:1.75,fontSize:"0.88rem",marginBottom:"1rem"}}>
                        {text}{streaming&&<span style={{animation:"blink 1s infinite",color:"var(--primary)"}}>▌</span>}
                      </p>
                      {highlights[qKey]?.length>0&&(
                        <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:"0.9rem",marginBottom:"1rem"}}>
                          <p style={{fontSize:"0.65rem",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",marginBottom:"0.5rem"}}>Voces destacadas</p>
                          <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                            {highlights[qKey].map((h,j)=>(
                              <p key={j} className="cg" style={{fontSize:"0.88rem",fontStyle:"italic",color:"var(--primary-light)",borderLeft:"2px solid var(--primary)",paddingLeft:"0.7rem"}}>"{h}"</p>
                            ))}
                          </div>
                        </div>
                      )}
                      {sentiment[qKey]&&(
                        <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:"0.9rem"}}>
                          <p style={{fontSize:"0.65rem",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",marginBottom:"0.5rem"}}>Sentimiento</p>
                          <SentimentBar sentiment={sentiment[qKey]} dark/>
                        </div>
                      )}
                    </>
                  ):(
                    <p style={{color:"rgba(255,255,255,0.2)",fontSize:"0.82rem",fontStyle:"italic"}}>El análisis aparecerá al cerrar la pregunta</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── WORD CLOUD TAB ── */}
        {tab==="wordcloud"&&(
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"2rem"}}>
            <h3 style={{fontSize:"0.72rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)",marginBottom:"1.5rem"}}>Nube de palabras en tiempo real</h3>
            <WordCloud words={wordFrequency} dark/>
            {wordFrequency.length>0&&(
              <div style={{marginTop:"1.5rem",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.5rem"}}>
                {wordFrequency.slice(0,9).map(({word,count})=>(
                  <div key={word} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.4rem 0.6rem",background:"rgba(255,255,255,0.03)",borderRadius:8}}>
                    <span style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.6)"}}>{word}</span>
                    <span style={{fontSize:"0.72rem",color:"var(--primary)",fontWeight:600}}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DEBATE TAB ── */}
        {tab==="debate"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.25rem"}}>
              <h3 style={{fontSize:"0.72rem",textTransform:"uppercase",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",marginBottom:"0.9rem"}}>Historial de debates</h3>
              {Object.keys(debateAnalysis).length===0?(
                <p style={{color:"rgba(255,255,255,0.2)",fontSize:"0.82rem"}}>Ningún debate completado aún. Publica los resultados de una pregunta y activa el modo debate.</p>
              ):Object.entries(debateAnalysis).map(([qKey,meta])=>{
                const qNum=parseInt(qKey.replace("q",""));
                const dresp=Object.values(debateResponses).map(r=>r[qKey]).filter(Boolean);
                const counts={agree:0,nuance:0,disagree:0};
                dresp.forEach(e=>counts[e.stance]=(counts[e.stance]||0)+1);
                return (
                  <div key={qKey} style={{background:"rgba(58,122,176,0.06)",border:"1px solid rgba(58,122,176,0.2)",borderRadius:12,padding:"1rem",marginBottom:"0.75rem"}}>
                    <p style={{fontSize:"0.72rem",color:"var(--sky)",marginBottom:"0.5rem",textTransform:"uppercase",letterSpacing:"0.08em"}}>Pregunta {qNum} · {dresp.length} reacciones</p>
                    <div style={{display:"flex",gap:"1rem",marginBottom:"0.75rem"}}>
                      {[["De acuerdo",counts.agree,"var(--sage)"],["Matiz",counts.nuance,"var(--primary)"],["Discrepo",counts.disagree,"var(--rust)"]].map(([l,c,color])=>(
                        <div key={l} style={{textAlign:"center"}}>
                          <div style={{fontSize:"1.2rem",color,fontFamily:"Cormorant Garamond,serif"}}>{c}</div>
                          <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.35)"}}>{l}</div>
                        </div>
                      ))}
                    </div>
                    <p style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.65)",lineHeight:1.6}}>{meta}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PROMPTS TAB ── */}
        {tab==="prompts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <p style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.35)",marginBottom:"0.25rem"}}>Edita los prompts del agente por pregunta. Puedes regenerar el análisis después.</p>
            {[1,2,3].map(qNum=>(
              <div key={qNum} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.1rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.7rem"}}>
                  <span style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.45)"}}>Pregunta {qNum}</span>
                  {editingPrompt===qNum?(
                    <div style={{display:"flex",gap:"0.4rem"}}>
                      <button onClick={()=>{store.set({analysisPrompts:{...store.get().analysisPrompts,[qNum]:promptDraft}});setEditingPrompt(null);}}
                        style={{background:"var(--sage)",border:"none",borderRadius:6,padding:"0.28rem 0.65rem",color:"white",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Guardar</button>
                      <button onClick={()=>setEditingPrompt(null)}
                        style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,padding:"0.28rem 0.65rem",color:"rgba(255,255,255,0.4)",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Cancelar</button>
                    </div>
                  ):(
                    <button onClick={()=>{setEditingPrompt(qNum);setPromptDraft(analysisPrompts[qNum]);}}
                      style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,padding:"0.28rem 0.65rem",color:"rgba(255,255,255,0.4)",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Editar</button>
                  )}
                </div>
                {editingPrompt===qNum?(
                  <textarea value={promptDraft} onChange={e=>setPromptDraft(e.target.value)}
                    style={{width:"100%",minHeight:90,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"0.7rem",color:"white",fontSize:"0.82rem",fontFamily:"Outfit,sans-serif",resize:"vertical"}}/>
                ):(
                  <p style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.45)",lineHeight:1.55}}>{analysisPrompts[qNum]}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab==="settings"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            {/* Session name */}
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.25rem"}}>
              <h3 style={{fontSize:"0.72rem",textTransform:"uppercase",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",marginBottom:"0.9rem"}}>Sesión</h3>
              <div style={{display:"flex",gap:"0.75rem",alignItems:"center"}}>
                <input value={sessionNameDraft} onChange={e=>setSessionNameDraft(e.target.value)}
                  style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"0.6rem 0.9rem",color:"white",fontSize:"0.88rem",fontFamily:"Outfit,sans-serif"}}
                  placeholder="Nombre de la sesión"/>
                <Btn onClick={()=>store.set({sessionName:sessionNameDraft})} small>Guardar</Btn>
              </div>
            </div>
            {/* Branding */}
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.25rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.9rem"}}>
                <h3 style={{fontSize:"0.72rem",textTransform:"uppercase",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em"}}>Branding</h3>
                {editingBranding?(
                  <div style={{display:"flex",gap:"0.4rem"}}>
                    <button onClick={()=>{store.set({branding:brandingDraft});setEditingBranding(false);}}
                      style={{background:"var(--sage)",border:"none",borderRadius:6,padding:"0.28rem 0.65rem",color:"white",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Guardar</button>
                    <button onClick={()=>setEditingBranding(false)}
                      style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,padding:"0.28rem 0.65rem",color:"rgba(255,255,255,0.4)",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Cancelar</button>
                  </div>
                ):(
                  <button onClick={()=>setEditingBranding(true)}
                    style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,padding:"0.28rem 0.65rem",color:"rgba(255,255,255,0.4)",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Editar</button>
                )}
              </div>
              {editingBranding?(
                <div style={{display:"flex",flexDirection:"column",gap:"0.7rem"}}>
                  <div>
                    <label style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.4)",display:"block",marginBottom:"0.3rem"}}>Título de sesión</label>
                    <input value={brandingDraft.sessionTitle} onChange={e=>setBrandingDraft({...brandingDraft,sessionTitle:e.target.value})}
                      style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"0.55rem 0.8rem",color:"white",fontSize:"0.88rem",fontFamily:"Outfit,sans-serif"}}/>
                  </div>
                  <div>
                    <label style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.4)",display:"block",marginBottom:"0.3rem"}}>Color principal</label>
                    <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
                      <input type="color" value={brandingDraft.primaryColor} onChange={e=>setBrandingDraft({...brandingDraft,primaryColor:e.target.value})}
                        style={{width:40,height:36,border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,background:"none",cursor:"pointer",padding:2}}/>
                      <span style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.5)"}}>{brandingDraft.primaryColor}</span>
                    </div>
                  </div>
                </div>
              ):(
                <div style={{display:"flex",gap:"1rem",alignItems:"center"}}>
                  <div style={{width:32,height:32,borderRadius:8,background:branding.primaryColor}}/>
                  <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.6)"}}>{branding.sessionTitle}</p>
                </div>
              )}
            </div>
            {/* Anonymity message */}
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.25rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
                <h3 style={{fontSize:"0.72rem",textTransform:"uppercase",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em"}}>Mensaje de anonimato</h3>
                {editingAnonymity?(
                  <div style={{display:"flex",gap:"0.4rem"}}>
                    <button onClick={()=>{store.set({anonymityMessage:anonymityDraft});setEditingAnonymity(false);}}
                      style={{background:"var(--sage)",border:"none",borderRadius:6,padding:"0.28rem 0.65rem",color:"white",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Guardar</button>
                    <button onClick={()=>setEditingAnonymity(false)}
                      style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,padding:"0.28rem 0.65rem",color:"rgba(255,255,255,0.4)",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Cancelar</button>
                  </div>
                ):(
                  <button onClick={()=>setEditingAnonymity(true)}
                    style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,padding:"0.28rem 0.65rem",color:"rgba(255,255,255,0.4)",fontSize:"0.72rem",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Editar</button>
                )}
              </div>
              {editingAnonymity?(
                <textarea value={anonymityDraft} onChange={e=>setAnonymityDraft(e.target.value)}
                  style={{width:"100%",minHeight:70,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"0.65rem 0.8rem",color:"white",fontSize:"0.82rem",fontFamily:"Outfit,sans-serif",resize:"vertical"}}/>
              ):(
                <p style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.45)",lineHeight:1.55}}>{anonymityMessage}</p>
              )}
            </div>
            {/* Timer config */}
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.25rem"}}>
              <h3 style={{fontSize:"0.72rem",textTransform:"uppercase",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",marginBottom:"0.9rem"}}>Tiempo por pregunta</h3>
              <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                {[[60,"1 min"],[120,"2 min"],[180,"3 min"],[300,"5 min"],[420,"7 min"],[600,"10 min"]].map(([secs,label])=>(
                  <button key={secs} onClick={()=>store.set({timerDuration:secs})}
                    style={{padding:"0.45rem 0.9rem",borderRadius:8,border:`1px solid ${timerDuration===secs?"var(--primary)":"rgba(255,255,255,0.15)"}`,background:timerDuration===secs?"rgba(200,129,58,0.15)":"transparent",color:timerDuration===secs?"var(--primary-light)":"rgba(255,255,255,0.4)",fontSize:"0.78rem",cursor:"pointer",fontFamily:"Outfit,sans-serif",transition:"all 0.15s"}}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results section */}
      {status==="results"&&tab==="control"&&(
        <div style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <ResultsDisplay dark compact/>
        </div>
      )}
    </div>
  );
};

// ─── CLIENT VIEW ──────────────────────────────────────────────────────────────
const ClientView = () => {
  const { responses, analysis, wordFrequency, questions, sentiment, highlights, resultsPublished, branding, sessionName } = useStore();
  const pCount = Object.keys(responses).length;
  const anyPublished = Object.values(resultsPublished).some(Boolean);

  return (
    <div style={{minHeight:"100vh",background:"var(--paper)",fontFamily:"Outfit,sans-serif"}}>
      <div style={{background:"white",borderBottom:"1px solid var(--border)",padding:"1rem 2rem",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"var(--shadow-sm)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"var(--primary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"white"}}>◈</div>
          <span className="cg" style={{fontSize:"1.1rem"}}>{branding.sessionTitle}</span>
          <span style={{fontSize:"0.72rem",background:"var(--cream)",padding:"0.2rem 0.6rem",borderRadius:100,color:"var(--muted)"}}>{sessionName}</span>
        </div>
        <span style={{fontSize:"0.78rem",color:"var(--muted)"}}>◎ Vista cliente · Solo lectura</span>
      </div>

      <div style={{maxWidth:780,margin:"0 auto",padding:"2rem 1.5rem"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.75rem",marginBottom:"2rem"}}>
          {[["Participantes",pCount,"◉"],["Respuestas",Object.values(responses).reduce((a,r)=>a+Object.keys(r).length,0),"◎"],["Preguntas analizadas",Object.values(analysis).filter(Boolean).length,"◈"]].map(([l,v,icon])=>(
            <div key={l} style={{background:"white",border:"1px solid var(--border)",borderRadius:14,padding:"1.1rem",boxShadow:"var(--shadow-sm)"}}>
              <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--muted)",marginBottom:"0.3rem"}}>{icon} {l}</div>
              <div className="cg" style={{fontSize:"1.8rem",fontWeight:400}}>{v}</div>
            </div>
          ))}
        </div>

        {!anyPublished?(
          <div style={{textAlign:"center",padding:"3rem",color:"var(--muted)"}}>
            <div style={{fontSize:48,marginBottom:"1rem"}}>◎</div>
            <p className="cg" style={{fontSize:"1.4rem",marginBottom:"0.5rem"}}>Resultados pendientes</p>
            <p style={{fontSize:"0.85rem"}}>El ponente publicará los resultados cuando estén listos.</p>
          </div>
        ):(
          <ResultsDisplay dark={false} compact={false}/>
        )}
      </div>
    </div>
  );
};

// ─── PARTICIPANT APP ──────────────────────────────────────────────────────────
const ParticipantApp = () => {
  const { status, debateActive } = useStore();
  const [pid] = useState(()=>`p_${Math.random().toString(36).slice(2,8)}`);
  useEffect(()=>{ store.set({participants:{...store.get().participants,[pid]:true}}); },[pid]);

  if(debateActive) return <DebateScreen participantId={pid}/>;
  if(status==="waiting") return <WaitingScreen/>;
  if(status.startsWith("question")) return <QuestionScreen participantId={pid}/>;
  if(status==="processing") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--paper)"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:36,height:36,border:"2px solid var(--primary)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 1rem"}}/>
        <p className="cg" style={{fontSize:"1.1rem"}}>Analizando respuestas…</p>
      </div>
    </div>
  );
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--paper)",padding:"2rem",textAlign:"center"}}>
      <div style={{width:60,height:60,borderRadius:"50%",background:"var(--sage)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem",boxShadow:"0 4px 16px rgba(107,125,95,0.35)"}}>
        <span style={{color:"white",fontSize:24}}>✓</span>
      </div>
      <h2 className="cg fu" style={{fontSize:"1.8rem",fontWeight:400,marginBottom:"0.75rem"}}>¡Gracias por participar!</h2>
      <p className="fu2" style={{color:"var(--muted)",maxWidth:280,lineHeight:1.65,fontSize:"0.88rem"}}>El ponente está preparando los resultados. En breve los veréis todos juntos.</p>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null);
  return (
    <>
      <style>{css}</style>
      {!role && <RoleSelector onSelect={setRole}/>}
      {role==="participant" && <ParticipantApp/>}
      {role==="presenter"  && <PresenterDashboard/>}
      {role==="client"     && <ClientView/>}
    </>
  );
}
