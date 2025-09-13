// Teste para verificar se a detecção de tema está funcionando

const textoComTema = `Tema: A importância da educação digital no século XXI

A educação digital tornou-se fundamental nos dias atuais. Com o avanço da tecnologia, é essencial que as escolas se adaptem.

No primeiro parágrafo de desenvolvimento, podemos observar que a tecnologia transformou a forma como aprendemos. As ferramentas digitais facilitam o acesso à informação.

Além disso, a educação digital promove a inclusão social. Estudantes de diferentes regiões podem ter acesso às mesmas oportunidades educacionais.

Por fim, é necessário investir na formação de professores para que possam utilizar adequadamente essas ferramentas tecnológicas. O governo deve implementar políticas públicas que garantam o acesso universal à internet nas escolas.`;

const textoSemTema = `A educação digital tornou-se fundamental nos dias atuais. Com o avanço da tecnologia, é essencial que as escolas se adaptem.

No primeiro parágrafo de desenvolvimento, podemos observar que a tecnologia transformou a forma como aprendemos. As ferramentas digitais facilitam o acesso à informação.

Além disso, a educação digital promove a inclusão social. Estudantes de diferentes regiões podem ter acesso às mesmas oportunidades educacionais.

Por fim, é necessário investir na formação de professores para que possam utilizar adequadamente essas ferramentas tecnológicas. O governo deve implementar políticas públicas que garantam o acesso universal à internet nas escolas.`;

console.log('=== TESTE 1: Texto COM tema ===');
console.log('Texto original (7 linhas, mas primeira é tema):');
console.log('Parágrafos esperados: 4 (introdução + 2 desenvolvimento + conclusão)');
console.log('Tema esperado: "A importância da educação digital no século XXI"');

console.log('\n=== TESTE 2: Texto SEM tema ===');
console.log('Texto original (4 parágrafos):');
console.log('Parágrafos esperados: 4');
console.log('Tema esperado: null');

console.log('\nPara testar, execute:');
console.log('1. Copie o textoComTema no corretor');
console.log('2. Verifique se mostra "4 parágrafos da redação" em C2');
console.log('3. Copie o textoSemTema no corretor');
console.log('4. Verifique se mostra "4 parágrafos da redação" em C2');
