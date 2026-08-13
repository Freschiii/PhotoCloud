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

    const cmd = `yt-dlp -J --extractor-args "youtube:formats=missing_pot" --no-playlist "${url}"`
    const { stdout } = await execAsync(cmd, { maxBuffer: 20 * 1024 * 1024 })
    const info = JSON.parse(stdout)

    const formats = info.formats || []
    const resolutionsMap = new Map()

    formats.forEach(f => {
      if (f.height && f.vcodec !== 'none') {
        const height = f.height
        const key = height >= 2160 ? '2160' :
                    height >= 1440 ? '1440' :
                    height >= 1080 ? '1080' :
                    height >= 720  ? '720' :
                    height >= 480  ? '480' : String(height)

        const label = height >= 2160 ? '🚀 4K Ultra HD (2160p 60fps)' :
                      height >= 1440 ? '🎬 2K Quad HD (1440p)' :
                      height >= 1080 ? '📺 1080p Full HD' :
                      height >= 720  ? '📹 720p HD' :
                      height >= 480  ? '📱 480p SD' : `${height}p`

        const sub = height >= 2160 ? 'Qualidade Máxima Ultra HD (3840x2160)' :
                    height >= 1440 ? 'Alta Definição 2K (2560x1440)' :
                    height >= 1080 ? 'Full HD padrão (1920x1080)' :
                    height >= 720  ? 'HD otimizado (1280x720)' : 'Resolução padrão'

        if (!resolutionsMap.has(key)) {
          resolutionsMap.set(key, {
            id: key,
            height: height,
            label,
            sub
          })
        }
      }
    })

    const availableQualities = Array.from(resolutionsMap.values()).sort((a, b) => b.height - a.height)
    
    availableQualities.push({
      id: 'audio',
      height: 0,
      label: '🎵 Apenas Áudio (MP3)',
      sub: 'High Bitrate 320kbps (AAC/MP3)'
    })

    res.status(200).json({
      title: info.title || 'Vídeo do YouTube',
      duration: info.duration || 0,
      thumbnail: info.thumbnail || `https://img.youtube.com/vi/${info.id}/maxresdefault.jpg`,
      videoId: info.id,
      availableQualities
    })
  } catch (err) {
    console.error('Erro no Vercel Handler /api/info:', err)
    res.status(500).json({ error: 'Não foi possível extrair dados do vídeo: ' + err.message })
  }
}


