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
    total: number;
}

// Dicionários para análise
const viciosDeLinguagem = ['coisa', 'tipo assim', 'daí', 'então', 'né', 'aí', 'cara', 'meio que', 'top', 'show'];
const conectivos = ['portanto', 'logo', 'enfim', 'assim', 'consequentemente', 'além disso', 'ademais', 'com efeito', 'desse modo', 'dessa forma', 'em suma', 'por conseguinte', 'entretanto', 'porém', 'mas', 'contudo', 'todavia', 'no entanto', 'apesar disso', 'ainda que', 'embora', 'mesmo que', 'se bem que', 'posto que', 'porque', 'pois', 'visto que'];
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
    // Remove linhas em branco para depois contar os blocos de texto restantes.
    const blocosDeTexto = texto.split(/\n+/).filter(p => p.trim() !== '');
    // Conta apenas os blocos que parecem parágrafos reais (mais de 15 palavras)
    return blocosDeTexto.filter(p => p.trim().split(/\s+/).length > 15).length;
};

export const encontrarPalavrasRepetidas = (texto: string) => {
    const palavras = normalizarPalavras(texto);
    const contagem: { [key: string]: number } = {};

    palavras.forEach(p => {
        if (p.length > 3) {
            contagem[p] = (contagem[p] || 0) + 1;
        }
    });

    const repetidas = [];
    for (const p in contagem) {
        if (contagem[p] > 3) {
            repetidas.push({ palavra: p, vezes: contagem[p] });
        }
    }
    return repetidas;
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

// Funções de cálculo de notas
export const calcularNotaC1 = (analises: ResultadoAnalise): NotaCompetencia => {
    let nota = 200;
    const detalhes: DetalhesNota[] = [];

    const penalidadeRepetidas = analises.repetidas.length * 10;
    if (penalidadeRepetidas > 0) {
        nota -= penalidadeRepetidas;
        detalhes.push({ item: `${analises.repetidas.length} tipo(s) de palavra repetida`, pontos: -penalidadeRepetidas });
    }

    const penalidadeVicios = analises.vicios.length * 20;
    if (penalidadeVicios > 0) {
        nota -= penalidadeVicios;
        detalhes.push({ item: `${analises.vicios.length} vício(s) de linguagem`, pontos: -penalidadeVicios });
    }

    const penalidadeFrasesLongas = analises.frasesLongas.length * 10;
    if (penalidadeFrasesLongas > 0) {
        nota -= penalidadeFrasesLongas;
        detalhes.push({ item: `${analises.frasesLongas.length} frase(s) muito longa(s)`, pontos: -penalidadeFrasesLongas });
    }

    return { nota: Math.max(0, nota), detalhes };
};

export const calcularNotaC2 = (analises: ResultadoAnalise): NotaCompetencia => {
    let nota = 200;
    const detalhes: DetalhesNota[] = [];

    if (analises.palavras < 150) {
        nota = 40;
        detalhes.push({ item: 'Texto com menos de 150 palavras', pontos: -160 });
    } else if (analises.paragrafos < 4 || analises.paragrafos > 5) {
        nota -= 80;
        detalhes.push({ item: 'Estrutura de parágrafos inadequada', pontos: -80 });
    }

    return { nota: Math.max(0, nota), detalhes };
};

export const calcularNotaC3 = (analises: ResultadoAnalise): NotaCompetencia => {
    let nota = 0;
    const detalhes: DetalhesNota[] = [];

    const ttr = parseFloat(analises.ttr);
    let pontosTTR = 0;

    if (ttr > 0.65) pontosTTR = 120;
    else if (ttr > 0.55) pontosTTR = 80;
    else if (ttr > 0.45) pontosTTR = 40;

    if (pontosTTR > 0) {
        nota += pontosTTR;
        detalhes.push({ item: `Boa riqueza lexical (TTR de ${analises.ttr})`, pontos: pontosTTR });
    }

    const maxPontosMarcadores = 80;
    let pontosMarcadoresAcumulados = 0;

    analises.marcadores.forEach(marcador => {
        const pontosParaEsteMarcador = 20;
        if (pontosMarcadoresAcumulados < maxPontosMarcadores) {
            nota += pontosParaEsteMarcador;
            pontosMarcadoresAcumulados += pontosParaEsteMarcador;
            detalhes.push({ item: `Marcador de argumentação "${marcador}"`, pontos: pontosParaEsteMarcador });
        }
    });

    if (detalhes.length === 0) {
        detalhes.push({ item: 'Poucos indicadores de argumentação encontrados', pontos: 0 });
    }

    return { nota: Math.min(200, nota), detalhes };
};

export const calcularNotaC4 = (analises: ResultadoAnalise): NotaCompetencia => {
    let nota = 0;
    const numConectivos = analises.conectivos.length;

    if (numConectivos >= 1) nota = 40;
    if (numConectivos >= 3) nota = 80;
    if (numConectivos >= 5) nota = 120;
    if (numConectivos >= 7) nota = 160;
    if (numConectivos >= 9) nota = 200;

    return {
        nota,
        detalhes: [{ item: `${numConectivos} conectivo(s) diferente(s) utilizado(s)`, pontos: nota }]
    };
};

export const calcularNotaC5 = (analises: ResultadoAnalise): NotaCompetencia => {
    let nota = 0;
    const detalhes: DetalhesNota[] = [];

    for (const elemento in analises.intervencao) {
        if (analises.intervencao[elemento]) {
            nota += 40;
            detalhes.push({ item: `Elemento "${elemento}" encontrado`, pontos: 40 });
        }
    }

    return { nota, detalhes };
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
    const total = c1.nota + c2.nota + c3.nota + c4.nota + c5.nota;

    return { c1, c2, c3, c4, c5, total };
};