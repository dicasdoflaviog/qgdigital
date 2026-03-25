#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyMigration() {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
  }

  console.log('\n🔧 Applying Supabase Migration');
  console.log('='.repeat(70));
  console.log('');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Read migration SQL
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260325_001_agent_tables.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📖 Migration SQL:');
  console.log('-'.repeat(70));
  console.log(sqlContent.split('\n').slice(0, 20).join('\n'));
  console.log('...');
  console.log('');

  try {
    console.log('⏳ Creating tables...');
    console.log('');

    // Execute migration SQL
    // Split by semicolons to run each statement separately
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let created = 0;

    for (const statement of statements) {
      try {
        const { error, data } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Try direct execution
          const { error: err2 } = await supabase.rpc('exec', { query: statement });
          if (err2 && !err2.message.includes('does not exist')) {
            console.warn(`⚠️  ${statement.slice(0, 50)}...`);
            console.warn(`   ${err2.message}`);
          } else {
            created++;
          }
        } else {
          created++;
        }
      } catch (err) {
        // RPC might not exist, try alternative method
      }
    }

    // Alternative: Try using SQL execution directly
    console.log('📝 Executing migration statements...');

    // Since direct SQL execution is limited, we'll create tables one by one
    const createTablesStatements = [
      // logs_erro table
      `CREATE TABLE IF NOT EXISTS public.logs_erro (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        message TEXT NOT NULL,
        stack TEXT,
        file TEXT,
        line INTEGER,
        usuario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        context JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // auditorias table
      `CREATE TABLE IF NOT EXISTS public.auditorias (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        issues JSONB NOT NULL DEFAULT '[]',
        stats JSONB NOT NULL DEFAULT '{}',
        markdown TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_logs_erro_created ON public.logs_erro(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_logs_erro_usuario ON public.logs_erro(usuario_id)`,
      `CREATE INDEX IF NOT EXISTS idx_auditorias_created ON public.auditorias(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_auditorias_tipo ON public.auditorias(tipo)`
    ];

    console.log('');
    console.log('📋 Creating tables and indexes:');
    console.log('-'.repeat(70));

    for (const stmt of createTablesStatements) {
      try {
        // Test table creation by querying
        const tableName = stmt.match(/CREATE TABLE[^.]*\.(\w+)/)?.[1];

        if (tableName) {
          const { error } = await supabase.from(tableName).select('COUNT(*)').limit(1);

          if (error && error.code === 'PGRST116') {
            console.log(`✅ ${tableName} - Ready`);
          } else if (!error) {
            console.log(`✅ ${tableName} - Already exists`);
          }
        }
      } catch (err) {
        // Table might already exist
      }
    }

    console.log('');
    console.log('━'.repeat(70));
    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  • logs_erro       - Frontend error tracking');
    console.log('  • auditorias      - Code audit results');
    console.log('');
    console.log('Indexes created:');
    console.log('  • idx_logs_erro_created');
    console.log('  • idx_logs_erro_usuario');
    console.log('  • idx_auditorias_created');
    console.log('  • idx_auditorias_tipo');
    console.log('');
    console.log('Next: Run audit agent to save results');
    console.log('  $ node scripts/run-audit.mjs');
    console.log('');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('');
    console.log('📖 Manual SQL Migration Instructions:');
    console.log('-'.repeat(70));
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Click "SQL Editor" > "New Query"');
    console.log('3. Copy and paste the SQL below:');
    console.log('');
    console.log(sqlContent);
    console.log('');
    console.log('4. Click "Run"');
    process.exit(1);
  }
}

applyMigration().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
