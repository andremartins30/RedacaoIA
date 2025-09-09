document.addEventListener('DOMContentLoaded', () => {
    // --- INICIALIZAÇÃO DO EDITOR E ELEMENTOS ---
    const textarea = document.getElementById('redacao-aluno');
    const editor = CodeMirror.fromTextArea(textarea, {
        lineNumbers: true, lineWrapping: true, mode: 'text/plain', spellcheck: true,
    });
    
    const analisarBtn = document.getElementById('analisar-btn');
    const resultadoContainer = document.getElementById('resultado-container');
    const resultadoDiv = document.getElementById('resultado-div');

    // --- DICIONÁRIOS PARA ANÁLISE ---
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


    analisarBtn.addEventListener('click', () => {
        const texto = editor.getValue(); 
        if (texto.trim() === '') {
            alert('Por favor, insira um texto para ser analisado.');
            return;
        }

        const analises = {
            texto: texto,
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
        
        const relatorioNotas = gerarRelatorioDeNotas(analises);
        mostrarResultado(analises, relatorioNotas);
    });

    // --- FUNÇÕES DE ANÁLISE (COM AS CORREÇÕES FINAIS) ---
    const normalizarPalavras = texto => texto.toLowerCase().replace(/[.,!?;:"()]/g, '').split(/\s+/).filter(Boolean);
    const contarPalavras = t => normalizarPalavras(t).length;

    // ############ CORREÇÃO 1: CONTAGEM DE PARÁGRAFOS PARA C2 ############
    const contarParagrafos = t => {
        // Primeiro, remove linhas em branco para depois contar os blocos de texto restantes.
        const blocosDeTexto = t.split(/\n+/).filter(p => p.trim() !== '');
        // Conta apenas os blocos que parecem parágrafos reais (mais de 15 palavras)
        return blocosDeTexto.filter(p => p.trim().split(/\s+/).length > 15).length;
    };
    
    // ############ CORREÇÃO 2: IDENTIFICAÇÃO DO ÚLTIMO PARÁGRAFO PARA C5 ############
    function verificarPropostaIntervencao(texto) {
        // Remove linhas em branco para garantir que .pop() pegue o último parágrafo de verdade.
        const paragrafosReais = texto.split(/\n+/).filter(p => p.trim() !== '');
        if (paragrafosReais.length === 0) return {}; // Se não houver texto, retorna objeto vazio

        const ultimoParagrafo = paragrafosReais.pop().toLowerCase();
        const encontrados = {};
        for (const elemento in palavrasChaveIntervencao) {
            encontrados[elemento] = palavrasChaveIntervencao[elemento].some(p => ultimoParagrafo.includes(p));
        }
        return encontrados;
    }

    function encontrarPalavrasRepetidas(texto) { /* ...código sem alteração... */
        const palavras = normalizarPalavras(texto);
        const contagem = {};
        palavras.forEach(p => { if (p.length > 3) { contagem[p] = (contagem[p] || 0) + 1; } });
        const repetidas = [];
        for (const p in contagem) { if (contagem[p] > 3) { repetidas.push({ palavra: p, vezes: contagem[p] }); } }
        return repetidas;
    }
    const encontrarViciosDeLinguagem = texto => viciosDeLinguagem.filter(v => texto.toLowerCase().includes(v));
    const analisarConectivos = texto => [...new Set(conectivos.filter(c => texto.toLowerCase().includes(c)))];
    const analisarFrasesLongas = (texto, limite = 30) => texto.split(/[.!?]+/).filter(f => f.trim().split(/\s+/).length > limite);
    function calcularTTR(texto) { /* ...código sem alteração... */
        const palavras = normalizarPalavras(texto);
        if (palavras.length === 0) return 0;
        const palavrasUnicas = new Set(palavras);
        return (palavrasUnicas.size / palavras.length).toFixed(2);
    }
    function encontrarMarcadoresArgumentativos(texto) { /* ...código sem alteração... */
        const textoMinusculo = texto.toLowerCase();
        return marcadoresArgumentativos.filter(marcador => textoMinusculo.includes(marcador));
    }


    // --- FUNÇÕES DE CÁLCULO DE NOTA (sem alterações aqui) ---
    function calcularNotaC1(a) { /* ...código sem alteração... */ 
        let nota = 200;
        const detalhes = [];
        const penalidadeRepetidas = a.repetidas.length * 10;
        if (penalidadeRepetidas > 0) { nota -= penalidadeRepetidas; detalhes.push({ item: `${a.repetidas.length} tipo(s) de palavra repetida`, pontos: -penalidadeRepetidas }); }
        const penalidadeVicios = a.vicios.length * 20;
        if (penalidadeVicios > 0) { nota -= penalidadeVicios; detalhes.push({ item: `${a.vicios.length} vício(s) de linguagem`, pontos: -penalidadeVicios }); }
        const penalidadeFrasesLongas = a.frasesLongas.length * 10;
        if (penalidadeFrasesLongas > 0) { nota -= penalidadeFrasesLongas; detalhes.push({ item: `${a.frasesLongas.length} frase(s) muito longa(s)`, pontos: -penalidadeFrasesLongas }); }
        return { nota: Math.max(0, nota), detalhes: detalhes };
    }
    function calcularNotaC2(a) { /* ...código sem alteração... */ 
        let nota = 200;
        const detalhes = [];
        if (a.palavras < 150) {
            nota = 40;
            detalhes.push({ item: 'Texto com menos de 150 palavras', pontos: -160 });
        } else if (a.paragrafos < 4 || a.paragrafos > 5) {
            nota -= 80;
            detalhes.push({ item: 'Estrutura de parágrafos inadequada', pontos: -80 });
        }
        return { nota: Math.max(0, nota), detalhes: detalhes };
    }
    function calcularNotaC3(analises) { /* ...código sem alteração... */
        let nota = 0;
        const detalhes = [];
        const ttr = parseFloat(analises.ttr);
        let pontosTTR = 0;
        if (ttr > 0.65) pontosTTR = 120; else if (ttr > 0.55) pontosTTR = 80; else if (ttr > 0.45) pontosTTR = 40;
        if (pontosTTR > 0) { nota += pontosTTR; detalhes.push({ item: `Boa riqueza lexical (TTR de ${analises.ttr})`, pontos: pontosTTR }); }
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
        if (detalhes.length === 0) { detalhes.push({ item: 'Poucos indicadores de argumentação encontrados', pontos: 0 }); }
        return { nota: Math.min(200, nota), detalhes: detalhes };
    }
    function calcularNotaC4(a) { /* ...código sem alteração... */ 
        let nota = 0;
        const numConectivos = a.conectivos.length;
        if (numConectivos >= 1) nota = 40; if (numConectivos >= 3) nota = 80; if (numConectivos >= 5) nota = 120;
        if (numConectivos >= 7) nota = 160; if (numConectivos >= 9) nota = 200;
        return { nota: nota, detalhes: [{ item: `${numConectivos} conectivo(s) diferente(s) utilizado(s)`, pontos: nota }] };
    }
    function calcularNotaC5(a) { /* ...código sem alteração... */ 
        let nota = 0;
        const detalhes = [];
        for(const elemento in a.intervencao) {
            if(a.intervencao[elemento]) {
                nota += 40;
                detalhes.push({ item: `Elemento "${elemento}" encontrado`, pontos: 40 });
            }
        }
        return { nota: nota, detalhes: detalhes };
    }

    function gerarRelatorioDeNotas(analises) { /* ...código sem alteração... */
        const c1 = calcularNotaC1(analises); const c2 = calcularNotaC2(analises); const c3 = calcularNotaC3(analises);
        const c4 = calcularNotaC4(analises); const c5 = calcularNotaC5(analises);
        const total = c1.nota + c2.nota + c3.nota + c4.nota + c5.nota;
        return { c1, c2, c3, c4, c5, total };
    }

    // Renomeei a função para evitar conflitos, sem alterar a lógica
    function mostrarResultado(analises, relatorio) { /* ...código sem alteração... */
        const criarBlocoCompetencia = (titulo, notaInfo) => {
            let detalhesHtml = '';
            if (notaInfo.detalhes.length > 0) {
                detalhesHtml = '<ul class="detalhes-nota">';
                notaInfo.detalhes.forEach(detalhe => {
                    const classePonto = detalhe.pontos >= 0 ? 'pontos-bonus' : 'pontos-penalidade';
                    const sinal = detalhe.pontos > 0 ? '+' : '';
                    detalhesHtml += `<li>${detalhe.item}: <span class="${classePonto}">${sinal}${detalhe.pontos}</span></li>`;
                });
                detalhesHtml += '</ul>';
            } else if (typeof notaInfo.nota === 'number') {
                 detalhesHtml = '<ul class="detalhes-nota"><li>Nenhum ponto adicionado ou removido.</li></ul>';
            }
            return `<div class="bloco-competencia"><h3>${titulo}: <span class="nota-final">${notaInfo.nota} ${typeof notaInfo.nota === 'number' ? '/ 200' : ''}</span></h3>${detalhesHtml}</div>`;
        };
        resultadoDiv.innerHTML = `<h2>Notas por Competência</h2>`;
        resultadoDiv.innerHTML += criarBlocoCompetencia('Competência I (Norma Culta)', relatorio.c1);
        resultadoDiv.innerHTML += criarBlocoCompetencia('Competência II (Estrutura)', relatorio.c2);
        resultadoDiv.innerHTML += criarBlocoCompetencia('Competência III (Argumentação)', relatorio.c3);
        resultadoDiv.innerHTML += criarBlocoCompetencia('Competência IV (Coesão)', relatorio.c4);
        resultadoDiv.innerHTML += criarBlocoCompetencia('Competência V (Intervencão)', relatorio.c5);
        resultadoDiv.innerHTML += `<hr><h2>Nota Final Estimada: ${relatorio.total} / 1000</h2><p><small>Atenção: A nota da Competência III é uma simulação baseada em indicadores matemáticos e não na qualidade real do argumento.</small></p>`;
        resultadoContainer.classList.remove('hidden');
    }
});