import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface VisionOCRResponse {
    text: string;
    confidence: number;
    wordCount: number;
    processingTime: string;
    method: 'google-vision';
    correctionApplied?: boolean;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json(
                { error: 'Imagem não fornecida' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GOOGLE_VISION_API_KEY;

        if (!apiKey) {
            console.log('⚠️ GOOGLE_VISION_API_KEY não encontrada no .env.local');
            return NextResponse.json(
                { error: 'Google Vision API não configurado. Configure a chave de API para usar o serviço de OCR.' },
                { status: 503 }
            );
        }

        console.log('🔑 Usando Google Vision API Key');
        try {
            const visionResult = await processWithVisionAPI(image, apiKey, startTime);
            return NextResponse.json(visionResult);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ Erro no Google Vision API:', error);

            if (errorMessage.includes('BILLING_REQUIRED')) {
                return NextResponse.json(
                    { error: 'Google Cloud precisa de faturamento ativo. Configure o faturamento no Google Cloud Console.' },
                    { status: 402 }
                );
            }

            if (errorMessage.includes('Nenhum texto detectado') || errorMessage.includes('Texto vazio detectado')) {
                return NextResponse.json(
                    { error: 'O Google Vision não conseguiu identificar texto na imagem. Por favor, envie uma imagem com texto mais legível ou redija o texto manualmente.' },
                    { status: 422 }
                );
            }

            return NextResponse.json(
                { error: 'Erro ao processar a imagem com Google Vision. Tente novamente ou use uma imagem de melhor qualidade.' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('❌ Erro geral na API:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// Função de pré-correção ortográfica com Gemini
async function preCorrectTextWithGemini(text: string): Promise<{ text: string; corrected: boolean }> {
    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            console.log('⚠️ GEMINI_API_KEY não encontrada - pulando pré-correção');
            return { text, corrected: false };
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.1, // Baixa temperatura para correções precisas
            }
        });

        const prompt = `Você é um corretor ortográfico especializado em textos manuscritos de redações do ENEM.

INSTRUÇÕES CRÍTICAS:
1. Corrija APENAS erros ortográficos óbvios (palavras claramente erradas)
2. NÃO altere a estrutura das frases ou o estilo de escrita
3. NÃO mude o sentido ou conteúdo do texto
4. NÃO adicione ou remova palavras
5. NÃO corrija erros de concordância ou regência (isso será avaliado na correção)
6. Mantenha parágrafos, pontuação e formatação originais
7. Se uma palavra pode ter múltiplas interpretações, escolha a mais provável no contexto

EXEMPLOS DO QUE CORRIGIR:
- "tecnolgia" → "tecnologia"
- "educção" → "educação"
- "conheicmento" → "conhecimento"
- "brasielira" → "brasileira"

EXEMPLOS DO QUE NÃO CORRIGIR:
- Concordância verbal incorreta (manter para avaliação)
- Uso incorreto de preposições (manter para avaliação)
- Construções de frases awkward (manter estilo do autor)

Texto para correção:
"""
${text}
"""

Retorne APENAS o texto corrigido, sem explicações ou comentários:`;

        console.log('🔄 Aplicando pré-correção ortográfica com Gemini...');

        const result = await model.generateContent(prompt);
        const correctedText = result.response.text().trim();

        // Verifica se houve mudanças significativas
        const originalWords = text.split(/\s+/).length;
        const correctedWords = correctedText.split(/\s+/).length;
        const wordCountDiff = Math.abs(originalWords - correctedWords);

        // Se a diferença de palavras for muito grande, usar texto original
        if (wordCountDiff > Math.max(3, originalWords * 0.1)) {
            console.log('⚠️ Pré-correção rejeitada - mudanças muito grandes');
            return { text, corrected: false };
        }

        console.log('✅ Pré-correção ortográfica aplicada');
        return { text: correctedText, corrected: true };

    } catch (error) {
        console.error('❌ Erro na pré-correção:', error);
        return { text, corrected: false };
    }
}

async function processWithVisionAPI(imageBase64: string, apiKey: string, startTime: number): Promise<VisionOCRResponse> {
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const requestBody = {
        requests: [
            {
                image: {
                    content: base64Data
                },
                features: [
                    {
                        type: 'DOCUMENT_TEXT_DETECTION',
                        maxResults: 1
                    }
                ],
                imageContext: {
                    languageHints: ['pt', 'pt-BR']
                }
            }
        ]
    };

    const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        }
    );

    if (!response.ok) {
        const errorData = await response.json();

        // Tratamento específico para erro de faturamento
        if (response.status === 403 && errorData.error?.code === 403) {
            const isBillingError = errorData.error.message?.includes('billing to be enabled');
            if (isBillingError) {
                console.log('💳 Erro de faturamento - usando fallback');
                throw new Error('BILLING_REQUIRED: Ative o faturamento no Google Cloud Console');
            }
        }

        throw new Error(`Vision API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Google Vision API resposta recebida');

    if (!data.responses || !data.responses[0] || !data.responses[0].textAnnotations) {
        throw new Error('Nenhum texto detectado na imagem');
    }

    const textAnnotations = data.responses[0].textAnnotations;
    const fullText = textAnnotations[0]?.description || '';

    if (!fullText.trim()) {
        throw new Error('Texto vazio detectado');
    }

    // Primeiro: pós-processamento básico
    const cleanedText = postProcessPortugueseText(fullText);

    // Segundo: pré-correção ortográfica com Gemini
    const { text: correctedText, corrected } = await preCorrectTextWithGemini(cleanedText);

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

    return {
        text: correctedText,
        confidence: 0.95,
        wordCount: correctedText.split(/\s+/).filter(Boolean).length,
        processingTime: `${processingTime}s`,
        method: 'google-vision',
        correctionApplied: corrected
    };
}

function postProcessPortugueseText(text: string): string {
    let processed = text;

    processed = processed.replace(/Ã¡/g, 'á');
    processed = processed.replace(/Ã©/g, 'é');
    processed = processed.replace(/Ã­/g, 'í');
    processed = processed.replace(/Ã³/g, 'ó');
    processed = processed.replace(/Ãº/g, 'ú');
    processed = processed.replace(/Ã§/g, 'ç');
    processed = processed.replace(/Ã£/g, 'ã');
    processed = processed.replace(/Ãµ/g, 'õ');

    processed = processed.replace(/[\x00-\x1F\x7F]/g, '');
    processed = processed.replace(/\s+/g, ' ');
    processed = processed.replace(/\s+([.,!?;:])/g, '$1');
    processed = processed.replace(/([.,!?;:])([A-Za-zÀ-ÿ])/g, '$1 $2');
    processed = processed.replace(/([.!?])\s+([A-ZÀ-Ÿ])/g, '$1\n\n$2');
    processed = processed.replace(/\n{3,}/g, '\n\n');
    processed = processed.replace(/(^|[.!?]\s+)([a-záàâãéêíóôõúç])/g,
        (match, prefix, letter) => prefix + letter.toUpperCase()
    );

    return processed.trim();
}

export async function GET() {
    const hasApiKey = !!process.env.GOOGLE_VISION_API_KEY;

    return NextResponse.json({
        name: 'Google Vision OCR API',
        version: '2.0.0',
        description: 'API para extração de texto usando Google Cloud Vision AI',
        status: hasApiKey ? 'ready' : 'not-configured',
        setup: {
            apiKey: hasApiKey ? 'configured ✅' : 'missing ❌ - adicione GOOGLE_VISION_API_KEY no .env.local',
            instructions: 'Ver GOOGLE_VISION_SETUP.md para configurar'
        },
        supportedLanguages: ['pt', 'pt-BR'],
        features: [
            'Google Cloud Vision AI',
            'Otimizado para manuscritos em português',
            'Pós-processamento inteligente',
            'Pré-correção ortográfica com Gemini',
            'Detecção de texto ilegível'
        ]
    });
}
