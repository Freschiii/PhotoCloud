import express from 'express'
import cors from 'cors'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

function sanitizeFilename(name) {
  return (name || 'youtube_video')
    .replace(/[^\w\s\-\.\u00C0-\u00FF]/gi, '')
    .trim()
    .slice(0, 100) || 'video'
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'YouTube Downloader API (yt-dlp engine)', port: PORT })
})

app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body
    if (!url) {
      return res.status(400).json({ error: 'URL do YouTube não fornecida.' })
    }

    const cmd = `yt-dlp -J --no-playlist "${url}"`
    const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 })
    const info = JSON.parse(stdout)

    const title = info.title || 'Vídeo do YouTube'
    const duration = info.duration || 0
    const thumbnail = info.thumbnail || `https://img.youtube.com/vi/${info.id}/maxresdefault.jpg`

    res.json({
      title,
      duration,
      thumbnail,
      videoId: info.id,
      maxQuality: '1080p Full HD'
    })
  } catch (err) {
    console.error('Erro no /api/info:', err)
    res.status(500).json({ error: 'Falha ao analisar informações do vídeo. ' + err.message })
  }
})

app.get('/api/download', async (req, res) => {
  try {
    const { url, quality, isAudio } = req.query

    if (!url) {
      return res.status(400).send('URL do YouTube inválida.')
    }

    const isAudioOnly = isAudio === 'true' || quality === 'audio'

    // Obtém o título
    let title = 'video'
    try {
      const infoCmd = `yt-dlp --get-title "${url}"`
      const { stdout } = await execAsync(infoCmd)
      title = sanitizeFilename(stdout.trim())
    } catch {}

    // Seleciona o formato adequado via yt-dlp
    let formatArg = '-f "b"'
    if (isAudioOnly) {
      formatArg = '-f "ba/b"'
    } else if (quality === '720') {
      formatArg = '-f "b[height<=720]/b"'
    } else if (quality === '480') {
      formatArg = '-f "b[height<=480]/b"'
    }

    const cmd = `yt-dlp -g ${formatArg} --extractor-args "youtube:player_client=android" "${url}"`
    const { stdout } = await execAsync(cmd)
    const directUrl = stdout.trim().split('\n').filter(u => u.startsWith('http'))[0]

    if (!directUrl) {
      return res.status(500).send('Não foi possível obter a URL direta de transmissão.')
    }

    // Define cabeçalhos de download direto
    if (isAudioOnly) {
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`)
    } else {
      res.setHeader('Content-Type', 'video/mp4')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp4"`)
    }

    // Faz a transmissão dos dados com STATUS 200 OK
    const videoStream = await fetch(directUrl)
    if (videoStream.ok && videoStream.body) {
      if (videoStream.headers.get('content-length')) {
        res.setHeader('Content-Length', videoStream.headers.get('content-length'))
      }

      const reader = videoStream.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
      return res.end()
    }

    res.status(500).send('Erro ao ler a transmissão do vídeo.')
  } catch (err) {
    console.error('Erro no /api/download:', err)
    if (!res.headersSent) {
      res.status(500).send('Falha ao processar download: ' + err.message)
    }
  }
})

app.listen(PORT, () => {
  console.log(`🚀 YouTube Downloader API (yt-dlp engine) rodando na porta ${PORT}`)
})

