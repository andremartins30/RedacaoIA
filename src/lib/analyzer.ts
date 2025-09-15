// Sistema completo de análise baseado no projeto original
export interface ResultadoAnalise {
    texto: string;
    palavras: number;
    paragrafos: number;
    repetidas: Array<{ palavra: string; vezes: number }>;
    vicios: string[];
    conectivos: string[];
    frasesLongas: string[];
    intervencao: { [key: string]: boolean };
    ttr: string;
    marcadores: string[];
    tema?: string | null; // Adiciona informação sobre tema detectado
}

export interface DetalhesNota {
    item: string;
    pontos: number;
}

export interface NotaCompetencia {
    nota: number;
    detalhes: DetalhesNota[];
}

export interface RelatorioNotas {
    c1: NotaCompetencia;
    c2: NotaCompetencia;
    c3: NotaCompetencia;
    c4: NotaCompetencia;
    c5: NotaCompetencia;
}

// Interface para o consenso entre avaliações
export interface ConfigConsenso {
    pesoProfessor: number; // 0.0 a 1.0 (peso da análise tradicional)
    pesoIA: number; // 0.0 a 1.0 (peso da análise de IA)
    nivelRigidez: 'leniente' | 'moderado' | 'rigoroso'; // Nível de exigência
    ajustesPorCompetencia: {
        c1: number; // Multiplicador específico para C1
        c2: number; // Multiplicador específico para C2
        c3: number; // Multiplicador específico para C3
        c4: number; // Multiplicador específico para C4
        c5: number; // Multiplicador específico para C5
    };
}

// Interface para resultado do consenso
export interface ResultadoConsenso {
    notasProfessor: {
        c1: number; c2: number; c3: number; c4: number; c5: number; total: number;
    };
    notasIA: {
        c1: number; c2: number; c3: number; c4: number; c5: number; total: number;
    };
    notasConsenso: {
        c1: number; c2: number; c3: number; c4: number; c5: number; total: number;
    };
    detalhesConsenso: {
        metodologia: string;
        configuracao: ConfigConsenso;
        explicacao: string[];
    };
}

// Dicionários para análise (expandidos e mais rigorosos)
const viciosDeLinguagem = [
    'coisa', 'tipo assim', 'daí', 'então', 'né', 'aí', 'cara', 'meio que', 'top', 'show',
    'tipo', 'beleza', 'massa', 'legal', 'bacana', 'maneiro', 'da hora', 'irado',
    'gente', 'pessoal', 'galera', 'povo', 'tal', 'tal coisa', 'troço', 'negócio',
    'sei lá', 'sabe', 'entende', 'sacou', 'tá ligado', 'pô', 'véi', 'mano'
];

const conectivos = [
    'portanto', 'logo', 'enfim', 'assim', 'consequentemente', 'além disso', 'ademais',
    'com efeito', 'desse modo', 'dessa forma', 'em suma', 'por conseguinte',
    'entretanto', 'porém', 'mas', 'contudo', 'todavia', 'no entanto', 'apesar disso',
    'ainda que', 'embora', 'mesmo que', 'se bem que', 'posto que', 'porque', 'pois',
    'visto que', 'uma vez que', 'já que', 'posto isso', 'diante disso', 'nesse sentido',
    'por outro lado', 'em contrapartida', 'outrossim', 'não obstante', 'conquanto',
    'sobretudo', 'principalmente', 'especialmente', 'mormente', 'primeiramente',
    'em primeiro lugar', 'em segundo lugar', 'finalmente', 'por fim', 'em conclusão'
];
const palavrasChaveIntervencao = {
    agente: ['governo', 'ministério', 'escolas', 'mídia', 'ongs', 'sociedade', 'famílias', 'prefeituras', 'estado'],
    acao: ['criar', 'promover', 'implementar', 'garantir', 'desenvolver', 'investir', 'fiscalizar', 'conscientizar', 'campanhas', 'reforma'],
    meio: ['por meio de', 'através de', 'mediante', 'com o uso de', 'por intermédio de'],
    finalidade: ['a fim de', 'para que', 'com o objetivo de', 'com o intuito de', 'para'],
    detalhamento: ['por exemplo', 'isto é', 'como', 'detalhadamente', 'especificamente']
};
const marcadoresArgumentativos = [
    'segundo', 'de acordo com', 'conforme', 'como afirma', 'por exemplo',
    'isso se evidencia', 'prova disso', 'como pode ser observado', 'isto é',
    'ou seja', 'em outras palavras'
];

// Funções de análise
export const normalizarPalavras = (texto: string) => {
    return texto.toLowerCase().replace(/[.,!?;:"()]/g, '').split(/\s+/).filter(Boolean);
};

export const contarPalavras = (texto: string) => normalizarPalavras(texto).length;

// Função para identificar se o primeiro parágrafo é um tema/proposta
export const identificarTema = (texto: string): { tema: string | null; textoRedacao: string } => {
    const blocos = texto.split(/\n+/).filter(p => p.trim() !== '');

    if (blocos.length === 0) {
        return { tema: null, textoRedacao: texto };
    }

    const primeiroParagrafo = blocos[0].trim();

    // Critérios para identificar se o primeiro parágrafo é um tema:
    const indicadoresTema = [
        /^tema:/i,                           // Começa com "Tema:"
        /^proposta:/i,                       // Começa com "Proposta:"
        /^questão:/i,                        // Começa com "Questão:"
        /^redija.*text/i,                    // Contém "redija" e "text"
        /^com base.*text/i,                  // Começa com "com base" e contém "text"
        /^a partir.*text/i,                  // Começa com "a partir" e contém "text"
        /^considerando.*text/i,              // Começa com "considerando" e contém "text"
        /dissertativ.-argumentativ/i,        // Contém "dissertativo-argumentativo"
        /modalidade escrita formal/i,        // Contém "modalidade escrita formal"
        /defenda.*ponto.*vista/i,           // Contém "defenda" e "ponto" e "vista"
        /elabore.*proposta.*intervenção/i,   // Contém elaboração de proposta de intervenção
    ];

    // Verifica se é muito curto para ser um parágrafo de redação (provavelmente é tema)
    const palavrasPrimeiroParagrafo = primeiroParagrafo.split(/\s+/).length;
    const caracteristicasTema = indicadoresTema.some(regex => regex.test(primeiroParagrafo));
    const muitoCurtoParaRedacao = palavrasPrimeiroParagrafo < 15; // Menos de 15 palavras
    const muitoLongoParaTema = palavrasPrimeiroParagrafo > 100;   // Mais de 100 palavras

    // Se tem características de tema e não é muito longo, provavelmente é tema
    if ((caracteristicasTema || muitoCurtoParaRedacao) && !muitoLongoParaTema) {
        // Remove o primeiro parágrafo (tema) e retorna o resto como redação
        const redacaoSemTema = blocos.slice(1).join('\n\n');
        return {
            tema: primeiroParagrafo,
            textoRedacao: redacaoSemTema
        };
    }

    // Se não parece ser tema, considera todo o texto como redação
    return {
        tema: null,
        textoRedacao: texto
    };
};

export const contarParagrafos = (texto: string) => {
    // Primeiro, identifica e remove o tema se presente
    const { textoRedacao } = identificarTema(texto);

    // Remove linhas em branco e divide em blocos de texto da redação (sem tema)
    const blocosDeTexto = textoRedacao.split(/\n+/).filter(p => p.trim() !== '');

    // Aplica critérios mais rigorosos para considerar um parágrafo válido
    const paragrafosValidos = blocosDeTexto.filter(paragrafo => {
        const palavras = paragrafo.trim().split(/\s+/).length;
        const caracteres = paragrafo.trim().length;

        // Para ser considerado parágrafo válido, deve ter:
        // - Pelo menos 20 palavras OU
        // - Pelo menos 100 caracteres OU
        // - Ser claramente uma introdução/conclusão (10+ palavras)
        return palavras >= 20 || caracteres >= 100 || palavras >= 10;
    });

    // Retorna o número de parágrafos válidos, mínimo 1 se houver texto
    return Math.max(1, paragrafosValidos.length);
};

export const encontrarPalavrasRepetidas = (texto: string) => {
    const palavras = normalizarPalavras(texto);
    const contagem: { [key: string]: number } = {};

    // Palavras funcionais que não devem ser penalizadas por repetição
    const palavrasFuncionais = new Set([
        'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com',
        'se', 'que', 'e', 'ou', 'mas', 'como', 'quando', 'onde', 'o', 'a', 'os', 'as', 'um', 'uma',
        'este', 'esta', 'esse', 'essa', 'aquele', 'aquela', 'seu', 'sua', 'seus', 'suas',
        'é', 'são', 'foi', 'foram', 'ser', 'estar', 'tem', 'têm', 'ter', 'há', 'haver',
        'muito', 'muitos', 'muita', 'muitas', 'mais', 'menos', 'bem', 'mal', 'já', 'ainda',
        'também', 'só', 'apenas', 'mesmo', 'mesma', 'todos', 'todas', 'todo', 'toda',
        'pode', 'podem', 'deve', 'devem', 'isso', 'isto', 'assim', 'então'
    ]);

    palavras.forEach(p => {
        // Só conta palavras com mais de 3 caracteres que não sejam funcionais
        if (p.length > 3 && !palavrasFuncionais.has(p.toLowerCase())) {
            contagem[p] = (contagem[p] || 0) + 1;
        }
    });

    const repetidas = [];
    for (const p in contagem) {
        // Critério mais rigoroso: penaliza a partir de 3 repetições (era 4)
        if (contagem[p] >= 3) {
            repetidas.push({ palavra: p, vezes: contagem[p] });
        }
    }

    // Ordena por frequência decrescente
    return repetidas.sort((a, b) => b.vezes - a.vezes);
};

export const encontrarViciosDeLinguagem = (texto: string) => {
    const textoMinusculo = texto.toLowerCase();
    const viciosEncontrados: string[] = [];

    viciosDeLinguagem.forEach(vicio => {
        // Cria regex com word boundaries para evitar falsos positivos
        // \b garante que seja uma palavra completa, não parte de outra palavra
        const regex = new RegExp(`\\b${vicio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

        if (regex.test(textoMinusculo)) {
            viciosEncontrados.push(vicio);
        }
    });

    return viciosEncontrados;
};

export const analisarConectivos = (texto: string) => {
    const textoMinusculo = texto.toLowerCase();
    const conectivosEncontrados: string[] = [];

    conectivos.forEach(conectivo => {
        // Para conectivos, usamos uma abordagem mais flexível
        // Alguns conectivos podem aparecer no meio de frases
        const regex = new RegExp(`\\b${conectivo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

        if (regex.test(textoMinusculo)) {
            conectivosEncontrados.push(conectivo);
        }
    });

    return [...new Set(conectivosEncontrados)];
};

export const analisarFrasesLongas = (texto: string, limite = 30) => {
    return texto.split(/[.!?]+/).filter(f => f.trim().split(/\s+/).length > limite);
};

export const verificarPropostaIntervencao = (texto: string) => {
    // Remove linhas em branco para garantir que .pop() pegue o último parágrafo de verdade.
    const paragrafosReais = texto.split(/\n+/).filter(p => p.trim() !== '');
    if (paragrafosReais.length === 0) return {}; // Se não houver texto, retorna objeto vazio

    const ultimoParagrafo = paragrafosReais[paragrafosReais.length - 1].toLowerCase();
    const encontrados: { [key: string]: boolean } = {};

    for (const elemento in palavrasChaveIntervencao) {
        encontrados[elemento] = palavrasChaveIntervencao[elemento as keyof typeof palavrasChaveIntervencao].some(p => ultimoParagrafo.includes(p));
    }
    return encontrados;
};

export const calcularTTR = (texto: string) => {
    const palavras = normalizarPalavras(texto);
    if (palavras.length === 0) return '0.00';
    const palavrasUnicas = new Set(palavras);
    return (palavrasUnicas.size / palavras.length).toFixed(2);
};

export const encontrarMarcadoresArgumentativos = (texto: string) => {
    const textoMinusculo = texto.toLowerCase();
    const marcadoresEncontrados: string[] = [];

    marcadoresArgumentativos.forEach(marcador => {
        // Para marcadores argumentativos, usamos word boundaries
        // para evitar falsos positivos
        const regex = new RegExp(`\\b${marcador.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

        if (regex.test(textoMinusculo)) {
            marcadoresEncontrados.push(marcador);
        }
    });

    return marcadoresEncontrados;
};

// Função para verificar a qualidade básica do texto
const verificarQualidadeMinima = (analises: ResultadoAnalise): boolean => {
    // Critérios mínimos mais realistas para uma redação válida
    if (analises.palavras < 30) return false; // Texto muito curto (era 50)
    if (analises.paragrafos < 1) return false; // Sem estrutura mínima (era 2)
    if (analises.vicios.length > 8) return false; // Muitos vícios de linguagem (era 5)
    if (analises.repetidas.length > analises.palavras / 10) return false; // Muita repetição (era /20)
    return true;
};

// Função para detectar textos de qualidade muito baixa
const isTextoMuitoBaixaQualidade = (analises: ResultadoAnalise): boolean => {
    const problemas = [];

    // Contagem de problemas graves - critérios mais realistas
    if (analises.palavras < 40) problemas.push('muito-curto'); // era 80
    if (analises.paragrafos === 0) problemas.push('sem-estrutura'); // era <= 1
    if (analises.vicios.length >= 5) problemas.push('muitos-vicios'); // era >= 3
    if (analises.repetidas.length >= 8) problemas.push('muita-repeticao'); // era >= 5
    if (parseFloat(analises.ttr) < 0.2) problemas.push('vocabulario-limitado'); // era < 0.3
    if (analises.conectivos.length === 0 && analises.palavras > 100) problemas.push('sem-conectivos'); // só penaliza se texto maior

    // Se tem 4 ou mais problemas graves, é de qualidade muito baixa (era 3)
    return problemas.length >= 4;
};

// Funções de cálculo de notas seguindo EXATAMENTE os critérios oficiais do ENEM
export const calcularNotaC1 = (analises: ResultadoAnalise): NotaCompetencia => {
    const detalhes: DetalhesNota[] = [];

    // C1 - Domínio da norma culta: Sintaxe + desvios
    // Critérios oficiais: 200, 160, 120, 80, 40, 0

    // Verifica se há texto suficiente para avaliação
    if (analises.palavras < 10) {
        detalhes.push({ item: 'Sintaxe inexistente - texto insuficiente', pontos: 0 });
        return { nota: 0, detalhes };
    }

    // Conta total de problemas de norma culta
    let totalDesvios = 0;

    // Vícios de linguagem são desvios graves
    totalDesvios += analises.vicios.length * 2; // Cada vício conta como 2 desvios

    // Repetições excessivas são desvios
    totalDesvios += analises.repetidas.filter(r => r.vezes >= 4).length;

    // Frases muito longas podem indicar problemas sintáticos
    totalDesvios += analises.frasesLongas.length;

    // TTR muito baixo indica vocabulário limitado (desvio de norma culta)
    const ttr = parseFloat(analises.ttr);
    if (ttr < 0.3) {
        totalDesvios += 3; // Vocabulário muito limitado é grave
    } else if (ttr < 0.4) {
        totalDesvios += 1;
    }

    // Determina nota conforme critérios oficiais (apenas notas permitidas)
    let nota: number;
    if (totalDesvios === 0 && ttr > 0.6) {
        nota = 200; // Sintaxe excelente, no máximo dois desvios
        detalhes.push({ item: 'Sintaxe excelente, sem desvios detectados', pontos: 200 });
    } else if (totalDesvios <= 2) {
        nota = 200; // Sintaxe excelente, no máximo dois desvios
        detalhes.push({ item: `Sintaxe excelente, ${totalDesvios} desvio(s) detectado(s)`, pontos: 200 });
    } else if (totalDesvios <= 4) {
        nota = 160; // Sintaxe boa, poucos desvios
        detalhes.push({ item: `Sintaxe boa, ${totalDesvios} desvios detectados`, pontos: 160 });
    } else if (totalDesvios <= 7) {
        nota = 120; // Sintaxe regular, alguns desvios
        detalhes.push({ item: `Sintaxe regular, ${totalDesvios} desvios detectados`, pontos: 120 });
    } else if (totalDesvios <= 12) {
        nota = 80; // Sintaxe deficitária ou muitos desvios
        detalhes.push({ item: `Sintaxe deficitária, ${totalDesvios} desvios detectados`, pontos: 80 });
    } else if (totalDesvios <= 20) {
        nota = 40; // Sintaxe deficitária e muitos desvios
        detalhes.push({ item: `Sintaxe deficitária com muitos desvios (${totalDesvios})`, pontos: 40 });
    } else {
        nota = 0; // Sintaxe inexistente
        detalhes.push({ item: `Sintaxe inexistente - ${totalDesvios} desvios graves`, pontos: 0 });
    }

    // Detalhamento dos problemas encontrados
    if (analises.vicios.length > 0) {
        detalhes.push({ item: `${analises.vicios.length} vício(s) de linguagem encontrado(s)`, pontos: 0 });
    }
    if (analises.repetidas.length > 0) {
        detalhes.push({ item: `${analises.repetidas.length} tipo(s) de repetição excessiva`, pontos: 0 });
    }
    if (analises.frasesLongas.length > 0) {
        detalhes.push({ item: `${analises.frasesLongas.length} frase(s) muito longa(s)`, pontos: 0 });
    }

    return { nota, detalhes };
};

export const calcularNotaC2 = (analises: ResultadoAnalise): NotaCompetencia => {
    const detalhes: DetalhesNota[] = [];

    // C2 - Compreensão do tema + estrutura dissertativa + repertório
    // Critérios oficiais: 200, 160, 120, 80, 40, 0

    // Informa se um tema foi detectado e removido da contagem de parágrafos
    if (analises.tema) {
        detalhes.push({ item: 'Tema detectado e separado da contagem de parágrafos', pontos: 0 });
    }

    // Verifica qualidade mínima
    if (analises.palavras < 30) {
        detalhes.push({ item: 'Texto insuficiente para avaliação do tema', pontos: 0 });
        return { nota: 0, detalhes };
    }

    // Avalia estrutura dissertativa (3 partes: introdução, desenvolvimento, conclusão)
    let temEstruturaDissertativa = false;
    let temRepertorio = false;
    let abordagemCompleta = false;

    // Verifica estrutura básica (4-5 parágrafos é ideal para dissertação)
    if (analises.paragrafos >= 4 && analises.paragrafos <= 5) {
        temEstruturaDissertativa = true;
        detalhes.push({ item: 'Estrutura dissertativa adequada (4-5 parágrafos da redação)', pontos: 0 });
    } else if (analises.paragrafos === 3) {
        // Pode ser estrutura mínima válida
        temEstruturaDissertativa = analises.palavras >= 200; // Precisa ter substância
        detalhes.push({ item: 'Estrutura mínima (3 parágrafos da redação)', pontos: 0 });
    } else if (analises.paragrafos >= 6) {
        detalhes.push({ item: `Estrutura com muitos parágrafos (${analises.paragrafos} parágrafos da redação)`, pontos: 0 });
    } else {
        detalhes.push({ item: `Estrutura insuficiente (${analises.paragrafos} parágrafo${analises.paragrafos > 1 ? 's' : ''} da redação)`, pontos: 0 });
    }

    // Verifica se há repertório (marcadores argumentativos indicam conhecimento)
    if (analises.marcadores.length >= 2) {
        temRepertorio = true;
        detalhes.push({ item: `Repertório detectado (${analises.marcadores.length} marcadores)`, pontos: 0 });
    }

    // Verifica abordagem completa (extensão + estrutura + coerência)
    if (analises.palavras >= 200 && analises.palavras <= 400 && analises.repetidas.length <= 3) {
        abordagemCompleta = true;
        detalhes.push({ item: 'Abordagem completa do tema', pontos: 0 });
    }

    // Determina nota conforme critérios oficiais
    let nota: number;

    if (abordagemCompleta && temEstruturaDissertativa && temRepertorio && analises.marcadores.length >= 3) {
        nota = 200; // Abordagem completa + três partes + repertório legitimado, pertinente e produtivo
        detalhes.push({ item: 'Excelente: abordagem completa + estrutura + repertório produtivo', pontos: 200 });
    } else if (abordagemCompleta && temEstruturaDissertativa && temRepertorio) {
        nota = 160; // Abordagem completa + três partes + repertório legitimado e pertinente
        detalhes.push({ item: 'Bom: abordagem completa + estrutura + repertório pertinente', pontos: 160 });
    } else if (abordagemCompleta && temEstruturaDissertativa) {
        nota = 120; // Abordagem completa + três partes, repertório limitado
        detalhes.push({ item: 'Adequado: abordagem completa + estrutura dissertativa', pontos: 120 });
    } else if (analises.palavras < 100 || analises.repetidas.length > 5) {
        nota = 80; // Abordagem com foco temático distorcido
        detalhes.push({ item: 'Deficitário: foco temático distorcido ou texto muito curto', pontos: 80 });
    } else if (analises.paragrafos < 3 || analises.palavras < 150) {
        nota = 40; // Abordagem incompleta do tema
        detalhes.push({ item: 'Insuficiente: abordagem incompleta ou estrutura inadequada', pontos: 40 });
    } else {
        nota = 0; // Não atende critérios mínimos
        detalhes.push({ item: 'Inadequado: não demonstra compreensão do tema', pontos: 0 });
    }

    return { nota, detalhes };
};

export const calcularNotaC3 = (analises: ResultadoAnalise): NotaCompetencia => {
    const detalhes: DetalhesNota[] = [];

    // C3 - Projeto de texto (desenvolvimento de ideias)
    // Critérios oficiais: 200, 160, 120, 80, 40, 0

    // Verifica qualidade mínima
    if (analises.palavras < 50) {
        detalhes.push({ item: 'Aglomerado caótico de palavras', pontos: 0 });
        return { nota: 0, detalhes };
    }

    // Avalia desenvolvimento das ideias através de múltiplos indicadores
    let projetoTexto = 0; // Pontuação do projeto (0-10)

    // 1. Riqueza lexical (TTR) - indica desenvolvimento de ideias
    const ttr = parseFloat(analises.ttr);
    if (ttr >= 0.6) {
        projetoTexto += 3; // Excelente variedade lexical
        detalhes.push({ item: `Excelente variedade lexical (TTR: ${analises.ttr})`, pontos: 0 });
    } else if (ttr >= 0.5) {
        projetoTexto += 2; // Boa variedade
        detalhes.push({ item: `Boa variedade lexical (TTR: ${analises.ttr})`, pontos: 0 });
    } else if (ttr >= 0.4) {
        projetoTexto += 1; // Variedade limitada
        detalhes.push({ item: `Variedade lexical limitada (TTR: ${analises.ttr})`, pontos: 0 });
    }

    // 2. Marcadores argumentativos - indicam organização das ideias
    if (analises.marcadores.length >= 3) {
        projetoTexto += 2; // Ideias bem organizadas
        detalhes.push({ item: `${analises.marcadores.length} marcadores argumentativos (ideias organizadas)`, pontos: 0 });
    } else if (analises.marcadores.length >= 1) {
        projetoTexto += 1; // Alguma organização
        detalhes.push({ item: `${analises.marcadores.length} marcador(es) argumentativo(s)`, pontos: 0 });
    }

    // 3. Ausência de repetições excessivas - indica desenvolvimento adequado
    if (analises.repetidas.length === 0) {
        projetoTexto += 2; // Sem repetições
        detalhes.push({ item: 'Ausência de repetições excessivas', pontos: 0 });
    } else if (analises.repetidas.length <= 2) {
        projetoTexto += 1; // Poucas repetições
    } else {
        detalhes.push({ item: `${analises.repetidas.length} tipos de repetição excessiva`, pontos: 0 });
    }

    // 4. Extensão adequada para desenvolvimento
    if (analises.palavras >= 200 && analises.paragrafos >= 4) {
        projetoTexto += 2; // Espaço suficiente para desenvolver ideias
        detalhes.push({ item: 'Extensão adequada para desenvolvimento das ideias', pontos: 0 });
    } else if (analises.palavras >= 150) {
        projetoTexto += 1; // Extensão mínima
    }

    // 5. Penalidade por problemas graves
    if (analises.vicios.length > 3) {
        projetoTexto -= 2; // Vícios prejudicam o desenvolvimento
        detalhes.push({ item: `${analises.vicios.length} vícios prejudicam o desenvolvimento`, pontos: 0 });
    }

    // Determina nota conforme critérios oficiais
    let nota: number;

    if (projetoTexto >= 9) {
        nota = 200; // Projeto de texto estratégico (desenvolvimento de todas as ideias)
        detalhes.push({ item: 'Excelente: projeto de texto estratégico', pontos: 200 });
    } else if (projetoTexto >= 7) {
        nota = 160; // Projeto de texto bom (poucas falhas no desenvolvimento das ideias)
        detalhes.push({ item: 'Bom: projeto com poucas falhas no desenvolvimento', pontos: 160 });
    } else if (projetoTexto >= 5) {
        nota = 120; // Projeto de texto com falhas
        detalhes.push({ item: 'Adequado: projeto com algumas falhas', pontos: 120 });
    } else if (projetoTexto >= 3) {
        nota = 80; // Projeto de texto com muitas falhas
        detalhes.push({ item: 'Deficitário: projeto com muitas falhas', pontos: 80 });
    } else if (projetoTexto >= 1) {
        nota = 40; // Ausência de projeto de texto + ideias confusas
        detalhes.push({ item: 'Insuficiente: ideias confusas ou aglomeradas', pontos: 40 });
    } else {
        nota = 0; // Aglomerado caótico de palavras
        detalhes.push({ item: 'Inadequado: aglomerado caótico de palavras', pontos: 0 });
    }

    return { nota, detalhes };
};

export const calcularNotaC4 = (analises: ResultadoAnalise): NotaCompetencia => {
    const detalhes: DetalhesNota[] = [];

    // C4 - Mecanismos linguísticos para argumentação (conectivos + repetições + inadequações)
    // Critérios oficiais: 200, 160, 120, 80, 40, 0

    // Verifica qualidade mínima
    if (analises.palavras < 50) {
        detalhes.push({ item: 'Ausência de articulação (texto muito curto)', pontos: 0 });
        return { nota: 0, detalhes };
    }

    // Avalia presença de conectivos
    const numConectivos = analises.conectivos.length;
    const conectivosUnicos = new Set(analises.conectivos).size;

    // Avalia repetições excessivas
    const repeticoesExcessivas = analises.repetidas.filter(r => r.vezes >= 4).length;

    // Avalia inadequações (vícios de linguagem + frases muito longas)
    const inadequacoes = analises.vicios.length + analises.frasesLongas.length;

    // Sistema de pontuação baseado nos critérios oficiais
    let qualidadeCoesao = 0; // 0-10 pontos

    // 1. Presença de conectivos (0-4 pontos)
    if (numConectivos >= 7) {
        qualidadeCoesao += 4; // Presença expressiva
        detalhes.push({ item: `Presença expressiva de conectivos (${numConectivos})`, pontos: 0 });
    } else if (numConectivos >= 5) {
        qualidadeCoesao += 3; // Presença constante
        detalhes.push({ item: `Presença constante de conectivos (${numConectivos})`, pontos: 0 });
    } else if (numConectivos >= 3) {
        qualidadeCoesao += 2; // Presença regular
        detalhes.push({ item: `Presença regular de conectivos (${numConectivos})`, pontos: 0 });
    } else if (numConectivos >= 1) {
        qualidadeCoesao += 1; // Presença pontual
        detalhes.push({ item: `Presença pontual de conectivos (${numConectivos})`, pontos: 0 });
    } else {
        detalhes.push({ item: 'Ausência de conectivos', pontos: 0 });
    }

    // 2. Avalia repetições (0-3 pontos - inverte a lógica: menos repetições = mais pontos)
    if (repeticoesExcessivas === 0) {
        qualidadeCoesao += 3; // Ausentes
        detalhes.push({ item: 'Ausência de repetições excessivas', pontos: 0 });
    } else if (repeticoesExcessivas <= 1) {
        qualidadeCoesao += 2; // Raras
        detalhes.push({ item: 'Raras repetições excessivas', pontos: 0 });
    } else if (repeticoesExcessivas <= 3) {
        qualidadeCoesao += 1; // Poucas/algumas
        detalhes.push({ item: `${repeticoesExcessivas} repetições excessivas`, pontos: 0 });
    } else {
        detalhes.push({ item: `Muitas repetições excessivas (${repeticoesExcessivas})`, pontos: 0 });
    }

    // 3. Avalia inadequações (0-3 pontos - inverte a lógica: menos inadequações = mais pontos)
    if (inadequacoes === 0) {
        qualidadeCoesao += 3; // Sem inadequações
        detalhes.push({ item: 'Sem inadequações detectadas', pontos: 0 });
    } else if (inadequacoes <= 1) {
        qualidadeCoesao += 2; // Poucas
        detalhes.push({ item: 'Poucas inadequações', pontos: 0 });
    } else if (inadequacoes <= 3) {
        qualidadeCoesao += 1; // Algumas
        detalhes.push({ item: `${inadequacoes} inadequações detectadas`, pontos: 0 });
    } else {
        detalhes.push({ item: `Muitas inadequações (${inadequacoes})`, pontos: 0 });
    }

    // Penalidade por variedade insuficiente de conectivos
    if (numConectivos > 0 && conectivosUnicos < numConectivos * 0.7) {
        qualidadeCoesao -= 1;
        detalhes.push({ item: 'Pouca variedade nos conectivos utilizados', pontos: 0 });
    }

    // Determina nota conforme critérios oficiais
    let nota: number;

    if (qualidadeCoesao >= 9) {
        nota = 200; // Presença expressiva + raras/ausentes repetições + sem inadequações
        detalhes.push({ item: 'Excelente: coesão expressiva sem problemas', pontos: 200 });
    } else if (qualidadeCoesao >= 7) {
        nota = 160; // Presença constante + poucas repetições + poucas inadequações
        detalhes.push({ item: 'Bom: coesão constante com poucos problemas', pontos: 160 });
    } else if (qualidadeCoesao >= 5) {
        nota = 120; // Presença regular + algumas repetições + algumas inadequações
        detalhes.push({ item: 'Adequado: coesão regular com alguns problemas', pontos: 120 });
    } else if (qualidadeCoesao >= 3) {
        nota = 80; // Presença pontual + muitas repetições + muitas inadequações
        detalhes.push({ item: 'Deficitário: coesão pontual com muitos problemas', pontos: 80 });
    } else if (qualidadeCoesao >= 1) {
        nota = 40; // Presença rara + excessivas repetições + excessivas inadequações
        detalhes.push({ item: 'Insuficiente: coesão rara com problemas excessivos', pontos: 40 });
    } else {
        nota = 0; // Ausência de articulação
        detalhes.push({ item: 'Inadequado: ausência de articulação textual', pontos: 0 });
    }

    return { nota, detalhes };
};

export const calcularNotaC5 = (analises: ResultadoAnalise): NotaCompetencia => {
    const detalhes: DetalhesNota[] = [];

    // C5 - Proposta de intervenção (5 elementos válidos)
    // Critérios oficiais EXATOS: 200 (5 elementos), 160 (4), 120 (3), 80 (2), 40 (1), 0 (nenhum)

    // Verifica qualidade mínima
    if (analises.palavras < 50) {
        detalhes.push({ item: 'Ausência de proposta de intervenção', pontos: 0 });
        return { nota: 0, detalhes };
    }

    // Conta elementos válidos da proposta
    let elementosValidos = 0;
    const elementos = ['agente', 'acao', 'meio', 'finalidade', 'detalhamento'];

    for (const elemento of elementos) {
        if (analises.intervencao[elemento]) {
            elementosValidos++;
            detalhes.push({ item: `Elemento "${elemento}" identificado`, pontos: 0 });
        }
    }

    // Determina nota EXATAMENTE conforme critérios oficiais
    let nota: number;

    if (elementosValidos === 5) {
        nota = 200; // 5 elementos válidos
        detalhes.push({ item: 'Excelente: proposta completa com todos os 5 elementos', pontos: 200 });
    } else if (elementosValidos === 4) {
        nota = 160; // 4 elementos válidos
        detalhes.push({ item: 'Bom: proposta com 4 elementos válidos', pontos: 160 });
    } else if (elementosValidos === 3) {
        nota = 120; // 3 elementos válidos
        detalhes.push({ item: 'Adequado: proposta com 3 elementos válidos', pontos: 120 });
    } else if (elementosValidos === 2) {
        nota = 80; // 2 elementos válidos
        detalhes.push({ item: 'Deficitário: proposta com apenas 2 elementos válidos', pontos: 80 });
    } else if (elementosValidos === 1) {
        nota = 40; // 1 elemento válido
        detalhes.push({ item: 'Insuficiente: proposta com apenas 1 elemento válido', pontos: 40 });
    } else {
        nota = 0; // Nenhum elemento válido
        detalhes.push({ item: 'Inadequado: nenhum elemento válido de proposta identificado', pontos: 0 });
    }

    // Lista elementos em falta para orientação
    const elementosFaltando = elementos.filter(el => !analises.intervencao[el]);
    if (elementosFaltando.length > 0 && elementosValidos > 0) {
        detalhes.push({
            item: `Elementos em falta: ${elementosFaltando.join(', ')}`,
            pontos: 0
        });
    }

    // Orientação específica quando há zero elementos
    if (elementosValidos === 0) {
        detalhes.push({
            item: 'Para obter pontos em C5, inclua: agente (quem), ação (o que fazer), meio (como), finalidade (para que) e detalhamento',
            pontos: 0
        });
    }

    return { nota, detalhes };
};

export const analisarTextoCompleto = (texto: string): ResultadoAnalise => {
    // Identifica e separa o tema da redação
    const { tema, textoRedacao } = identificarTema(texto);

    // Para a contagem de palavras, usa o texto completo (incluindo tema se houver)
    // Para parágrafos e análises estruturais, usa apenas o texto da redação
    return {
        texto,
        palavras: contarPalavras(texto), // Conta palavras do texto completo
        paragrafos: contarParagrafos(texto), // Já usa a função atualizada que ignora tema
        repetidas: encontrarPalavrasRepetidas(textoRedacao), // Analisa apenas a redação
        vicios: encontrarViciosDeLinguagem(textoRedacao), // Analisa apenas a redação
        conectivos: analisarConectivos(textoRedacao), // Analisa apenas a redação
        frasesLongas: analisarFrasesLongas(textoRedacao), // Analisa apenas a redação
        intervencao: verificarPropostaIntervencao(textoRedacao), // Analisa apenas a redação
        ttr: calcularTTR(textoRedacao), // Analisa apenas a redação
        marcadores: encontrarMarcadoresArgumentativos(textoRedacao), // Analisa apenas a redação
        tema: tema // Inclui informação sobre o tema detectado
    };
};

export const gerarRelatorioDeNotas = (analises: ResultadoAnalise): RelatorioNotas => {
    const c1 = calcularNotaC1(analises);
    const c2 = calcularNotaC2(analises);
    const c3 = calcularNotaC3(analises);
    const c4 = calcularNotaC4(analises);
    const c5 = calcularNotaC5(analises);

    return { c1, c2, c3, c4, c5 };
};

// Configurações predefinidas para diferentes níveis de rigidez
export const CONFIGURACOES_CONSENSO = {
    leniente: {
        pesoProfessor: 0.3,
        pesoIA: 0.7,
        nivelRigidez: 'leniente' as const,
        ajustesPorCompetencia: {
            c1: 1.1, // Mais generoso com norma culta
            c2: 1.15, // Mais generoso com estrutura
            c3: 1.05, // Levemente mais generoso com argumentação
            c4: 1.1, // Mais generoso com coesão
            c5: 1.2  // Muito mais generoso com proposta
        }
    },
    moderado: {
        pesoProfessor: 0.4,
        pesoIA: 0.6,
        nivelRigidez: 'moderado' as const,
        ajustesPorCompetencia: {
            c1: 1.0, // Neutro
            c2: 1.05, // Levemente mais generoso
            c3: 1.0, // Neutro
            c4: 1.0, // Neutro
            c5: 1.1  // Mais generoso com proposta
        }
    },
    rigoroso: {
        pesoProfessor: 0.6,
        pesoIA: 0.4,
        nivelRigidez: 'rigoroso' as const,
        ajustesPorCompetencia: {
            c1: 0.95, // Mais rigoroso
            c2: 0.9, // Mais rigoroso com estrutura
            c3: 0.95, // Mais rigoroso com argumentação
            c4: 0.9, // Mais rigoroso com coesão
            c5: 0.85  // Muito mais rigoroso com proposta
        }
    }
};

// Função para arredondar para nota oficial do ENEM (0, 40, 80, 120, 160, 200)
const arredondarParaNotaOficial = (nota: number): number => {
    const notasOficiais = [0, 40, 80, 120, 160, 200];

    // Encontra a nota oficial mais próxima
    let menorDistancia = Infinity;
    let notaMaisProxima = 0;

    for (const notaOficial of notasOficiais) {
        const distancia = Math.abs(nota - notaOficial);
        if (distancia < menorDistancia) {
            menorDistancia = distancia;
            notaMaisProxima = notaOficial;
        }
    }

    return notaMaisProxima;
};

// Função principal para calcular o consenso
export const calcularConsenso = (
    notasProfessor: { c1: number; c2: number; c3: number; c4: number; c5: number; },
    notasIA: { c1: number; c2: number; c3: number; c4: number; c5: number; },
    config: ConfigConsenso = CONFIGURACOES_CONSENSO.moderado
): ResultadoConsenso => {
    const notasConsenso = {
        c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, total: 0
    };

    const explicacao: string[] = [];

    // Validação dos pesos
    const somasPesos = config.pesoProfessor + config.pesoIA;
    if (Math.abs(somasPesos - 1.0) > 0.01) {
        throw new Error('A soma dos pesos deve ser igual a 1.0');
    }

    // Calcular consenso para cada competência
    const competencias = ['c1', 'c2', 'c3', 'c4', 'c5'] as const;

    for (const comp of competencias) {
        const notaProfessor = notasProfessor[comp];
        const notaIA = notasIA[comp];
        const ajuste = config.ajustesPorCompetencia[comp];

        // Fórmula do consenso ponderado com ajuste
        const consensoBase = (notaProfessor * config.pesoProfessor + notaIA * config.pesoIA);
        const consensoAjustado = consensoBase * ajuste;

        // CRUCIAL: Arredonda para nota oficial do ENEM
        const notaOficial = arredondarParaNotaOficial(consensoAjustado);
        notasConsenso[comp] = notaOficial;

        // Adicionar explicação detalhada
        const diferenca = Math.abs(notaProfessor - notaIA);
        if (diferenca > 50) {
            explicacao.push(
                `${comp.toUpperCase()}: Grande diferença entre avaliações (Professor: ${notaProfessor}, IA: ${notaIA}). ` +
                `Consenso: ${notasConsenso[comp]} (cálculo: ${consensoAjustado.toFixed(1)} → arredondado para nota oficial)`
            );
        } else {
            explicacao.push(
                `${comp.toUpperCase()}: Professor ${notaProfessor}, IA ${notaIA} → Consenso ${notasConsenso[comp]}`
            );
        }
    }

    // Calcular totais
    const totalProfessor = Object.values(notasProfessor).reduce((a, b) => a + b, 0);
    const totalIA = Object.values(notasIA).reduce((a, b) => a + b, 0);
    notasConsenso.total = Object.values(notasConsenso).reduce((a, b) => a + b, 0) - notasConsenso.total; // Remove o total que foi incluído na soma

    return {
        notasProfessor: { ...notasProfessor, total: totalProfessor },
        notasIA: { ...notasIA, total: totalIA },
        notasConsenso,
        detalhesConsenso: {
            metodologia: `Consenso ${config.nivelRigidez} com pesos: Professor ${(config.pesoProfessor * 100).toFixed(0)}%, IA ${(config.pesoIA * 100).toFixed(0)}% (notas arredondadas para padrão oficial)`,
            configuracao: config,
            explicacao
        }
    };
};

// Função para sugerir configuração baseada no perfil da redação
export const sugerirConfiguracaoConsenso = (
    notasProfessor: { c1: number; c2: number; c3: number; c4: number; c5: number; },
    notasIA: { c1: number; c2: number; c3: number; c4: number; c5: number; }
): ConfigConsenso => {
    const totalProfessor = Object.values(notasProfessor).reduce((a, b) => a + b, 0);
    const totalIA = Object.values(notasIA).reduce((a, b) => a + b, 0);
    const diferenca = Math.abs(totalProfessor - totalIA);

    // Se a diferença é muito grande (>200 pontos), usar configuração mais balanceada
    if (diferenca > 200) {
        return CONFIGURACOES_CONSENSO.moderado;
    }

    // Se as notas são muito baixas (<400), usar configuração mais leniente
    if (totalProfessor < 400 && totalIA < 400) {
        return CONFIGURACOES_CONSENSO.leniente;
    }

    // Se ambas as notas são altas (>800), usar configuração mais rigorosa
    if (totalProfessor > 800 && totalIA > 800) {
        return CONFIGURACOES_CONSENSO.rigoroso;
    }

    // Caso padrão: moderado
    return CONFIGURACOES_CONSENSO.moderado;
};