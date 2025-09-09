import { NextRequest, NextResponse } from 'next/server';
import { analisarTextoCompleto, gerarRelatorioDeNotas, RelatorioNotas } from '@/lib/analyzer';

// Interface para o resultado da análise
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
    vicios: string[];
    conectivos: string[];
    frasesLongas: string[];
    intervencao: { [key: string]: boolean };
    ttr: string;
    marcadores: string[];
    feedback: {
        c1: string[];
        c2: string[];
        c3: string[];
        c4: string[];
        c5: string[];
        geral: string[];
    };
    relatorio: RelatorioNotas;
}

// Interface para as análises do texto
interface AnalisesTexto {
    repetidas: Array<{ palavra: string; vezes: number }>;
    vicios: string[];
    frasesLongas: string[];
    palavras: number;
    paragrafos: number;
    ttr: string;
    marcadores: string[];
    conectivos: string[];
    intervencao: { [key: string]: boolean };
}

const gerarFeedback = (relatorio: RelatorioNotas, analises: AnalisesTexto) => {
    const feedback = {
        c1: [] as string[],
        c2: [] as string[],
        c3: [] as string[],
        c4: [] as string[],
        c5: [] as string[],
        geral: [] as string[]
    };

    // Feedback C1 - Norma Culta
    if (analises.repetidas.length > 0) {
        feedback.c1.push(`Evite repetir palavras: ${analises.repetidas.slice(0, 3).map((r) => r.palavra).join(', ')}`);
    }
    if (analises.vicios.length > 0) {
        feedback.c1.push(`Vícios de linguagem encontrados: ${analises.vicios.join(', ')}`);
    }
    if (analises.frasesLongas.length > 0) {
        feedback.c1.push(`${analises.frasesLongas.length} frase(s) muito longa(s). Prefira períodos mais concisos.`);
    }
    if (relatorio.c1.nota >= 160) {
        feedback.c1.push('Excelente domínio da norma culta!');
    }

    // Feedback C2 - Estrutura
    if (analises.palavras < 150) {
        feedback.c2.push('Texto muito curto. Desenvolva melhor suas ideias para atingir pelo menos 150 palavras.');
    }
    if (analises.paragrafos < 4) {
        feedback.c2.push('Texto precisa de mais parágrafos. Organize as ideias em 4-5 parágrafos.');
    } else if (analises.paragrafos > 5) {
        feedback.c2.push('Muitos parágrafos. Tente organizar as ideias em 4-5 parágrafos.');
    }
    if (relatorio.c2.nota >= 160) {
        feedback.c2.push('Ótima estrutura textual!');
    }

    // Feedback C3 - Argumentação
    const ttr = parseFloat(analises.ttr);
    if (ttr < 0.45) {
        feedback.c3.push('Varie mais o vocabulário para enriquecer a argumentação.');
    }
    if (analises.marcadores.length < 3) {
        feedback.c3.push('Use mais marcadores argumentativos como "segundo", "por exemplo", "além disso".');
    }
    if (ttr >= 0.65) {
        feedback.c3.push('Excelente riqueza lexical!');
    }

    // Feedback C4 - Coesão
    if (analises.conectivos.length < 3) {
        feedback.c4.push('Use mais conectivos para melhorar a coesão textual.');
    } else if (analises.conectivos.length >= 7) {
        feedback.c4.push('Excelente uso de conectivos! Isso melhora muito a coesão do texto.');
    }

    // Feedback C5 - Proposta de Intervenção
    const elementosIntervencao = Object.values(analises.intervencao).filter(Boolean).length;
    if (elementosIntervencao < 3) {
        feedback.c5.push('A proposta de intervenção precisa ser mais detalhada. Inclua agente, ação, meio, finalidade e detalhamento.');
    }
    if (elementosIntervencao >= 4) {
        feedback.c5.push('Boa proposta de intervenção!');
    }

    // Feedback geral
    if (analises.palavras >= 150 && analises.paragrafos >= 4 && analises.paragrafos <= 5) {
        feedback.geral.push('Boa estrutura textual! Mantenha essa organização.');
    }
    if (relatorio.total >= 800) {
        feedback.geral.push('Excelente redação! Continue praticando para manter esse nível.');
    } else if (relatorio.total >= 600) {
        feedback.geral.push('Boa redação! Com algumas melhorias pode chegar a uma nota ainda melhor.');
    } else if (relatorio.total >= 400) {
        feedback.geral.push('Redação precisa de melhorias. Foque nos pontos destacados acima.');
    } else {
        feedback.geral.push('Redação precisa de bastante trabalho. Revise os fundamentos da escrita dissertativa.');
    }

    return feedback;
};

export async function POST(request: NextRequest) {
    try {
        const { texto } = await request.json();

        if (!texto || typeof texto !== 'string' || texto.trim().length < 50) {
            return NextResponse.json(
                { error: 'Texto inválido. Mínimo de 50 caracteres.' },
                { status: 400 }
            );
        }

        // Análise completa do texto usando o sistema original
        const analises = analisarTextoCompleto(texto);

        // Gera o relatório de notas
        const relatorio = gerarRelatorioDeNotas(analises);

        // Gera feedback personalizado
        const feedback = gerarFeedback(relatorio, analises);

        // Resultado final
        const resultado: ResultadoAnalise = {
            competencias: {
                c1: relatorio.c1.nota,
                c2: relatorio.c2.nota,
                c3: relatorio.c3.nota,
                c4: relatorio.c4.nota,
                c5: relatorio.c5.nota
            },
            total: relatorio.total,
            palavras: analises.palavras,
            paragrafos: analises.paragrafos,
            repetidas: analises.repetidas,
            vicios: analises.vicios,
            conectivos: analises.conectivos,
            frasesLongas: analises.frasesLongas,
            intervencao: analises.intervencao,
            ttr: analises.ttr,
            marcadores: analises.marcadores,
            feedback,
            relatorio
        };

        return NextResponse.json(resultado);

    } catch (error) {
        console.error('Erro na análise:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
