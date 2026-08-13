import ytdl from '@distube/ytdl-core'

function sanitizeFilename(name) {
  return (name || 'youtube_video')
    .replace(/[^\w\s\-\.\u00C0-\u00FF]/gi, '')
    .trim()
    .slice(0, 100) || 'video'
}

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

  try {
    const { url, quality, itag, isAudio } = req.query || {}

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

    ytdl(url, formatOptions)
      .on('error', (err) => {
        console.error('Erro no ytdl stream:', err)
        if (!res.headersSent) {
          res.status(500).send('Erro ao processar stream do vídeo.')
        }
      })
      .pipe(res)
  } catch (err) {
    console.error('Erro no Vercel Handler /api/download:', err)
    if (!res.headersSent) {
      res.status(500).send('Falha ao processar download.')
    }
  }
}
