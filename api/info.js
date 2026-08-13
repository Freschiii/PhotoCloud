import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { url } = req.body || {}
    if (!url) {
      return res.status(400).json({ error: 'URL do YouTube não fornecida.' })
    }

    const cmd = `yt-dlp -J --extractor-args "youtube:player_client=android" --no-playlist "${url}"`
    const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 })
    const info = JSON.parse(stdout)

    res.status(200).json({
      title: info.title || 'Vídeo do YouTube',
      duration: info.duration || 0,
      thumbnail: info.thumbnail || `https://img.youtube.com/vi/${info.id}/maxresdefault.jpg`,
      videoId: info.id,
      maxQuality: '1080p Full HD'
    })
  } catch (err) {
    console.error('Erro no Vercel Handler /api/info:', err)
    res.status(500).json({ error: 'Não foi possível extrair dados do vídeo: ' + err.message })
  }
}


