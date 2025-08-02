import { Hono } from 'hono';
import { z } from 'zod';
import { LLMService } from '../services/llm-service.js';
// import { ChatRouter } from '../services/chat-router.js'; // We'll enable this later

const chatRoute = new Hono();
const llmService = new LLMService();
// const chatRouter = new ChatRouter(); // We'll enable this later

// Request schema validation
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([])
});

chatRoute.post('/chat', async (c) => {
  try {
    const body = await c.req.json();
    const { message, history } = chatRequestSchema.parse(body);

    console.log(`💬 Chat request: ${message}`);

    // For now, just use basic LLM chat
    // Later we'll switch to: const result = await chatRouter.processMessage(message, history);
    const response = await llmService.chat(message, history);

    return c.json({
      response,
      status: 'success'
      // Later we'll add: action, workflowId, requiresConfirmation
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json({
        response: 'Sorry, there was an issue with your request format.',
        status: 'error',
        error: 'Invalid request format'
      }, 400);
    }

    return c.json({
      response: 'Sorry, I encountered an error while processing your request. Please try again.',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { chatRoute };