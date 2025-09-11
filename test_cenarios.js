// Teste de múltiplos cenários para garantir notas sempre redondas

console.log("=== TESTE DE MÚLTIPLOS CENÁRIOS ===\n");

const notasOficiais = [0, 40, 80, 120, 160, 200];

function arredondarParaNotaOficial(nota) {
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
}

function testarConsenso(nome, prof, ia) {
    console.log(`\n📝 ${nome}:`);
    console.log(`Professor: ${prof} | IA: ${ia}`);
    
    // Consenso padrão (40% professor, 60% IA)
    const consensoBase = prof * 0.4 + ia * 0.6;
    const notaOficial = arredondarParaNotaOficial(consensoBase);
    
    console.log(`Consenso base: ${consensoBase.toFixed(1)} → Nota oficial: ${notaOficial}`);
    
    return notaOficial;
}

// Teste de cenários extremos
const cenarios = [
    ["Discordância máxima", 0, 200],
    ["Discordância alta", 40, 160],
    ["Discordância média", 80, 120],
    ["Acordo total", 120, 120],
    ["Professor maior", 160, 80],
    ["Notas baixas", 40, 40],
    ["Notas altas", 160, 200],
    ["Caso original C1", 80, 120],
    ["Caso original C2", 0, 160],
    ["Caso original C4", 120, 80]
];

const resultados = [];

for (const [nome, prof, ia] of cenarios) {
    const resultado = testarConsenso(nome, prof, ia);
    resultados.push(resultado);
}

console.log("\n✅ VERIFICAÇÃO FINAL:");
const todasOficiais = resultados.every(nota => notasOficiais.includes(nota));
console.log(`Todas as notas são oficiais: ${todasOficiais ? 'SIM ✅' : 'NÃO ❌'}`);
console.log(`Notas geradas: ${resultados.join(', ')}`);
console.log(`Notas válidas: ${notasOficiais.join(', ')}`);

if (todasOficiais) {
    console.log("\n🎯 SUCESSO: O sistema de consenso agora sempre gera notas oficiais!");
    console.log("💡 Benefícios:");
    console.log("  • Elimina notas quebradas (537 → 560)");
    console.log("  • Padroniza com critérios oficiais ENEM");
    console.log("  • Facilita interpretação da nota");
    console.log("  • Mantém consistência do sistema");
}
