import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toJpeg } from "html-to-image";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ============================================================================
// Constants & Context
// ============================================================================
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const TAROT_DECK = [
  "愚者","魔術師","女祭司","皇后","皇帝","教皇","戀人","戰車","力量","隱者",
  "命運之輪","正義","倒吊人","死神","節制","惡魔","塔","星星","月亮","太陽","審判","世界",
  "權杖Ace","權杖二","權杖三","權杖四","權杖五","權杖六","權杖七","權杖八","權杖九","權杖十",
  "權杖侍者","權杖騎士","權杖皇后","權杖國王",
  "聖杯Ace","聖杯二","聖杯三","聖杯四","聖杯五","聖杯六","聖杯七","聖杯八","聖杯九","聖杯十",
  "聖杯侍者","聖杯騎士","聖杯皇后","聖杯國王",
  "寶劍Ace","寶劍二","寶劍三","寶劍四","寶劍五","寶劍六","寶劍七","寶劍八","寶劍九","寶劍十",
  "寶劍侍者","寶劍騎士","寶劍皇后","寶劍國王",
  "錢幣Ace","錢幣二","錢幣三","錢幣四","錢幣五","錢幣六","錢幣七","錢幣八","錢幣九","錢幣十",
  "錢幣侍者","錢幣騎士","錢幣皇后","錢幣國王"
];
const ICHING_HEXAGRAMS = [
  "乾為天","坤為地","水雷屯","山水蒙","水天需","天水訟","地水師","水地比","風天小畜","天澤履",
  "地天泰","天地否","天火同人","火天大有","地山謙","雷地豫","澤雷隨","山風蠱","地澤臨","風地觀",
  "火雷噬嗑","山火賁","山地剝","地雷復","天雷無妄","山天大畜","山雷頤","澤風大過","坎為水","離為火",
  "澤山咸","雷風恆","天山遯","雷天大壯","火地晉","地火明夷","風火家人","火澤睽","水山蹇","雷水解",
  "山澤損","風雷益","澤天夬","天風姤","澤地萃","地風升","澤水困","水風井","澤火革","火風鼎",
  "震為雷","艮為山","風山漸","雷澤歸妹","雷火豐","火山旅","巽為風","兌為澤","風水渙","水澤節",
  "風澤中孚","雷山小過","水火既濟","火水未濟"
];

const PROMPT_EAST = `你是「彼岸解惑」的命理大師，結合紫微斗數與易經卜卦（東方哲學霸主）為人解惑。
## 風格
- 語言古樸、威嚴而蘊含禪機，像一位隱世的高人
- 適度使用易理與紫微術語，隨即用白話文精闢點出核心
- 點出運勢走向的「關鍵時機」與「因果轉折」
- 回答控制在 800-1200 字

## 解讀結構
1. **命盤速寫**（150字）：根據生辰排紫微命盤，專注於命宮格局的特徵。
2. **易經雙卦解讀**（200字）：解讀本卦（代表現狀與本質）與變卦（代表未來與變數），理出破局之道。
3. **東方哲學交叉**（200字）：將紫微先天定數，與易經的後天變數（卦辭寓意）結合。
4. **決策錦囊**（300字）：給出3條具體、可執行的對策。

⚠️【重要指示】必須在整篇解讀的最後，獨立空一行並以「【IG摘要】」為標題，嚴格給出3句話的精華摘要。
【IG摘要】
1. （第一句具體建議，限15字以內）
2. （第二句具體建議，限15字以內）
3. （一語道破的天機或溫暖祝福，限15字以內）

## 紫微排盤要點
- 甲(廉破武陽) 乙(機梁紫陰) 丙(同機昌廉) 丁(陰同機巨) 戊(貪陰右機) 己(武貪梁曲) 庚(陽武陰同) 辛(巨陽曲昌) 壬(梁紫左武) 癸(破巨陰貪)`;

const PROMPT_WEST = `你是「彼岸解惑」的身心靈嚮導，結合人類圖與塔羅/禪卡（現代身心靈爆款）進行靈魂諮詢。
## 風格
- 語氣溫柔、理解且極具包容心，像一位充滿療癒感的心理諮商師
- 對人類圖的「內在權威」及塔羅的潛意識有深刻見解
- 從「能量運作」及「潛意識清理」的角度探討問題，重啟自信
- 回答控制在 800-1200 字

## 人類圖類型判斷規則（極重要，必須嚴格遵守）
人類圖有且僅有五種類型，判別方式如下（依出生日期的太陽位置與月亮位置對應閘門/通道）：
- **顯示者 (Manifestor)**：喉嚨中心有通道直接連接到意志力、情緒、或根部中心，但薦骨「未被定義」。特質：獨立發起、無需等待。內在權威通常是「情緒權威」或「脾直覺權威」。策略：告知。
- **生產者 (Generator)**：薦骨中心「有被定義」（亮著），且喉嚨中心沒有通道直連動力中心。特質：持久的生命力與工作爆發力。內在權威：「薦骨權威」（等待腸道的回應）。策略：等待回應。
- **顯示生產者 (Manifesting Generator)**：薦骨中心「有被定義」，同時喉嚨中心有通道直連到動力中心（薦骨/情緒/意志力/根部）。結合了顯示者的發起力與生產者的持久力。策略：等待回應後再告知。
- **投射者 (Projector)**：薦骨中心「未被定義」，且喉嚨中心沒有直連動力中心。特質：天生的引導者與管理者。策略：等待被邀請。
- **反映者 (Reflector)**：所有九大中心均「未被定義」（全空白），極為罕見（約1%人口）。特質：環境之鏡。策略：等待28天月亮週期。

⚠️ 如果無法100%確定案主的精確類型，請誠實告知「依據提供的出生時間推估，您較可能是X類型」，並簡述根據哪些線索推斷。絕對不可隨意猜測。「顯示者」和「顯示生產者」是完全不同的類型，千萬不可混淆。

## 人生角色 (Profile) 解讀（若案主有提供）
人生角色由兩個數字組成（如 1/3、4/6），代表人生學習與互動的模式：
- **1 爻（研究者）**：需要深入研究才安心，追求穩固基礎
- **2 爻（隱士）**：天賦異稟但需要被召喚，獨處時最有創造力
- **3 爻（實驗者/烈士）**：透過嘗試與錯誤學習，人生經驗豐富
- **4 爻（使者）**：靠人脈與關係網絡成功，影響力來自信任圈
- **5 爻（異端者）**：天生的問題解決者，容易被投射期待
- **6 爻（模範）**：人生分三階段（30前試錯→30-50屋頂觀察→50後成為榜樣）
若案主有提供 Profile，請在靈魂設計速寫中融入其人生角色的特質分析。

## 解讀結構
1. **靈魂設計速寫**（150字）：基於出生資料，依據上面的規則嚴格判定人類圖類型，並簡述其內在權威特質與人生策略。
2. **潛意識牌陣解讀**（200字）：解讀過去/現在/未來三張牌，作為案主潛意識歷程的反射。
3. **能量共振分析**（200字）：交叉對比人類圖天賦與塔羅點出的卡點，說明能量為何被堵塞。
4. **療癒行動方針**（300字）：給出3個「回歸內在權威」的具體行動方針。

⚠️【重要指示】必須在整篇解讀的最後，獨立空一行並以「【IG摘要】」為標題，嚴格給出3句話的精華摘要。
【IG摘要】
1. （第一句療癒行動，限15字以內）
2. （第二句覺察建議，限15字以內）
3. （第三句充滿靈性光芒的肯定語句，限15字以內）

## 塔羅解讀
- 正位＝能量順暢，逆位＝需要反思（不等於壞）`;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── I Ching hexagram line helpers ──
const ELEM_TRI = {天:'111',地:'000',水:'010',火:'101',雷:'100',風:'011',山:'001',澤:'110',
  乾:'111',坤:'000',坎:'010',離:'101',震:'100',巽:'011',艮:'001',兌:'110'};
function getHexLines(name) {
  let u, l;
  if (name.includes('為')) { u = l = ELEM_TRI[name[0]]; }
  else { u = ELEM_TRI[name[0]]; l = ELEM_TRI[name[1]]; }
  if (!u || !l) return [1,1,1,1,1,1];
  return [...u].reverse().concat([...l].reverse()).map(Number);
}

// ── Tarot suit helpers ──
function getTarotSuit(idx) {
  if (idx < 22) return 'major';
  if (idx < 36) return 'wands';
  if (idx < 50) return 'cups';
  if (idx < 64) return 'swords';
  return 'pentacles';
}
const SUIT_STYLE = {
  major:    { bg:'#1a1040', ac:'#c9a96e' },
  wands:    { bg:'#2a1510', ac:'#e8734a' },
  cups:     { bg:'#101a2a', ac:'#4a9ae8' },
  swords:   { bg:'#1a1a24', ac:'#b0b8d0' },
  pentacles:{ bg:'#1a2010', ac:'#7ac060' },
};

function renderMarkdown(text) {
  if (!text) return null;
  const elements = [];
  let key = 0;
  for (const line of text.split("\n")) {
    if (line.startsWith("## "))
      elements.push(<h2 key={key++} style={{fontSize:17,fontWeight:700,color:"#f0d8a0",marginTop:28,marginBottom:8,letterSpacing:1,borderBottom:"1px solid rgba(201,169,110,0.15)",paddingBottom:6}}>{renderInline(line.slice(3))}</h2>);
    else if (line.startsWith("### "))
      elements.push(<h3 key={key++} style={{fontSize:15,fontWeight:600,color:"#c9a96e",marginTop:18,marginBottom:6}}>{renderInline(line.slice(4))}</h3>);
    else if (line.trim() === "")
      elements.push(<div key={key++} style={{height:10}}/>);
    else
      elements.push(<p key={key++} style={{margin:"4px 0",lineHeight:1.9}}>{renderInline(line)}</p>);
  }
  return elements;
}

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{color:"#f0d8a0",fontWeight:600}}>{p.slice(2,-2)}</strong>
      : <span key={i}>{p}</span>
  );
}

// ============================================================================
// Main Application Component
// ============================================================================
const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=台北市信義區吳興街577號";
const HOURS = ["子時 (23:00-01:00)","丑時 (01:00-03:00)","寅時 (03:00-05:00)","卯時 (05:00-07:00)","辰時 (07:00-09:00)","巳時 (09:00-11:00)","午時 (11:00-13:00)","未時 (13:00-15:00)","申時 (15:00-17:00)","酉時 (17:00-19:00)","戌時 (19:00-21:00)","亥時 (21:00-23:00)","不確定"];
const LOADING_MSGS = ["共鳴宇宙能量中⋯⋯","排列星盤與牌陣⋯⋯","雙系統正在交叉比對⋯⋯","深夜的答案即將浮現⋯⋯"];

export default function BianOracle() {
  const [step, setStep] = useState(-1);
  const [systemType, setSystemType] = useState(null); // "EAST" or "WEST"
  const [redeemCode, setRedeemCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [hdType, setHdType] = useState("");
  const [hdAuthority, setHdAuthority] = useState("");
  const [hdProfile, setHdProfile] = useState("");
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

  // ── Auto-read redeem code from URL (?code=XXXX) ──
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
      setStep(0); setCodeError(""); return;
    }
    
    if (!supabase) {
      setCodeError("系統尚未連結驗證資料庫，無法驗證此碼"); return;
    }

    try {
      const { data, error } = await supabase
        .from('codes')
        .select('*')
        .eq('code', c)
        .single();
        
      if (error || !data) {
        setCodeError("❌ 兌換碼無效或不存在"); return;
      }
      if (data.used) {
        setCodeError("⚠️ 該兌換碼已經被使用了"); return;
      }
      
      const { error: updateError } = await supabase
        .from('codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', data.id);
        
      if (updateError) {
        setCodeError("連線不穩，請稍後再試"); return;
      }

      setStep(0); setCodeError("");
    } catch (e) {
      setCodeError("系統驗證發生錯誤，請稍後再試");
    }
  };

  const handleSystemSelect = (sys) => {
    setSystemType(sys);
    setShuffledDeck(shuffle([...Array(sys === "EAST" ? 64 : 78).keys()]));
    setStep(1);
  };

  const maxSelectCount = systemType === "EAST" ? 2 : 3;
  const isEast = systemType === "EAST";

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
    if (!isEast) {
      setOrientations(p => ({ ...p, [cardIdx]: Math.random() > 0.5 ? "逆位" : "正位" }));
    }
  }, [shuffledDeck, flippedCards, selectedCards, maxSelectCount, isEast]);

  const canStep1 = birthYear && birthMonth && birthDay && birthHour;
  const canStep2 = question.trim().length > 0;
  const canStep3 = selectedCards.length === maxSelectCount;

  const positions = isEast ? ["本卦", "變卦"] : ["過去", "現在", "未來"];
  const deckSource = isEast ? ICHING_HEXAGRAMS : TAROT_DECK;
  const sysNameInfo = isEast ? "紫微斗數 × 易經卜卦" : "人類圖 × 奧修禪卡/塔羅";

  const doReading = async () => {
    setLoading(true); setStreaming(false); setStep(4); setResult("");
    const birthInfo = `國曆 ${birthYear}年${birthMonth}月${birthDay}日 ${birthHour}`;
    
    let cardsInfo = "";
    if (isEast) {
      cardsInfo = selectedCards.map((ci, i) => `${positions[i]}：${deckSource[ci]}`).join("\n");
    } else {
      cardsInfo = selectedCards.map((ci, i) => `${positions[i]}：${deckSource[ci]}（${orientations[ci]}）`).join("\n");
    }

    const hdInfo = (!isEast && hdType) ? `\n【人類圖類型】${hdType}${hdAuthority ? `（內在權威：${hdAuthority}）` : ''}${hdProfile ? `（人生角色：${hdProfile}）` : ''}\n⚠️ 此為案主自行查詢後提供的確認結果，請直接採用此類型進行解讀，不要再猜測。` : '';
    const userMsg = `請為我進行【${sysNameInfo}】雙系統解讀。\n\n【生辰】${birthInfo}${hdInfo}\n【抽牌/卜卦結果】\n${cardsInfo}\n【問題】${question}\n\n請依照解讀結構完整回覆。`;

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: isEast ? PROMPT_EAST : PROMPT_WEST,
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

  const getAdviceText = () => {
    if (result.includes("【IG摘要】")) {
      const parts = result.split("【IG摘要】");
      return parts[parts.length - 1].replace(/##\s*/g,"").replace(/\*\*/g,"").replace(/###\s*/g,"").trim();
    }
    const match = result.match(/IG小卡語錄[^\n]*\n([\s\S]*?)(?:\n\n|$)/);
    if (match && match[1] && match[1].trim().length > 0) {
      return match[1].replace(/##\s*/g,"").replace(/\*\*/g,"").replace(/###\s*/g,"").trim();
    }
    const splitKey = result.includes("行動方針") ? "行動方針" : "行動";
    const parts = result.split(new RegExp(splitKey, "i"));
    let text = parts.length > 1 ? parts[parts.length - 1] : result;
    text = text.replace(/^[^\n]*\n/, ""); 
    text = text.replace(/##\s*/g,"").replace(/\*\*/g,"").replace(/###\s*/g,"").trim();
    return text.length > 150 ? text.slice(0,150) + "⋯⋯" : text;
  };
  const adviceText = getAdviceText();

  const displayResult = result.includes("【IG摘要】") 
    ? result.split("【IG摘要】")[0].trim() 
    : result;

  const handleDownloadAndShare = useCallback(async () => {
    if (!shareCardRef.current) return;
    try {
      const dataUrl = await toJpeg(shareCardRef.current, { quality: 0.95, pixelRatio: 2, width: 340, height: 520, style: { margin: '0' } });
      const link = document.createElement("a");
      link.download = `彼岸解惑-${new Date().getTime()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch(e) {
      console.error(e);
      alert("儲存圖片失敗，請直接截圖或長按圖片儲存。");
    }
  }, []);

  const handleShareToIG = useCallback(async () => {
    if (!shareCardRef.current) return;
    try {
      const dataUrl = await toJpeg(shareCardRef.current, { quality: 0.95, pixelRatio: 2, width: 340, height: 520, style: { margin: '0' } });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `彼岸解惑-${new Date().getTime()}.jpg`, { type: "image/jpeg" });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `彼岸解惑 - 專屬指南`,
          text: "來看看我的專屬命理指引！",
        });
      } else {
        alert("您的裝置或瀏覽器不支援直接分享圖片。系統將自動為您下載，您可以直接前往 IG 限動上載該圖片！");
        const link = document.createElement("a");
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  const restart = () => {
    setStep(0); setSystemType(null); setBirthYear(""); setBirthMonth(""); setBirthDay(""); setBirthHour("");
    setHdType(""); setHdAuthority(""); setHdProfile("");
    setSelectedCards([]); setOrientations({}); setFlippedCards(new Set());
    setQuestion(""); setResult(""); setLoading(false); setStreaming(false); setShowShareCard(false);
  };

  const cy = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => cy - 15 - i);
  const mons = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysList = Array.from({ length: 31 }, (_, i) => i + 1);

  const S = {
    app:{minHeight:"100vh",background:"linear-gradient(170deg, #0a0e1a 0%, #131a2e 40%, #1a1510 100%)",color:"#e8dcc8",fontFamily:"'Noto Serif TC','Hiragino Mincho ProN',serif",position:"relative",overflow:"hidden"},
    noise:{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,pointerEvents:"none",zIndex:0},
    wrap:{maxWidth:480,margin:"0 auto",padding:"20px 20px 40px",position:"relative",zIndex:1},
    wrapWide:{maxWidth:720,margin:"0 auto",padding:"20px 16px 40px",position:"relative",zIndex:1},
    header:{textAlign:"center",padding:"40px 0 20px"},
    shopName:{fontSize:14,letterSpacing:6,color:"#8a7a62",marginBottom:8},
    title:{fontSize:36,fontWeight:700,letterSpacing:4,background:"linear-gradient(135deg, #c9a96e 0%, #f0d8a0 50%, #c9a96e 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8},
    sub:{fontSize:13,color:"#6a6050",letterSpacing:2},
    divLine:{width:60,height:1,background:"linear-gradient(90deg, transparent, #c9a96e, transparent)",margin:"24px auto"},
    dots:{display:"flex",justifyContent:"center",gap:12,marginBottom:32},
    dot:(a,d)=>({width:10,height:10,borderRadius:"50%",background:d?"#c9a96e":a?"#c9a96e":"#2a2a3a",border:a?"2px solid #f0d8a0":"2px solid #3a3a4a",transition:"all 0.4s",boxShadow:a?"0 0 12px rgba(201,169,110,0.4)":"none"}),
    label:{fontSize:13,color:"#8a7a62",marginBottom:8,letterSpacing:1},
    inp:{width:"100%",padding:"14px 16px",fontSize:16,background:"rgba(255,255,255,0.04)",border:"1px solid #2a2520",borderRadius:8,color:"#e8dcc8",outline:"none",fontFamily:"'Noto Serif TC',serif",boxSizing:"border-box"},
    sel:{flex:1,padding:"14px 12px",fontSize:15,background:"rgba(255,255,255,0.04)",border:"1px solid #2a2520",borderRadius:8,color:"#e8dcc8",outline:"none",fontFamily:"'Noto Serif TC',serif",appearance:"none"},
    ta:{width:"100%",padding:"14px 16px",fontSize:15,minHeight:100,background:"rgba(255,255,255,0.04)",border:"1px solid #2a2520",borderRadius:8,color:"#e8dcc8",outline:"none",resize:"vertical",fontFamily:"'Noto Serif TC',serif",boxSizing:"border-box"},
    btn:(dis)=>({width:"100%",padding:"16px 0",fontSize:16,fontWeight:600,letterSpacing:3,border:"none",borderRadius:8,cursor:dis?"not-allowed":"pointer",background:dis?"rgba(255,255,255,0.05)":"linear-gradient(135deg, #c9a96e 0%, #a8873e 100%)",color:dis?"#555":"#0a0e1a",fontFamily:"'Noto Serif TC',serif",opacity:dis?0.5:1,marginTop:24}),
    grid:{display:"grid",gap:5,marginBottom:16},
    card:(sel,flip)=>({aspectRatio:"2/3",borderRadius:6,cursor:"pointer",border:sel?"2px solid #c9a96e":"1px solid rgba(201,169,110,0.12)",background:flip?"linear-gradient(135deg, #1a1530, #2a1f40)":"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:flip?8:16,textAlign:"center",transition:"all 0.35s ease",boxShadow:sel?"0 0 16px rgba(201,169,110,0.4)":flip?"none":"0 1px 4px rgba(0,0,0,0.3)",color:flip?"#c9a96e":"#3a3550",padding:0,lineHeight:1.2,overflow:"hidden",position:"relative"}),
    sc:{display:"flex",gap:12,justifyContent:"center",marginBottom:20,flexWrap:"wrap"},
    scard:{background:"linear-gradient(135deg, #1a1530, #2a1f45)",border:"1px solid #c9a96e",borderRadius:10,padding:"12px 16px",textAlign:"center",minWidth:90},
    scPos:{fontSize:11,color:"#8a7a62",marginBottom:4,letterSpacing:2},
    scName:{fontSize:14,color:"#f0d8a0",fontWeight:600},
    tog:{display:"flex",gap:6,marginTop:6,justifyContent:"center"},
    togBtn:(a)=>({padding:"4px 12px",fontSize:12,borderRadius:4,cursor:"pointer",border:"1px solid #3a3a4a",background:a?"rgba(201,169,110,0.2)":"transparent",color:a?"#f0d8a0":"#6a6050",fontFamily:"'Noto Serif TC',serif"}),
    res:{background:"rgba(255,255,255,0.02)",border:"1px solid #2a2520",borderRadius:12,padding:"28px 22px",marginTop:20,lineHeight:1.9,fontSize:15},
    cursor:{display:"inline-block",width:2,height:16,background:"#c9a96e",marginLeft:2,animation:"blink 1s step-end infinite",verticalAlign:"text-bottom"},
    shareBtn:{width:"100%",padding:"14px 0",fontSize:15,fontWeight:600,letterSpacing:2,border:"1px solid #c9a96e",borderRadius:8,cursor:"pointer",background:"rgba(201,169,110,0.08)",color:"#c9a96e",fontFamily:"'Noto Serif TC',serif",marginTop:16},
    cta:{marginTop:28,textAlign:"center",background:"rgba(201,169,110,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:12,padding:"28px 20px"},
    ctaT:{fontSize:18,fontWeight:600,color:"#c9a96e",letterSpacing:2,marginBottom:12},
    ctaA:{fontSize:13,color:"#6a6050",lineHeight:1.8,marginBottom:16},
    ctaMap:{display:"inline-block",padding:"12px 32px",fontSize:14,fontWeight:600,letterSpacing:2,background:"linear-gradient(135deg, #c9a96e, #a8873e)",color:"#0a0e1a",borderRadius:8,textDecoration:"none",fontFamily:"'Noto Serif TC',serif"},
    rstBtn:{background:"none",border:"1px solid #3a3a4a",borderRadius:8,color:"#6a6050",padding:"10px 28px",fontSize:13,cursor:"pointer",fontFamily:"'Noto Serif TC',serif",letterSpacing:2,marginTop:20},
    ember:()=>({position:"fixed",width:3,height:3,borderRadius:"50%",background:"#c9a96e",opacity:0.15+Math.random()*0.15,left:`${10+Math.random()*80}%`,bottom:-10,animation:`floatUp ${8+Math.random()*6}s linear infinite`,animationDelay:`${Math.random()*8}s`,pointerEvents:"none",zIndex:0}),
  };

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&display=swap');
@keyframes floatUp{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:0.2}90%{opacity:0.15}100%{transform:translateY(-100vh) translateX(30px);opacity:0}}
@keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes cardFlip{0%{transform:rotateY(0deg)}50%{transform:rotateY(90deg)}100%{transform:rotateY(0deg)}}
.tarot-grid{grid-template-columns:repeat(6,1fr);}
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

  return (
    <div style={S.app}>
      <style>{css}</style>
      <div style={S.noise}/>
      {Array.from({length:8}).map((_,i)=><div key={i} style={S.ember()}/>)}

      <div style={step===2 ? S.wrapWide : S.wrap}>
        <div style={S.header}>
          <div style={S.shopName}>彼岸關東煮</div>
          <div style={S.title}>彼岸解惑</div>
          <div style={S.sub}>{step >= 1 && systemType ? sysNameInfo : "專屬您的深夜命理"}</div>
          <div style={S.divLine}/>
        </div>

        {step===-1&&(
          <div style={{textAlign:"center",padding:"24px 0",animation:"fadeIn 0.5s ease"}}>
            <div style={{fontSize:48,marginBottom:20,opacity:0.7}}>🎴</div>
            <div style={{fontSize:14,color:"#8a7a62",lineHeight:1.8,marginBottom:24}}>集滿 6 點的貴客專屬<br/>請輸入兌換碼開啟解惑</div>
            <input style={{...S.inp,textAlign:"center",fontSize:20,letterSpacing:4}} placeholder="輸入兌換碼" value={redeemCode} onChange={e=>{setRedeemCode(e.target.value);setCodeError("");}} onKeyDown={e=>e.key==="Enter"&&handleVerify()}/>
            <div style={{fontSize:13,color:"#c06060",marginTop:8,minHeight:20}}>{codeError}</div>
            <button style={S.btn(!redeemCode.trim())} disabled={!redeemCode.trim()} onClick={handleVerify}>驗證兌換碼</button>
          </div>
        )}

        {step===0&&(
          <div style={{animation:"fadeIn 0.5s ease"}}>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:16,color:"#c9a96e",marginBottom:8,letterSpacing:2}}>選擇您的真理法門</div>
              <div style={{fontSize:13,color:"#6a6050",lineHeight:1.8}}>彼岸提供東西方兩大命理巔峰體系，<br/>請感應您此刻的直覺，選擇引導您的道路。</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <button 
                style={{...S.btn(false),marginTop:0,background:"linear-gradient(135deg, #1f1b2e 0%, #151024 100%)",border:"1px solid #c9a96e",padding:"24px 20px",position:"relative",overflow:"hidden",textAlign:"left"}} 
                onClick={() => handleSystemSelect("EAST")}
              >
                <div style={{fontSize:12,color:"#8a7a62",letterSpacing:2,marginBottom:8}}>東方哲學霸主</div>
                <div style={{fontSize:20,fontWeight:700,color:"#f0d8a0",letterSpacing:2,marginBottom:6}}>紫微斗數 × 易經卜卦</div>
                <div style={{fontSize:11,color:"#6a6050",fontWeight:400,lineHeight:1.6}}>宏觀的終身定數 × 縝密高階的策略推演<br/>適合探尋因緣流年與重大決策解惑。</div>
              </button>
              <button 
                style={{...S.btn(false),marginTop:0,background:"linear-gradient(135deg, #1f1b2e 0%, #151024 100%)",border:"1px solid #5a7a8a",padding:"24px 20px",textAlign:"left"}} 
                onClick={() => handleSystemSelect("WEST")}
              >
                <div style={{fontSize:12,color:"#6a8a9a",letterSpacing:2,marginBottom:8}}>現代身心靈爆款</div>
                <div style={{fontSize:20,fontWeight:700,color:"#d0e8f0",letterSpacing:2,marginBottom:6}}>人類圖 × 奧修禪卡/塔羅</div>
                <div style={{fontSize:11,color:"#5a6a7a",fontWeight:400,lineHeight:1.6}}>揭開靈魂天賦設計 × 與潛意識深層對話<br/>適合療癒內在、了解自我與情感能量梳理。</div>
              </button>
            </div>
          </div>
        )}

        {step>=1&&<div style={S.dots}>{[1,2,3,4].map(i=><div key={i} style={S.dot(step===i,step>i)}/>)}</div>}

        {step===1&&(
          <div style={{animation:"fadeIn 0.5s ease"}}>
            <div style={S.label}>出生年</div>
            <select style={S.sel} value={birthYear} onChange={e=>setBirthYear(e.target.value)}><option value="">選擇年份</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
            <div style={{height:14}}/>
            <div style={S.label}>出生月日</div>
            <div style={{display:"flex",gap:10}}>
              <select style={S.sel} value={birthMonth} onChange={e=>setBirthMonth(e.target.value)}><option value="">月</option>{mons.map(m=><option key={m} value={m}>{m}月</option>)}</select>
              <select style={S.sel} value={birthDay} onChange={e=>setBirthDay(e.target.value)}><option value="">日</option>{daysList.map(d=><option key={d} value={d}>{d}日</option>)}</select>
            </div>
            <div style={{height:14}}/>
            <div style={S.label}>出生時辰 (人類圖需準確)</div>
            <select style={S.sel} value={birthHour} onChange={e=>setBirthHour(e.target.value)}><option value="">選擇時辰</option>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select>
            {!isEast && (
              <div style={{marginTop:16,padding:"16px",background:"rgba(74,154,232,0.06)",border:"1px solid rgba(74,154,232,0.2)",borderRadius:10}}>
                <div style={{fontSize:13,color:"#8ab8e8",marginBottom:10,fontWeight:600,textAlign:"center"}}>🧬 人類圖資訊（選填，可大幅提升準確度）</div>
                <div style={{fontSize:11,color:"#5a7a8a",marginBottom:10,lineHeight:1.6,textAlign:"center"}}>如果您已知自己的類型，請直接選擇；若不確定，可先前往查詢</div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <select style={{...S.sel,borderColor:"rgba(74,154,232,0.3)"}} value={hdType} onChange={e=>setHdType(e.target.value)}>
                    <option value="">我的人類圖類型</option>
                    <option value="顯示者 Manifestor">顯示者 Manifestor</option>
                    <option value="生產者 Generator">生產者 Generator</option>
                    <option value="顯示生產者 MG">顯示生產者 Manifesting Generator</option>
                    <option value="投射者 Projector">投射者 Projector</option>
                    <option value="反映者 Reflector">反映者 Reflector</option>
                  </select>
                  <select style={{...S.sel,borderColor:"rgba(74,154,232,0.3)"}} value={hdAuthority} onChange={e=>setHdAuthority(e.target.value)}>
                    <option value="">內在權威（選填）</option>
                    <option value="情緒權威">情緒權威</option>
                    <option value="薦骨權威">薦骨權威</option>
                    <option value="脾直覺權威">脾直覺權威</option>
                    <option value="意志力權威">意志力權威（心臟/自我）</option>
                    <option value="G中心權威">G中心權威（自我投射）</option>
                    <option value="環境權威">環境權威（心智投射）</option>
                    <option value="月亮週期權威">月亮週期權威</option>
                  </select>
                </div>
                <div style={{marginBottom:10}}>
                  <select style={{...S.sel,borderColor:"rgba(74,154,232,0.3)",width:"100%"}} value={hdProfile} onChange={e=>setHdProfile(e.target.value)}>
                    <option value="">人生角色 Profile（選填）</option>
                    <option value="1/3">1/3 研究型烈士</option>
                    <option value="1/4">1/4 研究型使者</option>
                    <option value="2/4">2/4 隱士型使者</option>
                    <option value="2/5">2/5 隱士型異端者</option>
                    <option value="3/5">3/5 實驗型異端者</option>
                    <option value="3/6">3/6 實驗型模範</option>
                    <option value="4/6">4/6 使者型模範</option>
                    <option value="4/1">4/1 使者型研究者</option>
                    <option value="5/1">5/1 異端型研究者</option>
                    <option value="5/2">5/2 異端型隱士</option>
                    <option value="6/2">6/2 模範型隱士</option>
                    <option value="6/3">6/3 模範型實驗者</option>
                  </select>
                </div>
                <div style={{textAlign:"center"}}>
                  <a href="https://www.mybodygraph.com/" target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#6a8a9a",textDecoration:"underline"}}>
                    還不知道？→ 前往免費查詢人類圖
                  </a>
                </div>
              </div>
            )}
            <button style={S.btn(!canStep1)} disabled={!canStep1} onClick={()=>setStep(2)}>下一步 ─ 提問</button>
          </div>
        )}

        {step===2&&(
          <div style={{animation:"fadeIn 0.5s ease"}}>
            <div style={S.label}>你想問什麼？</div>
            <textarea style={S.ta} placeholder="例如：最近事業發展方向、感情困惑、今年運勢⋯⋯問題越具體，解讀越精準。帶著問題的意念去抽卡，更能感應宇宙的指引。" value={question} onChange={e=>setQuestion(e.target.value)}/>
            <button style={S.btn(!canStep2)} disabled={!canStep2} onClick={()=>setStep(3)}>下一步 ─ 帶著問題抽卦</button>
          </div>
        )}

        {step===3&&(
          <div style={{animation:"fadeIn 0.5s ease"}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:15,color:"#c9a96e",marginBottom:4}}>帶著你的問題，憑直覺點選 {maxSelectCount} 個指引</div>
              <div style={{fontSize:12,color:"#6a6050"}}>依序對應：{positions.join(" → ")}（點擊可取消）</div>
            </div>
            {selectedCards.length>0&&(
              <div style={S.sc}>{selectedCards.map((ci,i)=>(
                <div key={ci} style={S.scard}>
                  <div style={S.scPos}>{positions[i]}</div>
                  <div style={{...S.scName, fontSize: isEast ? 18 : 14, marginTop: isEast ? 8 : 0}}>{deckSource[ci]}</div>
                  {!isEast && (
                    <div style={S.tog}>
                      <button style={S.togBtn(orientations[ci]==="正位")} onClick={()=>setOrientations(p=>({...p,[ci]:"正位"}))}>正位</button>
                      <button style={S.togBtn(orientations[ci]==="逆位")} onClick={()=>setOrientations(p=>({...p,[ci]:"逆位"}))}>逆位</button>
                    </div>
                  )}
                </div>
              ))}</div>
            )}
            <div className="tarot-grid" style={S.grid}>
              <svg style={{position:"absolute",width:0,height:0}}>
                <defs>
                  <linearGradient id="cardBg" x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#18133a"/>
                    <stop offset="35%" stopColor="#1a1540"/>
                    <stop offset="65%" stopColor="#16112e"/>
                    <stop offset="100%" stopColor="#110d24"/>
                  </linearGradient>
                  <radialGradient id="cardGlow" cx="50%" cy="35%" r="50%">
                    <stop offset="0%" stopColor="rgba(201,169,110,0.1)"/>
                    <stop offset="100%" stopColor="rgba(201,169,110,0)"/>
                  </radialGradient>
                </defs>
              </svg>
              {shuffledDeck.map((cardIdx,dp)=>{
                const sel=selectedCards.includes(cardIdx),flip=flippedCards.has(dp)||sel;
                return (
                  <div key={dp} className="tarot-card" style={{...S.card(sel,flip),animation:`cardIn 0.3s ease ${dp*8}ms both`}} onClick={()=>handleCardClick(dp)}>
                    {flip ? (
                      isEast ? (
                        /* ── I Ching hexagram card face ── */
                        <svg viewBox="0 0 60 90" style={{width:"100%",height:"100%",display:"block"}}>
                          <rect width="60" height="90" rx="4" fill="#0a0e1a"/>
                          <rect x="1" y="1" width="58" height="88" rx="3.5" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="0.6"/>
                          <rect x="4" y="4" width="52" height="82" rx="2" fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth="0.3"/>
                          {getHexLines(deckSource[cardIdx]).map((yang, li) => {
                            const yy = 12 + li * 8 + (li >= 3 ? 5 : 0);
                            return yang
                              ? <rect key={li} x="12" y={yy} width="36" height="5" rx="1" fill="#c9a96e" opacity="0.85"/>
                              : <g key={li}><rect x="12" y={yy} width="14" height="5" rx="1" fill="#c9a96e" opacity="0.85"/><rect x="34" y={yy} width="14" height="5" rx="1" fill="#c9a96e" opacity="0.85"/></g>;
                          })}
                          <text x="30" y="82" textAnchor="middle" fill="#c9a96e" fontSize="6" fontFamily="'Noto Serif TC',serif" fontWeight="600">{deckSource[cardIdx]}</text>
                        </svg>
                      ) : (
                        /* ── Tarot card face ── */
                        (() => {
                          const suit = getTarotSuit(cardIdx);
                          const sc = SUIT_STYLE[suit];
                          const nm = deckSource[cardIdx];
                          return (
                            <svg viewBox="0 0 60 90" style={{width:"100%",height:"100%",display:"block"}}>
                              <rect width="60" height="90" rx="4" fill={sc.bg}/>
                              <rect x="1" y="1" width="58" height="88" rx="3.5" fill="none" stroke={sc.ac} strokeWidth="0.6" opacity="0.5"/>
                              <rect x="4" y="4" width="52" height="82" rx="2" fill="none" stroke={sc.ac} strokeWidth="0.25" opacity="0.15"/>
                              <circle cx="30" cy="36" r="14" fill="none" stroke={sc.ac} strokeWidth="0.4" opacity="0.15"/>
                              <circle cx="30" cy="36" r="10" fill="none" stroke={sc.ac} strokeWidth="0.3" opacity="0.1" strokeDasharray="1.5,1.5"/>
                              {suit==='major' && <path d="M30,22 L32.5,31 L41,31 L34,36.5 L36.5,45 L30,40 L23.5,45 L26,36.5 L19,31 L27.5,31 Z" fill={sc.ac} opacity="0.6"/>}
                              {suit==='wands' && <path d="M30,20 C27,28 23,33 25.5,41 C27.5,47 32.5,47 34.5,41 C37,33 33,28 30,20 Z" fill={sc.ac} opacity="0.55"/>}
                              {suit==='cups' && <><path d="M22,27 L22,27 C22,27 24,43 30,47 C36,43 38,27 38,27 Z" fill="none" stroke={sc.ac} strokeWidth="1" opacity="0.6"/><line x1="27" y1="47" x2="33" y2="47" stroke={sc.ac} strokeWidth="0.8" opacity="0.5"/><line x1="30" y1="47" x2="30" y2="51" stroke={sc.ac} strokeWidth="0.8" opacity="0.5"/><line x1="25" y1="51" x2="35" y2="51" stroke={sc.ac} strokeWidth="0.8" opacity="0.4"/></>}
                              {suit==='swords' && <><rect x="29" y="18" width="2" height="30" rx="0.5" fill={sc.ac} opacity="0.6"/><rect x="23" y="28" width="14" height="2.5" rx="1" fill={sc.ac} opacity="0.5"/><circle cx="30" cy="28" r="3" fill="none" stroke={sc.ac} strokeWidth="0.5" opacity="0.3"/></>}
                              {suit==='pentacles' && <><circle cx="30" cy="36" r="10" fill="none" stroke={sc.ac} strokeWidth="1" opacity="0.55"/><path d="M30,26 L32.5,33 L40,33 L34,37.5 L36,44 L30,40 L24,44 L26,37.5 L20,33 L27.5,33 Z" fill={sc.ac} opacity="0.4"/></>}
                              <text x="30" y={nm.length>3?78:80} textAnchor="middle" fill={sc.ac} fontSize={nm.length>4?5:6.5} fontFamily="'Noto Serif TC',serif" fontWeight="600">{nm}</text>
                            </svg>
                          );
                        })()
                      )
                    ) : (
                      <svg viewBox="0 0 60 90" style={{width:"100%",height:"100%",display:"block"}}>
                        {/* Base layers */}
                        <rect width="60" height="90" rx="4" fill="url(#cardBg)"/>
                        <rect width="60" height="90" rx="4" fill="url(#cardGlow)"/>
                        {/* Outer gold border */}
                        <rect x="1" y="1" width="58" height="88" rx="3.5" fill="none" stroke="rgba(201,169,110,0.4)" strokeWidth="0.6"/>
                        {/* Inner decorative frame */}
                        <rect x="4.5" y="4.5" width="51" height="81" rx="2" fill="none" stroke="rgba(201,169,110,0.15)" strokeWidth="0.3"/>
                        {/* Diamond corner ornaments */}
                        <polygon points="8,4.5 9.5,7 8,9.5 6.5,7" fill="rgba(201,169,110,0.4)"/>
                        <polygon points="52,4.5 53.5,7 52,9.5 50.5,7" fill="rgba(201,169,110,0.4)"/>
                        <polygon points="8,80.5 9.5,83 8,85.5 6.5,83" fill="rgba(201,169,110,0.4)"/>
                        <polygon points="52,80.5 53.5,83 52,85.5 50.5,83" fill="rgba(201,169,110,0.4)"/>
                        {/* Corner filigree curves */}
                        <path d="M4.5,13 Q8,13 8,9.5" fill="none" stroke="rgba(201,169,110,0.25)" strokeWidth="0.35"/>
                        <path d="M55.5,13 Q52,13 52,9.5" fill="none" stroke="rgba(201,169,110,0.25)" strokeWidth="0.35"/>
                        <path d="M4.5,77 Q8,77 8,80.5" fill="none" stroke="rgba(201,169,110,0.25)" strokeWidth="0.35"/>
                        <path d="M55.5,77 Q52,77 52,80.5" fill="none" stroke="rgba(201,169,110,0.25)" strokeWidth="0.35"/>
                        {/* Top & bottom accent lines */}
                        <line x1="13" y1="20" x2="47" y2="20" stroke="rgba(201,169,110,0.18)" strokeWidth="0.25"/>
                        <line x1="13" y1="69" x2="47" y2="69" stroke="rgba(201,169,110,0.18)" strokeWidth="0.25"/>
                        {/* Central mandala rings */}
                        <circle cx="30" cy="38" r="15" fill="none" stroke="rgba(201,169,110,0.08)" strokeWidth="0.25"/>
                        <circle cx="30" cy="38" r="12" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.25" strokeDasharray="1.5,1.5"/>
                        {/* Crescent moon */}
                        <circle cx="30" cy="33" r="7.5" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="0.6"/>
                        <circle cx="33.5" cy="31" r="6.5" fill="#151028"/>
                        <circle cx="27.5" cy="33" r="2.5" fill="rgba(201,169,110,0.03)"/>
                        {/* Steam wisps — oden reference */}
                        <path d="M26,43 Q24.5,40 26.5,37.5" fill="none" stroke="rgba(201,169,110,0.18)" strokeWidth="0.4" strokeLinecap="round"/>
                        <path d="M30,44 Q28.5,41 30.5,38.5" fill="none" stroke="rgba(201,169,110,0.14)" strokeWidth="0.35" strokeLinecap="round"/>
                        <path d="M34,43 Q32.5,40 34.5,37.5" fill="none" stroke="rgba(201,169,110,0.18)" strokeWidth="0.4" strokeLinecap="round"/>
                        {/* Three-layer waves — 彼岸 = other shore */}
                        <path d="M10,54 Q16,51 22,54 Q28,57 34,54 Q40,51 46,54 Q50,56 52,54" fill="none" stroke="rgba(201,169,110,0.3)" strokeWidth="0.5"/>
                        <path d="M8,58 Q14,55 20,58 Q26,61 32,58 Q38,55 44,58 Q50,61 54,58" fill="none" stroke="rgba(201,169,110,0.2)" strokeWidth="0.4"/>
                        <path d="M10,61.5 Q15,59.5 20,61.5 Q25,63.5 30,61.5 Q35,59.5 40,61.5 Q45,63.5 50,61.5" fill="none" stroke="rgba(201,169,110,0.1)" strokeWidth="0.3"/>
                        {/* 彼岸 split text */}
                        <text x="22" y="77" textAnchor="middle" fill="rgba(201,169,110,0.55)" fontSize="6.5" fontFamily="'Noto Serif TC',serif" fontWeight="700">彼</text>
                        <text x="38" y="77" textAnchor="middle" fill="rgba(201,169,110,0.55)" fontSize="6.5" fontFamily="'Noto Serif TC',serif" fontWeight="700">岸</text>
                        {/* Dot separator between chars */}
                        <circle cx="30" cy="74.5" r="0.6" fill="rgba(201,169,110,0.35)"/>
                        {/* Scattered star field */}
                        <circle cx="14" cy="16" r="0.5" fill="rgba(201,169,110,0.4)"/>
                        <circle cx="46" cy="14" r="0.4" fill="rgba(201,169,110,0.3)"/>
                        <circle cx="11" cy="28" r="0.3" fill="rgba(201,169,110,0.2)"/>
                        <circle cx="49" cy="30" r="0.35" fill="rgba(201,169,110,0.25)"/>
                        <circle cx="18" cy="48" r="0.3" fill="rgba(201,169,110,0.15)"/>
                        <circle cx="42" cy="47" r="0.25" fill="rgba(201,169,110,0.2)"/>
                        <circle cx="22" cy="13" r="0.25" fill="rgba(201,169,110,0.18)"/>
                        <circle cx="38" cy="18" r="0.3" fill="rgba(201,169,110,0.22)"/>
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
            <button style={S.btn(!canStep3)} disabled={!canStep3} onClick={doReading}>開始解讀</button>
          </div>
        )}

        {step===4&&(
          <div style={{animation:"fadeIn 0.5s ease"}}>
            {loading?(
              <div style={{textAlign:"center",padding:"60px 0"}}>
                <div style={{fontSize:40,animation:"pulse 2s ease infinite"}}>☽</div>
                <div style={{color:"#8a7a62",fontSize:14,marginTop:16,letterSpacing:2}}>{LOADING_MSGS[loadingMsg]}</div>
              </div>
            ):(
              <>
                <div style={S.sc}>{selectedCards.map((ci,i)=>(
                  <div key={ci} style={S.scard}>
                    <div style={S.scPos}>{positions[i]}</div>
                    <div style={{...S.scName, fontSize: isEast ? 18 : 14, marginTop: isEast ? 8 : 0}}>{deckSource[ci]}</div>
                    {!isEast && <div style={{fontSize:11,color:orientations[ci]==="逆位"?"#a06060":"#6a8a6a",marginTop:2}}>{orientations[ci]}</div>}
                  </div>
                ))}</div>

                <div ref={resultRef} style={S.res}>
                  {renderMarkdown(displayResult)}
                  {streaming && <span style={S.cursor}/>}
                  <div ref={bottomRef}/>
                </div>

                {isFinished&&(
                  <>
                    {/* Share Card Toggle */}
                    {!showShareCard ? (
                      <button style={S.shareBtn} onClick={()=>setShowShareCard(true)}>
                        📸 製作 IG 限動分享圖
                      </button>
                    ) : (
                      <div style={{marginTop:16}}>
                        {/* ── Action buttons FIRST (visible without scroll) ── */}
                        <div style={{display:"flex",gap:10,marginBottom:12}}>
                          <button style={{...S.shareBtn,marginTop:0,flex:1,background:"linear-gradient(135deg, #c9a96e, #a8873e)",color:"#0a0e1a",border:"none",fontSize:14}} onClick={handleDownloadAndShare}>
                            ⬇️ 下載圖片
                          </button>
                          <button style={{...S.shareBtn,marginTop:0,flex:1,background:"rgba(201,169,110,0.15)",color:"#f0d8a0",border:"1px solid #c9a96e",fontSize:14}} onClick={handleShareToIG}>
                            📲 分享到 IG
                          </button>
                        </div>
                        <button style={{...S.shareBtn,marginTop:0,marginBottom:14,fontSize:13,padding:"10px 0",borderColor:"#3a3a4a",color:"#6a6050"}} onClick={()=>setShowShareCard(false)}>
                          收合分享圖
                        </button>

                        <div style={{fontSize:12,color:"#8a7a62",textAlign:"center",marginBottom:10,lineHeight:1.6}}>
                          👇 以下為分享小卡預覽
                        </div>
                        {/* ── Share Card Preview (9:16) ── */}
                        <div ref={shareCardRef} style={{
                          width:340,height:520,margin:"0 auto",
                          background:"linear-gradient(170deg, #0a0e1a 0%, #131a2e 40%, #1a1510 100%)",
                          borderRadius:16,overflow:"hidden",position:"relative",
                          border:"1px solid rgba(201,169,110,0.2)",
                          display:"flex",flexDirection:"column",justifyContent:"space-between",
                          padding:"24px 22px 18px",boxSizing:"border-box",
                        }}>
                          {/* Header */}
                          <div style={{textAlign:"center",marginBottom:10}}>
                            <div style={{fontSize:9,letterSpacing:4,color:"#8a7a62",marginBottom:3}}>彼岸關東煮</div>
                            <div style={{fontSize:22,fontWeight:700,letterSpacing:3,background:"linear-gradient(135deg,#c9a96e,#f0d8a0,#c9a96e)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>彼岸解惑</div>
                            <div style={{width:36,height:1,background:"linear-gradient(90deg,transparent,#c9a96e,transparent)",margin:"6px auto"}}/>
                            <div style={{fontSize:8,color:"#6a6050",letterSpacing:1}}>{sysNameInfo}</div>
                          </div>

                          {/* Cards row */}
                          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:10,flexWrap:"wrap"}}>
                            {selectedCards.map((ci,i)=>(
                              <div key={ci} style={{background:"linear-gradient(135deg,#1a1530,#2a1f45)",border:"1px solid rgba(201,169,110,0.4)",borderRadius:8,padding:"5px 10px",textAlign:"center",minWidth:isEast ? 80 : 55}}>
                                <div style={{fontSize:7,color:"#8a7a62",letterSpacing:1,marginBottom:1}}>{positions[i]}</div>
                                <div style={{fontSize: isEast ? 13 : 10,color:"#f0d8a0",fontWeight:600}}>{deckSource[ci]}</div>
                                {!isEast && <div style={{fontSize:7,color:orientations[ci]==="逆位"?"#a06060":"#6a8a6a",marginTop:1}}>{orientations[ci]}</div>}
                              </div>
                            ))}
                          </div>

                          {/* Result snippet - centered */}
                          <div style={{overflow:"hidden",fontSize:13,color:"#f0d8a0",lineHeight:2.2,textAlign:"center",marginBottom:10}}>
                            <div style={{color:"#c9a96e",fontWeight:600,marginBottom:6,fontSize:13}}>🌟 專屬行動指南</div>
                            <div style={{display:"-webkit-box",WebkitLineClamp:6,WebkitBoxOrient:"vertical",overflow:"hidden",whiteSpace:"pre-wrap",letterSpacing:0.5}}>
                              {adviceText}
                            </div>
                          </div>

                          {/* CTA footer */}
                          <div style={{borderTop:"1px solid rgba(201,169,110,0.15)",paddingTop:12,textAlign:"center"}}>
                            <div style={{fontSize:13,fontWeight:600,color:"#c9a96e",letterSpacing:1,marginBottom:4}}>想聊更多？今晚來彼岸坐坐</div>
                            <div style={{fontSize:9,color:"#6a6050",lineHeight:1.6}}>
                              台北市信義區吳興街577號<br/>Mon-Sat 18:00-00:00
                            </div>
                          </div>

                          {/* Watermark */}
                          <div style={{position:"absolute",bottom:6,right:10,fontSize:8,color:"rgba(201,169,110,0.2)",letterSpacing:1}}>彼岸解惑 ✦</div>
                        </div>
                      </div>
                    )}

                    <div style={S.cta}>
                      <div style={S.ctaT}>想聊更多？今晚來彼岸坐坐</div>
                      <div style={S.ctaA}>台北市信義區吳興街577號<br/>Mon-Sat 18:00-00:00</div>
                      <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" style={S.ctaMap}>📍 Google Maps 導航</a>
                    </div>

                    <div style={{textAlign:"center"}}><button style={S.rstBtn} onClick={restart}>再問一次 / 重選法門</button></div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        <div style={{textAlign:"center",marginTop:48,paddingBottom:20}}>
          <div style={S.divLine}/>
          <div style={{fontSize:11,color:"#4a4540",letterSpacing:1,lineHeight:1.8}}>彼岸關東煮 ─ 集滿 6 點解鎖<br/>台北市信義區吳興街577號</div>
        </div>
      </div>
    </div>
  );
}
