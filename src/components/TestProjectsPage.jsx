import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Download, Play, Music, Video, Sparkles, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'

// --- Experimento 1: YouTube Downloader (Max Quality) ---
function YtDownloader() {
  const [url, setUrl] = useState('')
  const [quality, setQuality] = useState('max') // 'max' | '1080' | '720' | '480' | 'audio'
  const [isAudioOnly, setIsAudioOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusLogs, setStatusLogs] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Extrai ID do vídeo do YouTube para thumbnail e embed
  const extractYtId = (inputUrl) => {
    if (!inputUrl) return null
    try {
      const u = new URL(inputUrl)
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
      if (u.searchParams.get('v')) return u.searchParams.get('v')
      const parts = u.pathname.split('/')
      const idx = parts.findIndex(p => p === 'shorts' || p === 'embed')
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
    } catch {
      // Regex fallback
      const match = inputUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
      return match ? match[1] : null
    }
    return null
  }

  const ytId = extractYtId(url)
  const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null

  const handleDownload = async (e) => {
    if (e) e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)
    setStatusLogs([
      '[01/03] Analisando URL do YouTube...',
      '[02/03] Conectando à API Própria Node.js (http://localhost:4000)...'
    ])

    try {
      // 1. Tenta consultar nossa API própria rodando em localhost:4000
      const localApiUrl = 'http://localhost:4000/api/info'
      const res = await fetch(localApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      if (res.ok) {
        const info = await res.json()
        setStatusLogs(prev => [...prev, '[03/03] ✔ Informações extraídas via API Própria! Gerando link de stream direto...'])

        const directDownloadLink = `http://localhost:4000/api/download?url=${encodeURIComponent(url.trim())}&quality=${quality}&isAudio=${isAudioOnly}`
        
        setResult({
          downloadUrl: directDownloadLink,
          title: info.title,
          thumbnail: info.thumbnail || thumbnailUrl,
          maxQuality: info.maxQuality || quality.toUpperCase(),
          filename: `${info.title || 'video'}.${isAudioOnly || quality === 'audio' ? 'mp3' : 'mp4'}`,
          type: isAudioOnly || quality === 'audio' ? 'audio' : 'video',
          isLocalApi: true
        })
      } else {
        throw new Error('API local retornou erro ou não está rodando na porta 4000.')
      }
    } catch (err) {
      console.warn('API local offline ou inacessível, testando Cobalt API como fallback:', err)
      setStatusLogs(prev => [...prev, '[AVISO] API Local offline. Tentando servidor remoto ou fallback direto...'])

      // Fallback Cobalt / Direct download
      try {
        const resCobalt = await fetch('https://api.cobalt.tools/api/json', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: url.trim(),
            videoQuality: quality === 'audio' ? 'max' : quality,
            isAudioOnly: isAudioOnly || quality === 'audio'
          })
        })
        const data = await resCobalt.json()
        if (resCobalt.ok && data?.url) {
          setStatusLogs(prev => [...prev, '[03/03] ✔ Link extraído com sucesso!'])
          setResult({
            downloadUrl: data.url,
            filename: data.filename || `youtube_${ytId || 'download'}.mp4`,
            type: isAudioOnly || quality === 'audio' ? 'audio' : 'video'
          })
          return
        }
      } catch {}

      // Fallback 2: Link Direto do Servidor Local
      const directFallbackLink = `http://localhost:4000/api/download?url=${encodeURIComponent(url.trim())}&quality=${quality}&isAudio=${isAudioOnly}`
      setResult({
        downloadUrl: directFallbackLink,
        filename: `youtube_${ytId || 'download'}.${isAudioOnly || quality === 'audio' ? 'mp3' : 'mp4'}`,
        type: isAudioOnly || quality === 'audio' ? 'audio' : 'video',
        isLocalApi: true
      })
      setStatusLogs(prev => [...prev, '[03/03] ✔ Link de streaming local gerado (certifique-se que npm run server está rodando).'])
    } finally {
      setLoading(false)
    }
  }

  const triggerDirectDownload = (downloadLink) => {
    if (!downloadLink) return
    window.open(downloadLink, '_blank')
  }

  return (
    <div className="border border-green-900/50 bg-[#0C1118] rounded-xl overflow-hidden shadow-2xl p-6">

      {/* Header do App */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-green-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">YouTube Video Downloader (API Própria)</h2>
            <p className="text-xs text-green-700">Extração nativa via Node.js em 4K, 1080p ou MP3</p>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-1 bg-green-950 text-green-400 border border-green-800 rounded font-mono">
          API PRÓPRIA: PORT 4000
        </span>
      </div>

      {/* Formulário */}
      <form onSubmit={handleDownload} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-green-400 mb-2">
            $ URL DO VÍDEO DO YOUTUBE
          </label>
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Cole aqui a URL (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...)"
              className="w-full px-4 py-3.5 bg-black/60 border border-green-900 text-green-200 placeholder-green-900 rounded-lg focus:outline-none focus:border-green-500 font-mono text-sm transition-all"
              required
            />
            {url && (
              <button
                type="button"
                onClick={() => { setUrl(''); setResult(null); setError(null) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-700 hover:text-green-400"
              >
                LIMPAR
              </button>
            )}
          </div>
        </div>

        {/* Qualidade e Opções */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'max', label: '🚀 MAX (4K / 60FPS)', sub: 'Qualidade máxima disponível' },
            { id: '1080', label: '🎬 1080p Full HD', sub: 'Alta qualidade (padrão)' },
            { id: '720', label: '📺 720p HD', sub: 'Tamanho otimizado' },
            { id: 'audio', label: '🎵 Apenas Áudio (MP3)', sub: 'High Bitrate 320kbps' },
          ].map(q => (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setQuality(q.id)
                setIsAudioOnly(q.id === 'audio')
              }}
              className={`p-3 text-left rounded-lg border transition-all ${
                quality === q.id
                  ? 'border-green-500 bg-green-950/40 text-green-300 shadow-lg'
                  : 'border-green-900/50 bg-black/30 text-green-800 hover:border-green-700 hover:text-green-400'
              }`}
            >
              <div className="text-xs font-bold mb-0.5">{q.label}</div>
              <div className="text-[10px] text-green-700">{q.sub}</div>
            </button>
          ))}
        </div>

        {/* Botão de Processar */}
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className={`w-full py-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-xl ${
            loading || !url.trim()
              ? 'bg-green-950/40 border border-green-900 text-green-900 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-extrabold shadow-green-900/30'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              PROCESSANDO VÍDEO...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              OBTER LINK DE DOWNLOAD
            </>
          )}
        </button>
      </form>

      {/* Logs do Terminal */}
      {statusLogs.length > 0 && (
        <div className="mt-6 p-4 bg-black/70 border border-green-900/40 rounded-lg text-xs font-mono space-y-1">
          <div className="text-green-700 mb-1">// STATUS LOG:</div>
          {statusLogs.map((log, index) => (
            <div key={index} className="text-green-400 flex items-center gap-2">
              <span>{log}</span>
            </div>
          ))}
        </div>
      )}

      {/* Resultado / Preview */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="mt-6 p-5 border border-green-500/40 bg-green-950/20 rounded-xl space-y-4"
          >
            <div className="flex flex-col md:flex-row items-center gap-4">
              {thumbnailUrl && (
                <div className="relative w-full md:w-56 aspect-video bg-black rounded-lg overflow-hidden border border-green-900 shrink-0">
                  <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                    <span className="text-[10px] text-green-400 bg-black/70 px-2 py-0.5 rounded font-mono">
                      ID: {ytId}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-1 space-y-2 text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {result.type === 'audio' ? 'Áudio MP3 Pronto' : `Vídeo ${quality.toUpperCase()} Pronto`}
                </div>
                <h3 className="text-sm font-bold text-white font-mono break-all">
                  {result.filename}
                </h3>
                <p className="text-xs text-green-600">
                  Resolução e áudio otimizados para máxima taxa de bits.
                </p>
              </div>
            </div>

            {/* Botões de Download */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => triggerDirectDownload(result.downloadUrl)}
                className="flex-1 py-3 px-6 rounded-lg bg-green-500 hover:bg-green-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                BAIXAR AGORA ({quality === 'max' ? 'MELHOR QUALIDADE' : quality.toUpperCase()})
              </button>

              {result.picker && result.picker.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {result.picker.slice(1, 4).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => triggerDirectDownload(p.url)}
                      className="px-3 py-2 border border-green-800 text-green-400 hover:bg-green-900/40 text-xs rounded font-mono whitespace-nowrap"
                    >
                      Opção {idx + 2}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Erro */}
      {error && (
        <div className="mt-6 p-4 border border-red-800/60 bg-red-950/30 text-red-400 rounded-lg text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// --- Experimento 2: Canvas Matrix Rain Ampliado ---
function MatrixCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth
      canvas.height = 560
    }
    resize()
    window.addEventListener('resize', resize)

    const chars = '0123456789ABCDEF<>/{};=+$#@!%&'
    const fontSize = 16
    const columns = Math.floor(canvas.width / fontSize)
    const drops = Array(columns).fill(1)

    const draw = () => {
      ctx.fillStyle = 'rgba(8, 12, 16, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#00FF66'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillText(text, x, y)

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative border border-green-900/50 bg-[#0C1118] rounded-xl overflow-hidden shadow-2xl">
      <div className="p-3 border-b border-green-900/40 text-xs text-green-700 flex justify-between items-center select-none">
        <span>// exp_02: matrix_rain.canvas</span>
        <span className="text-green-500 animate-pulse">RUNNING [60 FPS]</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-[560px] block" />
    </div>
  )
}

// --- Componente Principal ---
export default function TestProjectsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('downloader') // 'downloader' | 'matrix'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080C10', fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}>

      {/* Header estilo Terminal */}
      <div className="border-b border-green-900/50 sticky top-0 z-40" style={{ backgroundColor: 'rgba(8,12,16,0.97)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button onClick={() => navigate('/admin')} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors" title="Voltar ao Admin" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-green-400 text-xs">~/laboratorio.dev</span>
            <span className="text-green-600 text-xs animate-pulse">_</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-800">
            <span>MODO: DEV</span>
            <span>|</span>
            <span>v1.1.0</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Cabeçalho */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-green-700 text-xs mb-2">// AMBIENTE DE EXPERIMENTAÇÃO DE CÓDIGO</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            <span className="text-green-400">_</span>laboratorio<span className="text-green-400">.dev</span>
          </h1>
          <p className="text-green-800 text-sm">Ferramentas utilitárias, scripts e experimentos de desenvolvimento.</p>
        </motion.div>

        {/* SELETOR DE ABAS */}
        <div className="flex border border-green-900/60 mb-8 text-xs bg-[#0C1118] rounded-lg overflow-x-auto">
          {[
            ['downloader', '⚡ 01. YOUTUBE DOWNLOADER (MAX QUALITY)'],
            ['matrix', '💻 02. MATRIX ANIMATION CANVAS']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-3.5 transition-colors font-mono whitespace-nowrap font-bold ${
                activeTab === key ? 'bg-green-500 text-black' : 'text-green-700 hover:text-green-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="mb-12">
          {activeTab === 'downloader' && <YtDownloader />}
          {activeTab === 'matrix' && <MatrixCanvas />}
        </div>

        {/* Rodapé */}
        <div className="pt-6 border-t border-green-900/30 flex items-center justify-between text-xs text-green-900">
          <span>// laboratorio — ambiente interno</span>
          <button onClick={() => navigate('/admin')} className="text-green-800 hover:text-green-400 transition-colors">
            &lt;- voltar ao admin
          </button>
        </div>
      </div>
    </div>
  )
}

