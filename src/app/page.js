"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const MEMBERS = ["Khoa Đoàn", "Khoa BP", "Phát Kendo", "Hưng An Giang", "Nam Đa Khoa", "Dũng Gay", "Thông Data", "Bảnh KH Bao"];

function getFines(sessions) {
  const fines = {};
  MEMBERS.forEach(m => fines[m] = 0);
  sessions.forEach(session => {
    (session.matches || []).forEach(match => {
      const { pair1, pair2, score1, score2 } = match;
      if (score1 === score2) {
        [...pair1, ...pair2].forEach(p => { if (fines[p] !== undefined) fines[p] += 10000; });
      } else if (score1 < score2) {
        pair1.forEach(p => { if (fines[p] !== undefined) fines[p] += 10000; });
      } else {
        pair2.forEach(p => { if (fines[p] !== undefined) fines[p] += 10000; });
      }
    });
  });
  return fines;
}

function getResult(score1, score2) {
  if (score1 === score2) return "draw";
  if (score1 > score2) return "pair1";
  return "pair2";
}

function formatVND(amount) {
  if (amount === 0) return "0đ";
  return (amount / 1000) + "k";
}

function AddMatchModal({ onAdd, onClose, loading }) {
  const [pair1, setPair1] = useState(["", ""]);
  const [pair2, setPair2] = useState(["", ""]);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const allSelected = pair1[0] && pair1[1] && pair2[0] && pair2[1] && score1 !== "" && score2 !== "";
  const allUnique = new Set([pair1[0], pair1[1], pair2[0], pair2[1]]).size === 4;
  const taken = [pair1[0], pair1[1], pair2[0], pair2[1]].filter(Boolean);
  const available = (current) => MEMBERS.filter(m => !taken.includes(m) || m === current);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#111620", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#e2e8f0" }}>Log Match</div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#60A5FA", marginBottom: 8, fontFamily: "monospace" }}>PAIR A</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1].map(i => (
              <select key={i} value={pair1[i]} onChange={e => setPair1(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                style={{ flex: 1, background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", padding: "8px 6px", fontSize: 11 }}>
                <option value="">Player {i + 1}</option>
                {available(pair1[i]).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <input type="number" min="0" max="10" placeholder="0" value={score1} onChange={e => setScore1(e.target.value)}
            style={{ flex: 1, background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#60A5FA", padding: "10px", fontSize: 22, fontWeight: 700, textAlign: "center" }} />
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>—</span>
          <input type="number" min="0" max="10" placeholder="0" value={score2} onChange={e => setScore2(e.target.value)}
            style={{ flex: 1, background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#FB923C", padding: "10px", fontSize: 22, fontWeight: 700, textAlign: "center" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#FB923C", marginBottom: 8, fontFamily: "monospace" }}>PAIR B</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1].map(i => (
              <select key={i} value={pair2[i]} onChange={e => setPair2(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                style={{ flex: 1, background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", padding: "8px 6px", fontSize: 11 }}>
                <option value="">Player {i + 1}</option>
                {available(pair2[i]).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ))}
          </div>
        </div>
        {!allUnique && taken.length === 4 && <div style={{ fontSize: 11, color: "#F87171", marginBottom: 12 }}>⚠ Each player can only appear once</div>}
        <button onClick={() => { if (allSelected && allUnique) onAdd({ pair1, pair2, score1: parseInt(score1), score2: parseInt(score2) }); }}
          disabled={!allSelected || !allUnique || loading}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: allSelected && allUnique && !loading ? "#4ADE80" : "rgba(255,255,255,0.06)", color: allSelected && allUnique && !loading ? "#080b10" : "rgba(255,255,255,0.2)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>
          {loading ? "SAVING..." : "CONFIRM MATCH"}
        </button>
      </div>
    </div>
  );
}

function AddSessionModal({ onAdd, onClose, loading }) {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const [label, setLabel] = useState(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#111620", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#e2e8f0" }}>New Session</div>
        <input value={label} onChange={e => setLabel(e.target.value)}
          style={{ width: "100%", background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", padding: "10px 12px", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
        <button onClick={() => label.trim() && onAdd(label)} disabled={!label.trim() || loading}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: label.trim() && !loading ? "#60A5FA" : "rgba(255,255,255,0.06)", color: label.trim() && !loading ? "#080b10" : "rgba(255,255,255,0.2)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>
          {loading ? "CREATING..." : "CREATE SESSION"}
        </button>
      </div>
    </div>
  );
}

export default function ClubMatchLog() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [view, setView] = useState("matches");
  const [loadingData, setLoadingData] = useState(true);
  const [savingMatch, setSavingMatch] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const { data: sessionsData, error: sErr } = await supabase.from("sessions").select("*").order("created_at", { ascending: false });
      if (sErr) throw sErr;
      const { data: matchesData, error: mErr } = await supabase.from("matches").select("*").order("created_at", { ascending: true });
      if (mErr) throw mErr;
      const combined = (sessionsData || []).map(s => ({
        ...s,
        matches: (matchesData || []).filter(m => m.session_id === s.id),
      }));
      setSessions(combined);
      if (combined.length > 0) setActiveSessionId(prev => prev || combined[0].id);
    } catch (e) {
      setError("Failed to load. Check your Supabase config.");
    }
    setLoadingData(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const channel = supabase.channel("club-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, loadData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadData]);

  const addSession = async (label) => {
    setSavingSession(true);
    const { data, error } = await supabase.from("sessions").insert([{ label }]).select().single();
    if (!error && data) { setActiveSessionId(data.id); setShowAddSession(false); await loadData(); }
    setSavingSession(false);
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm("Delete this entire session and all its matches?")) return;
    await supabase.from("matches").delete().eq("session_id", sessionId);
    await supabase.from("sessions").delete().eq("id", sessionId);
    setActiveSessionId(null);
    await loadData();
  };

  const deleteMatch = async (matchId) => {
    if (!window.confirm("Delete this match?")) return;
    await supabase.from("matches").delete().eq("id", matchId);
    await loadData();
  };

  const addMatch = async (matchData) => {
    if (!activeSessionId) return;
    setSavingMatch(true);
    await supabase.from("matches").insert([{ session_id: activeSessionId, ...matchData }]);
    setShowAddMatch(false);
    await loadData();
    setSavingMatch(false);
  };

  const fines = getFines(sessions);
  const sortedFines = Object.entries(fines).sort((a, b) => b[1] - a[1]);
  const totalFines = Object.values(fines).reduce((a, b) => a + b, 0);
  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div style={{ minHeight: "100vh", background: "#080b10", color: "#e2e8f0", fontFamily: "Georgia, serif", padding: "20px 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 5, color: "#4ADE80", marginBottom: 6, fontFamily: "monospace" }}>🎾 CLUB MATCH LOG</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>Club Sessions</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, fontFamily: "monospace" }}>Tue & Thu · 10k/player per loss · 10k each on draw</div>
        </div>

        {error && <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#F87171" }}>⚠ {error}</div>}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["matches", "fines"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", background: view === v ? "#e2e8f0" : "rgba(255,255,255,0.06)", color: view === v ? "#080b10" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, fontFamily: "monospace", letterSpacing: 1 }}>
              {v === "matches" ? "📋 MATCHES" : "💰 FINES"}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 12, letterSpacing: 2 }}>LOADING...</div>
        ) : view === "matches" ? (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
              {sessions.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => setActiveSessionId(s.id)} style={{ padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: activeSessionId === s.id ? "#60A5FA" : "rgba(255,255,255,0.05)", color: activeSessionId === s.id ? "#080b10" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                    {s.label}
                  </button>
                  <button onClick={() => deleteSession(s.id)} style={{ padding: "5px 7px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(248,113,113,0.1)", color: "#F87171", fontSize: 11, lineHeight: 1 }}>✕</button>
                </div>
              ))}
              <button onClick={() => setShowAddSession(true)} style={{ padding: "7px 14px", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                + New Session
              </button>
            </div>

            {activeSession ? (
              <>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 14, fontFamily: "monospace" }}>
                  {activeSession.matches.length} match{activeSession.matches.length !== 1 ? "es" : ""} · {activeSession.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeSession.matches.map((match, idx) => {
                    const result = getResult(match.score1, match.score2);
                    const isDraw = result === "draw";
                    return (
                      <div key={match.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>MATCH {idx + 1}{isDraw ? " · 🤝 DRAW" : ""}</div><button onClick={() => deleteMatch(match.id)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, color: "#F87171", fontSize: 10, padding: "3px 8px", cursor: "pointer", fontFamily: "monospace" }}>✕ delete</button></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            {match.pair1.map(p => (
                              <div key={p} style={{ fontSize: 13, fontWeight: result === "pair1" ? 700 : 400, color: result === "pair1" ? "#4ADE80" : isDraw ? "#FDE047" : "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                                {result === "pair1" ? "🏆 " : "💸 "}{p}
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 26, fontWeight: 900, color: result === "pair1" ? "#4ADE80" : isDraw ? "#FDE047" : "rgba(255,255,255,0.4)" }}>{match.score1}</span>
                            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }}>—</span>
                            <span style={{ fontSize: 26, fontWeight: 900, color: result === "pair2" ? "#4ADE80" : isDraw ? "#FDE047" : "rgba(255,255,255,0.4)" }}>{match.score2}</span>
                          </div>
                          <div style={{ flex: 1, textAlign: "right" }}>
                            {match.pair2.map(p => (
                              <div key={p} style={{ fontSize: 13, fontWeight: result === "pair2" ? 700 : 400, color: result === "pair2" ? "#4ADE80" : isDraw ? "#FDE047" : "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                                {p}{result === "pair2" ? " 🏆" : " 💸"}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", display: "flex", justifyContent: "space-between" }}>
                          <span>{isDraw ? "All 4 players fined 10k each" : "Losers pay 10k each"}</span>
                          <span style={{ color: "#FB923C" }}>{isDraw ? "40k total" : "20k total"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div onClick={() => setShowAddMatch(true)} style={{ marginTop: 12, border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 14, padding: "16px", textAlign: "center", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: "monospace", letterSpacing: 1 }}>
                  + LOG MATCH
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 12 }}>
                No sessions yet — tap "+ New Session" to start
              </div>
            )}
          </>
        ) : (
          <div>
            <div style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#FB923C", fontFamily: "monospace" }}>TOTAL FINES COLLECTED</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#FB923C", marginTop: 4 }}>{formatVND(totalFines)}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4, fontFamily: "monospace" }}>across all sessions</div>
              </div>
              <div style={{ fontSize: 36 }}>💰</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sortedFines.map(([name, amount], idx) => (
                <div key={name} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${amount > 0 ? "rgba(251,146,60,0.15)" : "rgba(255,255,255,0.05)"}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: idx === 0 && amount > 0 ? "rgba(251,146,60,0.2)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: amount > 0 ? 600 : 400 }}>{name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 2, fontFamily: "monospace" }}>{amount > 0 ? `${amount / 10000} loss${amount / 10000 > 1 ? "es" : ""}` : "clean record ✨"}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: amount > 0 ? "#FB923C" : "#4ADE80" }}>{amount > 0 ? `−${formatVND(amount)}` : "0đ"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showAddMatch && <AddMatchModal onAdd={addMatch} onClose={() => setShowAddMatch(false)} loading={savingMatch} />}
      {showAddSession && <AddSessionModal onAdd={addSession} onClose={() => setShowAddSession(false)} loading={savingSession} />}
    </div>
  );
}
