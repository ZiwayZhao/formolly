// 快速检查数据库连接和表结构
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ijrbyfpesocafkkwmfht.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
  console.log('🔍 检查Formolly数据库表...\n');

  const tables = [
    'formolly_welcome_notice',
    'formolly_travel_knowledge', 
    'formolly_cloud_files',
    'formolly_chat_history'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: 表存在且可访问`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  // 检查存储桶
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log(`❌ Storage: ${error.message}`);
    } else {
      const formollyBucket = buckets.find(b => b.name === 'formolly-files');
      if (formollyBucket) {
        console.log(`✅ formolly-files 存储桶: 存在且可访问`);
      } else {
        console.log(`❌ formolly-files 存储桶: 不存在`);
      }
    }
  } catch (err) {
    console.log(`❌ Storage: ${err.message}`);
  }
}

checkTables();
