import { type UIMessage } from 'ai';
import store from "@/redux/store";
import { getMostRecentUserMessage } from '@/lib/utils';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
    }: {
      id: string;
      messages: Array<UIMessage>;
    } = await request.json();

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Extract the user's message
    let userInput = "";
    if (typeof userMessage.content === 'string') {
      userInput = userMessage.content;
    } else if (Array.isArray(userMessage.parts)) {
      // Find text content in parts
      for (const part of userMessage.parts) {
        if (typeof part === 'string') {
          userInput = part;
          break;
        } else if (part && typeof part === 'object' && 'text' in part) {
          userInput = part.text as string;
          break;
        }
      }
    }
    
    // Create a readable stream for progressive response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Echo back the user's message directly
        controller.enqueue(encoder.encode("You said: " + userInput));
        
        controller.close();
      }
    });
    
    // Return the stream as text
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}

// Removing the DELETE function entirely:
// export async function DELETE(request: Request) { ... } 