'use client';

import React, { useState, useId } from 'react';
import { Upload, FileText, BarChart3, Award, Camera, Type, Zap, AlertCircle, BookOpen, Target, CheckCircle, Send, Info } from 'lucide-react';

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
    relatorio?: any;
}

const CorretorRedacao = () => {
    const [texto, setTexto] = useState('');
    const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('text');
    const [ocrLoading, setOcrLoading] = useState(false);

    // Gera ID único que é consistente entre servidor e cliente
    const fileInputId = useId();

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

    const getNotaColor = (nota: number) => {
        if (nota >= 160) return 'text-green-600';
        if (nota >= 120) return 'text-yellow-600';
        if (nota >= 80) return 'text-orange-600';
        return 'text-red-600';
    };

    const getNotaLevel = (nota: number) => {
        if (nota >= 160) return { label: 'Excelente', color: 'bg-green-500' };
        if (nota >= 120) return { label: 'Bom', color: 'bg-yellow-500' };
        if (nota >= 80) return { label: 'Regular', color: 'bg-orange-500' };
        return { label: 'Precisa melhorar', color: 'bg-red-500' };
    };

    const competenciasNomes = [
        'Domínio da Norma Culta',
        'Compreensão do Tema',
        'Argumentação',
        'Coesão e Coerência',
        'Proposta de Intervenção'
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 shadow-xl">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
                        🎯 Corretor de Redação ENEM
                    </h1>
                    <p className="text-xl text-blue-100 text-center max-w-3xl mx-auto">
                        Análise completa com base nos critérios oficiais do ENEM
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
                    {/* Input Section */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                                    <BookOpen className="h-6 w-6 mr-3 text-blue-600" />
                                    Sua Redação
                                </h2>
                                <div className="flex bg-gray-100 rounded-xl p-2">
                                    <button
                                        onClick={() => setActiveTab('text')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'text'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Type className="h-4 w-4 inline mr-2" />
                                        Texto
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('image')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'image'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Camera className="h-4 w-4 inline mr-2" />
                                        Imagem
                                    </button>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-4">Cole o seu texto na caixa abaixo. Palavras com erros de ortografia serão sublinhadas em vermelho.</p>

                            {activeTab === 'text' ? (
                                <div className="space-y-4">
                                    <textarea
                                        value={texto}
                                        onChange={(e) => setTexto(e.target.value)}
                                        placeholder="Cole ou digite sua redação aqui... Mínimo de 150 palavras para análise completa."
                                        className="w-full h-80 p-4 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows={15}
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 text-sm">
                                            {texto.split(/\s+/).filter(Boolean).length} palavras
                                        </span>
                                        <button
                                            onClick={analisarTexto}
                                            disabled={loading || !texto.trim()}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                    <span>Analisando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <BarChart3 className="h-5 w-5" />
                                                    <span>Analisar Redação</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-gray-700 font-medium mb-2">Envie uma imagem da redação</h3>
                                        <p className="text-gray-500 text-sm mb-4">
                                            {ocrLoading ? 'Processando imagem...' : 'Suporte para JPG, PNG e WebP'}
                                        </p>
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
                                            className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${ocrLoading
                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            {ocrLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                    <span>Processando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="h-5 w-5" />
                                                    <span>Escolher Imagem</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sobre a Ferramenta - inspirado no projeto original */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <Target className="h-5 w-5 mr-2 text-blue-600" />
                                Sobre a Nossa Ferramenta
                            </h2>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <strong>Estatísticas Gerais:</strong> Contamos o número de palavras, frases e parágrafos.
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <strong>Repetição de Palavras:</strong> Destacamos termos que se repetem excessivamente.
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <strong>Vícios de Linguagem:</strong> Identificamos palavras que devem ser evitadas na escrita formal.
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <strong>Notas por Competência (Estilo ENEM):</strong> Calculamos uma nota simulada para as competências I, II, IV e V.
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-8">
                        {resultado ? (
                            <>
                                {/* Score Card */}
                                <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-semibold text-gray-800">Análise do Texto</h2>
                                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-full text-xl font-bold shadow-lg">
                                            {resultado.total}/1000
                                        </div>
                                    </div>

                                    {/* Competências com estilo similar ao original */}
                                    <div className="space-y-4">
                                        {['c1', 'c2', 'c3', 'c4', 'c5'].map((comp, index) => {
                                            const nota = resultado.competencias[comp as keyof typeof resultado.competencias];
                                            const level = getNotaLevel(nota);

                                            return (
                                                <div key={comp} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-4 h-4 rounded-full ${level.color}`}></div>
                                                            <span className="text-gray-800 font-medium">
                                                                Competência {index + 1}: {competenciasNomes[index]}
                                                            </span>
                                                        </div>
                                                        <span className={`font-bold text-lg ${getNotaColor(nota)}`}>
                                                            {nota}/200
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                                        <div
                                                            className={`h-3 rounded-full ${level.color} transition-all duration-500`}
                                                            style={{ width: `${(nota / 200) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="mt-2 text-sm text-gray-600">
                                                        {level.label}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Estatísticas</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                                            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-gray-800">{resultado.palavras}</div>
                                            <div className="text-gray-600 text-sm">Palavras</div>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                                            <div className="text-2xl font-bold text-gray-800">{resultado.paragrafos}</div>
                                            <div className="text-gray-600 text-sm">Parágrafos</div>
                                        </div>
                                        {resultado.conectivos && (
                                            <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-100">
                                                <div className="text-2xl font-bold text-gray-800">{resultado.conectivos.length}</div>
                                                <div className="text-gray-600 text-sm">Conectivos</div>
                                            </div>
                                        )}
                                        {resultado.ttr && (
                                            <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-100">
                                                <div className="text-2xl font-bold text-gray-800">{resultado.ttr}</div>
                                                <div className="text-gray-600 text-sm">TTR</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Palavras Repetidas */}
                                {resultado.repetidas.length > 0 && (
                                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Palavras Repetidas</h3>
                                        <div className="space-y-2">
                                            {resultado.repetidas.slice(0, 5).map((item, index) => (
                                                <div key={index} className="flex justify-between items-center bg-red-50 rounded-lg p-3 border border-red-100">
                                                    <span className="text-gray-800 font-medium">{item.palavra}</span>
                                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">{item.vezes}x</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Vícios de Linguagem */}
                                {resultado.vicios && resultado.vicios.length > 0 && (
                                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Vícios de Linguagem</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {resultado.vicios.map((vicio, index) => (
                                                <span key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {vicio}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Feedback Detalhado inspirado no original */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Feedback Detalhado</h3>

                                    {resultado.feedback ? (
                                        <div className="space-y-4">
                                            {/* Feedback por competência */}
                                            {Object.entries(resultado.feedback).map(([competencia, dicas]) => {
                                                if (competencia === 'geral' || dicas.length === 0) return null;

                                                const nomeCompetencia: { [key: string]: string } = {
                                                    c1: 'Norma Culta',
                                                    c2: 'Compreensão do Tema',
                                                    c3: 'Argumentação',
                                                    c4: 'Coesão e Coerência',
                                                    c5: 'Proposta de Intervenção'
                                                };

                                                return (
                                                    <div key={competencia} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <h4 className="text-gray-800 font-medium mb-3 border-b border-gray-300 pb-2">
                                                            {nomeCompetencia[competencia] || competencia}
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {dicas.map((dica: string, index: number) => (
                                                                <div key={index} className="flex items-start space-x-2">
                                                                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                                    <span className="text-gray-700 text-sm">{dica}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Feedback geral */}
                                            {resultado.feedback.geral && resultado.feedback.geral.length > 0 && (
                                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                    <h4 className="text-gray-800 font-medium mb-3 border-b border-blue-300 pb-2">Dicas Gerais</h4>
                                                    <div className="space-y-2">
                                                        {resultado.feedback.geral.map((dica: string, index: number) => (
                                                            <div key={index} className="flex items-start space-x-2">
                                                                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                                <span className="text-gray-700 text-sm">{dica}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-start space-x-3">
                                                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-700 text-sm">
                                                    Mantenha entre 4-5 parágrafos para melhor estrutura
                                                </span>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-700 text-sm">
                                                    Evite repetir palavras mais de 3 vezes
                                                </span>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-700 text-sm">
                                                    Use conectivos para melhor coesão textual
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-2xl p-12 shadow-xl text-center border border-gray-100">
                                <Award className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Pronto para análise!</h3>
                                <p className="text-gray-600 text-lg">
                                    Digite ou cole sua redação ao lado e clique em "Analisar Redação" para receber feedback instantâneo
                                    baseado nos critérios do ENEM.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Seção Sobre */}
            <div className="container mx-auto px-6 my-16">
                <div className="bg-white rounded-2xl p-12 shadow-xl border border-gray-100 max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold mb-8 text-center text-blue-600">
                        📖 Sobre a Ferramenta
                    </h2>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">🎯 Como funciona?</h3>
                            <p className="text-gray-700 mb-6 text-lg">
                                Esta ferramenta analisa sua redação seguindo os critérios oficiais do ENEM:
                            </p>
                            <ul className="space-y-4 text-gray-700">
                                <li className="flex items-start space-x-3">
                                    <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                                    <span><strong>Norma Culta:</strong> Gramática e ortografia</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                                    <span><strong>Tema:</strong> Compreensão da proposta</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                                    <span><strong>Argumentação:</strong> Qualidade dos argumentos</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                                    <span><strong>Coesão:</strong> Organização do texto</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</span>
                                    <span><strong>Proposta:</strong> Solução para o problema</span>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">💡 Dicas importantes</h3>
                            <div className="space-y-4">
                                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                        <span className="font-semibold text-green-800 text-lg">Tamanho ideal</span>
                                    </div>
                                    <p className="text-green-700">Entre 150-300 palavras para melhor avaliação</p>
                                </div>
                                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                                        <span className="font-semibold text-yellow-800 text-lg">Use conectivos</span>
                                    </div>
                                    <p className="text-yellow-700">"portanto", "assim", "dessa forma" melhoram a coesão</p>
                                </div>
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Info className="h-6 w-6 text-blue-600" />
                                        <span className="font-semibold text-blue-800 text-lg">Estrutura</span>
                                    </div>
                                    <p className="text-blue-700">Introdução, desenvolvimento e conclusão bem definidos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 py-8 mt-16">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-gray-300 text-lg">Desenvolvido com ❤️ para aprimorar sua escrita</p>
                </div>
            </footer>
        </div>
    );
};

export default CorretorRedacao;
