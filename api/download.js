import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

    if (!url) {
      return res.status(400).send('URL do YouTube não fornecida.')
    }

    const isAudioOnly = isAudio === 'true' || quality === 'audio'

    let title = 'video'
    try {
      const infoCmd = `yt-dlp --get-title "${url}"`
      const { stdout } = await execAsync(infoCmd)
      title = sanitizeFilename(stdout.trim())
    } catch {}

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
      return res.status(500).send('Não foi possível obter a URL de streaming.')
    }

    if (isAudioOnly) {
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`)
    } else {
      res.setHeader('Content-Type', 'video/mp4')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp4"`)
    }

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

    res.status(500).send('Não foi possível realizar o stream da mídia.')
  } catch (err) {
    console.error('Erro no Vercel Handler /api/download:', err)
    if (!res.headersSent) {
      res.status(500).send('Falha ao processar download: ' + err.message)
    }
  }
}



