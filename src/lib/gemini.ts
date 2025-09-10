import { GoogleGenerativeAI } from '@google/generative-ai';

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

        const analise: AnaliseGemini = JSON.parse(jsonMatch[0]);

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
} export async function gerarSugestoesDetalhadas(texto: string, analiseOriginal: {
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
