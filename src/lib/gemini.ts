import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    redacaoParaYAMLOtimizado,
    yamlParaAnaliseGemini,
    // calcularReducaoTokens, // Função não usada no momento
    gerarEstatisticasOtimizacao,
    validarPreservacaoTexto
} from './yaml-optimizer';

// Configuração do Gemini com modelo mais eficiente para o free tier
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',  // Modelo mais eficiente com mais cota gratuita
    generationConfig: {
        maxOutputTokens: 2000,  // Limita o output para economizar cota
        temperature: 0.7,
    }
});

// Controle de rate limiting e retry com backoff
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 3000; // Aumentado para 3 segundos entre requisições
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 segundo de delay base

const waitForRateLimit = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_INTERVAL_MS) {
        const waitTime = MIN_INTERVAL_MS - timeSinceLastRequest;
        console.log(`Rate limiting: aguardando ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_RETRIES,
    baseDelay: number = BASE_DELAY
): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: unknown) {
            lastError = error;

            // Verifica se é um erro que vale a pena retry
            const shouldRetry = error && typeof error === 'object' &&
                ('status' in error && (
                    error.status === 503 || // Service Unavailable
                    error.status === 429 || // Too Many Requests
                    error.status === 500    // Internal Server Error
                ));

            if (attempt === maxRetries || !shouldRetry) {
                throw lastError;
            }

            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`);
            await sleep(delay);
        }
    }

    throw lastError;
};

// Interface para análise do Gemini
export interface AnaliseGemini {
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
}

// Prompt para avaliação de redação ENEM
const PROMPT_AVALIACAO_REDACAO = `
Você é um corretor especialista em redações do ENEM com mais de 20 anos de experiência. Sua missão é avaliar a redação fornecida seguindo rigorosamente os critérios oficiais do ENEM.

**CRITÉRIOS DE AVALIAÇÃO:**

**COMPETÊNCIA 1 - Domínio da modalidade escrita formal da língua portuguesa (0-200 pontos)**
- 200: Excelente domínio da modalidade escrita formal
- 160: Bom domínio da modalidade escrita formal  
- 120: Domínio mediano da modalidade escrita formal
- 80: Domínio insuficiente da modalidade escrita formal
- 40: Domínio precário da modalidade escrita formal
- 0: Desconhecimento da modalidade escrita formal

**COMPETÊNCIA 2 - Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento (0-200 pontos)**
- 200: Desenvolve o tema por completo
- 160: Desenvolve o tema de forma adequada
- 120: Desenvolve o tema de forma mediana
- 80: Desenvolve o tema de forma insuficiente
- 40: Desenvolve o tema de forma precária
- 0: Foge ao tema/não desenvolve o tema

**COMPETÊNCIA 3 - Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos (0-200 pontos)**
- 200: Excelente seleção, relação, organização e interpretação
- 160: Boa seleção, relação, organização e interpretação
- 120: Seleção, relação, organização e interpretação adequadas
- 80: Seleção, relação, organização e interpretação insuficientes
- 40: Seleção, relação, organização e interpretação precárias
- 0: Apresenta informações, fatos e opiniões desconectados

**COMPETÊNCIA 4 - Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação (0-200 pontos)**
- 200: Articula as partes do texto com poucas inadequações
- 160: Articula as partes do texto de maneira adequada
- 120: Articula as partes do texto de maneira mediana
- 80: Articula as partes do texto de maneira insuficiente
- 40: Articula as partes do texto de maneira precária
- 0: Não articula as informações

**COMPETÊNCIA 5 - Elaborar proposta de intervenção para o problema abordado (0-200 pontos)**
- 200: Elabora muito bem a proposta, detalhada, relacionada ao tema e articulada à discussão
- 160: Elabora bem a proposta, relacionada ao tema e articulada à discussão
- 120: Elabora de forma mediana a proposta, relacionada ao tema
- 80: Elabora de forma insuficiente a proposta
- 40: Elabora de forma precária a proposta
- 0: Não elabora proposta

**INSTRUÇÕES:**
1. Leia atentamente toda a redação
2. Avalie cada competência individualmente com muito rigor
3. Forneça feedback específico e construtivo
4. Identifique pontos fortes e áreas de melhoria
5. Sugira melhorias práticas e detalhadas
6. Mantenha tom profissional e educativo

**IMPORTANTE: Responda APENAS com um JSON válido, sem texto adicional. Não use "..." ou reticências no meio das strings.**

**FORMATO DA RESPOSTA:**
Retorne um JSON válido seguindo exatamente esta estrutura:

{
    "competencia1": {
        "nota": número entre 0 e 200,
        "feedback": ["feedback específico sobre gramática, ortografia, concordância"],
        "pontosFortes": ["aspectos positivos identificados"],
        "pontosFrageis": ["pontos que precisam melhorar"]
    },
    "competencia2": {
        "nota": número entre 0 e 200,
        "feedback": ["feedback sobre tema e desenvolvimento"],
        "pontosFortes": ["aspectos positivos"],
        "pontosFrageis": ["pontos de melhoria"]
    },
    "competencia3": {
        "nota": número entre 0 e 200,
        "feedback": ["feedback sobre argumentação"],
        "pontosFortes": ["aspectos positivos"],
        "pontosFrageis": ["pontos de melhoria"]
    },
    "competencia4": {
        "nota": número entre 0 e 200,
        "feedback": ["feedback sobre coesão e coerência"],
        "pontosFortes": ["aspectos positivos"],
        "pontosFrageis": ["pontos de melhoria"]
    },
    "competencia5": {
        "nota": número entre 0 e 200,
        "feedback": ["feedback sobre proposta de intervenção"],
        "pontosFortes": ["aspectos positivos"],
        "pontosFrageis": ["pontos de melhoria"]
    },
    "notaFinal": soma das 5 competências,
    "feedbackGeral": ["comentários gerais sobre a redação"],
    "sugestoesDetalhadas": ["sugestões específicas para melhoria"],
    "analiseQualitativa": "análise detalhada em texto corrido sobre a redação como um todo"
}

**REDAÇÃO PARA AVALIAR:**
`;

// Prompt otimizado para análise YAML (economia de ~45% tokens)
const PROMPT_YAML_OTIMIZADO = `
Você é um corretor especialista em redações ENEM. Recebeu uma redação em formato YAML estruturado para análise mais eficiente.

IMPORTANTE: O texto_original no YAML está INTACTO e deve ser analisado conforme critérios oficiais ENEM.

Analise seguindo rigorosamente os critérios ENEM (0-200 pontos cada competência) e responda APENAS em YAML compacto:

\`\`\`yaml
analise:
  notas:
    C1: 160  # Norma culta
    C2: 140  # Tema
    C3: 180  # Argumentação
    C4: 120  # Coesão
    C5: 160  # Proposta
    total: 760
  feedback:
    pontos_fortes: ["domínio norma culta", "argumentação consistente"]
    areas_melhoria: ["conectivos", "dados estatísticos"]
  sugestoes:
    - original: "frase a melhorar"
      melhoria: "sugestão específica"
    - original: "outra frase"
      melhoria: "outra sugestão"
  observacoes: "análise geral breve e objetiva"
\`\`\`

Redação estruturada:
`;

export async function analisarRedacaoComGemini(texto: string): Promise<AnaliseGemini | null> {
    try {
        if (!process.env.GOOGLE_API_KEY) {
            console.warn('Chave da API do Google não configurada');
            return null;
        }

        const prompt = PROMPT_AVALIACAO_REDACAO + texto;

        const result = await retryWithBackoff(async () => {
            // Rate limiting
            await waitForRateLimit();
            return await model.generateContent(prompt);
        });

        const response = await result.response;
        const text = response.text();

        // Função auxiliar para parsing robusto de JSON da análise
        const parseAnaliseJson = (jsonText: string): AnaliseGemini | null => {
            try {
                // Primeira tentativa: JSON direto
                return JSON.parse(jsonText);
            } catch (error) {
                console.log('JSON da análise malformado, tentando corrigir automaticamente...');

                try {
                    // Limpeza mais agressiva para JSON de análise
                    let cleanJson = jsonText
                        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
                        .replace(/,(\s*[}\]])/g, '$1') // Remove vírgulas antes de } ou ]
                        .replace(/([}\]])\s*,/g, '$1') // Remove vírgulas após } ou ]
                        .replace(/,(\s*,)+/g, ',') // Remove vírgulas duplicadas
                        .replace(/:\s*,/g, ': ""') // Substitui valores vazios por string vazia
                        .replace(/"\s*\.\.\./g, '"') // Remove "..." no final de strings
                        .replace(/\.\.\./g, '') // Remove "..." soltos
                        .replace(/[""]([^"]*?)["]/g, '"$1"') // Normaliza aspas curvas
                        .replace(/'/g, '"') // Substitui aspas simples por duplas dentro de strings
                        .replace(/\\"/g, '\\"') // Garante escape correto de aspas
                        .trim();

                    // Se não termina com }, adiciona
                    if (!cleanJson.endsWith('}')) {
                        // Encontra a última string completa e fecha o JSON
                        const lastCompleteQuote = cleanJson.lastIndexOf('"]');
                        if (lastCompleteQuote !== -1) {
                            cleanJson = cleanJson.substring(0, lastCompleteQuote + 2) + '}}';
                        } else {
                            cleanJson += '}}';
                        }
                    }

                    const correctedParsed = JSON.parse(cleanJson);
                    console.log('JSON da análise corrigido e parseado com sucesso');
                    return correctedParsed;
                } catch (secondError) {
                    console.log('Extraindo dados da análise manualmente...', secondError);
                    console.log('JSON problemático (primeiros 500 chars):', jsonText.substring(0, 500));

                    // Extração manual dos dados principais se o JSON falhar completamente
                    try {
                        const competencia1Match = jsonText.match(/"competencia1":\s*{\s*"nota":\s*(\d+)/);
                        const competencia2Match = jsonText.match(/"competencia2":\s*{\s*"nota":\s*(\d+)/);
                        const competencia3Match = jsonText.match(/"competencia3":\s*{\s*"nota":\s*(\d+)/);
                        const competencia4Match = jsonText.match(/"competencia4":\s*{\s*"nota":\s*(\d+)/);
                        const competencia5Match = jsonText.match(/"competencia5":\s*{\s*"nota":\s*(\d+)/);

                        if (competencia1Match && competencia2Match && competencia3Match && competencia4Match && competencia5Match) {
                            const notas = {
                                c1: parseInt(competencia1Match[1]),
                                c2: parseInt(competencia2Match[1]),
                                c3: parseInt(competencia3Match[1]),
                                c4: parseInt(competencia4Match[1]),
                                c5: parseInt(competencia5Match[1])
                            };

                            const total = notas.c1 + notas.c2 + notas.c3 + notas.c4 + notas.c5;

                            // Cria uma análise básica com as notas extraídas
                            return {
                                competencia1: { nota: notas.c1, feedback: ['Análise extraída automaticamente'], pontosFortes: [], pontosFrageis: [] },
                                competencia2: { nota: notas.c2, feedback: ['Análise extraída automaticamente'], pontosFortes: [], pontosFrageis: [] },
                                competencia3: { nota: notas.c3, feedback: ['Análise extraída automaticamente'], pontosFortes: [], pontosFrageis: [] },
                                competencia4: { nota: notas.c4, feedback: ['Análise extraída automaticamente'], pontosFortes: [], pontosFrageis: [] },
                                competencia5: { nota: notas.c5, feedback: ['Análise extraída automaticamente'], pontosFortes: [], pontosFrageis: [] },
                                notaFinal: total,
                                feedbackGeral: ['Análise simplificada devido a problema de formatação'],
                                sugestoesDetalhadas: [],
                                analiseQualitativa: 'Análise extraída automaticamente devido a problema na resposta do Gemini'
                            };
                        }
                    } catch (extractError) {
                        console.log('Falha na extração manual:', extractError);
                    }

                    return null;
                }
            }
        };

        // Extrair JSON da resposta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Resposta do Gemini não contém JSON válido');
            return null;
        }

        const analise = parseAnaliseJson(jsonMatch[0]);
        if (!analise) {
            console.error('Não foi possível extrair análise válida da resposta do Gemini');
            return null;
        }

        // Validar se a análise tem a estrutura esperada
        if (!analise.competencia1 || typeof analise.competencia1.nota !== 'number') {
            console.error('Análise não possui estrutura válida para competencia1');
            return null;
        }

        // Garantir que todas as competências têm notas válidas
        const competencias = ['competencia1', 'competencia2', 'competencia3', 'competencia4', 'competencia5'] as const;
        for (const comp of competencias) {
            if (!analise[comp] || typeof analise[comp].nota !== 'number') {
                console.warn(`Competência ${comp} inválida, definindo valores padrão`);
                analise[comp] = {
                    nota: 0,
                    feedback: ['Dados não disponíveis'],
                    pontosFortes: [],
                    pontosFrageis: []
                };
            }
        }

        // Calcular nota final se não estiver presente ou estiver incorreta
        if (!analise.notaFinal || typeof analise.notaFinal !== 'number') {
            analise.notaFinal = analise.competencia1.nota + analise.competencia2.nota +
                analise.competencia3.nota + analise.competencia4.nota + analise.competencia5.nota;
        }

        return analise;
    } catch (error: unknown) {
        console.error('Erro na análise com Gemini:', error);

        // Tratamento específico para diferentes tipos de erro
        if (error && typeof error === 'object' && 'status' in error) {
            switch (error.status) {
                case 503:
                    console.warn('Serviço Gemini temporariamente sobrecarregado. Tente novamente em alguns minutos.');
                    break;
                case 429:
                    console.warn('Cota da API Gemini excedida. Análise IA temporariamente indisponível.');
                    break;
                case 500:
                    console.warn('Erro interno do serviço Gemini. Tentativas automáticas de retry foram feitas.');
                    break;
                default:
                    console.warn('Erro desconhecido na API Gemini:', error.status);
            }
        }

        return null;
    }
}

/**
 * Análise otimizada usando YAML - Reduz tokens em ~45%
 * IMPORTANTE: Preserva texto original integralmente
 */
export async function analisarRedacaoComYAMLOtimizado(texto: string): Promise<{
    analise: AnaliseGemini | null;
    estatisticas: {
        tokens_texto_original: number;
        tokens_yaml: number;
        reducao_percentual: number;
    };
    economia_tokens: {
        economia_absoluta: number;
        economia_percentual: number;
    };
} | null> {
    try {
        if (!process.env.GOOGLE_API_KEY) {
            console.warn('Chave da API do Google não configurada');
            return null;
        }

        // Converte redação para YAML otimizado (PRESERVANDO texto original)
        const yamlOtimizado = redacaoParaYAMLOtimizado(texto);

        // Verifica se o texto foi preservado
        const yamlData = yamlParaAnaliseGemini(yamlOtimizado);
        if (!validarPreservacaoTexto(texto, yamlData)) {
            console.error('ERRO CRÍTICO: Texto original foi alterado durante otimização YAML');
            return null;
        }

        // Gera estatísticas de otimização
        const estatisticas = gerarEstatisticasOtimizacao(texto, yamlOtimizado);
        console.log(`🚀 Otimização YAML ativada:`, estatisticas);

        const prompt = PROMPT_YAML_OTIMIZADO + yamlOtimizado;

        const result = await retryWithBackoff(async () => {
            await waitForRateLimit();
            return await model.generateContent(prompt);
        });

        const response = await result.response;
        const yamlResposta = response.text();

        // Converte resposta YAML para estrutura esperada
        const analiseYAML = yamlParaAnaliseGemini(yamlResposta);

        if (!analiseYAML) {
            console.error('Resposta YAML do Gemini inválida');
            return null;
        }

        // Type-safe access to YAML data
        const analiseData = analiseYAML as {
            analise?: {
                notas?: {
                    C1?: number;
                    C2?: number;
                    C3?: number;
                    C4?: number;
                    C5?: number;
                    total?: number;
                };
                feedback?: {
                    pontos_fortes?: string[];
                    areas_melhoria?: string[];
                };
                observacoes?: string;
                sugestoes?: Array<{ melhoria?: string }>;
            };
        };

        // Converte para formato AnaliseGemini compatível
        const analiseGemini: AnaliseGemini = {
            competencia1: {
                nota: analiseData.analise?.notas?.C1 || 0,
                feedback: analiseData.analise?.feedback?.pontos_fortes || [],
                pontosFortes: analiseData.analise?.feedback?.pontos_fortes || [],
                pontosFrageis: analiseData.analise?.feedback?.areas_melhoria || []
            },
            competencia2: {
                nota: analiseData.analise?.notas?.C2 || 0,
                feedback: analiseData.analise?.feedback?.pontos_fortes || [],
                pontosFortes: analiseData.analise?.feedback?.pontos_fortes || [],
                pontosFrageis: analiseData.analise?.feedback?.areas_melhoria || []
            },
            competencia3: {
                nota: analiseData.analise?.notas?.C3 || 0,
                feedback: analiseData.analise?.feedback?.pontos_fortes || [],
                pontosFortes: analiseData.analise?.feedback?.pontos_fortes || [],
                pontosFrageis: analiseData.analise?.feedback?.areas_melhoria || []
            },
            competencia4: {
                nota: analiseData.analise?.notas?.C4 || 0,
                feedback: analiseData.analise?.feedback?.pontos_fortes || [],
                pontosFortes: analiseData.analise?.feedback?.pontos_fortes || [],
                pontosFrageis: analiseData.analise?.feedback?.areas_melhoria || []
            },
            competencia5: {
                nota: analiseData.analise?.notas?.C5 || 0,
                feedback: analiseData.analise?.feedback?.pontos_fortes || [],
                pontosFortes: analiseData.analise?.feedback?.pontos_fortes || [],
                pontosFrageis: analiseData.analise?.feedback?.areas_melhoria || []
            },
            notaFinal: analiseData.analise?.notas?.total || 0,
            feedbackGeral: [analiseData.analise?.observacoes || 'Análise concluída'],
            sugestoesDetalhadas: (analiseData.analise?.sugestoes || []).map((s: { melhoria?: string }) => s.melhoria || ''),
            analiseQualitativa: analiseData.analise?.observacoes || ''
        };

        return {
            analise: analiseGemini,
            estatisticas: {
                tokens_texto_original: estatisticas.tokens_original,
                tokens_yaml: estatisticas.tokens_yaml,
                reducao_percentual: estatisticas.reducao_percentual
            },
            economia_tokens: {
                economia_absoluta: estatisticas.economia_absoluta,
                economia_percentual: estatisticas.reducao_percentual
            }
        };

    } catch (error: unknown) {
        console.error('Erro na análise YAML otimizada:', error);

        // Tratamento específico de erros
        if (error && typeof error === 'object' && 'status' in error) {
            switch (error.status) {
                case 503:
                    console.warn('Serviço Gemini sobrecarregado. Análise YAML temporariamente indisponível.');
                    break;
                case 429:
                    console.warn('Cota da API Gemini excedida. Análise YAML temporariamente indisponível.');
                    break;
            }
        }

        return null;
    }
}

export async function gerarSugestoesDetalhadas(texto: string, analiseOriginal: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
    total: number;
}): Promise<string[]> {
    try {
        if (!process.env.GOOGLE_API_KEY) {
            return [];
        }

        const prompt = `
Como corretor especialista em ENEM, analise esta redação e forneça 3-5 sugestões específicas e práticas para melhorar a nota:

REDAÇÃO:
${texto}

ANÁLISE ATUAL:
- Nota C1: ${analiseOriginal.c1}
- Nota C2: ${analiseOriginal.c2}
- Nota C3: ${analiseOriginal.c3}
- Nota C4: ${analiseOriginal.c4}
- Nota C5: ${analiseOriginal.c5}
- Total: ${analiseOriginal.total}

IMPORTANTE: Responda APENAS com um array JSON válido, sem texto adicional.

Formato obrigatório:
[
  "Sugestão específica 1",
  "Sugestão específica 2",
  "Sugestão específica 3"
]

Exemplos de sugestões:
- "Substitua 'muito bom' por termos mais precisos como 'extremamente relevante'"
- "No segundo parágrafo, adicione um conectivo como 'entretanto' para melhorar a coesão"
- "Inclua dados estatísticos para fortalecer seu argumento"
- "Use mais conectivos como 'além disso', 'por outro lado' para melhorar C4"
- "Detalhe melhor a proposta de intervenção com agente, ação e finalidade"
`;

        const result = await retryWithBackoff(async () => {
            // Rate limiting
            await waitForRateLimit();
            return await model.generateContent(prompt);
        });

        const response = await result.response;
        const text = response.text();

        // Função auxiliar para limpar e corrigir JSON malformado
        const parseJsonSugestoes = (jsonText: string): string[] => {
            try {
                // Primeira tentativa: JSON direto
                const parsed = JSON.parse(jsonText);
                return parsed;
            } catch (error) {
                console.log('JSON malformado, tentando corrigir automaticamente...');

                try {
                    // Remove caracteres problemáticos e tenta corrigir
                    let cleanJson = jsonText
                        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
                        .replace(/,(\s*[}\]])/g, '$1') // Remove vírgulas antes de } ou ]
                        .replace(/([}\]])\s*,/g, '$1') // Remove vírgulas após } ou ]
                        .trim();

                    // Se não termina com ], adiciona
                    if (!cleanJson.endsWith(']')) {
                        const lastQuote = cleanJson.lastIndexOf('"');
                        if (lastQuote !== -1) {
                            cleanJson = cleanJson.substring(0, lastQuote + 1) + ']';
                        } else {
                            cleanJson += ']';
                        }
                    }

                    const correctedParsed = JSON.parse(cleanJson);
                    console.log('JSON corrigido e parseado com sucesso');
                    return correctedParsed;
                } catch (secondError) {
                    console.log('Extraindo sugestões manualmente via regex...');

                    // Extração manual usando regex para encontrar strings entre aspas
                    const suggestionMatches = jsonText.match(/"([^"\\]|\\.)*"/g);
                    if (suggestionMatches) {
                        return suggestionMatches.map(match => {
                            try {
                                return JSON.parse(match);
                            } catch {
                                // Remove as aspas manualmente se JSON.parse falhar
                                return match.slice(1, -1).replace(/\\"/g, '"');
                            }
                        });
                    }

                    return [];
                }
            }
        };

        // Procura por array JSON na resposta
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const sugestoes = parseJsonSugestoes(jsonMatch[0]);
            if (Array.isArray(sugestoes) && sugestoes.length > 0) {
                return sugestoes;
            }
        }

        // Se não encontrou array, procura por strings individuais
        const stringMatches = text.match(/"[^"]*"/g);
        if (stringMatches && stringMatches.length > 0) {
            return stringMatches.map(match => match.slice(1, -1));
        }

        // Último recurso: procura por linhas que começam com "-" ou números
        const lineMatches = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.match(/^(\d+\.|\-|\•)\s*(.+)/))
            .map(line => line.replace(/^(\d+\.|\-|\•)\s*/, ''))
            .filter(line => line.length > 10); // Filtra sugestões muito curtas

        if (lineMatches.length > 0) {
            return lineMatches;
        }

        return [];
    } catch (error: unknown) {
        console.error('Erro ao gerar sugestões detalhadas:', error);

        // Tratamento específico para diferentes tipos de erro
        if (error && typeof error === 'object' && 'status' in error) {
            switch (error.status) {
                case 503:
                    console.warn('Serviço Gemini sobrecarregado. Sugestões IA temporariamente indisponíveis.');
                    break;
                case 429:
                    console.warn('Cota da API Gemini excedida. Sugestões IA temporariamente indisponíveis.');
                    break;
            }
        }

        return [];
    }
}

// Versão simplificada da análise para quando a cota estiver limitada
export async function analisarRedacaoSimplificada(texto: string): Promise<AnaliseGemini | null> {
    try {
        if (!process.env.GOOGLE_API_KEY) {
            console.warn('Chave da API do Google não configurada');
            return null;
        }

        // Rate limiting
        await waitForRateLimit();

        const prompt = `
Analise esta redação ENEM de forma SIMPLIFICADA.

TEXTO: ${texto}

RESPONDA APENAS com este JSON exato (sem texto adicional, sem "..."):
{
    "competencia1": {"nota": 120, "feedback": ["comentário breve"]},
    "competencia2": {"nota": 140, "feedback": ["comentário breve"]},
    "competencia3": {"nota": 160, "feedback": ["comentário breve"]},
    "competencia4": {"nota": 120, "feedback": ["comentário breve"]},
    "competencia5": {"nota": 140, "feedback": ["comentário breve"]},
    "notaFinal": 680,
    "feedbackGeral": ["análise geral"],
    "sugestoesDetalhadas": ["sugestão"],
    "analiseQualitativa": "análise breve"
}
`;

        const result = await retryWithBackoff(async () => {
            await waitForRateLimit();
            return await model.generateContent(prompt);
        });
        const response = await result.response;
        const text = response.text();

        // Usar o mesmo parser robusto da função principal
        const parseAnaliseSimplificada = (jsonText: string): any | null => {
            try {
                return JSON.parse(jsonText);
            } catch (error) {
                console.log('JSON simplificado malformado, tentando corrigir...');
                try {
                    let cleanJson = jsonText
                        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                        .replace(/,(\s*[}\]])/g, '$1')
                        .replace(/([}\]])\s*,/g, '$1')
                        .replace(/"\s*\.\.\./g, '"')
                        .trim();

                    if (!cleanJson.endsWith('}')) {
                        cleanJson += '}';
                    }

                    return JSON.parse(cleanJson);
                } catch (secondError) {
                    console.log('Fallback para análise básica...');
                    return {
                        competencia1: { nota: 100, feedback: ['Análise básica'] },
                        competencia2: { nota: 120, feedback: ['Análise básica'] },
                        competencia3: { nota: 140, feedback: ['Análise básica'] },
                        competencia4: { nota: 100, feedback: ['Análise básica'] },
                        competencia5: { nota: 120, feedback: ['Análise básica'] },
                        notaFinal: 580,
                        feedbackGeral: ['Análise simplificada'],
                        sugestoesDetalhadas: ['Continue praticando'],
                        analiseQualitativa: 'Análise básica devido a limitações técnicas'
                    };
                }
            }
        };

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Resposta do Gemini não contém JSON válido na análise simplificada');
            return null;
        }

        const analise = parseAnaliseSimplificada(jsonMatch[0]);
        if (!analise) {
            return null;
        }

        // Preencher campos obrigatórios caso estejam ausentes
        const analiseCompleta: AnaliseGemini = {
            competencia1: {
                nota: analise.competencia1?.nota || 0,
                feedback: analise.competencia1?.feedback || [],
                pontosFortes: [],
                pontosFrageis: []
            },
            competencia2: {
                nota: analise.competencia2?.nota || 0,
                feedback: analise.competencia2?.feedback || [],
                pontosFortes: [],
                pontosFrageis: []
            },
            competencia3: {
                nota: analise.competencia3?.nota || 0,
                feedback: analise.competencia3?.feedback || [],
                pontosFortes: [],
                pontosFrageis: []
            },
            competencia4: {
                nota: analise.competencia4?.nota || 0,
                feedback: analise.competencia4?.feedback || [],
                pontosFortes: [],
                pontosFrageis: []
            },
            competencia5: {
                nota: analise.competencia5?.nota || 0,
                feedback: analise.competencia5?.feedback || [],
                pontosFortes: [],
                pontosFrageis: []
            },
            notaFinal: analise.notaFinal || 0,
            feedbackGeral: analise.feedbackGeral || [],
            sugestoesDetalhadas: analise.sugestoesDetalhadas || [],
            analiseQualitativa: analise.analiseQualitativa || ''
        };

        return analiseCompleta;
    } catch (error: unknown) {
        console.error('Erro na análise simplificada com Gemini:', error);

        // Tratamento específico para diferentes tipos de erro
        if (error && typeof error === 'object' && 'status' in error) {
            switch (error.status) {
                case 503:
                    console.warn('Serviço Gemini sobrecarregado. Análise IA simplificada temporariamente indisponível.');
                    break;
                case 429:
                    console.warn('Cota da API Gemini excedida. Análise IA temporariamente indisponível.');
                    break;
            }
        }

        return null;
    }
}
