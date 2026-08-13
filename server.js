import express from 'express'
import cors from 'cors'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

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
  res.json({ status: 'ok', service: 'YouTube Downloader API (yt-dlp + ffmpeg 4K Engine)', port: PORT })
})

app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body
    if (!url) {
      return res.status(400).json({ error: 'URL do YouTube não fornecida.' })
    }

    const cmd = `python -m yt_dlp --js-runtimes node -J --no-playlist "${url}"`
    const { stdout } = await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 })
    const info = JSON.parse(stdout)

    const title = info.title || 'Vídeo do YouTube'
    const duration = info.duration || 0
    const thumbnail = info.thumbnail || `https://img.youtube.com/vi/${info.id}/maxresdefault.jpg`

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

    res.json({
      title,
      duration,
      thumbnail,
      videoId: info.id,
      availableQualities
    })
  } catch (err) {
    console.error('Erro no /api/info:', err)
    res.status(500).json({ error: 'Falha ao analisar informações do vídeo. ' + err.message })
  }
})

app.get('/api/download', async (req, res) => {
  const tempId = `temp_dl_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const tempFile = path.resolve(`./${tempId}.mp4`)
  const tempMp3 = path.resolve(`./${tempId}.mp3`)

  try {
    const { url, quality, isAudio } = req.query

    if (!url) {
      return res.status(400).send('URL do YouTube não fornecida.')
    }

    const isAudioOnly = isAudio === 'true' || quality === 'audio'

    let title = 'youtube_video'
    try {
      const infoCmd = `python -m yt_dlp --js-runtimes node --get-title "${url}"`
      const { stdout } = await execAsync(infoCmd)
      title = sanitizeFilename(stdout.trim())
    } catch {}

    let formatArg = ''
    let targetPath = tempFile

    if (isAudioOnly) {
      formatArg = `-f "bestaudio/best" -x --audio-format mp3 -o "${tempMp3}"`
      targetPath = tempMp3
    } else {
      const height = parseInt(quality) || 0
      if (height > 0) {
        formatArg = `-f "bestvideo[height<=${height}]+bestaudio/best" --merge-output-format mp4 --postprocessor-args "ffmpeg:-c:v libx264 -c:a aac -pix_fmt yuv420p" -o "${tempFile}"`
      } else {
        formatArg = `-f "bestvideo+bestaudio/best" --merge-output-format mp4 --postprocessor-args "ffmpeg:-c:v libx264 -c:a aac -pix_fmt yuv420p" -o "${tempFile}"`
      }
    }

    const cmd = `python -m yt_dlp --js-runtimes node ${formatArg} "${url}"`
    await execAsync(cmd, { maxBuffer: 150 * 1024 * 1024 })

    if (!fs.existsSync(targetPath)) {
      return res.status(500).send('Não foi possível gerar o arquivo de mídia na qualidade solicitada.')
    }

    const stats = fs.statSync(targetPath)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Content-Length', stats.size)

    if (isAudioOnly) {
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`)
    } else {
      res.setHeader('Content-Type', 'video/mp4')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp4"`)
    }

    const fileStream = fs.createReadStream(targetPath)
    fileStream.pipe(res)

    res.on('finish', () => {
      try {
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath)
      } catch {}
    })

  } catch (err) {
    console.error('Erro no /api/download:', err)
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
      if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3)
    } catch {}

    if (!res.headersSent) {
      res.status(500).send('Falha ao processar download na resolução desejada: ' + err.message)
    }
  }
})

app.listen(PORT, () => {
  console.log(`🚀 YouTube Downloader API (yt-dlp + ffmpeg 4K Engine) rodando na porta ${PORT}`)
})


