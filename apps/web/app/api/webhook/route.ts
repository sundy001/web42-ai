import { NextRequest, NextResponse } from 'next/server';
import { eventBridge } from '@/server/eventBridge';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the message
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid message field' },
        { status: 400 }
      );
    }

    // Create webhook message with unique ID and timestamp
    const webhookMessage = {
      id: uuidv4(),
      message: body.message,
      timestamp: new Date().toISOString(),
    };

    // Send message through the event bridge
    eventBridge.sendMessage(webhookMessage);

    // Return success response
    return NextResponse.json({
      success: true,
      messageId: webhookMessage.id,
      message: 'Message sent to SSE endpoint',
      activeConnections: eventBridge.getListenerCount(),
    });

  } catch (error) {
    console.error('Error in webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    endpoint: 'webhook',
    method: 'POST',
    description: 'Send messages to SSE clients',
    usage: 'POST with JSON body containing "message" field',
    activeConnections: eventBridge.getListenerCount(),
  });
}