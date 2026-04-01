import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 載入 .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ 找不到 Supabase 環境變數，請確認 .env 檔案設定是否正確。");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateRandomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除 I, O, 0, 1 避免混淆
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  const COUNT = 100; // 要產生的數量
  const codes = [];
  
  console.log(`即將產生 ${COUNT} 組 6 位數兌換碼...`);

  for (let i = 0; i < COUNT; i++) {
    codes.push({ code: generateRandomCode() });
  }

  // 寫入 Supabase
  const { data, error } = await supabase
    .from('codes')
    .insert(codes)
    .select('code');

  if (error) {
    console.error("❌ 寫入資料庫失敗：", error);
    process.exit(1);
  }

  // 匯出成 CSV，方便讓老闆去列印
  const csvContent = "Code,URL\n" + data.map(r => `${r.code},https://bianoracle.vercel.app/?code=${r.code}`).join("\n");
  fs.writeFileSync('codes_export.csv', csvContent);

  console.log(`✅ 成功產生並寫入 ${data.length} 組兌換碼！`);
  console.log(`📄 已匯出至 codes_export.csv，您可以交給影印店印成 QR Code 卡片。`);
}

main();
