# Integração com Google Gemini AI

Este documento explica como configurar e usar a integração com o Google Gemini para análise de redações.

## Configuração

### 1. Obter Chave da API do Google

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar Variável de Ambiente

No arquivo `.env.local`:

```env
GOOGLE_API_KEY=sua_chave_aqui
```

**IMPORTANTE**: Nunca commit a chave da API no código!

## Funcionalidades

### Análise Detalhada por IA

A IA do Gemini fornece:

- **Avaliação por competência**: Análise específica de cada uma das 5 competências do ENEM
- **Feedback personalizado**: Comentários detalhados sobre pontos fortes e fracos
- **Sugestões práticas**: Recomendações específicas para melhoria
- **Análise qualitativa**: Avaliação geral da redação

### Interface Visual

- **Seção Análise IA**: Card com cor azul/roxa mostrando a nota da IA
- **Sugestões IA Detalhadas**: Card verde com sugestões específicas e práticas
- **Comparação**: Permite comparar a análise automática com a análise da IA

## Estrutura da Análise

```typescript
interface AnaliseGemini {
    competencia1: {
        nota: number;           // 0-200
        feedback: string[];     // Comentários específicos
        pontosFortes: string[]; // Aspectos positivos
        pontosFrageis: string[];// Pontos de melhoria
    };
    // ... competencias 2-5 com mesma estrutura
    notaFinal: number;              // 0-1000
    feedbackGeral: string[];        // Comentários gerais
    sugestoesDetalhadas: string[];  // Sugestões práticas
    analiseQualitativa: string;     // Análise em texto corrido
}
```

## Benefícios da IA

1. **Precisão**: Avaliação baseada em milhares de exemplos
2. **Consistência**: Critérios aplicados uniformemente
3. **Detalhamento**: Feedback específico e acionável
4. **Rapidez**: Análise em segundos
5. **Aprendizado**: Sugestões educativas para melhoria

## Funcionamento Técnico

1. **Análise Paralela**: IA roda em paralelo com análise técnica
2. **Fallback Gracioso**: Se IA falhar, análise básica continua funcionando
3. **Caching**: Respostas podem ser cacheadas para otimização
4. **Rate Limiting**: Controle automático de uso da API

## Prompts Especializados

O sistema usa prompts especializados que:

- Seguem rigorosamente os critérios do ENEM
- Fornecem feedback construtivo
- Identificam padrões de melhoria
- Sugerem correções específicas

## Limitações e Considerações

- **Custo**: Cada análise consome créditos da API
- **Latência**: Pode adicionar 2-5 segundos na análise
- **Disponibilidade**: Depende da disponibilidade da API do Google
- **Idioma**: Otimizado para português brasileiro

## Monitoramento

- Logs de erro são capturados automaticamente
- Métricas de uso podem ser implementadas
- Fallback automático em caso de falha

## Desenvolvimento

Para testar localmente:

1. Configure a variável de ambiente
2. Execute `npm run dev`
3. Teste com redações de exemplo
4. Monitore logs no console

## Próximos Passos

- [ ] Implementar cache para reduzir custos
- [ ] Adicionar métricas de uso
- [ ] Criar dashboard de monitoramento
- [ ] Implementar rate limiting inteligente
- [ ] Adicionar análise de plágio
- [ ] Integrar correção ortográfica avançada
