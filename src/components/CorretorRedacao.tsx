'use client';

import React, { useState, useId, useEffect } from 'react';
import { Upload, BarChart3, Award, Camera, Type, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

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
    relatorio?: unknown;
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
    sugestoesIA?: string[];
}

const CorretorRedacao = () => {
    const [texto, setTexto] = useState('');
    const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('text');
    const [ocrLoading, setOcrLoading] = useState(false);
    const { isDark, toggleTheme } = useTheme();

    // Gera ID único que é consistente entre servidor e cliente
    const fileInputId = useId();

    // Limpa as estatísticas quando o texto for excluído por completo
    useEffect(() => {
        if (!texto.trim() && resultado) {
            setResultado(null);
        }
    }, [texto, resultado]);

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
                body: JSON.stringify({ texto }),
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

    const processarImagem = async (file: File) => {
        if (!file) return;

        setOcrLoading(true);

        try {
            // Converter para base64
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: base64, type: 'base64' }),
            });

            if (!response.ok) {
                throw new Error('Erro no OCR');
            }

            const data = await response.json();
            setTexto(data.text);
            setActiveTab('text'); // Muda para a aba de texto

            // Mostra notificação de sucesso
            alert(`Texto extraído com sucesso! ${data.wordCount} palavras detectadas.`);
        } catch (error) {
            console.error('Erro no OCR:', error);
            alert('Erro ao processar a imagem. Tente novamente.');
        } finally {
            setOcrLoading(false);
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
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-6 shadow-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nota1000</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Análise baseada nos critérios oficiais</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'text'
                                    ? 'bg-gray-900 dark:bg-gray-700 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Type className="h-4 w-4 inline mr-2" />
                                Texto
                            </button>
                            <button
                                onClick={() => setActiveTab('image')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'image'
                                    ? 'bg-gray-900 dark:bg-gray-700 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Camera className="h-4 w-4 inline mr-2" />
                                Imagem
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                title={isDark ? 'Modo claro' : 'Modo escuro'}
                            >
                                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Foco no Editor */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Editor de Texto - Seção Principal */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-md">
                            {/* Header do Editor */}
                            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editor de Redação</h2>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span>{texto.split(/\s+/).filter(Boolean).length} palavras</span>
                                        <span>•</span>
                                        <span>{texto.split('\n').length} linhas</span>
                                    </div>
                                </div>
                            </div>

                            {/* Editor com Contador de Linhas */}
                            <div className="relative">
                                {activeTab === 'text' ? (
                                    <div className="flex bg-gray-50 dark:bg-gray-700">
                                        {/* Contador de Linhas */}
                                        <div className="bg-gray-100 dark:bg-gray-600 border-r border-gray-300 dark:border-gray-500 px-3 py-4 text-xs text-gray-600 dark:text-gray-300 font-mono leading-6 select-none min-w-[40px]">
                                            {Array.from({ length: Math.max(1, texto.split('\n').length) }, (_, index) => (
                                                <div key={`line-${index}`} className="h-6 flex items-center justify-end">
                                                    {index + 1}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Área de Texto */}
                                        <div className="flex-1 bg-white dark:bg-gray-800">
                                            <textarea
                                                value={texto}
                                                onChange={(e) => setTexto(e.target.value)}
                                                placeholder="Digite sua redação aqui...&#10;&#10;Dicas:&#10;• Use parágrafos bem estruturados&#10;• Evite repetir palavras&#10;• Use conectivos para melhorar a coesão&#10;• Mínimo de 150 palavras para análise completa"
                                                className="w-full h-96 p-4 border-0 resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none leading-6 text-sm bg-transparent"
                                                style={{ fontFamily: 'Arial, sans-serif' }}
                                            />
                                        </div>
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
                    </div>

                    {/* Painel de Resultados - Lado Direito */}
                    <div className="lg:col-span-1">
                        <div className="space-y-6">
                            {resultado ? (
                                <>
                                    {/* Score Card Simplificado */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm p-6">
                                        <div className="text-center mb-4">
                                            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                                {resultado.total}/1000
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Nota Total</div>
                                        </div>

                                        {/* Competências Simplificadas */}
                                        <div className="space-y-3">
                                            {['c1', 'c2', 'c3', 'c4', 'c5'].map((comp, index) => {
                                                const nota = resultado.competencias[comp as keyof typeof resultado.competencias];
                                                const level = getNotaLevel(nota);

                                                return (
                                                    <div key={comp} className="space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-700 dark:text-gray-300">C{index + 1}</span>
                                                            <span className="font-medium text-gray-900 dark:text-white">{nota}/200</span>
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
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Sugestões</h3>
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

                                    {/* Análise IA do Gemini */}
                                    {resultado.analiseGemini ? (
                                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm p-6">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Análise IA - Gemini</h3>
                                            </div>

                                            {/* Nota da IA */}
                                            <div className="text-center mb-4">
                                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                                                    {resultado.analiseGemini.notaFinal}/1000
                                                </div>
                                                <div className="text-xs text-blue-700 dark:text-blue-300">Avaliação IA</div>
                                            </div>

                                            {/* Feedback da IA - Resumido */}
                                            {resultado.analiseGemini.feedbackGeral && resultado.analiseGemini.feedbackGeral.length > 0 && (
                                                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                                    {resultado.analiseGemini.feedbackGeral.slice(0, 2).map((feedback: string, index: number) => (
                                                        <div key={index} className="flex items-start space-x-2">
                                                            <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                            <span>{feedback}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Aviso quando IA não está disponível */
                                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-700 shadow-sm p-6">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Análise IA - Temporariamente Indisponível</h3>
                                            </div>
                                            <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                                                <div className="flex items-start space-x-2">
                                                    <div className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span>Serviço Gemini temporariamente sobrecarregado ou cota esgotada.</span>
                                                </div>
                                                <div className="flex items-start space-x-2">
                                                    <div className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span>A análise tradicional continua funcionando normalmente.</span>
                                                </div>
                                                <div className="flex items-start space-x-2">
                                                    <div className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span>Sistema fez 3 tentativas automáticas com intervalo inteligente.</span>
                                                </div>
                                                <div className="flex items-start space-x-2">
                                                    <div className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span>Tente novamente em alguns minutos.</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sugestões Detalhadas da IA */}
                                    {resultado.sugestoesIA && resultado.sugestoesIA.length > 0 && (
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700 shadow-sm p-6">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">Sugestões IA Detalhadas</h3>
                                            </div>

                                            <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                                                {resultado.sugestoesIA.slice(0, 3).map((sugestao: string, index: number) => (
                                                    <div key={index} className="flex items-start space-x-2">
                                                        <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                                        <span>{sugestao}</span>
                                                    </div>
                                                ))}
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
