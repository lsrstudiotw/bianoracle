const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 手動讀取 .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ 找不到 Supabase 環境變數");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateRandomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  const COUNT = 100;
  const codes = [];
  const usedCodes = new Set();
  
  console.log(`即將產生 ${COUNT} 組 6 位數兌換碼...`);

  while (codes.length < COUNT) {
    const code = generateRandomCode();
    if (!usedCodes.has(code)) {
      usedCodes.add(code);
      codes.push({ code });
    }
  }

  const { data, error } = await supabase
    .from('codes')
    .insert(codes)
    .select('code');

  if (error) {
    console.error("❌ 寫入資料庫失敗：", error.message);
    process.exit(1);
  }

  const csvContent = "Code,URL\n" + data.map(r => `${r.code},https://bianoracle.vercel.app/?code=${r.code}`).join("\n");
  const outPath = path.resolve(__dirname, '..', 'codes_export.csv');
  fs.writeFileSync(outPath, csvContent);

  console.log(`✅ 成功產生並寫入 ${data.length} 組兌換碼！`);
  console.log(`📄 已匯出至 ${outPath}`);
  console.log(`\n前 5 組預覽：`);
  data.slice(0, 5).forEach(r => console.log(`  ${r.code}  →  https://bianoracle.vercel.app/?code=${r.code}`));
}

main();
