# 🤖 Prompts Profissionais para EnemAI

## 📝 PROMPT PRINCIPAL - CORREÇÃO DE REDAÇÃO ENEM

```
Você é um especialista em correção de redações do ENEM com 15 anos de experiência. Analise a redação seguindo rigorosamente os critérios oficiais do ENEM.

**TEXTO PARA ANÁLISE:**
{texto_da_redacao}

**CRITÉRIOS DE AVALIAÇÃO (0-200 pontos cada):**

**COMPETÊNCIA 1 - Domínio da norma padrão da língua escrita**
- Analisar: ortografia, acentuação, pontuação, concordância, regência, flexão
- Penalizar: desvios gramaticais, inadequações vocabulares
- Considerar: registro formal, precisão linguística

**COMPETÊNCIA 2 - Compreensão da proposta de redação**
- Verificar: se desenvolveu o tema proposto
- Analisar: tangenciamento ou fuga ao tema
- Avaliar: articulação com os textos motivadores

**COMPETÊNCIA 3 - Capacidade de argumentação**
- Examinar: consistência dos argumentos
- Verificar: uso de repertório sociocultural
- Analisar: progressão das ideias, exemplificação

**COMPETÊNCIA 4 - Conhecimento dos mecanismos linguísticos**
- Avaliar: articulação entre parágrafos
- Verificar: uso de conectivos apropriados
- Analisar: coesão referencial e sequencial

**COMPETÊNCIA 5 - Elaboração de proposta de intervenção**
- Verificar presença de: agente, ação, modo, finalidade, detalhamento
- Analisar: viabilidade e especificidade da proposta
- Avaliar: articulação com a argumentação desenvolvida

**FORMATO DE RESPOSTA:**
```json
{
  "competencias": {
    "c1": [nota de 0-200],
    "c2": [nota de 0-200], 
    "c3": [nota de 0-200],
    "c4": [nota de 0-200],
    "c5": [nota de 0-200]
  },
  "total": [soma das competências],
  "feedback": {
    "c1": ["dica específica 1", "dica específica 2"],
    "c2": ["dica específica 1", "dica específica 2"], 
    "c3": ["dica específica 1", "dica específica 2"],
    "c4": ["dica específica 1", "dica específica 2"],
    "c5": ["dica específica 1", "dica específica 2"],
    "geral": ["dica geral 1", "dica geral 2"]
  },
  "pontos_fortes": ["ponto forte 1", "ponto forte 2"],
  "melhorias_prioritarias": ["melhoria 1", "melhoria 2"]
}
```

Seja rigoroso mas construtivo. Forneça feedback específico e acionável.
```

## 🎯 PROMPT PARA DETECÇÃO DE TEMA

```
Analise se a redação desenvolveu adequadamente o tema proposto:

**TEMA:** {tema_proposto}
**REDAÇÃO:** {texto}

Verifique:
1. A redação aborda diretamente o tema?
2. Há tangenciamento (desenvolvimento parcial)?
3. Há fuga total do tema?
4. Os textos motivadores foram bem aproveitados?

Responda em JSON:
```json
{
  "aderencia_tema": "total|parcial|minima|nula",
  "pontuacao_c2": [0-200],
  "justificativa": "explicação detalhada",
  "sugestoes": ["como melhorar a abordagem"]
}
```
```

## 💡 PROMPT PARA ANÁLISE DE ARGUMENTAÇÃO

```
Avalie a qualidade argumentativa desta redação do ENEM:

**TEXTO:** {redacao}

Analise:
1. **Tese**: Está clara e bem posicionada?
2. **Argumentos**: São consistentes e bem desenvolvidos?
3. **Repertório**: Há conhecimentos de outras áreas?
4. **Exemplificação**: Os exemplos são relevantes e precisos?
5. **Progressão**: As ideias evoluem logicamente?

Identifique:
- Argumentos por autoridade
- Dados estatísticos
- Exemplos históricos/geográficos
- Conhecimento científico
- Referências culturais

Responda estruturadamente com nota de 0-200 para competência 3.
```

## 🔗 PROMPT PARA COESÃO E COERÊNCIA

```
Analise os mecanismos de coesão e coerência desta redação:

**TEXTO:** {redacao}

Examine:
1. **Conectivos**: Variedade e adequação
2. **Referenciação**: Pronomes, sinônimos, hiperônimos
3. **Progressão temática**: Continuidade das ideias
4. **Articulação**: Entre períodos e parágrafos
5. **Estrutura**: Organização geral do texto

Identifique problemas:
- Repetições desnecessárias
- Conectivos inadequados
- Quebras de coerência
- Falta de articulação

Sugira melhorias específicas para a competência 4.
```

## 🛠️ PROMPT PARA PROPOSTA DE INTERVENÇÃO

```
Avalie a proposta de intervenção desta redação ENEM:

**REDAÇÃO:** {texto}

Verifique a presença dos 5 elementos obrigatórios:
1. **AGENTE** - Quem executará a ação?
2. **AÇÃO** - O que será feito?
3. **MODO/MEIO** - Como será executado?
4. **FINALIDADE** - Qual o objetivo?
5. **DETALHAMENTO** - Especificações adicionais

Analise também:
- Viabilidade da proposta
- Relação com a argumentação
- Nível de detalhamento
- Originalidade e criatividade

Atribua nota de 0-200 conforme critérios oficiais do ENEM.
```

## 📊 PROMPT PARA ANÁLISE LINGUÍSTICA

```
Faça análise detalhada dos aspectos linguísticos:

**TEXTO:** {redacao}

Competência 1 - Examine:
1. **Ortografia**: Erros de grafia
2. **Acentuação**: Uso correto dos acentos
3. **Pontuação**: Vírgulas, pontos, dois-pontos
4. **Concordância**: Verbal e nominal
5. **Regência**: Verbal e nominal
6. **Colocação**: Pronominal
7. **Registro**: Adequação ao padrão formal

Classifique os desvios:
- Sistemáticos (padrão de erro)
- Esporádicos (eventuais)
- Graves (comprometem compreensão)
- Leves (não prejudicam sentido)

Forneça exemplos específicos e correções.
```

## 🎨 PROMPT PARA FEEDBACK MOTIVACIONAL

```
Crie feedback encorajador e construtivo para este estudante:

**REDAÇÃO:** {texto}
**NOTAS:** {notas_por_competencia}

Elementos do feedback:
1. **Pontos fortes**: O que o aluno fez bem
2. **Crescimento**: Áreas que mostraram evolução
3. **Prioridades**: 3 pontos principais para melhorar
4. **Estratégias**: Como estudar cada competência
5. **Motivação**: Encorajamento personalizado

Tom: Professoral, encorajador, específico e acionável.
Evite: Críticas destrutivas, linguagem técnica excessiva.
```

## 🚀 PROMPT PARA SUGESTÃO DE ESTUDOS

```
Com base na análise da redação, sugira plano de estudos personalizado:

**PERFIL DO ALUNO:**
- Notas: {notas}
- Principais dificuldades: {dificuldades}
- Pontos fortes: {fortes}

**PLANO DE ESTUDOS (4 semanas):**

Semana 1: Foco na competência mais deficiente
Semana 2: Reforço na segunda prioridade  
Semana 3: Integração de competências
Semana 4: Simulado e revisão geral

Para cada semana, inclua:
- Material de estudo
- Exercícios práticos  
- Tempo de dedicação
- Marcos de progresso
```

## 🔍 PROMPT PARA OCR PÓS-PROCESSAMENTO

```
Corrija e melhore este texto extraído por OCR de uma redação manuscrita:

**TEXTO BRUTO:** {texto_ocr}

Tarefas:
1. Corrigir erros de reconhecimento óbvios
2. Ajustar pontuação malformada  
3. Separar parágrafos adequadamente
4. Manter erros intencionais do autor
5. Sinalizar trechos com baixa confiança: [?]

**IMPORTANTE:** 
- NÃO corrija erros gramaticais do autor
- NÃO altere o conteúdo ou sentido
- APENAS melhore a legibilidade técnica

Retorne o texto limpo e bem formatado.
```
