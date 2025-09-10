# Como Usar a Análise IA com Gemini

## Exemplo Prático

Aqui está um exemplo completo de como usar a nova funcionalidade de análise IA:

### 1. Configuração Inicial

1. Configure sua chave da API do Google no arquivo `.env.local`:
```env
GOOGLE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

2. O projeto já está configurado e pronto para uso!

### 2. Testando a Funcionalidade

Acesse http://localhost:3000 e cole este exemplo de redação para teste:

```
Violência contra a mulher no Brasil

A violência contra a mulher constitui um grave problema social no Brasil contemporâneo. Segundo dados do Mapa da Violência, o país ocupa a quinta posição mundial em feminicídios, evidenciando a urgência de ações efetivas para combater essa questão.

Primeiramente, é importante analisar as raízes históricas desse problema. A sociedade brasileira foi construída sobre bases patriarcais, onde a mulher era vista como propriedade do homem. Essa cultura machista perpetua-se até hoje, manifestando-se em diversas formas de violência: física, psicológica, sexual e patrimonial.

Ademais, a impunidade contribui significativamente para a perpetuação da violência. Muitas mulheres não denunciam seus agressores por medo de retaliação ou por descrença no sistema judiciário. Quando denunciam, frequentemente não recebem proteção adequada, tornando-se vítimas novamente.

Por conseguinte, é fundamental implementar políticas públicas eficazes. O Estado deve, através do Ministério da Justiça e Segurança Pública, ampliar o número de delegacias especializadas e capacitar adequadamente os profissionais que atendem essas vítimas. Paralelamente, campanhas educativas devem ser realizadas nas escolas e meios de comunicação para desconstruir estereótipos de gênero e promover o respeito às mulheres.

Portanto, o combate à violência contra a mulher exige ações coordenadas entre Estado e sociedade, visando criar um ambiente seguro e igualitário para todas as brasileiras.
```

### 3. O que Esperar

Após a análise, você verá:

#### Análise Tradicional (Sistema Original):
- Notas das 5 competências (0-200 cada)
- Estatísticas básicas (palavras, parágrafos)
- Feedback automático baseado em regras

#### Análise IA (Gemini):
- **Card Azul/Roxo**: Análise detalhada da IA
  - Nota geral da IA (0-1000)
  - Feedback personalizado por competência
  - Identificação de pontos fortes e fracos

- **Card Verde**: Sugestões IA Detalhadas
  - Recomendações específicas e práticas
  - Sugestões de melhoria por competência
  - Dicas de aprimoramento da argumentação

### 4. Comparação das Análises

A interface permite comparar:
- **Sistema Tradicional**: Baseado em regras e padrões fixos
- **IA Gemini**: Análise contextual e personalizada

### 5. Benefícios da IA

- **Feedback Mais Rico**: Comentários detalhados e personalizados
- **Detecção Contextual**: Identifica nuances que regras fixas não captam
- **Sugestões Práticas**: Recomendações específicas e acionáveis
- **Avaliação Holística**: Considera o texto como um todo

### 6. Exemplo de Feedback IA

A IA pode fornecer feedback como:

**Competência 1 (Norma Culta):**
- "Excelente domínio da norma padrão, com uso correto de concordâncias e regências"
- "Pontos fortes: variação vocabular, coesão textual"

**Competência 3 (Argumentação):**
- "Boa seleção de argumentos com dados estatísticos relevantes"
- "Sugestão: desenvolver mais exemplos concretos no segundo parágrafo"

**Sugestões Detalhadas:**
- "Substitua 'é importante analisar' por 'torna-se fundamental compreender' para maior precisão"
- "No terceiro parágrafo, adicione conectivo 'Além disso' para melhorar a progressão textual"

### 7. Troubleshooting

Se a análise IA não aparecer:
1. Verifique se a chave da API está configurada
2. Confira os logs do console para erros
3. Teste com texto menor primeiro
4. Verifique sua conexão com internet

### 8. Custos

- Cada análise consome créditos da API do Google
- Google oferece cota gratuita generosa para testes
- Monitore o uso na console do Google AI

### 9. Próximos Recursos

Em desenvolvimento:
- Cache de análises para reduzir custos
- Comparação lado a lado das análises
- Histórico de melhorias
- Análise de progressão do estudante
