import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;

if (apiKey) {
  client = new Anthropic({ apiKey });
}

export async function analyzeWithAI(prompt: string): Promise<string> {
  if (!client) {
    console.warn('⚠️ ANTHROPIC_API_KEY não configurada. Pulando análise de IA.');
    return 'Análise de IA não disponível (API key não configurada)';
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock ? textBlock.text : 'Sem resposta';
  } catch (error) {
    console.error('Erro na API Claude:', error);
    return `Erro na análise: ${error}`;
  }
}

export function isAIAvailable(): boolean {
  return client !== null;
}
