#!/usr/bin/env node

// 部署前檢查腳本
// 使用方法: node scripts/deploy-check.js

const fs = require('fs')

console.log('🔍 YYSelection 部署前檢查\n')

const checks = []

// 檢查必要檔案
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath)
  checks.push({
    name: description,
    status: exists ? '✅' : '❌',
    message: exists ? '存在' : '缺少'
  })
  return exists
}

// 檢查環境變數範例
function checkEnvExample() {
  const envExamplePath = '.env.example'
  if (!fs.existsSync(envExamplePath)) {
    checks.push({
      name: '環境變數範例檔案',
      status: '❌',
      message: '缺少 .env.example'
    })
    return false
  }

  const content = fs.readFileSync(envExamplePath, 'utf8')
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL', 
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'ADMIN_EMAIL'
  ]

  const missingVars = requiredVars.filter(varName => !content.includes(varName))
  
  if (missingVars.length === 0) {
    checks.push({
      name: '環境變數範例檔案',
      status: '✅',
      message: '包含所有必要變數'
    })
    return true
  } else {
    checks.push({
      name: '環境變數範例檔案',
      status: '❌',
      message: `缺少: ${missingVars.join(', ')}`
    })
    return false
  }
}

// 檢查 Prisma schema
function checkPrismaSchema() {
  const schemaPath = 'prisma/schema.prisma'
  if (!fs.existsSync(schemaPath)) {
    checks.push({
      name: 'Prisma Schema',
      status: '❌',
      message: '缺少 schema.prisma'
    })
    return false
  }

  const content = fs.readFileSync(schemaPath, 'utf8')
  const isPostgreSQL = content.includes('provider = "postgresql"')
  
  checks.push({
    name: 'Prisma Schema 資料庫類型',
    status: isPostgreSQL ? '✅' : '❌',
    message: isPostgreSQL ? 'PostgreSQL' : '請改為 PostgreSQL'
  })
  
  return isPostgreSQL
}

// 檢查硬編碼問題
function checkHardcodedIssues() {
  const authFilePath = 'src/lib/auth.ts'
  if (!fs.existsSync(authFilePath)) {
    checks.push({
      name: '硬編碼檢查',
      status: '❌',
      message: '找不到 auth.ts'
    })
    return false
  }

  const content = fs.readFileSync(authFilePath, 'utf8')
  const hasHardcodedEmail = content.includes('@gmail.com') && !content.includes('process.env.ADMIN_EMAIL')
  
  checks.push({
    name: '硬編碼檢查 (ADMIN_EMAIL)',
    status: hasHardcodedEmail ? '❌' : '✅',
    message: hasHardcodedEmail ? '發現硬編碼 email' : '已使用環境變數'
  })
  
  return !hasHardcodedEmail
}

// 檢查 package.json 腳本
function checkPackageScripts() {
  const packagePath = 'package.json'
  if (!fs.existsSync(packagePath)) {
    checks.push({
      name: 'Package.json',
      status: '❌',
      message: '缺少 package.json'
    })
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  const hasPostinstall = packageJson.scripts && packageJson.scripts.postinstall
  const buildScript = packageJson.scripts && packageJson.scripts.build
  const hasPrismaGenerate = buildScript && buildScript.includes('prisma generate')
  
  checks.push({
    name: 'Build 腳本設定',
    status: hasPrismaGenerate ? '✅' : '❌',
    message: hasPrismaGenerate ? '包含 prisma generate' : '缺少 prisma generate'
  })
  
  checks.push({
    name: 'Postinstall 腳本',
    status: hasPostinstall ? '✅' : '❌',
    message: hasPostinstall ? '已設定' : '建議新增'
  })
  
  return hasPrismaGenerate
}

// 執行所有檢查
async function runChecks() {
  console.log('📁 檢查必要檔案...')
  checkFile('.env.example', '環境變數範例檔案')
  checkFile('vercel.json', 'Vercel 配置檔案')
  checkFile('next.config.ts', 'Next.js 配置檔案')
  checkFile('prisma/schema.prisma', 'Prisma Schema')
  checkFile('.gitignore', 'Git 忽略檔案')
  
  console.log('\n🔧 檢查配置...')
  checkEnvExample()
  checkPrismaSchema()
  checkHardcodedIssues()
  checkPackageScripts()
  
  console.log('\n📋 檢查結果:')
  console.log('='.repeat(50))
  
  let allPassed = true
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}: ${check.message}`)
    if (check.status === '❌') allPassed = false
  })
  
  console.log('='.repeat(50))
  
  if (allPassed) {
    console.log('🎉 所有檢查通過！準備部署到 Vercel')
    console.log('\n下一步:')
    console.log('1. git add . && git commit -m "準備部署"')
    console.log('2. git push origin main')
    console.log('3. 在 Vercel 中匯入專案')
    console.log('4. 設定環境變數')
    console.log('5. 部署完成後執行資料庫 migration')
  } else {
    console.log('❌ 發現問題，請修正後再部署')
    console.log('\n請參考 DEPLOYMENT.md 獲取詳細說明')
  }
  
  process.exit(allPassed ? 0 : 1)
}


runChecks().catch(console.error)