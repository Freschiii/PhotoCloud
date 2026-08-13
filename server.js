import express from 'express'
import cors from 'cors'
import ytdl from '@distube/ytdl-core'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Sanitize filename for headers
function sanitizeFilename(name) {
  return (name || 'youtube_video')
    .replace(/[^\w\s\-\.\u00C0-\u00FF]/gi, '')
    .trim()
    .slice(0, 100) || 'video'
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'YouTube Downloader API', port: PORT })
})

// Obter informações e qualidades do vídeo
app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'URL do YouTube inválida ou não fornecida.' })
    }

    const info = await ytdl.getInfo(url)
    const title = info.videoDetails.title
    const duration = info.videoDetails.lengthSeconds
    const thumbnails = info.videoDetails.thumbnails
    const bestThumbnail = thumbnails[thumbnails.length - 1]?.url

    // Filtra qualidades
    const formats = info.formats.map(f => ({
      itag: f.itag,
      qualityLabel: f.qualityLabel || (f.hasAudio && !f.hasVideo ? 'Áudio' : 'Auto'),
      container: f.container,
      hasVideo: f.hasVideo,
      hasAudio: f.hasAudio,
      height: f.height || 0,
      bitrate: f.bitrate || 0,
      url: f.url
    }))

    // Ordena vídeos por altura (resolução) decrescente
    const videoFormats = formats
      .filter(f => f.hasVideo)
      .sort((a, b) => b.height - a.height)

    const audioFormats = formats
      .filter(f => f.hasAudio && !f.hasVideo)
      .sort((a, b) => b.bitrate - a.bitrate)

    res.json({
      title,
      duration,
      thumbnail: bestThumbnail,
      videoId: info.videoDetails.videoId,
      maxQuality: videoFormats[0]?.qualityLabel || '1080p',
      videoFormats: videoFormats.slice(0, 8),
      audioFormats: audioFormats.slice(0, 4)
    })
  } catch (err) {
    console.error('Erro ao buscar informações do vídeo:', err)
    res.status(500).json({ error: 'Não foi possível extrair dados do vídeo. ' + err.message })
  }
})

// Endpoint para streaming e download direto de vídeo/áudio
app.get('/api/download', async (req, res) => {
  try {
    const { url, quality, itag, isAudio } = req.query

    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).send('URL do YouTube inválida.')
    }

    const info = await ytdl.getInfo(url)
    const title = sanitizeFilename(info.videoDetails.title)

    let filterOption = 'videoandaudio'
    let formatOptions = {}

    if (isAudio === 'true' || quality === 'audio') {
      filterOption = 'audioonly'
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`)
    } else {
      filterOption = 'videoandaudio'
      res.setHeader('Content-Type', 'video/mp4')
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`)
    }

    if (itag) {
      formatOptions = { format: info.formats.find(f => String(f.itag) === String(itag)) }
    } else {
      formatOptions = { filter: filterOption, quality: quality === 'max' ? 'highest' : 'highestvideo' }
    }

    // Pipeline de stream direto para o navegador
    ytdl(url, formatOptions)
      .on('error', (err) => {
        console.error('Erro no stream ytdl:', err)
        if (!res.headersSent) {
          res.status(500).send('Erro no processamento do vídeo.')
        }
      })
      .pipe(res)
  } catch (err) {
    console.error('Erro ao efetuar download:', err)
    if (!res.headersSent) {
      res.status(500).send('Falha ao processar download.')
    }
  }
})

app.listen(PORT, () => {
  console.log(`🚀 YouTube Downloader API rodando na porta ${PORT}`)
})
