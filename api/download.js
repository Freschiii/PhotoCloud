import play from 'play-dl'

function sanitizeFilename(name) {
  return (name || 'youtube_video')
    .replace(/[^\w\s\-\.\u00C0-\u00FF]/gi, '')
    .trim()
    .slice(0, 100) || 'video'
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { url, quality, isAudio } = req.query || {}

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
    console.error('Erro no Vercel Handler /api/download:', err)
    if (!res.headersSent) {
      res.status(500).send('Falha ao processar download: ' + err.message)
    }
  }
}


