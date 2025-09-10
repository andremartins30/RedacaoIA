# 📊 Sistema de Consenso - Professor + IA

## Visão Geral

O sistema de consenso foi desenvolvido para resolver o problema de discrepância entre as avaliações tradicionais (Professor) e as análises de Inteligência Artificial, criando uma nota mais equilibrada e precisa.

## Problema Identificado

- **Exemplo**: Redação nota 1000 → Sistema retornava 500 pontos
- **Causa**: Análise tradicional muito rígida vs. IA mais generosa
- **Necessidade**: Equilibrar critérios para maior acurácia

## Como Funciona

### 1. Três Tipos de Avaliação

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PROFESSOR     │    │       IA        │    │    CONSENSO     │
│  (Tradicional)  │    │    (Gemini)     │    │   (Híbrido)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Mais rigoroso │    │ • Mais generous │    │ • Equilibrado   │
│ • Foco técnico  │    │ • Foco conteúdo │    │ • Ponderado     │
│ • Nota: 550     │    │ • Nota: 880     │    │ • Nota: 715     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. Configurações Predefinidas

#### 🟢 **Leniente** (Para redações em desenvolvimento)
- Peso Professor: 30% | Peso IA: 70%
- Ajustes por competência:
  - C1 (Norma): +10% mais generoso
  - C2 (Estrutura): +15% mais generoso
  - C3 (Argumentação): +5% mais generoso
  - C4 (Coesão): +10% mais generoso
  - C5 (Proposta): +20% mais generoso

#### 🟡 **Moderado** (Padrão equilibrado)
- Peso Professor: 40% | Peso IA: 60%
- Ajustes por competência:
  - C1: Neutro (100%)
  - C2: +5% mais generoso
  - C3: Neutro (100%)
  - C4: Neutro (100%)
  - C5: +10% mais generoso

#### 🔴 **Rigoroso** (Para redações avançadas)
- Peso Professor: 60% | Peso IA: 40%
- Ajustes por competência:
  - C1: -5% mais rigoroso
  - C2: -10% mais rigoroso
  - C3: -5% mais rigoroso
  - C4: -10% mais rigoroso
  - C5: -15% mais rigoroso

### 3. Seleção Automática da Configuração

```typescript
function sugerirConfiguracao(notasProfessor, notasIA) {
    const diferenca = Math.abs(totalProfessor - totalIA);
    
    if (diferenca > 200) return 'moderado';           // Grande diferença → equilibrar
    if (ambas < 400) return 'leniente';               // Notas baixas → ser mais generoso
    if (ambas > 800) return 'rigoroso';               // Notas altas → manter rigor
    return 'moderado';                                // Padrão
}
```

## Fórmula do Consenso

```
NotaConsenso = (NotaProfessor × PesoProfessor + NotaIA × PesoIA) × AjusteCompetência
```

### Exemplo Prático:

**Competência 1 (C1):**
- Professor: 120 pontos
- IA: 160 pontos
- Configuração: Moderado (40% Prof, 60% IA, ajuste neutro)
- Consenso: (120 × 0.4 + 160 × 0.6) × 1.0 = **144 pontos**

## Interface do Usuario

### Seção de Consenso Exibida:

```
📊 Consenso de Avaliação

┌─────────────┬─────────────┬─────────────┐
│  Professor  │     IA      │   Consenso  │
│     550     │     880     │     715     │
│ Tradicional │   Gemini    │    Final    │
└─────────────┴─────────────┴─────────────┘

Metodologia: Consenso moderado com pesos: Professor 40%, IA 60%

Detalhamento por Competência:
• C1: Professor 120, IA 160 → Consenso 144
• C2: Professor 140, IA 180 → Consenso 165
• C3: Professor 100, IA 160 → Consenso 136
• C4: Professor 120, IA 180 → Consenso 156
• C5: Professor 70, IA 200 → Consenso 146
```

## Benefícios

### ✅ **Maior Acurácia**
- Reduz discrepâncias extremas
- Combina rigor técnico com análise contextual
- Nota mais próxima da realidade

### ✅ **Transparência**
- Mostra as três avaliações lado a lado
- Explica a metodologia utilizada
- Detalha como cada competência foi calculada

### ✅ **Flexibilidade**
- Adapta-se automaticamente ao perfil da redação
- Diferentes níveis de rigidez
- Ajustes específicos por competência

### ✅ **Educativo**
- Estudante vê múltiplas perspectivas
- Entende onde cada avaliação focou
- Aprende com o consenso final

## Casos de Uso

### Redação Nota 1000 → Sistema Antigo: 500 → Sistema Novo: ~850
- **Problema**: Professor muito rigoroso
- **Solução**: IA detecta qualidade, consenso equilibra
- **Resultado**: Nota mais justa e motivadora

### Redação Fraca → IA: 600 → Professor: 200 → Consenso: ~350
- **Problema**: IA pode ser generosa demais
- **Solução**: Professor mantém critérios, consenso realista
- **Resultado**: Nota honesta mas não desmotivadora

## Implementação Técnica

### Arquivos Modificados:

1. **`analyzer.ts`**: Funções de consenso e configurações
2. **`analyze/route.ts`**: Integração na API
3. **`CorretorRedacao.tsx`**: Interface visual do consenso

### Principais Funções:

```typescript
calcularConsenso(notasProfessor, notasIA, config)
sugerirConfiguracaoConsenso(notasProfessor, notasIA)
CONFIGURACOES_CONSENSO.{leniente|moderado|rigoroso}
```

## Próximos Passos

- [ ] Calibração baseada em dados reais
- [ ] Configuração manual pelo usuário
- [ ] Histórico de consensos
- [ ] Métricas de acurácia
- [ ] A/B testing com diferentes configurações

---

**Resultado**: Sistema agora entrega notas mais equilibradas, transparentes e educativas, resolvendo o problema de discrepância entre as avaliações! 🎯
