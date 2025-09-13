'use client';

import React, { useState, useId, useEffect } from 'react';
import { Upload, BarChart3, Award, Camera, Type, Moon, Sun, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useVisionOCR } from '@/hooks/useIsClient';
import { processImageWithVision, processImageFallback, OCRProgress } from '@/lib/ocr-vision';
import type { RelatorioNotas, DetalhesNota } from '@/lib/analyzer';

interface ResultadoAnalise {
    competencias: {
        c1: number;
        c2: number;
        c3: number;
        c4: number;
        c5: number;
    };
    total: number;
    palavras: number;
    paragrafos: number;
    repetidas: Array<{ palavra: string; vezes: number }>;
    vicios?: string[];
    conectivos?: string[];
    frasesLongas?: string[];
    intervencao?: { [key: string]: boolean };
    ttr?: string;
    marcadores?: string[];
    feedback?: {
        c1: string[];
        c2: string[];
        c3: string[];
        c4: string[];
        c5: string[];
        geral: string[];
    };
    relatorio?: RelatorioNotas;
    analiseGemini?: {
        competencia1: {
            nota: number;
            feedback: string[];
            pontosFortes: string[];
            pontosFrageis: string[];
        };
        competencia2: {
            nota: number;
            feedback: string[];
            pontosFortes: string[];
            pontosFrageis: string[];
        };
        competencia3: {
            nota: number;
            feedback: string[];
            pontosFortes: string[];
            pontosFrageis: string[];
        };
        competencia4: {
            nota: number;
            feedback: string[];
            pontosFortes: string[];
            pontosFrageis: string[];
        };
        competencia5: {
            nota: number;
            feedback: string[];
            pontosFortes: string[];
            pontosFrageis: string[];
        };
        notaFinal: number;
        feedbackGeral: string[];
        sugestoesDetalhadas: string[];
        analiseQualitativa: string;
    } | null;
    consenso?: {
        notasProfessor: {
            c1: number; c2: number; c3: number; c4: number; c5: number; total: number;
        };
        notasIA: {
            c1: number; c2: number; c3: number; c4: number; c5: number; total: number;
        };
        notasConsenso: {
            c1: number; c2: number; c3: number; c4: number; c5: number; total: number;
        };
        detalhesConsenso: {
            metodologia: string;
            configuracao: {
                pesoProfessor: number;
                pesoIA: number;
                nivelRigidez: string;
                ajustesPorCompetencia: {
                    c1: number;
                    c2: number;
                    c3: number;
                    c4: number;
                    c5: number;
                };
            };
            explicacao: string[];
        };
    };
    sugestoesIA?: string[];
}

const CorretorRedacao = () => {
    const [texto, setTexto] = useState('');
    const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('text');
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);
    const [useClientOCR, setUseClientOCR] = useState(true);

    const { isDark, toggleTheme } = useTheme();
    const { isReady: visionReady, isClient } = useVisionOCR();

    // Mapa das competências ENEM com suas descrições completas
    const competenciasENEM = {
        c1: {
            nome: 'Norma Culta',
            descricao: 'Demonstrar domínio da modalidade escrita formal da língua portuguesa. Avalia ortografia, acentuação, concordância verbal e nominal, regência, pontuação, flexão, colocação pronominal e propriedade vocabular.'
        },
        c2: {
            nome: 'Compreensão do Tema',
            descricao: 'Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento para desenvolver o tema, dentro dos limites estruturais do texto dissertativo-argumentativo em prosa.'
        },
        c3: {
            nome: 'Argumentação',
            descricao: 'Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista. Demonstrar capacidade de análise crítica e construção de argumentos consistentes.'
        },
        c4: {
            nome: 'Coesão e Coerência',
            descricao: 'Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação. Utilizar adequadamente elementos coesivos, conectivos, conjunções e demais recursos de articulação textual.'
        },
        c5: {
            nome: 'Proposta de Intervenção',
            descricao: 'Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos. A proposta deve ser detalhada, exequível, relacionada ao tema e conter agente, ação, meio, finalidade e detalhamento.'
        }
    };

    // Gera ID único que é consistente entre servidor e cliente
    const fileInputId = useId();

    // Limpa as estatísticas quando o texto for excluído por completo
    useEffect(() => {
        if (!texto.trim() && resultado) {
            setResultado(null);
        }
    }, [texto, resultado]);

    // Função para analisar e marcar problemas no texto
    const analisarTextoComMarcacoes = (texto: string): Array<{
        id: string;
        tipo: string;
        texto: string;
        posicoes: Array<{ inicio: number, fim: number }>;
        sugestao: string;
        cor: string;
    }> => {
        if (!resultado) return [];

        const problemas: Array<{
            id: string;
            tipo: string;
            texto: string;
            posicoes: Array<{ inicio: number, fim: number }>;
            sugestao: string;
            cor: string;
        }> = [];

        // Detectar palavras repetidas em excesso
        if (resultado.repetidas) {
            resultado.repetidas.forEach((rep: { palavra: string, vezes: number }, index: number) => {
                if (rep.vezes >= 3) {
                    problemas.push({
                        id: `repetida-${index}`,
                        tipo: 'repeticao',
                        texto: rep.palavra,
                        posicoes: encontrarPosicoesTexto(texto, rep.palavra),
                        sugestao: `Palavra repetida ${rep.vezes} vezes. Considere sinônimos`,
                        cor: 'bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-400 dark:border-yellow-500'
                    });
                }
            });
        }

        // Detectar vícios de linguagem
        if (resultado.vicios) {
            resultado.vicios.forEach((vicio: string, index: number) => {
                const posicoes = encontrarPosicoesTexto(texto.toLowerCase(), vicio.toLowerCase());
                if (posicoes.length > 0) {
                    problemas.push({
                        id: `vicio-${index}`,
                        tipo: 'vicio',
                        texto: vicio,
                        posicoes,
                        sugestao: `Evite expressões informais como "${vicio}"`,
                        cor: 'bg-red-100 dark:bg-red-900/40 border-l-4 border-red-400 dark:border-red-500'
                    });
                }
            });
        }

        // Detectar frases longas
        if (resultado.frasesLongas) {
            resultado.frasesLongas.forEach((frase: string, index: number) => {
                const pos = texto.indexOf(frase);
                if (pos !== -1) {
                    problemas.push({
                        id: `frase-longa-${index}`,
                        tipo: 'frase_longa',
                        texto: frase,
                        posicoes: [{ inicio: pos, fim: pos + frase.length }],
                        sugestao: 'Frase muito longa. Considere dividi-la para melhor clareza',
                        cor: 'bg-orange-100 dark:bg-orange-900/40 border-l-4 border-orange-400 dark:border-orange-500'
                    });
                }
            });
        }

        return problemas;
    };

    // Função auxiliar para encontrar todas as posições de uma palavra no texto
    const encontrarPosicoesTexto = (texto: string, palavra: string) => {
        const posicoes = [];
        let index = texto.indexOf(palavra, 0);

        while (index !== -1) {
            posicoes.push({
                inicio: index,
                fim: index + palavra.length
            });
            index = texto.indexOf(palavra, index + 1);
        }

        return posicoes;
    };

    // Função para renderizar o texto com marcações
    const renderizarTextoComMarcacoes = () => {
        if (!resultado || !texto) return null;

        const problemas = analisarTextoComMarcacoes(texto);
        const paragrafosDivididos = texto.split('\n').filter(p => p.trim());

        return paragrafosDivididos.map((paragrafo, pIndex) => {
            let offset = 0;

            // Calcula offset para este parágrafo
            for (let i = 0; i < pIndex; i++) {
                offset += paragrafosDivididos[i].length + 1; // +1 para quebra de linha
            }

            // Ordena problemas por posição para aplicar marcações sem conflito
            const problemasParagrafo = problemas.filter(p =>
                p.posicoes.some(pos =>
                    pos.inicio >= offset && pos.inicio < offset + paragrafo.length
                )
            ).sort((a, b) => a.posicoes[0].inicio - b.posicoes[0].inicio);

            return (
                <div key={pIndex} className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Parágrafo {pIndex + 1}
                    </div>
                    <div className="text-base leading-relaxed">
                        {paragrafo}
                    </div>
                    {problemasParagrafo.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {problemasParagrafo.map(problema => (
                                <div key={problema.id} className={`text-xs p-2 rounded ${problema.cor}`}>
                                    <strong>&ldquo;{problema.texto}&rdquo;</strong> - {problema.sugestao}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        });
    };

    const processarImagemComVision = async (file: File) => {
        if (!visionReady) {
            alert('OCR ainda não está pronto. Tente novamente em alguns segundos.');
            return;
        }

        setOcrLoading(true);
        setOcrProgress({ status: 'Iniciando OCR com Google Vision...', progress: 0 });

        try {
            // Converte para base64
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const result = await processImageWithVision(base64, (progress: OCRProgress) => {
                setOcrProgress(progress);
            });

            setTexto(result.text);
            setActiveTab('text');

            // Mostra estatísticas do OCR
            const methodText = result.method === 'google-vision' ? '🚀 Google Vision AI' : '🔧 Processamento Local';
            alert(
                `✅ Texto extraído com sucesso!\n` +
                `🤖 Método: ${methodText}\n` +
                `📝 ${result.wordCount} palavras detectadas\n` +
                `⏱️ Processamento: ${result.processingTime}s\n` +
                `🎯 Confiança: ${Math.round(result.confidence * 100)}%`
            );

        } catch (error) {
            console.error('Erro no OCR com Google Vision:', error);

            // Fallback para processamento local
            if (useClientOCR) {
                alert('Erro no Google Vision. Tentando processamento local...');
                await processarImagemFallback(file);
            } else {
                alert('Erro ao processar a imagem. Verifique se a imagem contém texto legível.');
            }
        } finally {
            setOcrLoading(false);
            setOcrProgress(null);
        }
    };

    const processarImagemFallback = async (file: File) => {
        try {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const result = await processImageFallback(base64, (progress: OCRProgress) => {
                setOcrProgress(progress);
            });

            setTexto(result.text);
            setActiveTab('text');

            alert(`📄 Texto extraído (modo local)\n📝 ${result.wordCount} palavras`);
        } catch (error) {
            console.error('Erro no fallback OCR:', error);
            alert('Erro ao processar a imagem. Tente uma imagem com melhor qualidade.');
        }
    };

    const processarImagem = async (file: File) => {
        if (!file) return;

        // Validações
        if (file.size > 10 * 1024 * 1024) { // 10MB
            alert('Arquivo muito grande. Máximo 10MB.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Arquivo deve ser uma imagem (JPG, PNG, WebP).');
            return;
        }

        // Usa Google Vision se disponível, senão fallback local
        if (isClient && visionReady && useClientOCR) {
            await processarImagemComVision(file);
        } else {
            await processarImagemFallback(file);
        }
    };

    const analisarTexto = async () => {
        if (!texto.trim()) {
            alert('Por favor, insira um texto para análise.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    texto: texto
                }),
            });

            if (!response.ok) {
                throw new Error('Erro na análise');
            }

            const data = await response.json();
            setResultado(data);
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao analisar o texto. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processarImagem(file);
        }
    };


    const getNotaLevel = (nota: number) => {
        if (nota >= 160) return { label: 'Excelente', color: 'bg-green-500' };
        if (nota >= 120) return { label: 'Bom', color: 'bg-yellow-500' };
        if (nota >= 80) return { label: 'Regular', color: 'bg-orange-500' };
        return { label: 'Precisa melhorar', color: 'bg-red-500' };
    };


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Header Acadêmico */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 md:py-6 shadow-sm">
                <div className="max-w-7xl mx-auto px-3 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <img
                                src="/pen.png"
                                alt="Logo IA"
                                className="h-10 sm:h-12 md:h-16 w-auto"
                            />
                            <div className="min-w-0 flex-1">
                                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                    Redação IA
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                                    Análise baseada nos critérios oficiais
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${activeTab === 'text'
                                    ? 'bg-gray-900 dark:bg-gray-700 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Type className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Texto</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('image')}
                                className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${activeTab === 'image'
                                    ? 'bg-gray-900 dark:bg-gray-700 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Camera className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Imagem</span>
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="relative p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-300 ease-in-out hover:scale-105 active:scale-95"
                                title={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
                            >
                                <div className="relative">
                                    {isDark ? (
                                        <Sun className="h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-300 rotate-0" />
                                    ) : (
                                        <Moon className="h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-300 rotate-0" />
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Foco no Editor */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Editor de Texto - Seção Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-md">
                            {/* Header do Editor */}
                            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editor de Redação</h2>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                        {/* Status do Google Vision */}
                                        {isClient && (
                                            <div className={`flex items-center space-x-1 ${visionReady ? 'text-green-600' : 'text-amber-600'}`}>
                                                <div className={`w-2 h-2 rounded-full ${visionReady ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                                <span className="text-xs">Vision AI {visionReady ? 'Pronto' : 'Carregando...'}</span>
                                            </div>
                                        )}
                                        <span>{texto.split(/\s+/).filter(Boolean).length} palavras</span>
                                    </div>
                                </div>

                                {/* Barra de progresso OCR */}
                                {ocrProgress && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            <span>{ocrProgress.status}</span>
                                            <span>{Math.round(ocrProgress.progress * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${ocrProgress.progress * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Editor de Texto */}
                            <div className="relative">
                                {activeTab === 'text' ? (
                                    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                                        <textarea
                                            value={texto}
                                            onChange={(e) => setTexto(e.target.value)}
                                            placeholder="Digite sua redação aqui...&#10;&#10;Dicas:&#10;• Use parágrafos bem estruturados&#10;• Evite repetir palavras&#10;• Use conectivos para melhorar a coesão&#10;• Mínimo de 150 palavras para análise completa"
                                            className="w-full h-96 p-4 border-0 resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none leading-6 text-sm bg-transparent rounded-lg"
                                            style={{ fontFamily: 'Arial, sans-serif' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <Upload className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Envie uma imagem da redação</h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">Suporte para JPG, PNG e WebP</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={ocrLoading}
                                            className="hidden"
                                            id={fileInputId}
                                        />
                                        <label
                                            htmlFor={fileInputId}
                                            className={`inline-flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-colors cursor-pointer ${ocrLoading
                                                ? 'bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed'
                                                : 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {ocrLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                    <span>Processando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="h-4 w-4" />
                                                    <span>Escolher Imagem</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Footer do Editor */}
                            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {texto.trim() ? (
                                            <span>Pronto para análise • {texto.split(/\s+/).filter(Boolean).length} palavras</span>
                                        ) : (
                                            <span>Digite sua redação para começar</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={analisarTexto}
                                        disabled={loading || !texto.trim()}
                                        className="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                <span>Analisando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <BarChart3 className="h-4 w-4" />
                                                <span>Analisar Redação</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Revisão do Texto - Posicionada abaixo do editor */}
                        {resultado && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-md">
                                    <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revisão do Texto</h2>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {/* Legenda das marcações - cores melhoradas */}
                                        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                🏷️ Legenda das Marcações:
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                <div className="flex items-center space-x-2 bg-white dark:bg-gray-600 p-2 rounded border">
                                                    <div className="w-4 h-4 bg-yellow-300 dark:bg-yellow-500 rounded border border-yellow-400 dark:border-yellow-600"></div>
                                                    <span className="text-gray-700 dark:text-gray-200 font-medium">Repetições</span>
                                                </div>
                                                <div className="flex items-center space-x-2 bg-white dark:bg-gray-600 p-2 rounded border">
                                                    <div className="w-4 h-4 bg-red-300 dark:bg-red-500 rounded border border-red-400 dark:border-red-600"></div>
                                                    <span className="text-gray-700 dark:text-gray-200 font-medium">Vícios de linguagem</span>
                                                </div>
                                                <div className="flex items-center space-x-2 bg-white dark:bg-gray-600 p-2 rounded border">
                                                    <div className="w-4 h-4 bg-orange-300 dark:bg-orange-500 rounded border border-orange-400 dark:border-orange-600"></div>
                                                    <span className="text-gray-700 dark:text-gray-200 font-medium">Frases longas</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Texto com marcações - melhor contraste */}
                                        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto">
                                            <div className="text-gray-800 dark:text-gray-100 leading-relaxed">
                                                {renderizarTextoComMarcacoes()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Análise da IA - Movida para abaixo da revisão */}
                                {resultado.analiseGemini ? (
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700 shadow-md">
                                        <div className="border-b border-blue-200 dark:border-blue-700 px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Análise da IA</h2>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            {/* Nota da IA */}
                                            <div className="text-center mb-6">
                                                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                                                    {resultado.consenso?.notasIA.total || resultado.analiseGemini.notaFinal}/1000
                                                </div>
                                                <div className="text-sm text-blue-700 dark:text-blue-300">Avaliação da Inteligência Artificial</div>
                                            </div>

                                            {/* Feedback da IA - Completo */}
                                            {resultado.analiseGemini.feedbackGeral && resultado.analiseGemini.feedbackGeral.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-3">Feedback Geral</h3>
                                                    <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                                                        {resultado.analiseGemini.feedbackGeral.map((feedback: string, index: number) => (
                                                            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                                <span className="leading-relaxed">{feedback}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Análise Qualitativa */}
                                            {resultado.analiseGemini.analiseQualitativa && (
                                                <div className="mb-6">
                                                    <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-3">Análise Qualitativa</h3>
                                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                                            {resultado.analiseGemini.analiseQualitativa}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Aviso quando IA não está disponível */
                                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-700 shadow-md">
                                        <div className="border-b border-amber-200 dark:border-amber-700 px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                                <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Análise IA - Temporariamente Indisponível</h2>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="space-y-3 text-sm text-amber-800 dark:text-amber-200">
                                                <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span>Serviço de IA temporariamente sobrecarregado ou indisponível.</span>
                                                </div>
                                                <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span>A análise tradicional continua funcionando normalmente.</span>
                                                </div>
                                                <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span>Sistema fez 3 tentativas automáticas com intervalo inteligente.</span>
                                                </div>
                                                <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span>Tente novamente em alguns minutos.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Sugestões Detalhadas da IA - Movida para abaixo da análise */}
                                {resultado.sugestoesIA && resultado.sugestoesIA.length > 0 && (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700 shadow-md">
                                        <div className="border-b border-green-200 dark:border-green-700 px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <h2 className="text-lg font-semibold text-green-900 dark:text-green-100">Sugestões Detalhadas da IA</h2>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="space-y-3 text-sm text-green-800 dark:text-green-200">
                                                {resultado.sugestoesIA.map((sugestao: string, index: number) => (
                                                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                                        <span className="leading-relaxed">{sugestao}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Painel de Resultados - Lado Direito */}
                    <div className="lg:col-span-1">
                        <div className="space-y-6">
                            {resultado ? (
                                <>
                                    {/* Score Card Simplificado */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm p-6">
                                        <div className="text-center mb-4">
                                            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                                {resultado.total}/1000
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Nota Geral</div>
                                        </div>

                                        {/* Competências com Descrições Completas */}
                                        <div className="space-y-4">
                                            {['c1', 'c2', 'c3', 'c4', 'c5'].map((comp, index) => {
                                                const nota = resultado.competencias[comp as keyof typeof resultado.competencias];
                                                const level = getNotaLevel(nota);
                                                const competencia = competenciasENEM[comp as keyof typeof competenciasENEM];
                                                const relatorioCompetencia = resultado.relatorio?.[comp as keyof typeof resultado.relatorio];

                                                return (
                                                    <div key={comp} className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <div className="flex flex-col space-y-1">
                                                                <span className="font-medium text-gray-900 dark:text-white">C{index + 1} - {competencia.nome}</span>
                                                                <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                                                    {relatorioCompetencia && typeof relatorioCompetencia === 'object' && 'detalhes' in relatorioCompetencia && relatorioCompetencia.detalhes && relatorioCompetencia.detalhes.length > 0 ? (
                                                                        <div className="space-y-1">
                                                                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Avaliação:</div>
                                                                            {relatorioCompetencia.detalhes.map((detalhe: DetalhesNota, i: number) => (
                                                                                <div key={i} className={`flex items-start space-x-2 text-xs ${detalhe.pontos > 0 ? 'text-green-600 dark:text-green-400' :
                                                                                    detalhe.pontos < 0 ? 'text-red-600 dark:text-red-400' :
                                                                                        'text-gray-600 dark:text-gray-400'
                                                                                    }`}>
                                                                                    <span className="flex-shrink-0">•</span>
                                                                                    <span className="flex-1">
                                                                                        {detalhe.item}
                                                                                        {detalhe.pontos !== 0 && (
                                                                                            <span className="font-medium ml-1">
                                                                                                ({detalhe.pontos > 0 ? '+' : ''}{detalhe.pontos} pts)
                                                                                            </span>
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        competencia.descricao
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="font-bold text-gray-900 dark:text-white ml-4 flex-shrink-0">{nota}/200</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${level.color} transition-all duration-500`}
                                                                style={{ width: `${(nota / 200) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Consenso Professor + IA */}
                                    {resultado.consenso && (
                                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                                                📊 Consenso de Avaliação
                                            </h3>

                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                {/* Nota do Professor */}
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                        {resultado.consenso.notasProfessor.total}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Professor</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500">Análise Tradicional</div>
                                                </div>

                                                {/* Nota da IA */}
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                        {resultado.consenso.notasIA.total}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">IA</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500">Análise com Gemini</div>
                                                </div>

                                                {/* Nota de Consenso */}
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                        {resultado.consenso.notasConsenso.total}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Consenso</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500">Nota Final</div>
                                                </div>
                                            </div>

                                            {/* Metodologia */}
                                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Metodologia:</div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {resultado.consenso.detalhesConsenso.metodologia}
                                                </div>
                                            </div>

                                            {/* Detalhes por Competência */}
                                            <div className="space-y-2">
                                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Detalhamento por Competência:</div>
                                                {resultado.consenso.detalhesConsenso.explicacao.map((explicacao, i) => (
                                                    <div key={i} className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                        {explicacao}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Estatísticas Básicas */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm p-6">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Estatísticas</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{resultado.palavras}</div>
                                                <div className="text-gray-600 dark:text-gray-400">Palavras</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{resultado.paragrafos}</div>
                                                <div className="text-gray-600 dark:text-gray-400">Parágrafos</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feedback Simplificado */}
                                    {resultado.feedback && (
                                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm p-6">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Sugestões do Professor</h3>
                                            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                                {resultado.feedback.geral && resultado.feedback.geral.length > 0 ? (
                                                    resultado.feedback.geral.slice(0, 3).map((dica: string, index: number) => (
                                                        <div key={index} className="flex items-start space-x-2">
                                                            <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                                                            <span>{dica}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-gray-500 dark:text-gray-400">Nenhuma sugestão específica disponível</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm p-8 text-center">
                                    <Award className="h-12 w-12 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Pronto para análise</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Digite sua redação no editor ao lado e clique em &quot;Analisar Redação&quot; para receber feedback detalhado.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Simplificado */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Corretor de Redação ENEM • Análise baseada nos critérios oficiais</p>
                </div>
            </footer>
        </div>
    );
};

export default CorretorRedacao;
