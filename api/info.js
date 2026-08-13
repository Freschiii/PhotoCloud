import play from 'play-dl'

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

    res.status(200).json({
      title,
      duration,
      thumbnail: bestThumbnail,
      videoId: info.video_details.id,
      maxQuality: videoFormats[0]?.qualityLabel || '1080p',
      videoFormats: videoFormats.slice(0, 8),
      audioFormats: audioFormats.slice(0, 4)
    })
  } catch (err) {
    console.error('Erro no Vercel Handler /api/info:', err)
    res.status(500).json({ error: 'Não foi possível extrair dados do vídeo: ' + err.message })
  }
}

