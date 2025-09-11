// Teste do sistema de consenso com arredondamento para notas oficiais

// Simula o problema relatado: notas quebradas
const notasProfessor = {
    c1: 80,  // Nota oficial
    c2: 0,   // Nota oficial
    c3: 80,  // Nota oficial
    c4: 120, // Nota oficial
    c5: 120  // Nota oficial
};

const notasIA = {
    c1: 120, // Nota oficial
    c2: 160, // Nota oficial
    c3: 120, // Nota oficial
    c4: 80,  // Nota oficial
    c5: 120  // Nota oficial
};

// Configuração padrão (moderado)
const configModerado = {
    pesoProfessor: 0.4,
    pesoIA: 0.6,
    nivelRigidez: 'moderado',
    ajustesPorCompetencia: {
        c1: 1.0,
        c2: 1.05,
        c3: 1.0,
        c4: 1.0,
        c5: 1.1
    }
};

console.log("=== TESTE DO CONSENSO COM ARREDONDAMENTO ===\n");

console.log("📋 NOTAS DE ENTRADA:");
console.log("Professor:", notasProfessor, "Total:", Object.values(notasProfessor).reduce((a,b) => a+b, 0));
console.log("IA:", notasIA, "Total:", Object.values(notasIA).reduce((a,b) => a+b, 0));

console.log("\n🔧 CÁLCULO DO CONSENSO:");
const competencias = ['c1', 'c2', 'c3', 'c4', 'c5'];
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

const consenso = {};
let totalConsenso = 0;

for (const comp of competencias) {
    const notaProf = notasProfessor[comp];
    const notaIA = notasIA[comp];
    const ajuste = configModerado.ajustesPorCompetencia[comp];
    
    // Cálculo original
    const consensoBase = (notaProf * 0.4 + notaIA * 0.6);
    const consensoAjustado = consensoBase * ajuste;
    
    // Arredondamento para nota oficial
    const notaFinal = arredondarParaNotaOficial(consensoAjustado);
    
    consenso[comp] = notaFinal;
    totalConsenso += notaFinal;
    
    console.log(`${comp.toUpperCase()}: Prof ${notaProf} + IA ${notaIA} → Base ${consensoBase.toFixed(1)} → Ajustado ${consensoAjustado.toFixed(1)} → Oficial ${notaFinal}`);
}

console.log("\n✅ RESULTADO FINAL:");
console.log("Consenso:", consenso, "Total:", totalConsenso);
console.log(`\n🎯 TODAS AS NOTAS SÃO OFICIAIS (${notasOficiais.join(', ')}): ${Object.values(consenso).every(n => notasOficiais.includes(n)) ? 'SIM ✅' : 'NÃO ❌'}`);

console.log("\n📊 COMPARAÇÃO:");
console.log("Antes: 537 pontos (notas quebradas: 104, 101, 96, 132)");
console.log(`Agora: ${totalConsenso} pontos (notas oficiais: ${Object.values(consenso).join(', ')})`);
