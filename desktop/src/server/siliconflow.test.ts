import { describe, it, expect } from 'vitest';
import { invokeLLM } from './_core/llm';

describe('SiliconFlow API Integration', () => {
  it('should successfully call DeepSeek API', async () => {
    const response = await invokeLLM({
      messages: [
        { role: 'user', content: 'Hello, please respond with "OK"' }
      ],
      max_tokens: 50,
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0].message).toBeDefined();
    expect(response.choices[0].message.content).toBeDefined();
    
    const content = response.choices[0].message.content;
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    expect(text.length).toBeGreaterThan(0);
  }, 30000); // 30秒超时
});
