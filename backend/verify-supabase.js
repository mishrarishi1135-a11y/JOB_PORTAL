/**
 * Supabase & Project Integration Diagnostic Tool
 * 
 * This script verifies all files, environment configurations, and integrations
 * with Supabase (both Database and Storage), Clerk, and Sentry.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI Terminal Styling
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bgGray: '\x1b[100m',
  fgWhite: '\x1b[97m'
};

const statusIcons = {
  success: '🟢 [PASSED]',
  failed: '🔴 [FAILED]',
  warning: '🟡 [WARNING]',
  info: '🔵 [INFO]'
};

console.log(`${colors.bold}${colors.cyan}====================================================`);
console.log(`         Hiresphere Supabase & Files Diagnostic Deck`);
console.log(`====================================================${colors.reset}\n`);

// Helper to print section titles
function printSection(title) {
  console.log(`\n${colors.bold}${colors.magenta}--- ${title} ---${colors.reset}\n`);
}

// 1. Verify Environment Files
printSection('Checking Environment Configurations (.env)');

const backendEnvPath = path.join(__dirname, '.env');
const frontendEnvPath = path.join(__dirname, '../frontend/.env');

let backendEnv = {};
let frontendEnv = {};

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
  return env;
}

backendEnv = parseEnvFile(backendEnvPath);
frontendEnv = parseEnvFile(frontendEnvPath);

// Backend checks
if (backendEnv) {
  console.log(`${statusIcons.success} Backend .env file found.`);
  
  const requiredBackendKeys = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];
  
  requiredBackendKeys.forEach(key => {
    if (backendEnv[key]) {
      const displayVal = (key.includes('KEY') || key.includes('URL')) && backendEnv[key].length > 15
        ? `${backendEnv[key].substring(0, 8)}...${backendEnv[key].slice(-4)}`
        : backendEnv[key];
      console.log(`   [✓] ${key}: ${colors.green}${displayVal}${colors.reset}`);
    } else {
      if (key === 'SUPABASE_KEY') {
        console.log(`   [✗] ${key}: ${colors.red}MISSING${colors.reset} (Required for resume uploads in storage middleware!)`);
      } else {
        console.log(`   [✗] ${key}: ${colors.red}MISSING${colors.reset}`);
      }
    }
  });
} else {
  console.log(`${statusIcons.failed} Backend .env file NOT found at ${backendEnvPath}`);
}

// Frontend checks
if (frontendEnv) {
  console.log(`\n${statusIcons.success} Frontend .env file found.`);
  const requiredFrontendKeys = [
    'VITE_CLERK_PUBLISHABLE_KEY',
    'VITE_API_URL'
  ];
  
  requiredFrontendKeys.forEach(key => {
    if (frontendEnv[key]) {
      console.log(`   [✓] ${key}: ${colors.green}${frontendEnv[key]}${colors.reset}`);
    } else {
      console.log(`   [✗] ${key}: ${colors.red}MISSING${colors.reset}`);
    }
  });
} else {
  console.log(`\n${statusIcons.warning} Frontend .env file NOT found at ${frontendEnvPath}`);
}

// 2. Validate Prisma Schema & Client
printSection('Validating Prisma Database Schema');

try {
  const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    console.log(`${statusIcons.success} schema.prisma found at ${schemaPath}`);
    
    // Check if client is generated
    const nodeModulesPrisma = path.join(__dirname, 'node_modules/@prisma/client');
    if (fs.existsSync(nodeModulesPrisma)) {
      console.log(`${statusIcons.success} Prisma Client is generated in node_modules.`);
    } else {
      console.log(`${statusIcons.warning} Prisma Client is NOT generated. Run: npm run postinstall`);
    }
  } else {
    console.log(`${statusIcons.failed} prisma/schema.prisma NOT found!`);
  }
} catch (err) {
  console.log(`${statusIcons.failed} Error checking schema: ${err.message}`);
}

// 3. Test Database Connectivity
printSection('Testing Supabase Database Connections');

const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  if (!backendEnv || !backendEnv.DATABASE_URL) {
    console.log(`${statusIcons.failed} Cannot test DB connection: DATABASE_URL is missing in .env`);
    return;
  }

  // Parse project ref
  let projectRef = 'berbfnmflhhdnkuvysoz';
  let password = 'ANUJ%404321%23123'; // parsed from DATABASE_URL
  const match = backendEnv.DATABASE_URL.match(/postgres:\/\/postgres:([^@]+)@/);
  if (match) {
    password = match[1];
  }
  
  const hostMatch = backendEnv.DATABASE_URL.match(/@([^:/]+)/);
  if (hostMatch) {
    const host = hostMatch[1];
    const refMatch = host.match(/db\.([^.]+)\.supabase/);
    if (refMatch) {
      projectRef = refMatch[1];
    }
  }

  // Test Direct Connection
  console.log(`\nTesting Direct Connection String (Port 5432):`);
  const directClient = new PrismaClient({
    datasources: { db: { url: backendEnv.DATABASE_URL } }
  });
  try {
    await directClient.$queryRaw`SELECT 1`;
    console.log(`   ${colors.green}✅ CONNECTED SUCCESSFULLY via Direct Connection!${colors.reset}`);
  } catch (err) {
    console.log(`   ${colors.red}❌ FAILED: ${err.message.split('\n')[0]}${colors.reset}`);
    console.log(`      (Note: This direct connection is IPv6-only. If your local network is IPv4-only, this is expected to fail.)`);
  } finally {
    await directClient.$disconnect();
  }

  // Test Pooler Connection - Session Mode
  const poolerSessionUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`;
  console.log(`\nTesting Pooler Session Connection (Port 5432) [IPv4 compatible]:`);
  const poolerSessionClient = new PrismaClient({
    datasources: { db: { url: poolerSessionUrl } }
  });
  try {
    await poolerSessionClient.$queryRaw`SELECT 1`;
    console.log(`   ${colors.green}✅ CONNECTED SUCCESSFULLY via Pooler Session Mode!${colors.reset}`);
    console.log(`   ${colors.bold}${colors.yellow}💡 Recommendation: Update your DATABASE_URL in .env to use this pooler URL for IPv4 compatibility!${colors.reset}`);
  } catch (err) {
    console.log(`   ${colors.red}❌ FAILED: ${err.message.split('\n')[0]}${colors.reset}`);
  } finally {
    await poolerSessionClient.$disconnect();
  }

  // Test Pooler Connection - Transaction Mode
  const poolerTxUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?connection_limit=1`;
  console.log(`\nTesting Pooler Transaction Connection (Port 6543) [IPv4 compatible]:`);
  const poolerTxClient = new PrismaClient({
    datasources: { db: { url: poolerTxUrl } }
  });
  try {
    await poolerTxClient.$queryRaw`SELECT 1`;
    console.log(`   ${colors.green}✅ CONNECTED SUCCESSFULLY via Pooler Transaction Mode!${colors.reset}`);
  } catch (err) {
    console.log(`   ${colors.red}❌ FAILED: ${err.message.split('\n')[0]}${colors.reset}`);
  } finally {
    await poolerTxClient.$disconnect();
  }
}

// 4. Test Supabase Storage & Client
async function testStorage() {
  printSection('Testing Supabase Storage Configuration');
  
  const supabaseUrl = backendEnv?.SUPABASE_URL;
  const supabaseKey = backendEnv?.SUPABASE_KEY;

  if (!supabaseUrl) {
    console.log(`${statusIcons.failed} SUPABASE_URL is missing in backend .env`);
    return;
  }

  if (!supabaseKey) {
    console.log(`${statusIcons.failed} SUPABASE_KEY is missing in backend .env`);
    console.log(`   (You need to set SUPABASE_KEY to your Supabase service_role or anon key in backend/.env)`);
    return;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`${statusIcons.info} Initializing Supabase client with URL: ${supabaseUrl}`);
    
    // Check connection by listing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log(`${statusIcons.failed} Failed to authenticate/list storage buckets: ${error.message}`);
      return;
    }

    console.log(`${statusIcons.success} Authenticated to Supabase storage successfully.`);
    console.log(`   Available Buckets:`);
    buckets.forEach(b => {
      console.log(`   - Name: ${colors.bold}${b.name}${colors.reset} (Public: ${b.public})`);
    });

    const hasResumes = buckets.some(b => b.name === 'resumes');
    if (hasResumes) {
      console.log(`   ${colors.green}✅ "resumes" bucket exists and is ready for upload.${colors.reset}`);
    } else {
      console.log(`   ${colors.red}❌ "resumes" bucket NOT found! Please create a bucket named "resumes" in your Supabase storage dashboard.${colors.reset}`);
    }
  } catch (err) {
    console.log(`${statusIcons.failed} Storage Test Error: ${err.message}`);
  }
}

// 5. Codebase Alignment Checks (Prisma ORM vs Mongoose ODM)
printSection('Checking Codebase Database Engine Alignment');

function checkCodebaseEngine() {
  const srcPath = path.join(__dirname, 'src');
  if (!fs.existsSync(srcPath)) {
    console.log(`${statusIcons.warning} src folder not found.`);
    return;
  }

  // Count files using prisma vs mongoose
  let prismaUses = [];
  let mongooseUses = [];

  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file !== 'node_modules') scanDir(fullPath);
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relative = path.relative(__dirname, fullPath);
        if (content.includes('require(\'../config/prisma\')') || content.includes('require(\'./config/prisma\')')) {
          prismaUses.push(relative);
        }
        if (content.includes('mongoose.model') || content.includes('require(\'mongoose\')')) {
          mongooseUses.push(relative);
        }
      }
    });
  }

  scanDir(srcPath);

  console.log(`${statusIcons.info} Prisma Engine usage detected in ${prismaUses.length} file(s):`);
  prismaUses.forEach(f => console.log(`   - ${f}`));

  console.log(`\n${statusIcons.info} Legacy Mongoose/MongoDB code detected in ${mongooseUses.length} file(s):`);
  mongooseUses.forEach(f => {
    // Check if it's just the schema definition or active database connection
    if (f.startsWith('src\\models') || f.startsWith('src/models')) {
      console.log(`   - ${f} ${colors.yellow}(Schema Definition - unused if routing to Prisma)${colors.reset}`);
    } else {
      console.log(`   - ${f} ${colors.red}(Potential engine mismatch!)${colors.reset}`);
    }
  });

  const dbConfigPath = path.join(__dirname, 'src/config/db.js');
  if (fs.existsSync(dbConfigPath)) {
    console.log(`\n${statusIcons.warning} Legacy db.js (MongoDB Mongoose connection) exists at ${dbConfigPath}`);
  }
}

async function run() {
  await testDatabase();
  await testStorage();
  checkCodebaseEngine();
  console.log(`\n${colors.bold}${colors.cyan}====================================================`);
  console.log(`               Diagnostics Complete`);
  console.log(`====================================================${colors.reset}\n`);
}

run().catch(console.error);
