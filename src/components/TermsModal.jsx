import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

const TERMS_EXPLANATION = `
Para acessar suas fotos, é necessário aceitar os termos de serviço e autorização de uso de imagem.

Se desejar, você pode ler os termos completos clicando no botão abaixo.
`

const TERMS_FULL = `
TERMOS DE SERVIÇO E AUTORIZAÇÃO DE USO DE IMAGEM

Ao contratar os serviços fotográficos de Ricardo Freschi de Oliveira Pandolfe e Dias, o cliente declara estar ciente e de acordo com os termos abaixo:

DIREITO DE USO DAS IMAGENS
O cliente autoriza o fotógrafo a utilizar as imagens captadas durante a sessão fotográfica para fins de divulgação de portfólio, seja em formato impresso ou digital, incluindo, mas não se limitando a:
• Publicações em site e blog profissional;
• Redes sociais (como Instagram, Facebook, Pinterest e similares);
• Material promocional, apresentações e campanhas de marketing.

GARANTIA DE RESPEITO
O fotógrafo compromete-se a utilizar as imagens de forma ética e respeitosa, sem realizar edições que deturpem a identidade, a imagem ou a dignidade do cliente.

AUSÊNCIA DE USO COMERCIAL POR TERCEIROS
As imagens não serão cedidas ou comercializadas para terceiros sem o consentimento prévio do cliente.

DIREITO DE REVOGAÇÃO
Caso o cliente, por qualquer motivo, não deseje mais que suas imagens sejam utilizadas em futuras divulgações, poderá solicitar a exclusão por escrito. Essa solicitação não terá efeito retroativo sobre materiais já publicados.

DIREITO AUTORAL
As fotografias produzidas são protegidas pela Lei de Direitos Autorais (Lei nº 9.610/98). O cliente tem direito de uso pessoal das imagens contratadas, enquanto o fotógrafo mantém a titularidade dos direitos autorais.

USO DO ÁLBUM DIGITAL
• O cliente pode visualizar e fazer download das imagens para uso pessoal
• É proibida a reprodução, distribuição ou comercialização sem autorização expressa
• O cliente deve manter a confidencialidade do código de acesso
• O fotógrafo se reserva o direito de remover o acesso a qualquer momento

Ao clicar em "ACEITAR", você declara ter lido, compreendido e concordado integralmente com estes termos de serviço e autorização de uso de imagem.
`

function TermsModal({ isOpen, onAccept, onClose, isDarkMode }) {
  const [showFullTerms, setShowFullTerms] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)

  const handleAccept = () => {
    if (hasAccepted) {
      onAccept('Cliente')
    }
  }

  const handleClose = () => {
    setShowFullTerms(false)
    setHasAccepted(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <FileText className={`h-6 w-6 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <h2 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Termos de Serviço e Autorização
                </h2>
              </div>
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className={`p-4 rounded-lg mb-6 ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-start space-x-3">
                  <AlertCircle className={`h-5 w-5 mt-0.5 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                  <div>
                    <h3 className={`font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Importante
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Antes de acessar suas fotos, leia e aceite os termos de serviço. 
                      Você deve se identificar como o cliente responsável pelo álbum.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms Content */}
              <div className={`${
                showFullTerms 
                  ? `p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`
                  : ''
              }`}>
                {showFullTerms ? (
                  <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {TERMS_FULL}
                  </pre>
                ) : (
                  <div className={`text-center py-6 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-600'
                  }`}>
                    <p className={`text-lg font-medium mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      Termos de Serviço
                    </p>
                    <p className="text-base leading-relaxed">
                      {TERMS_EXPLANATION}
                    </p>
                  </div>
                )}
              </div>

              {/* Show Full Terms Button */}
              {!showFullTerms && (
                <div className="mt-4 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFullTerms(true)}
                    className={`${
                      isDarkMode 
                        ? 'border-blue-400 text-blue-100 bg-gray-800 hover:bg-blue-600 hover:border-blue-300 hover:text-white font-medium' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ler Termos Completos
                  </Button>
                </div>
              )}

              {/* Back to Summary Button */}
              {showFullTerms && (
                <div className="mt-4 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFullTerms(false)}
                    className={`${
                      isDarkMode 
                        ? 'border-blue-400 text-blue-100 bg-gray-800 hover:bg-blue-600 hover:border-blue-300 hover:text-white font-medium' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Voltar ao Resumo
                  </Button>
                </div>
              )}

              {/* Checkbox de Aceitação */}
              <div className="mt-6">
                <div className="flex items-start space-x-3">
                  <button
                    type="button"
                    onClick={() => setHasAccepted(!hasAccepted)}
                    className={`mt-1 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                      hasAccepted 
                        ? (isDarkMode ? 'bg-green-500 border-green-500' : 'bg-green-600 border-green-600')
                        : (isDarkMode ? 'border-gray-400 hover:border-gray-300' : 'border-gray-500 hover:border-gray-400')
                    }`}
                  >
                    {hasAccepted && (
                      <div className={`w-2 h-2 rounded-full ${
                        isDarkMode ? 'bg-white' : 'bg-white'
                      }`} />
                    )}
                  </button>
                  <label 
                    className={`text-sm cursor-pointer ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                    onClick={() => setHasAccepted(!hasAccepted)}
                  >
                    Declaro que li, compreendi e aceito os termos de serviço e autorização de uso de imagem.
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex justify-end space-x-3 p-6 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className={`${
                  isDarkMode 
                    ? 'border-red-400 text-red-100 bg-gray-800 hover:bg-red-600 hover:border-red-300 hover:text-white font-medium' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAccept}
                disabled={!hasAccepted}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aceitar e Acessar Fotos
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default TermsModal
