import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd())
const clientesDir = path.join(root, 'public', 'clientes')
const manifestPath = path.join(clientesDir, 'manifest.json')

function safeRead(filePath) {
  try { return fs.readFileSync(filePath, 'utf8') } catch { return null }
}

function readTxtMeta(txt) {
  const meta = { name: '', password: '', folder: '' }
  if (!txt) return meta
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    if (line.startsWith('Nome:')) meta.name = line.substring(5).trim()
    else if (line.startsWith('Senha:')) meta.password = line.substring(6).trim()
    else if (line.startsWith('Pasta:')) meta.folder = line.substring(6).trim()
  }
  return meta
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function main() {
  if (!fs.existsSync(clientesDir)) {
    console.error('[manifest] public/clientes not found')
    process.exit(0)
  }

  const entries = []

  // Map from Pasta defined in X.txt files (1..200)
  const mappedFolders = new Map()
  for (let i = 1; i <= 200; i++) {
    const p = path.join(clientesDir, `${i}.txt`)
    if (!fs.existsSync(p)) continue
    const meta = readTxtMeta(safeRead(p))
    if (meta.folder) mappedFolders.set(meta.folder, { name: meta.name, password: meta.password })
  }

  const dirents = fs.readdirSync(clientesDir, { withFileTypes: true })
  for (const d of dirents) {
    if (!d.isDirectory()) continue
    const folder = d.name
    const absFolder = path.join(clientesDir, folder)
    const files = fs.readdirSync(absFolder)
      .filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f))
      .sort()

    const folderTxt = safeRead(path.join(absFolder, `${folder}.txt`))
    const folderMeta = readTxtMeta(folderTxt)

    const mapped = mappedFolders.get(folder) || {}
    const name = folderMeta.name || mapped.name || folder
    const password = folderMeta.password || mapped.password || ''

    entries.push({
      id: slugify(folder),
      folder,
      name,
      password,
      files,
      imageCount: files.length,
    })
  }

  const manifest = { generatedAt: new Date().toISOString(), clients: entries }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
  console.log(`[manifest] wrote ${manifest.clients.length} clients -> ${manifestPath}`)
}

main()


