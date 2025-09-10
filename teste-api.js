// Teste simples da API
const testarAPI = async () => {
    try {
        const textoTeste = "Este é um texto de teste para a análise da redação. Precisa ter pelo menos cinquenta caracteres para não dar erro na validação do tamanho mínimo. Este texto deve funcionar perfeitamente.";

        const response = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                texto: textoTeste
            })
        });

        console.log('Status:', response.status);
        console.log('Headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro:', errorText);
            return;
        }

        const data = await response.json();
        console.log('Sucesso:', data);

    } catch (error) {
        console.error('Erro na requisição:', error);
    }
};

// Execute no console do navegador: testarAPI()
