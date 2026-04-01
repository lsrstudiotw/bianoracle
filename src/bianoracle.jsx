import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================================
// Supabase Configuration
// ============================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ============================================================================
// Constants & Context
// ============================================================================
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const TAROT_DECK = [
  "愚者","魔術師","女祭司","皇后","皇帝","教皇","戀人","戰車","力量","隱者",
  "命運之輪","正義","倒吊人","死神","節制","惡魔","高塔","星星","月亮","太陽",
  "審判","世界",
  "權杖一","權杖二","權杖三","權杖四","權杖五","權杖六","權杖七","權杖八","權杖九","權杖十","權杖侍者","權杖騎士","權杖皇后","權杖國王",
  "聖杯一","聖杯二","聖杯三","聖杯四","聖杯五","聖杯六","聖杯七","聖杯八","聖杯九","聖杯十","聖杯侍者","聖杯騎士","聖杯皇后","聖杯國王",
  "寶劍一","寶劍二","寶劍三","寶劍四","寶劍五","寶劍六","寶劍七","寶劍八","寶劍九","寶劍十","寶劍侍者","寶劍騎士","寶劍皇后","寶劍國王",
  "錢幣一","錢幣二","錢幣三","錢幣四","錢幣五","錢幣六","錢幣七","錢幣八","錢幣九","錢幣十","錢幣侍者","錢幣騎士","錢幣皇后","錢幣國王"
];

const SYSTEM_PROMPT = `你是「彼岸解惑」的命理大師，融合紫微斗數與塔羅牌，為案主提供一場深度的私人命理諮詢。

## 你的身份
你不是機器人，你是一位在深夜關東煮店駐場的神祕命理師。你的語氣溫暖但精準，像一位洞察人心的老朋友。你說的每一句話都要讓案主感到「你真的看到了我」。

## 風格原則
- 不要說教，要說故事。用案主的命盤和牌面「說故事」，讓他們在故事中看到自己。
- 不要泛論，要精準。避免「保持正面心態」這種空話，給出具體到「這週可以做什麼」的建議。
- 不要冷漠，要溫柔。你是在深夜陪一個需要方向的人聊天，不是在寫報告。
- 適度使用紫微術語（如「命宮」「遷移宮」），但每個術語後面都要用白話解釋。
- 塔羅解讀要結合案主的具體問題，不要只是照本宣科念牌義。
- 回答控制在 800-1200 字。

## 解讀結構（必須嚴格遵守此順序）

### 1. 命盤人格素描（150字）
根據生辰排紫微命盤，描述案主的性格核心。要像在描述一個活生生的人，不是在唸課本。讓案主讀完覺得「天啊，這就是我」。

### 2. 塔羅三牌解讀（250字）
解讀過去/現在/未來三張牌：
- **過去**：你經歷了什麼，是什麼塑造了現在的你
- **現在**：你正站在什麼樣的十字路口
- **未來**：如果順應能量，前方會出現什麼
每張牌的解讀要結合案主的問題，不要平鋪直敘。

### 3. 命命運交叉點（200字）
這是整篇解讀的精華。找出紫微命盤的先天定數與塔羅牌面揭示的後天變數之間的「交叉點」——那個讓案主目前卡住的核心原因。用一個洞察點破。

### 4. 本週行動處方（200字）
給出 3 個具體、可執行的行動建議。必須具體到「什麼時候」「做什麼」「跟誰」的程度。
例如：
- ✅「這週找一個你信任的朋友，把你心裡那個『但是⋯⋯』說出來」
- ✅「今晚回家後，花 10 分鐘把腦中最大的擔憂寫在紙上，然後摺起來收好」
- ❌「建議保持正面心態」（這是廢話，禁止出現）
- ❌「順其自然」（太空泛，禁止出現）

### 5. 送給你的一句話（50字以內）
用一句溫暖、有力量的話作為結尾。像是命理師在案主離開前，輕輕說的最後一句話。這句話要讓人想截圖保存。

⚠️【重要指示】必須在整篇解讀的最後，獨立空一行並以「【IG摘要】」為標題，嚴格給出3句話的精華摘要。
【IG摘要】
1. （第一句具體建議，限15字以內）
2. （第二句具體建議，限15字以內）
3. （一句溫暖有力量的話，限15字以內）

## 紫微排盤要點
- 甲(廉破武陽) 乙(機梁紫陰) 丙(同機昌廉) 丁(陰同機巨) 戊(貪陰右機) 己(武貪梁曲) 庚(陽武陰同) 辛(巨陽曲昌) 壬(梁紫左武) 癸(破巨陰貪)

## 塔羅解讀
- 正位＝能量順暢，牌面意義正常發揮
- 逆位＝能量受阻或需要反思（不等於壞事，是宇宙在提醒你換個角度看）`;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================================
// Main Application Component
// ============================================================================
const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=台北市信義區吳興街577號";
const HOURS = ["子時 (23:00-01:00)", "丑時 (01:00-03:00)", "寅時 (03:00-05:00)", "卯時 (05:00-07:00)", "辰時 (07:00-09:00)", "巳時 (09:00-11:00)", "午時 (11:00-13:00)", "未時 (13:00-15:00)", "申時 (15:00-17:00)", "酉時 (17:00-19:00)", "戌時 (19:00-21:00)", "亥時 (21:00-23:00)", "不確定"];
const LOADING_MSGS = ["共鳴宇宙能量中⋯⋯", "排列星盤與牌陣⋯⋯", "紫微與塔羅正在交叉比對⋯⋯", "深夜的答案即將浮現⋯⋯"];

export default function BianOracle() {
  const [step, setStep] = useState(-1);
  const [redeemCode, setRedeemCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthHour, setBirthHour] = useState("");
  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [orientations, setOrientations] = useState({});
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [showShareCard, setShowShareCard] = useState(false);
  const resultRef = useRef(null);
  const bottomRef = useRef(null);
  const shareCardRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      setRedeemCode(codeFromUrl);
    }
  }, []);

  useEffect(() => {
    if (!loading) return;
    const iv = setInterval(() => setLoadingMsg(p => (p + 1) % LOADING_MSGS.length), 3000);
    return () => clearInterval(iv);
  }, [loading]);

  useEffect(() => {
    if (streaming && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [result, streaming]);

  const handleVerify = async () => {
    const c = redeemCode.trim().toUpperCase();
    if (c === "BIANTEST" || c === "BIAN2798") {
      setStep(1); setCodeError(""); return;
    }
    if (!supabase) {
      setCodeError("系統尚未連結驗證資料庫，無法驗證此碼"); return;
    }
    try {
      const { data, error } = await supabase.from('codes').select('*').eq('code', c).single();
      if (error || !data) {
        setCodeError("❌ 兌換碼無效或不存在"); return;
      }
      if (data.used) {
        setCodeError("⚠️ 該兌換碼已經被使用了"); return;
      }
      const { error: updateError } = await supabase.from('codes').update({ used: true, used_at: new Date().toISOString() }).eq('id', data.id);
      if (updateError) {
        setCodeError("連線不穩，請稍後再試"); return;
      }
      setStep(1); setCodeError("");
    } catch (e) {
      setCodeError("系統驗證發生錯誤，請稍後再試");
    }
  };

  useEffect(() => {
    if (shuffledDeck.length === 0) {
      setShuffledDeck(shuffle([...Array(78).keys()]));
    }
  }, []);

  const maxSelectCount = 3;
  const positions = ["過去", "現在", "未來"];
  const deckSource = TAROT_DECK;
  const sysNameInfo = "紫微斗數 × 塔羅牌";

  const handleCardClick = useCallback((deckIdx) => {
    const cardIdx = shuffledDeck[deckIdx];
    if (selectedCards.includes(cardIdx)) {
      setSelectedCards(p => p.filter(c => c !== cardIdx));
      setFlippedCards(p => { const n = new Set(p); n.delete(deckIdx); return n; });
      return;
    }
    if (selectedCards.length >= maxSelectCount) return;
    setFlippedCards(p => new Set(p).add(deckIdx));
    setSelectedCards(p => [...p, cardIdx]);
    setOrientations(p => ({ ...p, [cardIdx]: Math.random() > 0.5 ? "正位" : "逆位" }));
  }, [shuffledDeck, selectedCards, maxSelectCount]);

  const canStep1 = birthYear && birthMonth && birthDay && birthHour;
  const canStep2 = question.trim().length > 0;
  const canStep3 = selectedCards.length === maxSelectCount;

  const doReading = async () => {
    setLoading(true); setStreaming(false); setStep(4); setResult("");
    const birthInfo = `國曆 ${birthYear}年${birthMonth}月${birthDay}日 ${birthHour}`;
    const cardsInfo = selectedCards.map((ci, i) => `${positions[i]}：${deckSource[ci]}（${orientations[ci]}）`).join("\n");
    const userMsg = `請為我進行【紫微斗數 × 塔羅牌】雙系統解讀。\n\n【生辰】${birthInfo}\n【抽牌結果】\n${cardsInfo}\n【問題】${question}\n\n請依照解讀結構完整回覆。`;
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_PROMPT,
      });
      const response = await model.generateContentStream(userMsg);
      setLoading(false); setStreaming(true);
      let accumulated = "";
      for await (const chunk of response.stream) {
        const chunkText = chunk.text();
        accumulated += chunkText;
        setResult(accumulated);
      }
      setStreaming(false);
    } catch (e) {
      console.error(e);
      setResult("連線發生問題或額度用盡，請確認網路後再試一次。");
      setLoading(false); setStreaming(false);
    }
  };

  const years = Array.from({ length: 80 }, (_, i) => 2026 - i);
  const mons = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysList = Array.from({ length: 31 }, (_, i) => i + 1);

  const S = {
    app: { minHeight: "100vh", background: "#0a0e1a", color: "#e8dcc8", fontFamily: "'Noto Serif TC', serif", position: "relative", overflowX: "hidden" },
    noise: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, pointerEvents: "none", zIndex: 0 },
    wrap: { maxWidth: 480, margin: "0 auto", padding: "20px 20px 40px", position: "relative", zIndex: 1 },
    header: { textAlign: "center", padding: "40px 0 20px" },
    shopName: { fontSize: 14, letterSpacing: 6, color: "#8a7a62", marginBottom: 8 },
    title: { fontSize: 36, fontWeight: 700, letterSpacing: 4, background: "linear-gradient(135deg, #c9a96e 0%, #f0d8a0 50%, #c9a96e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 },
    sub: { fontSize: 13, color: "#6a6050", letterSpacing: 2 },
    divLine: { width: 60, height: 1, background: "linear-gradient(90deg, transparent, #c9a96e, transparent)", margin: "24px auto" },
    dots: { display: "flex", justifyContent: "center", gap: 12, marginBottom: 32 },
    dot: (a, d) => ({ width: 10, height: 10, borderRadius: "50%", background: d ? "#c9a96e" : a ? "#c9a96e" : "#2a2a3a", border: a ? "2px solid #f0d8a0" : "2px solid #3a3a4a", transition: "all 0.4s", boxShadow: a ? "0 0 12px rgba(201,169,110,0.4)" : "none" }),
    label: { fontSize: 13, color: "#8a7a62", marginBottom: 8, letterSpacing: 1 },
    inp: { width: "100%", padding: "14px 16px", fontSize: 16, background: "rgba(255,255,255,0.04)", border: "1px solid #2a2520", borderRadius: 8, color: "#e8dcc8", outline: "none", fontFamily: "'Noto Serif TC',serif", boxSizing: "border-box" },
    sel: { flex: 1, padding: "14px 12px", fontSize: 15, background: "rgba(255,255,255,0.04)", border: "1px solid #2a2520", borderRadius: 8, color: "#e8dcc8", outline: "none", fontFamily: "'Noto Serif TC',serif", appearance: "none" },
    ta: { width: "100%", padding: "14px 16px", fontSize: 15, minHeight: 100, background: "rgba(255,255,255,0.04)", border: "1px solid #2a2520", borderRadius: 8, color: "#e8dcc8", outline: "none", resize: "vertical", fontFamily: "'Noto Serif TC',serif", boxSizing: "border-box" },
    btn: (dis) => ({ width: "100%", padding: "16px 0", fontSize: 16, fontWeight: 600, letterSpacing: 3, border: "none", borderRadius: 8, cursor: dis ? "not-allowed" : "pointer", background: dis ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #c9a96e 0%, #a8873e 100%)", color: dis ? "#555" : "#0a0e1a", fontFamily: "'Noto Serif TC',serif", opacity: dis ? 0.5 : 1, marginTop: 24 }),
    card: (sel, flip) => ({ aspectRatio: "2/3", borderRadius: 6, cursor: "pointer", border: sel ? "2px solid #c9a96e" : "1px solid rgba(201,169,110,0.12)", background: flip ? "linear-gradient(135deg, #1a1530, #2a1f40)" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: flip ? 8 : 16, textAlign: "center", transition: "all 0.35s ease", boxShadow: sel ? "0 0 16px rgba(201,169,110,0.4)" : flip ? "none" : "0 1px 4px rgba(0,0,0,0.3)", color: flip ? "#c9a96e" : "#3a3550", padding: 0, lineHeight: 1.2, overflow: "hidden", position: "relative" }),
    sc: { display: "flex", gap: 12, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" },
    scard: { background: "linear-gradient(135deg, #1a1530, #2a1f45)", border: "1px solid #c9a96e", borderRadius: 10, padding: "12px 16px", textAlign: "center", minWidth: 90 },
    scPos: { fontSize: 11, color: "#8a7a62", marginBottom: 4, letterSpacing: 2 },
    scName: { fontSize: 14, color: "#f0d8a0", fontWeight: 600 },
    tog: { display: "flex", gap: 6, marginTop: 6, justifyContent: "center" },
    togBtn: (a) => ({ padding: "4px 12px", fontSize: 12, borderRadius: 4, cursor: "pointer", border: "1px solid #3a3a4a", background: a ? "rgba(201,169,110,0.2)" : "transparent", color: a ? "#f0d8a0" : "#6a6050", fontFamily: "'Noto Serif TC',serif" }),
    res: { background: "rgba(255,255,255,0.02)", border: "1px solid #2a2520", borderRadius: 12, padding: "28px 22px", marginTop: 20, lineHeight: 1.9, fontSize: 15 },
    cursor: { display: "inline-block", width: 2, height: 16, background: "#c9a96e", marginLeft: 2, animation: "blink 1s step-end infinite", verticalAlign: "text-bottom" },
    shareBtn: { width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 600, letterSpacing: 2, border: "1px solid #c9a96e", borderRadius: 8, cursor: "pointer", background: "rgba(201,169,110,0.08)", color: "#c9a96e", fontFamily: "'Noto Serif TC',serif", marginTop: 16 },
    cta: { marginTop: 28, textAlign: "center", background: "rgba(201,169,110,0.04)", border: "1px solid rgba(201,169,110,0.15)", borderRadius: 12, padding: "28px 20px" },
    ctaT: { fontSize: 18, fontWeight: 600, color: "#c9a96e", letterSpacing: 2, marginBottom: 12 },
    ctaA: { fontSize: 13, color: "#6a6050", lineHeight: 1.8, marginBottom: 16 },
    ctaMap: { display: "inline-block", padding: "12px 32px", fontSize: 14, fontWeight: 600, letterSpacing: 2, background: "linear-gradient(135deg, #c9a96e, #a8873e)", color: "#0a0e1a", borderRadius: 8, textDecoration: "none", fontFamily: "'Noto Serif TC',serif" },
    rstBtn: { background: "none", border: "1px solid #3a3a4a", borderRadius: 8, color: "#6a6050", padding: "10px 28px", fontSize: 13, cursor: "pointer", fontFamily: "'Noto Serif TC',serif", letterSpacing: 2, marginTop: 20 },
    ember: () => ({ position: "fixed", width: 3, height: 3, borderRadius: "50%", background: "#c9a96e", opacity: 0.15 + Math.random() * 0.15, left: `${10 + Math.random() * 80}%`, bottom: -10, animation: `floatUp ${8 + Math.random() * 6}s linear infinite`, animationDelay: `${Math.random() * 8}s`, pointerEvents: "none", zIndex: 0 }),
  };

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&display=swap');
@keyframes floatUp{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:0.2}90%{opacity:0.15}100%{transform:translateY(-100vh) translateX(30px);opacity:0}}
@keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes cardFlip{0%{transform:rotateY(0deg)}50%{transform:rotateY(90deg)}100%{transform:rotateY(0deg)}}
.tarot-grid{grid-template-columns:repeat(6,1fr); display:grid; gap:6px;}
@media(min-width:420px){.tarot-grid{grid-template-columns:repeat(8,1fr);}}
@media(min-width:560px){.tarot-grid{grid-template-columns:repeat(10,1fr);}}
@media(min-width:700px){.tarot-grid{grid-template-columns:repeat(13,1fr);}}
.tarot-card{transition:all 0.35s ease;transform-style:preserve-3d;}
.tarot-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(201,169,110,0.2) !important;}
.tarot-card.flipping{animation:cardFlip 0.45s ease;}
@keyframes cardIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
.bcard{transition:all 0.35s ease;transform-origin:center}
.bcard:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(201,169,110,0.2) !important;border-color:rgba(201,169,110,0.4) !important}
input:focus,textarea:focus,select:focus{border-color:#c9a96e !important}
select option{background:#1a1530;color:#e8dcc8}
::selection{background:rgba(201,169,110,0.3)}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a2520;border-radius:2px}`;

  const isFinished = step === 4 && !loading && !streaming && result;
  const restart = () => {
    setStep(-1);
    setBirthYear(""); setBirthMonth(""); setBirthDay(""); setBirthHour("");
    setSelectedCards([]); setOrientations({}); setFlippedCards(new Set());
    setShuffledDeck(shuffle([...Array(78).keys()]));
    setQuestion(""); setResult(""); setLoading(false); setStreaming(false); setShowShareCard(false);
  };

  return (
    <div style={S.app}>
      <style>{css}</style>
      <div style={S.noise} />
      {Array.from({ length: 8 }).map((_, i) => <div key={i} style={S.ember()} />)}

      <div style={S.wrap}>
        <div style={S.header}>
          <div style={S.shopName}>彼岸關東煮</div>
          <div style={S.title}>彼岸解惑</div>
          <div style={S.sub}>{step >= 1 ? sysNameInfo : "專屬您的深夜命理"}</div>
          <div style={S.divLine} />
        </div>

        {step === -1 && (
          <div style={{ textAlign: "center", padding: "24px 0", animation: "fadeIn 0.5s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.7 }}>🎴</div>
            <div style={{ fontSize: 14, color: "#8a7a62", lineHeight: 1.8, marginBottom: 24 }}>集滿 6 點的貴客專屬<br />請輸入兌換碼開啟解惑</div>
            <input style={{ ...S.inp, textAlign: "center", fontSize: 20, letterSpacing: 4 }} placeholder="輸入兌換碼" value={redeemCode} onChange={e => { setRedeemCode(e.target.value); setCodeError(""); }} onKeyDown={e => e.key === "Enter" && handleVerify()} />
            <div style={{ fontSize: 13, color: "#c06060", marginTop: 8, minHeight: 20 }}>{codeError}</div>
            <button style={S.btn(!redeemCode.trim())} disabled={!redeemCode.trim()} onClick={handleVerify}>驗證兌換碼</button>
          </div>
        )}

        {step >= 1 && <div style={S.dots}>{[1, 2, 3, 4].map(i => <div key={i} style={S.dot(step === i, step > i)} />)}</div>}

        {step === 1 && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={S.label}>出生年</div>
            <select style={S.sel} value={birthYear} onChange={e => setBirthYear(e.target.value)}><option value="">選擇年份</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
            <div style={{ height: 14 }} />
            <div style={S.label}>出生月日</div>
            <div style={{ display: "flex", gap: 10 }}>
              <select style={S.sel} value={birthMonth} onChange={e => setBirthMonth(e.target.value)}><option value="">月</option>{mons.map(m => <option key={m} value={m}>{m}月</option>)}</select>
              <select style={S.sel} value={birthDay} onChange={e => setBirthDay(e.target.value)}><option value="">日</option>{daysList.map(d => <option key={d} value={d}>{d}日</option>)}</select>
            </div>
            <div style={{ height: 14 }} />
            <div style={S.label}>出生時辰（紫微排盤需要）</div>
            <select style={S.sel} value={birthHour} onChange={e => setBirthHour(e.target.value)}><option value="">選擇時辰</option>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select>
            <button style={S.btn(!canStep1)} disabled={!canStep1} onClick={() => setStep(2)}>下一步 ─ 提問</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={S.label}>你想問什麼？</div>
            <textarea style={S.ta} placeholder="例如：最近事業發展方向、感情困惑、今年運勢⋯⋯問題越具體，解讀越精準。帶著問題的意念去抽卡，更能感應宇宙的指引。" value={question} onChange={e => setQuestion(e.target.value)} />
            <button style={S.btn(!canStep2)} disabled={!canStep2} onClick={() => setStep(3)}>下一步 ─ 帶著問題抽牌</button>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, color: "#c9a96e", marginBottom: 4 }}>帶著你的問題，憑直覺點選 {maxSelectCount} 個指引</div>
              <div style={{ fontSize: 12, color: "#6a6050" }}>依序對應：{positions.join(" → ")}（點擊可取消）</div>
            </div>
            {selectedCards.length > 0 && (
              <div style={S.sc}>
                {selectedCards.map((c, i) => (
                  <div key={i} style={{ ...S.scard, animation: "cardIn 0.5s ease forwards" }}>
                    <div style={S.scPos}>{positions[i]}</div>
                    <div style={S.scName}>{deckSource[c]}</div>
                    <div style={S.tog}>
                      <div style={S.togBtn(orientations[c] === "正位")}>正位</div>
                      <div style={S.togBtn(orientations[c] === "逆位")}>逆位</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="tarot-grid">
              {shuffledDeck.map((_, i) => (
                <button key={i} className={`tarot-card ${flippedCards.has(i) ? 'flipping' : ''}`} style={S.card(selectedCards.includes(shuffledDeck[i]), flippedCards.has(i))} onClick={() => handleCardClick(i)}>
                  {flippedCards.has(i) ? deckSource[shuffledDeck[i]] : "?"}
                </button>
              ))}
            </div>
            <div style={{ height: 20 }} />
            <button style={S.btn(!canStep3)} disabled={!canStep3} onClick={doReading}>開始深度解讀</button>
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: "fadeIn 0.6s ease" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 20, animation: "pulse 2s infinite" }}>🏮</div>
                <div style={{ fontSize: 18, color: "#c9a96e", letterSpacing: 4, marginBottom: 12 }}>{LOADING_MSGS[loadingMsg]}</div>
                <div style={{ fontSize: 13, color: "#6a6050" }}>大師正在為您感應時空因果...</div>
              </div>
            ) : (
              <div style={{ animation: "fadeIn 0.5s ease" }}>
                <div style={S.res} ref={resultRef}>
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {result}
                    {streaming && <span style={S.cursor} />}
                  </div>
                </div>
                <div ref={bottomRef} style={{ height: 1 }} />
                {isFinished && (
                  <div style={{ animation: "fadeIn 0.8s ease" }}>
                    <button style={S.shareBtn} onClick={() => setShowShareCard(true)}>📸 產生 IG 分享小卡</button>
                    <div style={S.cta}>
                      <div style={S.ctaT}>宵夜還沒吃飽？</div>
                      <div style={S.ctaA}>帶著大師的指引，來現領一份暖心的關東煮吧。</div>
                      <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" style={S.ctaMap}>前往「彼岸」實體店</a>
                    </div>
                    <div style={{ textAlign: "center", marginTop: 32 }}>
                      <button style={S.rstBtn} onClick={restart}>結束諮詢並返回首頁</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showShareCard && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowShareCard(false)}>
            <div className="bcard" style={{ background: "#0d111d", border: "1px solid #c9a96e", borderRadius: 16, padding: 32, maxWidth: 360, width: "100%", position: "relative", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()} ref={shareCardRef}>
              <div style={{ textAlign: "center", marginBottom: 24, borderBottom: "1px solid rgba(201,169,110,0.2)", paddingBottom: 16 }}>
                <div style={{ fontSize: 12, letterSpacing: 4, color: "#8a7a62", marginBottom: 8 }}>彼岸解惑 ─ 十字路口的指引</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#f0d8a0" }}>深夜的行動處方</div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: "#8a7a62", marginBottom: 12, textAlign: "center" }}>【 本次諮詢精華 】</div>
                {result.includes('【IG摘要】') ? (
                  result.split('【IG摘要】')[1].trim().split('\n').map((line, idx) => (
                    <div key={idx} style={{ color: "#e8dcc8", fontSize: 16, marginBottom: 12, lineHeight: 1.6, display: "flex", gap: 10 }}>
                      <span style={{ color: "#c9a96e" }}>{line.startsWith(idx + 1) ? '' : idx + 1 + '.'}</span>
                      <span>{line.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#e8dcc8", fontSize: 15, lineHeight: 1.6, textAlign: "center" }}>人生沒有標準答案<br />只有你當下的選擇。</div>
                )}
              </div>
              <div style={{ textAlign: "center", marginTop: 32, borderTop: "1px solid rgba(201,169,110,0.1)", paddingTop: 20 }}>
                <div style={{ fontSize: 12, color: "#6a6050", marginBottom: 8 }}>掃描尋找你的彼岸</div>
                <div style={{ display: "inline-block", padding: 8, background: "#fff", borderRadius: 4 }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('https://bianoracle.vercel.app')}`} alt="QR" style={{ display: "block" }} />
                </div>
              </div>
              <div style={{ fontSize: 10, color: "#3a3a4a", textAlign: "center", marginTop: 20 }}>Bian Oracle @ LSR Studio</div>
            </div>
            <div style={{ position: "absolute", bottom: 40, color: "#fff", fontSize: 14 }}>點擊背景關閉</div>
          </div>
        )}
      </div>
    </div>
  );
}
