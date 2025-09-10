import * as yaml from 'js-yaml';

/**
 * Interface para metadados da redação
 */
interface RedacaoMetadados {
    palavras_totais: number;
    paragrafos_total: number;
    estrutura: {
        tem_introducao: boolean;
        tem_desenvolvimento: boolean;
        tem_conclusao: boolean;
    };
    elementos_coesivos: string[];
    dados_citados: string[];
    proposta_intervencao: boolean;
}

/**
 * Interface para dados estruturados da redação
 */
interface RedacaoEstruturada {
    metadados: RedacaoMetadados;
    texto_original: string;
    request_type: string;
}

/**
 * Converte redação para formato YAML otimizado
 * IMPORTANTE: Preserva o texto original integralmente
 * @param texto - Texto da redação original
 * @returns String YAML otimizada
 */
export function redacaoParaYAMLOtimizado(texto: string): string {
    // Análise rápida dos metadados (sem alterar o texto)
    const palavras = texto.split(/\s+/).filter(Boolean);
    const paragrafos = texto.split('\n\n').filter(p => p.trim());

    // Busca elementos coesivos básicos
    const conectivos = ['portanto', 'assim', 'dessa forma', 'além disso', 'por outro lado', 'contudo', 'entretanto'];
    const elementosCoesivos = conectivos.filter(c => texto.toLowerCase().includes(c));

    // Verifica se há dados/citações (palavras como "dados", "pesquisa", "estudo")
    const indicadoresDados = ['dados', 'pesquisa', 'estudo', 'estatística', '%', 'segundo'];
    const dadosCitados = indicadoresDados.filter(d => texto.toLowerCase().includes(d));

    // Verifica estrutura básica
    const temIntroducao = paragrafos.length > 0 && palavras.length > 50;
    const temDesenvolvimento = paragrafos.length >= 2;
    const temConclusao = paragrafos.length > 0 && texto.toLowerCase().includes('portanto');

    // Verifica proposta de intervenção
    const indicadoresProposta = ['proposta', 'solução', 'medida', 'ação', 'governo', 'estado'];
    const temProposta = indicadoresProposta.some(p => texto.toLowerCase().includes(p));

    const dadosEstruturados: RedacaoEstruturada = {
        metadados: {
            palavras_totais: palavras.length,
            paragrafos_total: paragrafos.length,
            estrutura: {
                tem_introducao: temIntroducao,
                tem_desenvolvimento: temDesenvolvimento,
                tem_conclusao: temConclusao
            },
            elementos_coesivos: elementosCoesivos,
            dados_citados: dadosCitados,
            proposta_intervencao: temProposta
        },
        texto_original: texto, // TEXTO PRESERVADO INTEGRALMENTE
        request_type: "analise_redacao_enem"
    };

    return yaml.dump(dadosEstruturados, {
        flowLevel: -1,
        noRefs: true
    });
}

/**
 * Converte resposta YAML do Gemini para formato estruturado
 */
export function yamlParaAnaliseGemini(yamlString: string): Record<string, unknown> | null {
    try {
        // Remove blocos de código se presentes
        const yamlLimpo = yamlString.replace(/```yaml\n?/g, '').replace(/```\n?/g, '');

        const data = yaml.load(yamlLimpo);
        return data as Record<string, unknown>;
    } catch (error) {
        console.error('Erro ao parsear YAML:', error);
        return null;
    }
}

/**
 * Calcula a redução de tokens estimada
 */
export function calcularReducaoTokens(textoOriginal: string, yamlOtimizado: string) {
    // Estimativa aproximada: 1 token ≈ 0.75 palavras em português
    const tokensOriginal = Math.ceil(textoOriginal.split(/\s+/).length * 0.75);
    const tokensYaml = Math.ceil(yamlOtimizado.split(/\s+/).length * 0.75);

    const economiaAbsoluta = tokensOriginal - tokensYaml;
    const reducaoPercentual = ((economiaAbsoluta / tokensOriginal) * 100);

    return {
        tokens_original: tokensOriginal,
        tokens_yaml: tokensYaml,
        reducao_percentual: Math.round(reducaoPercentual * 10) / 10,
        economia_absoluta: economiaAbsoluta
    };
}

/**
 * Valida se o texto original foi preservado durante a otimização
 */
export function validarPreservacaoTexto(textoOriginal: string, yamlData: Record<string, unknown> | null): boolean {
    if (!yamlData) return false;

    const textoPreservado = (yamlData as { texto_original?: string }).texto_original;
    return textoPreservado === textoOriginal;
}

/**
 * Gera estatísticas detalhadas da otimização YAML
 */
export function gerarEstatisticasOtimizacao(textoOriginal: string, yamlOtimizado: string) {
    const estatisticasTokens = calcularReducaoTokens(textoOriginal, yamlOtimizado);
    const yamlData = yamlParaAnaliseGemini(yamlOtimizado);

    if (!yamlData) {
        throw new Error('Falha ao gerar estatísticas: YAML inválido');
    }

    const metadados = (yamlData as unknown as RedacaoEstruturada).metadados;

    return {
        metadados_extraidos: {
            paragrafos: metadados?.paragrafos_total || 0,
            palavras: metadados?.palavras_totais || 0,
            conectivos_encontrados: metadados?.elementos_coesivos?.length || 0,
            dados_citados: metadados?.dados_citados?.length || 0,
            tem_proposta: metadados?.proposta_intervencao || false
        },
        texto_preservado: validarPreservacaoTexto(textoOriginal, yamlData),
        tokens_original: estatisticasTokens.tokens_original,
        tokens_yaml: estatisticasTokens.tokens_yaml,
        reducao_percentual: estatisticasTokens.reducao_percentual,
        economia_absoluta: estatisticasTokens.economia_absoluta
    };
}
