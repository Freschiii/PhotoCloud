import express from 'express'
import cors from 'cors'
import play from 'play-dl'

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
  res.json({ status: 'ok', service: 'YouTube Downloader API (play-dl engine)', port: PORT })
})

app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body
    if (!url || !play.yt_validate(url)) {
      return res.status(400).json({ error: 'URL do YouTube inválida ou não fornecida.' })
    }

    const info = await play.video_info(url)
    const title = info.video_details.title
    const duration = info.video_details.durationInSec
    const thumbnails = info.video_details.thumbnails
    const bestThumbnail = thumbnails[thumbnails.length - 1]?.url

    const formats = (info.format || []).map(f => ({
      qualityLabel: f.qualityLabel || (f.mimeType?.includes('audio') ? 'Áudio' : 'Auto'),
      container: f.container || 'mp4',
      hasVideo: Boolean(f.qualityLabel || f.mimeType?.includes('video')),
      hasAudio: Boolean(f.audioBitrate || f.mimeType?.includes('audio')),
      url: f.url
    }))

    const videoFormats = formats.filter(f => f.hasVideo)
    const audioFormats = formats.filter(f => !f.hasVideo && f.hasAudio)

    res.json({
      title,
      duration,
      thumbnail: bestThumbnail,
      videoId: info.video_details.id,
      maxQuality: videoFormats[0]?.qualityLabel || '1080p',
      videoFormats: videoFormats.slice(0, 8),
      audioFormats: audioFormats.slice(0, 4)
    })
  } catch (err) {
    console.error('Erro ao obter informações do vídeo:', err)
    res.status(500).json({ error: 'Falha ao analisar vídeo do YouTube: ' + err.message })
  }
})

app.get('/api/download', async (req, res) => {
  try {
    const { url, quality, isAudio } = req.query

    if (!url || !play.yt_validate(url)) {
      return res.status(400).send('URL do YouTube inválida.')
    }

    const info = await play.video_info(url)
    const title = sanitizeFilename(info.video_details.title)

    const isAudioOnly = isAudio === 'true' || quality === 'audio'

    if (isAudioOnly) {
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`)
    } else {
      res.setHeader('Content-Type', 'video/mp4')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp4"`)
    }

    // Tenta pegar o stream nativo do play-dl
    const sourceStream = await play.stream(url, {
      quality: isAudioOnly ? 0 : (quality === '720' ? 1 : 2)
    })

    if (sourceStream && sourceStream.stream) {
      sourceStream.stream.on('error', (err) => {
        console.error('Erro no stream play-dl:', err)
        if (!res.headersSent) res.status(500).send('Erro na transmissão do arquivo.')
      })

      return sourceStream.stream.pipe(res)
    }

    res.status(500).send('Não foi possível gerar a transmissão do vídeo.')
  } catch (err) {
    console.error('Erro no endpoint de download:', err)
    if (!res.headersSent) {
      res.status(500).send('Falha ao efetuar o download: ' + err.message)
    }
  }
})

app.listen(PORT, () => {
  console.log(`🚀 YouTube Downloader API (play-dl) rodando na porta ${PORT}`)
})
