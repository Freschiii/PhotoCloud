import ytdl from '@distube/ytdl-core'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' })
  }

  try {
    const { url } = req.body || {}
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'URL do YouTube inválida ou não fornecida.' })
    }

    const info = await ytdl.getInfo(url)
    const title = info.videoDetails.title
    const duration = info.videoDetails.lengthSeconds
    const thumbnails = info.videoDetails.thumbnails
    const bestThumbnail = thumbnails[thumbnails.length - 1]?.url

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

    const videoFormats = formats
      .filter(f => f.hasVideo)
      .sort((a, b) => b.height - a.height)

    const audioFormats = formats
      .filter(f => f.hasAudio && !f.hasVideo)
      .sort((a, b) => b.bitrate - a.bitrate)

    res.status(200).json({
      title,
      duration,
      thumbnail: bestThumbnail,
      videoId: info.videoDetails.videoId,
      maxQuality: videoFormats[0]?.qualityLabel || '1080p',
      videoFormats: videoFormats.slice(0, 8),
      audioFormats: audioFormats.slice(0, 4)
    })
  } catch (err) {
    console.error('Erro no Vercel Handler /api/info:', err)
    res.status(500).json({ error: 'Não foi possível extrair dados do vídeo: ' + err.message })
  }
}
