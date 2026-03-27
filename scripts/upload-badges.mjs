/**
 * Upload badge PNGs to Supabase Storage 'badges' bucket
 * Reads badge-manifest.csv, uploads each PNG to badges/{role}/{filename}
 * Tier0 files go to badges/{role}/tier0/{filename}
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { resolve } from 'path'

const SUPABASE_URL = 'https://uqpjvbiuokwpldjvxiby.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set. Run with:')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=... node scripts/upload-badges.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Read manifest
const csvPath = resolve('badge-manifest.csv')
const csvContent = readFileSync(csvPath, 'utf8')
const manifest = parse(csvContent, { columns: true, skip_empty_lines: true })

console.log(`Manifest loaded: ${manifest.length} rows`)

const results = { uploaded: [], skipped: [], failed: [] }
let uploadCount = 0

async function uploadWithRetry(storagePath, fileBuffer, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { error } = await supabase.storage
      .from('badges')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: true
      })
    if (!error) return { success: true }
    if (attempt < retries) {
      const delay = Math.pow(2, attempt) * 500
      console.warn(`  Retry ${attempt}/${retries} for ${storagePath} (waiting ${delay}ms)`)
      await new Promise(r => setTimeout(r, delay))
    } else {
      return { success: false, error: error.message }
    }
  }
}

for (const row of manifest) {
  const filename = row.output_filename?.trim()
  if (!filename) {
    results.skipped.push({ reason: 'no filename', badge_name: row.badge_name })
    continue
  }

  const localPath = resolve('public', 'badges', filename)
  if (!existsSync(localPath)) {
    results.skipped.push({ reason: 'file not found', filename, badge_name: row.badge_name })
    continue
  }

  const role = row.role?.trim() || 'unknown'
  const isTier0 = row.rarity?.trim() === 'Tier0'
  const storagePath = isTier0
    ? `${role}/tier0/${filename}`
    : `${role}/${filename}`

  const fileBuffer = readFileSync(localPath)
  const result = await uploadWithRetry(storagePath, fileBuffer)

  if (result.success) {
    results.uploaded.push({ filename, storagePath })
    uploadCount++
  } else {
    results.failed.push({ filename, storagePath, error: result.error })
  }

  if (uploadCount % 25 === 0 && uploadCount > 0) {
    console.log(`Progress: ${uploadCount} uploaded, ${results.failed.length} failed, ${results.skipped.length} skipped`)
  }
}

console.log('\n=== UPLOAD COMPLETE ===')
console.log(`Uploaded: ${results.uploaded.length}`)
console.log(`Skipped:  ${results.skipped.length}`)
console.log(`Failed:   ${results.failed.length}`)

if (results.failed.length > 0) {
  console.log('\nFailed uploads:')
  results.failed.forEach(f => console.log(`  ${f.filename}: ${f.error}`))
}

if (results.skipped.length > 0) {
  console.log('\nSkipped (no file on disk):')
  results.skipped.filter(s => s.reason === 'file not found').forEach(s => console.log(`  ${s.filename}`))
}

writeFileSync('upload-results.json', JSON.stringify(results, null, 2))
console.log('\nResults saved to upload-results.json')
