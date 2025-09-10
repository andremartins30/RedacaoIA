import { NextRequest, NextResponse } from 'next/server';
import { analisarTextoCompleto, gerarRelatorioDeNotas, RelatorioNotas } from '@/lib/analyzer';
import { analisarRedacaoComGemini, gerarSugestoesDetalhadas, analisarRedacaoSimplificada, AnaliseGemini } from '@/lib/gemini';

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
    analiseGemini?: AnaliseGemini | null;
    sugestoesIA?: string[];
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

    // Feedback C1 - Norma Culta (mais rigoroso)
    if (relatorio.c1.nota === 0) {
        feedback.c1.push('Texto não atende aos critérios mínimos de norma culta.');
    } else if (relatorio.c1.nota <= 40) {
        feedback.c1.push('Domínio precário da norma culta. Revise gramática e ortografia.');
    } else if (relatorio.c1.nota <= 80) {
        feedback.c1.push('Domínio insuficiente da norma culta. Atenção a concordâncias e regências.');
    } else if (relatorio.c1.nota <= 120) {
        feedback.c1.push('Domínio mediano da norma culta. Continue aprimorando.');
    } else if (relatorio.c1.nota <= 160) {
        feedback.c1.push('Bom domínio da norma culta. Pequenos ajustes podem levar à excelência.');
    } else {
        feedback.c1.push('Excelente domínio da norma culta!');
    }

    if (analises.repetidas.length > 2) {
        feedback.c1.push(`Evite repetir palavras: ${analises.repetidas.slice(0, 3).map((r) => r.palavra).join(', ')}`);
    }
    if (analises.vicios.length > 0) {
        feedback.c1.push(`Vícios de linguagem encontrados: ${analises.vicios.join(', ')}`);
    }
    if (analises.frasesLongas.length > 0) {
        feedback.c1.push(`${analises.frasesLongas.length} frase(s) muito longa(s). Prefira períodos mais concisos.`);
    }

    // Feedback C2 - Estrutura (mais rigoroso)
    if (relatorio.c2.nota === 0) {
        feedback.c2.push('Texto não apresenta estrutura dissertativa válida.');
    } else if (relatorio.c2.nota <= 40) {
        feedback.c2.push('Estrutura textual inadequada. Texto muito curto ou desorganizado.');
    } else if (relatorio.c2.nota <= 80) {
        feedback.c2.push('Estrutura textual insuficiente. Organize melhor em 4-5 parágrafos.');
    } else if (relatorio.c2.nota <= 120) {
        feedback.c2.push('Estrutura textual mediana. Pequenos ajustes na organização.');
    } else if (relatorio.c2.nota <= 160) {
        feedback.c2.push('Boa estrutura textual. Mantém organização clara.');
    } else {
        feedback.c2.push('Excelente estrutura textual!');
    }

    if (analises.palavras < 150) {
        feedback.c2.push(`Texto muito curto (${analises.palavras} palavras). Desenvolva melhor suas ideias.`);
    }
    if (analises.paragrafos < 4) {
        feedback.c2.push('Texto precisa de mais parágrafos. Organize as ideias em 4-5 parágrafos.');
    }

    // Feedback C3 - Argumentação (mais rigoroso)
    if (relatorio.c3.nota === 0) {
        feedback.c3.push('Texto não apresenta argumentação válida.');
    } else if (relatorio.c3.nota <= 60) {
        feedback.c3.push('Argumentação precária. Desenvolva melhor seus argumentos.');
    } else if (relatorio.c3.nota <= 100) {
        feedback.c3.push('Argumentação insuficiente. Use mais estratégias argumentativas.');
    } else if (relatorio.c3.nota <= 140) {
        feedback.c3.push('Argumentação mediana. Continue aprimorando.');
    } else if (relatorio.c3.nota <= 180) {
        feedback.c3.push('Boa argumentação. Pequenos ajustes podem melhorar ainda mais.');
    } else {
        feedback.c3.push('Excelente argumentação!');
    }

    const ttr = parseFloat(analises.ttr);
    if (ttr < 0.4) {
        feedback.c3.push('Varie muito mais o vocabulário para enriquecer a argumentação.');
    } else if (ttr < 0.5) {
        feedback.c3.push('Varie mais o vocabulário para enriquecer a argumentação.');
    }

    if (analises.marcadores.length < 2) {
        feedback.c3.push('Use mais marcadores argumentativos como "segundo", "por exemplo", "além disso".');
    }

    // Feedback C4 - Coesão (mais rigoroso)
    if (relatorio.c4.nota === 0) {
        feedback.c4.push('Texto não apresenta coesão mínima entre as ideias.');
    } else if (relatorio.c4.nota <= 40) {
        feedback.c4.push('Coesão precária. Use conectivos para ligar suas ideias.');
    } else if (relatorio.c4.nota <= 80) {
        feedback.c4.push('Coesão insuficiente. Aumente o uso de conectivos adequados.');
    } else if (relatorio.c4.nota <= 120) {
        feedback.c4.push('Coesão adequada. Continue aprimorando as ligações entre ideias.');
    } else if (relatorio.c4.nota <= 160) {
        feedback.c4.push('Boa coesão textual. Mantém as ideias bem conectadas.');
    } else {
        feedback.c4.push('Excelente coesão textual!');
    }

    if (analises.conectivos.length < 2) {
        feedback.c4.push('Use mais conectivos para melhorar a coesão textual.');
    }

    // Feedback C5 - Proposta de Intervenção (mais rigoroso)
    if (relatorio.c5.nota === 0) {
        feedback.c5.push('Proposta de intervenção ausente ou inválida.');
    } else if (relatorio.c5.nota <= 40) {
        feedback.c5.push('Proposta muito precária. Inclua agente, ação, meio e finalidade.');
    } else if (relatorio.c5.nota <= 80) {
        feedback.c5.push('Proposta incompleta. Faltam elementos essenciais.');
    } else if (relatorio.c5.nota <= 120) {
        feedback.c5.push('Proposta adequada, mas pode ser mais detalhada.');
    } else if (relatorio.c5.nota <= 160) {
        feedback.c5.push('Boa proposta de intervenção. Bem estruturada.');
    } else {
        feedback.c5.push('Excelente proposta de intervenção!');
    }

    const elementosIntervencao = Object.values(analises.intervencao).filter(Boolean).length;
    if (elementosIntervencao < 3) {
        feedback.c5.push('A proposta precisa incluir: agente, ação, meio, finalidade e detalhamento.');
    }

    // Feedback geral (mais rigoroso)
    if (relatorio.total === 0) {
        feedback.geral.push('Texto inválido. Não atende aos critérios mínimos de uma redação dissertativa.');
    } else if (relatorio.total < 200) {
        feedback.geral.push('Redação muito abaixo do esperado. Revise todos os fundamentos da escrita dissertativa.');
    } else if (relatorio.total < 400) {
        feedback.geral.push('Redação precisa de muito trabalho. Foque nos pontos críticos destacados.');
    } else if (relatorio.total < 600) {
        feedback.geral.push('Redação em desenvolvimento. Continue praticando os pontos destacados.');
    } else if (relatorio.total < 800) {
        feedback.geral.push('Boa redação! Com melhorias pontuais pode alcançar nota ainda melhor.');
    } else {
        feedback.geral.push('Excelente redação! Continue mantendo esse padrão de qualidade.');
    }

    // Dica específica baseada na maior deficiência
    const notas = [relatorio.c1.nota, relatorio.c2.nota, relatorio.c3.nota, relatorio.c4.nota, relatorio.c5.nota];
    const menorNota = Math.min(...notas);
    const competenciaFraca = notas.indexOf(menorNota) + 1;

    if (menorNota < 120) {
        const competencias = ['norma culta', 'estrutura textual', 'argumentação', 'coesão', 'proposta de intervenção'];
        feedback.geral.push(`Foque especialmente na competência ${competenciaFraca} (${competencias[competenciaFraca - 1]}).`);
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

        // Executar análises do Gemini de forma sequencial para economizar cota
        let analiseGemini: AnaliseGemini | null = null;
        let sugestoesIA: string[] = [];

        try {
            // Primeira tentativa - análise principal (mais importante)
            analiseGemini = await analisarRedacaoComGemini(texto);

            // Segunda tentativa - sugestões detalhadas (só se a primeira funcionou)
            if (analiseGemini) {
                sugestoesIA = await gerarSugestoesDetalhadas(texto, {
                    c1: relatorio.c1.nota,
                    c2: relatorio.c2.nota,
                    c3: relatorio.c3.nota,
                    c4: relatorio.c4.nota,
                    c5: relatorio.c5.nota,
                    total: relatorio.total
                });
            }
        } catch (error: unknown) {
            console.warn('Tentativa de análise IA completa falhou, tentando versão simplificada...', error);

            // Fallback: tentar análise simplificada se a completa falhar
            try {
                analiseGemini = await analisarRedacaoSimplificada(texto);
                console.log('Análise IA simplificada executada com sucesso');
            } catch {
                console.warn('Análise IA completamente indisponível devido a limitações de cota');
            }
        }

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
            relatorio,
            analiseGemini,
            sugestoesIA
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
