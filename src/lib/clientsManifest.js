// Build-time manifest using import.meta.glob over src/assets/clientes
// This indexes all client folders and image files into a JS structure bundled with the app.

// Import all image files as URLs
const imageModules = import.meta.glob('/src/assets/clientes/**/*.{jpg,jpeg,png,webp,gif}', {
  eager: true,
})

// Import all txt files (Nome/Senha) as raw text
const txtModules = import.meta.glob('/src/assets/clientes/**/*.txt', {
  eager: true,
  as: 'raw',
})

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// Build entries per folder
const folderToFiles = new Map()
for (const fullPath in imageModules) {
  // fullPath example: /src/assets/clientes/igreja/IMG_0001.jpg
  const parts = fullPath.split('/')
  const folderIndex = parts.indexOf('clientes') + 1
  const folder = parts[folderIndex]
  const file = parts[parts.length - 1]
  const url = imageModules[fullPath].default || imageModules[fullPath]
  if (!folderToFiles.has(folder)) folderToFiles.set(folder, [])
  folderToFiles.get(folder).push({ name: file.replace(/\.[^.]+$/, ''), file, src: url })
}

const folderToMeta = new Map()
for (const fullPath in txtModules) {
  const parts = fullPath.split('/')
  const folderIndex = parts.indexOf('clientes') + 1
  const folder = parts[folderIndex]
  const raw = txtModules[fullPath] || ''
  const lines = String(raw)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  let name = ''
  let password = ''
  for (const line of lines) {
    if (line.toLowerCase().startsWith('nome:')) name = line.substring(5).trim()
    else if (line.toLowerCase().startsWith('senha:')) password = line.substring(6).trim()
  }
  folderToMeta.set(folder, { name, password })
}

// Build final manifest list
const clients = []
for (const [folder, files] of folderToFiles.entries()) {
  const meta = folderToMeta.get(folder) || { name: folder, password: '' }
  files.sort((a, b) => a.name.localeCompare(b.name))
  clients.push({
    id: slugify(folder),
    folder,
    name: meta.name || folder,
    password: meta.password || '',
    files,
    imageCount: files.length,
  })
}

// Index by id and by folder for quick access
const byId = new Map(clients.map((c) => [c.id, c]))
const byFolder = new Map(clients.map((c) => [c.folder, c]))

export function getAllClients() {
  return clients.slice()
}

export function getClientById(idOrFolder) {
  return byId.get(idOrFolder) || byFolder.get(idOrFolder) || null
}

export function getClientImages(idOrFolder) {
  const c = getClientById(idOrFolder)
  return c ? c.files.slice() : []
}


