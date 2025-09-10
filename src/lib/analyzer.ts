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

export const contarParagrafos = (texto: string) => {
    // Remove linhas em branco e divide em blocos de texto
    const blocosDeTexto = texto.split(/\n+/).filter(p => p.trim() !== '');

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
    return viciosDeLinguagem.filter(v => texto.toLowerCase().includes(v));
};

export const analisarConectivos = (texto: string) => {
    return [...new Set(conectivos.filter(c => texto.toLowerCase().includes(c)))];
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
    return marcadoresArgumentativos.filter(marcador => textoMinusculo.includes(marcador));
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

// Funções de cálculo de notas com critérios mais rigorosos
export const calcularNotaC1 = (analises: ResultadoAnalise): NotaCompetencia => {
    const detalhes: DetalhesNota[] = [];

    // Verifica se há texto suficiente para avaliação
    if (analises.palavras < 10) {
        detalhes.push({ item: 'Texto insuficiente para avaliação', pontos: 0 });
        return { nota: 0, detalhes };
    }

    // Verifica qualidade mínima - critérios mais brandos
    if (!verificarQualidadeMinima(analises)) {
        detalhes.push({ item: 'Texto não atende critérios mínimos de qualidade', pontos: 40 });
        return { nota: 40, detalhes };
    }

    // Verifica se é de qualidade muito baixa
    if (isTextoMuitoBaixaQualidade(analises)) {
        detalhes.push({ item: 'Texto apresenta múltiplos problemas graves de norma culta', pontos: 80 });
        return { nota: 80, detalhes };
    }

    let nota = 120; // Começa com nota mediana

    // Penalidades mais moderadas
    const penalidadeRepetidas = Math.min(analises.repetidas.length * 10, 40); // era 15, 60
    if (penalidadeRepetidas > 0) {
        nota -= penalidadeRepetidas;
        detalhes.push({ item: `${analises.repetidas.length} tipo(s) de palavra repetida`, pontos: -penalidadeRepetidas });
    }

    const penalidadeVicios = Math.min(analises.vicios.length * 20, 60); // era 25, 80
    if (penalidadeVicios > 0) {
        nota -= penalidadeVicios;
        detalhes.push({ item: `${analises.vicios.length} vício(s) de linguagem`, pontos: -penalidadeVicios });
    }

    const penalidadeFrasesLongas = Math.min(analises.frasesLongas.length * 10, 30); // era 15, 40
    if (penalidadeFrasesLongas > 0) {
        nota -= penalidadeFrasesLongas;
        detalhes.push({ item: `${analises.frasesLongas.length} frase(s) muito longa(s)`, pontos: -penalidadeFrasesLongas });
    }

    // Bônus por qualidade superior (máximo 80 pontos)
    const ttr = parseFloat(analises.ttr);
    if (ttr > 0.6 && analises.repetidas.length === 0 && analises.vicios.length === 0) {
        const bonus = Math.min(40, (ttr - 0.6) * 200);
        nota += bonus;
        detalhes.push({ item: 'Excelente domínio da norma culta', pontos: bonus });
    } else if (ttr > 0.5 && analises.vicios.length === 0) {
        const bonus = 20;
        nota += bonus;
        detalhes.push({ item: 'Bom domínio da norma culta', pontos: bonus });
    }

    // Garante que a nota esteja sempre entre 0 e 200
    const notaFinal = Math.max(0, Math.min(200, nota));

    // Explica quando a nota fica zerada
    if (notaFinal === 0) {
        const totalPenalidades = penalidadeRepetidas + penalidadeVicios + penalidadeFrasesLongas;
        detalhes.push({
            item: `Nota zerada: penalidades totais (${totalPenalidades} pts) superaram a nota base (120 pts)`,
            pontos: 0
        });
        detalhes.push({
            item: 'Para melhorar: reduza repetições, vícios de linguagem e frases muito longas',
            pontos: 0
        });
    } else if (detalhes.length === 0) {
        detalhes.push({ item: 'Domínio adequado da norma culta', pontos: notaFinal });
    }

    return { nota: notaFinal, detalhes };
};

export const calcularNotaC2 = (analises: ResultadoAnalise): NotaCompetencia => {
    const detalhes: DetalhesNota[] = [];

    // Verifica qualidade mínima
    if (!verificarQualidadeMinima(analises)) {
        detalhes.push({ item: 'Texto não atende estrutura mínima', pontos: 0 });
        return { nota: 0, detalhes };
    }

    // Critérios muito rigorosos para estrutura
    if (analises.palavras < 50) {
        detalhes.push({ item: 'Texto extremamente curto', pontos: 0 });
        return { nota: 0, detalhes };
    }

    if (analises.palavras < 100) {
        detalhes.push({ item: 'Texto muito curto (menos de 100 palavras)', pontos: 40 });
        return { nota: 40, detalhes };
    }

    if (analises.palavras < 150) {
        detalhes.push({ item: 'Texto curto (menos de 150 palavras)', pontos: 80 });
        return { nota: 80, detalhes };
    }

    let nota = 100; // Começa com nota baixa

    // Avalia estrutura de parágrafos de forma mais rigorosa
    if (analises.paragrafos < 3) {
        nota = Math.max(40, nota - 60);
        detalhes.push({ item: 'Estrutura inadequada: menos de 3 parágrafos', pontos: -60 });
    } else if (analises.paragrafos < 4) {
        nota -= 40;
        detalhes.push({ item: 'Estrutura inadequada: apenas 3 parágrafos', pontos: -40 });
    } else if (analises.paragrafos === 4 || analises.paragrafos === 5) {
        // Estrutura ideal
        nota += 60;
        detalhes.push({ item: 'Estrutura adequada: 4-5 parágrafos', pontos: 60 });
    } else if (analises.paragrafos > 5) {
        nota -= 20;
        detalhes.push({ item: 'Muitos parágrafos (mais de 5)', pontos: -20 });
    }

    // Bônus por extensão adequada
    if (analises.palavras >= 250 && analises.palavras <= 400) {
        nota += 40;
        detalhes.push({ item: 'Extensão ideal do texto', pontos: 40 });
    } else if (analises.palavras > 400) {
        nota -= 10;
        detalhes.push({ item: 'Texto muito longo', pontos: -10 });
    }

    return { nota: Math.max(0, Math.min(200, nota)), detalhes };
};

export const calcularNotaC3 = (analises: ResultadoAnalise): NotaCompetencia => {
    const detalhes: DetalhesNota[] = [];

    // Verifica qualidade mínima
    if (!verificarQualidadeMinima(analises) || isTextoMuitoBaixaQualidade(analises)) {
        detalhes.push({ item: 'Texto não apresenta argumentação válida', pontos: 0 });
        return { nota: 0, detalhes };
    }

    let nota = 60; // Começa muito baixo - argumentação deve ser provada
    const ttr = parseFloat(analises.ttr);

    // Avaliação rigorosa da riqueza lexical
    let pontosTTR = 0;
    if (ttr >= 0.7) {
        pontosTTR = 80;
        detalhes.push({ item: `Excelente riqueza lexical (TTR: ${analises.ttr})`, pontos: pontosTTR });
    } else if (ttr >= 0.6) {
        pontosTTR = 60;
        detalhes.push({ item: `Boa riqueza lexical (TTR: ${analises.ttr})`, pontos: pontosTTR });
    } else if (ttr >= 0.5) {
        pontosTTR = 40;
        detalhes.push({ item: `Riqueza lexical adequada (TTR: ${analises.ttr})`, pontos: pontosTTR });
    } else if (ttr >= 0.4) {
        pontosTTR = 20;
        detalhes.push({ item: `Riqueza lexical limitada (TTR: ${analises.ttr})`, pontos: pontosTTR });
    } else {
        detalhes.push({ item: `Vocabulário muito limitado (TTR: ${analises.ttr})`, pontos: 0 });
    }

    nota += pontosTTR;

    // Avaliação rigorosa dos marcadores argumentativos
    const numMarcadores = analises.marcadores.length;
    let pontosMarcadores = 0;

    if (numMarcadores === 0) {
        detalhes.push({ item: 'Nenhum marcador argumentativo encontrado', pontos: 0 });
    } else if (numMarcadores === 1) {
        pontosMarcadores = 15;
        detalhes.push({ item: '1 marcador argumentativo encontrado', pontos: pontosMarcadores });
    } else if (numMarcadores === 2) {
        pontosMarcadores = 30;
        detalhes.push({ item: '2 marcadores argumentativos encontrados', pontos: pontosMarcadores });
    } else if (numMarcadores >= 3) {
        pontosMarcadores = Math.min(60, 20 * numMarcadores);
        detalhes.push({ item: `${numMarcadores} marcadores argumentativos encontrados`, pontos: pontosMarcadores });
    }

    nota += pontosMarcadores;

    // Penalidade por falta de coerência argumentativa
    if (analises.repetidas.length > 3) {
        const penalidade = 20;
        nota -= penalidade;
        detalhes.push({ item: 'Muita repetição prejudica a argumentação', pontos: -penalidade });
    }

    return { nota: Math.max(0, Math.min(200, nota)), detalhes };
};

export const calcularNotaC4 = (analises: ResultadoAnalise): NotaCompetencia => {
    const detalhes: DetalhesNota[] = [];

    // Verifica qualidade mínima
    if (!verificarQualidadeMinima(analises) || isTextoMuitoBaixaQualidade(analises)) {
        detalhes.push({ item: 'Texto não apresenta coesão mínima', pontos: 0 });
        return { nota: 0, detalhes };
    }

    const numConectivos = analises.conectivos.length;
    let nota = 0;

    // Sistema mais rigoroso e gradual
    if (numConectivos === 0) {
        detalhes.push({ item: 'Nenhum conectivo encontrado', pontos: 0 });
        nota = 0;
    } else if (numConectivos === 1) {
        detalhes.push({ item: '1 conectivo utilizado - coesão insuficiente', pontos: 40 });
        nota = 40;
    } else if (numConectivos === 2) {
        detalhes.push({ item: '2 conectivos utilizados - coesão básica', pontos: 80 });
        nota = 80;
    } else if (numConectivos === 3) {
        detalhes.push({ item: '3 conectivos utilizados - coesão adequada', pontos: 120 });
        nota = 120;
    } else if (numConectivos >= 4 && numConectivos <= 6) {
        detalhes.push({ item: `${numConectivos} conectivos utilizados - boa coesão`, pontos: 160 });
        nota = 160;
    } else if (numConectivos >= 7) {
        detalhes.push({ item: `${numConectivos} conectivos utilizados - excelente coesão`, pontos: 200 });
        nota = 200;
    }

    // Penalidade por uso inadequado (muita repetição de conectivos)
    const conectivosUnicos = new Set(analises.conectivos).size;
    if (conectivosUnicos < numConectivos * 0.7) {
        const penalidade = 20;
        nota = Math.max(0, nota - penalidade);
        detalhes.push({ item: 'Conectivos repetidos prejudicam a coesão', pontos: -penalidade });
    }

    // Penalidade adicional por parágrafos insuficientes (afeta coesão)
    if (analises.paragrafos < 3) {
        const penalidade = 40;
        nota = Math.max(0, nota - penalidade);
        detalhes.push({ item: 'Poucos parágrafos prejudicam a coesão textual', pontos: -penalidade });
    }

    return { nota: Math.max(0, Math.min(200, nota)), detalhes };
};

export const calcularNotaC5 = (analises: ResultadoAnalise): NotaCompetencia => {
    const detalhes: DetalhesNota[] = [];

    // Verifica qualidade mínima
    if (!verificarQualidadeMinima(analises) || isTextoMuitoBaixaQualidade(analises)) {
        detalhes.push({ item: 'Texto não apresenta proposta de intervenção', pontos: 0 });
        return { nota: 0, detalhes };
    }

    let nota = 0;
    let elementosEncontrados = 0;

    // Avaliação mais rigorosa dos elementos da proposta
    const elementosObrigatorios = ['agente', 'acao', 'meio', 'finalidade'];
    // const elementoOpcional = ['detalhamento']; // Não usado atualmente

    for (const elemento of elementosObrigatorios) {
        if (analises.intervencao[elemento]) {
            elementosEncontrados++;
            const pontos = 35; // Reduzido de 40 para 35
            nota += pontos;
            detalhes.push({ item: `Elemento "${elemento}" encontrado`, pontos: pontos });
        }
    }

    // Elemento detalhamento vale menos
    if (analises.intervencao['detalhamento']) {
        elementosEncontrados++;
        const pontos = 25;
        nota += pontos;
        detalhes.push({ item: 'Elemento "detalhamento" encontrado', pontos: pontos });
    }

    // Penalidades por falta de elementos essenciais
    const elementosFaltando = 4 - elementosObrigatorios.filter(el => analises.intervencao[el]).length;

    if (elementosFaltando === 4) {
        detalhes.push({ item: 'Nenhum elemento de proposta de intervenção encontrado (agente, ação, meio, finalidade)', pontos: 0 });
        detalhes.push({ item: 'Para obter pontos em C5, é necessário apresentar pelo menos 2 elementos', pontos: 0 });
        return { nota: 0, detalhes };
    }

    if (elementosFaltando === 3) {
        detalhes.push({ item: 'Proposta muito incompleta - apenas 1 elemento', pontos: 0 });
        // Mantém apenas nota mínima de 35
        nota = Math.min(40, nota);
    } else if (elementosFaltando === 2) {
        detalhes.push({ item: 'Proposta incompleta - apenas 2 elementos', pontos: 0 });
        // Penalidade por incompletude
        nota = Math.min(80, nota);
    }

    // Bônus por proposta completa (4 ou 5 elementos)
    if (elementosEncontrados >= 4) {
        const bonus = elementosEncontrados === 5 ? 20 : 10;
        nota += bonus;
        detalhes.push({ item: 'Proposta completa com todos os elementos', pontos: bonus });
    }

    return { nota: Math.max(0, Math.min(200, nota)), detalhes };
};

export const analisarTextoCompleto = (texto: string): ResultadoAnalise => {
    return {
        texto,
        palavras: contarPalavras(texto),
        paragrafos: contarParagrafos(texto),
        repetidas: encontrarPalavrasRepetidas(texto),
        vicios: encontrarViciosDeLinguagem(texto),
        conectivos: analisarConectivos(texto),
        frasesLongas: analisarFrasesLongas(texto),
        intervencao: verificarPropostaIntervencao(texto),
        ttr: calcularTTR(texto),
        marcadores: encontrarMarcadoresArgumentativos(texto)
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
        const consensoAjustado = Math.round(consensoBase * ajuste);

        // Garantir que a nota esteja entre 0 e 200
        notasConsenso[comp] = Math.max(0, Math.min(200, consensoAjustado));

        // Adicionar explicação detalhada
        const diferenca = Math.abs(notaProfessor - notaIA);
        if (diferenca > 50) {
            explicacao.push(
                `${comp.toUpperCase()}: Grande diferença entre avaliações (Professor: ${notaProfessor}, IA: ${notaIA}). ` +
                `Consenso: ${notasConsenso[comp]} (peso professor: ${(config.pesoProfessor * 100).toFixed(0)}%, IA: ${(config.pesoIA * 100).toFixed(0)}%, ajuste: ${(ajuste * 100).toFixed(0)}%)`
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
            metodologia: `Consenso ${config.nivelRigidez} com pesos: Professor ${(config.pesoProfessor * 100).toFixed(0)}%, IA ${(config.pesoIA * 100).toFixed(0)}%`,
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