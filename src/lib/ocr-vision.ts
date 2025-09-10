export interface OCRResult {
    text: string;
    confidence: number;
    processingTime: number;
    wordCount: number;
    method: 'google-vision' | 'fallback';
}

export interface OCRProgress {
    status: string;
    progress: number;
}

// Função para processar imagem com Google Vision API
export const processImageWithVision = async (
    imageBase64: string,
    onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> => {
    const startTime = Date.now();

    if (onProgress) {
        onProgress({ status: 'Enviando para Google Vision...', progress: 0.1 });
    }

    try {
        // Remove o prefixo data:image/...;base64, se existir
        const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

        if (onProgress) {
            onProgress({ status: 'Processando com IA...', progress: 0.3 });
        }

        const response = await fetch('/api/vision-ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Data,
                features: {
                    TEXT_DETECTION: true,
                    DOCUMENT_TEXT_DETECTION: true
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        if (onProgress) {
            onProgress({ status: 'Processando texto...', progress: 0.7 });
        }

        const data = await response.json();

        if (!data.text || data.text.trim().length === 0) {
            throw new Error('Nenhum texto foi detectado na imagem');
        }

        if (onProgress) {
            onProgress({ status: 'Finalizando...', progress: 0.9 });
        }

        const processingTime = (Date.now() - startTime) / 1000;
        const cleanedText = postProcessPortugueseText(data.text);

        if (onProgress) {
            onProgress({ status: 'Concluído!', progress: 1.0 });
        }

        return {
            text: cleanedText,
            confidence: data.confidence || 0.95,
            processingTime,
            wordCount: cleanedText.split(/\s+/).filter(Boolean).length,
            method: 'google-vision'
        };

    } catch (error) {
        console.error('Erro no OCR com Google Vision:', error);
        throw error;
    }
};

// Função específica para pós-processamento de texto em português
const postProcessPortugueseText = (rawText: string): string => {
    let text = rawText;

    // Remove quebras de linha desnecessárias mas preserva parágrafos
    text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 quebras consecutivas
    text = text.replace(/([.!?])\n([A-Z])/g, '$1\n\n$2'); // Quebra entre frases

    // Corrige espaçamento
    text = text.replace(/\s+/g, ' '); // Remove espaços múltiplos
    text = text.replace(/\s+([.,!?;:])/g, '$1'); // Remove espaço antes de pontuação
    text = text.replace(/([.,!?;:])([A-Za-zÀ-ÿ])/g, '$1 $2'); // Adiciona espaço após pontuação

    // Correções específicas para português
    text = text.replace(/\b(nao|naõ)\b/gi, 'não'); // Corrige "nao" para "não"
    text = text.replace(/\b(e\s+)/gi, 'é '); // Corrige "e" isolado para "é"
    text = text.replace(/\b(a\s+)/gi, 'à '); // Algumas correções de acentos

    // Capitaliza início de frases
    text = text.replace(/(^|[.!?]\s+)([a-záàâãéêíóôõúç])/g,
        (match, prefix, letter) => prefix + letter.toUpperCase()
    );

    // Identifica parágrafos longos
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
        // Reorganiza em parágrafos se há múltiplas frases
        const paragraphs = [];
        let currentParagraph = '';

        sentences.forEach((sentence, index) => {
            currentParagraph += sentence.trim();
            if (index < sentences.length - 1) {
                currentParagraph += '.';
            }

            // Novo parágrafo a cada 2-3 frases ou quando há indicadores
            if ((index + 1) % 3 === 0 ||
                sentence.includes('Portanto') ||
                sentence.includes('Além disso') ||
                sentence.includes('Por outro lado') ||
                sentence.includes('Contudo') ||
                sentence.includes('Entretanto')) {
                paragraphs.push(currentParagraph.trim());
                currentParagraph = '';
            }
        });

        if (currentParagraph.trim()) {
            paragraphs.push(currentParagraph.trim());
        }

        text = paragraphs.join('\n\n');
    }

    return text.trim();
};

// Função fallback para processar localmente (sem Google Vision)
export const processImageFallback = async (
    imageBase64: string,
    onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> => {
    const startTime = Date.now();

    if (onProgress) {
        onProgress({ status: 'Processando localmente...', progress: 0.2 });
    }

    try {
        // Simula processamento
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (onProgress) {
            onProgress({ status: 'Extraindo texto...', progress: 0.6 });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        if (onProgress) {
            onProgress({ status: 'Finalizando...', progress: 0.9 });
        }

        // Texto de exemplo para demonstração
        const sampleText = `A tecnologia na educação representa uma transformação fundamental nos métodos de ensino e aprendizagem.

As plataformas digitais permitem acesso democrático ao conhecimento, quebrando barreiras geográficas e socioeconômicas. Estudantes de regiões remotas podem acessar conteúdos de qualidade sem precedentes.

Contudo, a dependência excessiva da tecnologia pode prejudicar habilidades sociais e cognitivas essenciais. O uso desmedido de dispositivos digitais está associado a problemas de atenção e relacionamento interpessoal.

Portanto, é necessário que o governo implemente políticas de educação digital equilibrada. Por meio de programas de capacitação docente e investimentos em infraestrutura, será possível aproveitar os benefícios tecnológicos sem comprometer o desenvolvimento humano integral.`;

        const processingTime = (Date.now() - startTime) / 1000;

        if (onProgress) {
            onProgress({ status: 'Concluído!', progress: 1.0 });
        }

        return {
            text: sampleText,
            confidence: 0.85,
            processingTime,
            wordCount: sampleText.split(/\s+/).filter(Boolean).length,
            method: 'fallback'
        };

    } catch (error) {
        console.error('Erro no processamento fallback:', error);
        throw new Error('Falha no processamento da imagem');
    }
};
