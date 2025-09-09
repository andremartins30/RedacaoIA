import { NextRequest, NextResponse } from 'next/server';

// Função simulada de OCR (você pode substituir por uma implementação real)
const simulateOCR = async (): Promise<string> => {
    // Simula o processamento de OCR
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Retorna um texto simulado para demonstração
    return `
    A tecnologia digital tem transformado significativamente a sociedade contemporânea, influenciando diversos aspectos da vida humana. 
    
    No contexto educacional, as ferramentas digitais proporcionam novas oportunidades de aprendizagem e democratização do conhecimento. Plataformas online permitem o acesso a cursos e materiais educativos de qualidade, independentemente da localização geográfica do estudante.
    
    Por outro lado, a dependência excessiva da tecnologia pode gerar problemas sociais e psicológicos. O uso descontrolado de redes sociais, por exemplo, está associado ao aumento dos casos de ansiedade e depressão, especialmente entre os jovens.
    
    Além disso, a digitalização do mercado de trabalho cria desafios para profissionais que não possuem habilidades tecnológicas adequadas. Muitos postos de trabalho tradicionais estão sendo substituídos por sistemas automatizados, gerando desemprego em determinados setores.
    
    Portanto, é fundamental que o governo implemente políticas públicas voltadas para a educação digital da população. Somente através de ações coordenadas entre Estado, empresas e sociedade civil será possível aproveitar os benefícios da tecnologia minimizando seus impactos negativos.
  `.trim();
};

// Função para processar imagem em base64
const processImageBase64 = async (base64Data: string): Promise<string> => {
    try {
        // Remove o prefixo data:image/...;base64,
        const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

        // Aqui você integraria com uma API real de OCR
        // Exemplos: Google Vision API, AWS Textract, Tesseract.js

        // Para demonstração, vamos simular o OCR
        const extractedText = await simulateOCR();

        return extractedText;

    } catch (error) {
        console.error('Erro no processamento da imagem:', error);
        throw new Error('Falha ao processar a imagem');
    }
};


export async function POST(request: NextRequest) {
    try {
        const { image, type = 'base64' } = await request.json();

        if (!image) {
            return NextResponse.json(
                { error: 'Imagem não fornecida' },
                { status: 400 }
            );
        }

        let extractedText: string;

        if (type === 'base64') {
            extractedText = await processImageBase64(image);
        } else {
            return NextResponse.json(
                { error: 'Tipo de imagem não suportado' },
                { status: 400 }
            );
        }

        // Pós-processamento do texto extraído
        const cleanedText = extractedText
            .replace(/\s+/g, ' ') // Remove espaços extras
            .replace(/[^\w\s\.,!?;:()]/g, '') // Remove caracteres especiais
            .trim();

        if (cleanedText.length < 50) {
            return NextResponse.json(
                { error: 'Texto extraído muito curto. Verifique a qualidade da imagem.' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            text: cleanedText,
            confidence: 0.95, // Simulado - APIs reais fornecem confiança
            wordCount: cleanedText.split(/\s+/).length,
            processingTime: '2.1s' // Simulado
        });

    } catch (error) {
        console.error('Erro na API de OCR:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor ao processar OCR' },
            { status: 500 }
        );
    }
}


// Endpoint GET para informações sobre a API
export async function GET() {
    return NextResponse.json({
        name: 'EnemAI OCR API',
        version: '1.0.0',
        description: 'API para extração de texto de imagens de redações',
        supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        maxFileSize: '10MB',
        features: [
            'Extração de texto manuscrito',
            'Pré-processamento de imagem',
            'Limpeza automática do texto',
            'Detecção de confiança'
        ]
    });
}
