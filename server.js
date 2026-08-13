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

    const cmd = `yt-dlp -J --extractor-args "youtube:formats=missing_pot" --no-playlist "${url}"`
    const { stdout } = await execAsync(cmd, { maxBuffer: 15 * 1024 * 1024 })
    const info = JSON.parse(stdout)

    const title = info.title || 'Vídeo do YouTube'
    const duration = info.duration || 0
    const thumbnail = info.thumbnail || `https://img.youtube.com/vi/${info.id}/maxresdefault.jpg`

    res.json({
      title,
      duration,
      thumbnail,
      videoId: info.id,
      maxQuality: '4K / 1080p 60fps'
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
      const infoCmd = `yt-dlp --get-title "${url}"`
      const { stdout } = await execAsync(infoCmd)
      title = sanitizeFilename(stdout.trim())
    } catch {}

    let formatArg = ''
    let targetPath = tempFile

    if (isAudioOnly) {
      formatArg = `-f "bestaudio/best" -x --audio-format mp3 -o "${tempMp3}"`
      targetPath = tempMp3
    } else if (quality === '720') {
      formatArg = `-f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best" --merge-output-format mp4 -o "${tempFile}"`
    } else if (quality === '1080') {
      formatArg = `-f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best" --merge-output-format mp4 -o "${tempFile}"`
    } else {
      // MAX / 4K / 60FPS
      formatArg = `-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best" --merge-output-format mp4 -o "${tempFile}"`
    }

    const cmd = `yt-dlp ${formatArg} --extractor-args "youtube:formats=missing_pot" "${url}"`
    await execAsync(cmd, { maxBuffer: 30 * 1024 * 1024 })

    if (!fs.existsSync(targetPath)) {
      return res.status(500).send('Não foi possível gerar o arquivo de mídia em alta qualidade.')
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
      res.status(500).send('Falha ao processar download em alta resolução: ' + err.message)
    }
  }
})

app.listen(PORT, () => {
  console.log(`🚀 YouTube Downloader API (yt-dlp + ffmpeg 4K Engine) rodando na porta ${PORT}`)
})


