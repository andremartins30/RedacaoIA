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

**FORMATO DA RESPOSTA:**
Retorne um JSON válido seguindo exatamente esta estrutura:

{
    "competencia1": {
        "nota": número entre 0 e 200,
        "feedback": ["feedback específico sobre gramática, ortografia, concordância..."],
        "pontosFortes": ["aspectos positivos identificados"],
        "pontosFrageis": ["pontos que precisam melhorar"]
    },
    "competencia2": {
        "nota": número entre 0 e 200,
        "feedback": ["feedback sobre tema e desenvolvimento..."],
        "pontosFortes": ["aspectos positivos"],
        "pontosFrageis": ["pontos de melhoria"]
    },
    "competencia3": {
        "nota": número entre 0 e 200,
        "feedback": ["feedback sobre argumentação..."],
        "pontosFortes": ["aspectos positivos"],
        "pontosFrageis": ["pontos de melhoria"]
    },
    "competencia4": {
        "nota": número entre 0 e 200,
        "feedback": ["feedback sobre coesão e coerência..."],
        "pontosFortes": ["aspectos positivos"],
        "pontosFrageis": ["pontos de melhoria"]
    },
    "competencia5": {
        "nota": número entre 0 e 200,
        "feedback": ["feedback sobre proposta de intervenção..."],
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

        // Extrair JSON da resposta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Resposta do Gemini não contém JSON válido');
            return null;
        }

        let analise: AnaliseGemini;
        try {
            // Tenta fazer o parse do JSON
            analise = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('Erro no parse do JSON do Gemini:', parseError);
            console.error('JSON extraído:', jsonMatch[0].substring(0, 200) + '...');

            // Tenta limpar o JSON removendo caracteres problemáticos
            const cleanJson = jsonMatch[0]
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
                .replace(/,(\s*[}\]])/g, '$1') // Remove vírgulas extras
                .replace(/([}\]])(\s*[,])/g, '$1'); // Remove vírgulas após fechamento

            try {
                analise = JSON.parse(cleanJson);
                console.log('JSON corrigido com sucesso');
            } catch (cleanError) {
                console.error('Falha mesmo com limpeza do JSON:', cleanError);
                return null;
            }
        }

        // Validar se a análise tem a estrutura esperada
        if (!analise.competencia1 || !analise.notaFinal) {
            console.error('Estrutura da análise do Gemini inválida');
            return null;
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

Forneça sugestões no formato de array JSON: ["sugestão 1", "sugestão 2", ...]

Seja específico e prático. Exemplos:
- "Substitua 'muito bom' por termos mais precisos como 'extremamente relevante'"
- "No segundo parágrafo, adicione um conectivo como 'entretanto' para melhorar a coesão"
- "Inclua dados estatísticos para fortalecer seu argumento"
`;

        const result = await retryWithBackoff(async () => {
            // Rate limiting
            await waitForRateLimit();
            return await model.generateContent(prompt);
        });

        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
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
Analise esta redação ENEM e forneça apenas:
- Nota de cada competência (0-200)
- 2 feedbacks principais
- 2 sugestões de melhoria

TEXTO: ${texto}

Responda em JSON:
{
    "competencia1": {"nota": 0, "feedback": ["comentário"]},
    "competencia2": {"nota": 0, "feedback": ["comentário"]},
    "competencia3": {"nota": 0, "feedback": ["comentário"]},
    "competencia4": {"nota": 0, "feedback": ["comentário"]},
    "competencia5": {"nota": 0, "feedback": ["comentário"]},
    "notaFinal": 0,
    "feedbackGeral": ["feedback geral"],
    "sugestoesDetalhadas": ["sugestão"],
    "analiseQualitativa": "breve análise"
}
`;

        const result = await retryWithBackoff(async () => {
            // Rate limiting
            await waitForRateLimit();
            return await model.generateContent(prompt);
        });
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Resposta do Gemini não contém JSON válido');
            return null;
        }

        const analise = JSON.parse(jsonMatch[0]);

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
