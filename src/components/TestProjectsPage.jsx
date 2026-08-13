import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Download, Play, Music, Video, Sparkles, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'

// --- Experimento 1: YouTube Downloader (Max Quality) ---
function YtDownloader() {
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzedVideo, setAnalyzedVideo] = useState(null) // { title, thumbnail, videoId, availableQualities: [] }
  const [selectedQuality, setSelectedQuality] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [statusLogs, setStatusLogs] = useState([])
  const [error, setError] = useState(null)

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
      const match = inputUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
      return match ? match[1] : null
    }
    return null
  }

  const ytId = extractYtId(url)

  // 1. Analisa a URL e busca as qualidades realmente disponíveis para este vídeo
  const handleAnalyze = async (e) => {
    if (e) e.preventDefault()
    if (!url.trim()) return

    setAnalyzing(true)
    setError(null)
    setAnalyzedVideo(null)
    setSelectedQuality(null)
    setStatusLogs([
      '[01/02] Conectando ao YouTube API...',
      '[02/02] Analisando resoluções e fluxos de mídia disponíveis...'
    ])

    try {
      const isLocal = window.location.origin.includes('localhost')
      const targetEndpoint = isLocal ? 'http://localhost:4000/api/info' : '/api/info'

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      let res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal
      }).catch(() => null)

      clearTimeout(timeoutId)

      // Fallback para /api/info se endpoint local específico não responder
      if (!res || !res.ok) {
        const altEndpoint = isLocal ? '/api/info' : 'http://localhost:4000/api/info'
        res = await fetch(altEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() })
        }).catch(() => null)
      }

      if (res && res.ok) {
        const info = await res.json()
        setAnalyzedVideo(info)
        
        // Seleciona por padrão a maior qualidade encontrada
        if (info.availableQualities && info.availableQualities.length > 0) {
          setSelectedQuality(info.availableQualities[0].id)
        }

        setStatusLogs(prev => [
          ...prev,
          `✔ Vídeo analisado com sucesso: "${info.title}"`,
          `✔ ${info.availableQualities?.length || 0} qualidades compatíveis encontradas.`
        ])
      } else {
        throw new Error('Não foi possível obter dados do vídeo. Verifique se a URL está correta.')
      }
    } catch (err) {
      console.error('Erro ao analisar vídeo:', err)
      setError(err.message || 'Falha ao analisar vídeo.')
      setStatusLogs(prev => [...prev, '[ERRO] ' + (err.message || 'Falha na análise.')])
    } finally {
      setAnalyzing(false)
    }
  }

  // 2. Dispara o download nativo da qualidade selecionada no navegador
  const handleStartDownload = (qualityId) => {
    if (!url.trim() || downloading) return
    const qId = qualityId || selectedQuality || 'max'
    const isAudio = qId === 'audio'

    setDownloading(true)
    setStatusLogs(prev => [
      ...prev,
      `[DOWNLOAD] Solicitando mídia na resolução (${qId.toUpperCase()})...`,
      '[PROCESSO] Mesclando faixas em H.264/AAC com algoritmo UltraFast...',
      '✔ Download enviado para o navegador! Acompanhe o progresso na barra de downloads.'
    ])

    try {
      const apiBase = window.location.origin.includes('localhost') ? 'http://localhost:4000' : ''
      const downloadLink = `${apiBase}/api/download?url=${encodeURIComponent(url.trim())}&quality=${qId}&isAudio=${isAudio}`

      const safeTitle = (analyzedVideo?.title || 'youtube_video').replace(/[^\w\s\-\.]/gi, '_')
      const ext = isAudio ? 'mp3' : 'mp4'
      const filename = `${safeTitle}_${qId}p.${ext}`

      // Dispara o download nativo no navegador (Chrome/Edge/Firefox)
      const a = document.createElement('a')
      a.href = downloadLink
      a.download = filename
      a.target = '_self'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      console.error('Erro no download:', err)
      setStatusLogs(prev => [...prev, '[ERRO] Falha no download: ' + err.message])
    } finally {
      setTimeout(() => setDownloading(false), 2000)
    }
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
            <h2 className="text-lg font-bold text-white tracking-wide">YouTube Video Downloader (Análise de Qualidade)</h2>
            <p className="text-xs text-green-700">Analisa qualidades reais do vídeo (4K, 2K, 1080p, 720p ou MP3) em H.264/AAC</p>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-1 bg-green-950 text-green-400 border border-green-800 rounded font-mono">
          ENGINE: YT-DLP + FFMPEG 4K
        </span>
      </div>

      {/* Passo 1: Formulário de Entrada da URL */}
      <form onSubmit={handleAnalyze} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-green-400 mb-2">
            $ URL DO VÍDEO DO YOUTUBE
          </label>
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={e => {
                setUrl(e.target.value)
                if (analyzedVideo) setAnalyzedVideo(null)
              }}
              placeholder="Cole a URL do vídeo aqui (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...)"
              className="w-full px-4 py-3.5 bg-black/60 border border-green-900 text-green-200 placeholder-green-900 rounded-lg focus:outline-none focus:border-green-500 font-mono text-sm transition-all"
              required
            />
            {url && (
              <button
                type="button"
                onClick={() => { setUrl(''); setAnalyzedVideo(null); setError(null); setStatusLogs([]) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-700 hover:text-green-400"
              >
                LIMPAR
              </button>
            )}
          </div>
        </div>

        {/* Botão de Analisar */}
        {!analyzedVideo && (
          <button
            type="submit"
            disabled={analyzing || !url.trim()}
            className={`w-full py-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-xl ${
              analyzing || !url.trim()
                ? 'bg-green-950/40 border border-green-900 text-green-900 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-extrabold shadow-green-900/30'
            }`}
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                ANALISANDO VÍDEO E RESOLUÇÕES DISPONÍVEIS...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                ANALISAR VÍDEO E MOSTRAR QUALIDADES
              </>
            )}
          </button>
        )}
      </form>

      {/* Passo 2: Seletor Dinâmico de Qualidade (Aparece SOMENTE após a análise) */}
      <AnimatePresence>
        {analyzedVideo && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="mt-6 p-5 border border-green-500/40 bg-green-950/20 rounded-xl space-y-5"
          >
            {/* Card com Detalhes do Vídeo */}
            <div className="flex flex-col md:flex-row items-center gap-4 pb-4 border-b border-green-900/40">
              {analyzedVideo.thumbnail && (
                <div className="relative w-full md:w-48 aspect-video bg-black rounded-lg overflow-hidden border border-green-900 shrink-0">
                  <img src={analyzedVideo.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 space-y-1 text-left">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  VÍDEO PRONTO PARA EDIÇÃO (H.264 / AAC)
                </div>
                <h3 className="text-sm font-bold text-white font-mono break-all line-clamp-2">
                  {analyzedVideo.title}
                </h3>
                <p className="text-xs text-green-600">
                  Selecione abaixo a resolução desejada para baixar diretamente:
                </p>
              </div>
            </div>

            {/* Resoluções Realmente Disponíveis para este Vídeo */}
            <div>
              <label className="block text-xs font-bold text-green-400 mb-3 font-mono">
                $ QUALIDADES DISPONÍVEIS PARA ESTE VÍDEO:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analyzedVideo.availableQualities?.map(q => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuality(q.id)}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      selectedQuality === q.id
                        ? 'border-green-500 bg-green-950/60 text-green-300 shadow-lg ring-1 ring-green-500'
                        : 'border-green-900/50 bg-black/40 text-green-700 hover:border-green-700 hover:text-green-300'
                    }`}
                  >
                    <div className="text-xs font-bold mb-0.5">{q.label}</div>
                    <div className="text-[10px] text-green-600 font-mono">{q.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botão Final de Download na Resolução Escolhida */}
            <button
              type="button"
              onClick={() => handleStartDownload(selectedQuality)}
              disabled={downloading || !selectedQuality}
              className={`w-full py-4 rounded-lg font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                downloading
                  ? 'bg-green-700 text-black cursor-wait animate-pulse'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black'
              }`}
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  BAIXANDO EM ALTA QUALIDADE...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  BAIXAR AGORA NA QUALIDADE SELECIONADA ({selectedQuality ? selectedQuality.toUpperCase() : ''})
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Mensagem de Erro */}
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

