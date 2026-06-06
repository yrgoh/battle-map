import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, imageData, prompt } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    if (!imageData) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 });
    }

    const visionPrompt = prompt || `Analyze this file thoroughly and provide a detailed textual description of what you see or what's in the document. Focus on key information, facts, data, visual elements, and overall context.`;

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: visionPrompt },
      { type: 'image_url', image_url: { url: imageData } },
    ];

    const payload = {
      model: 'openai/gpt-5.4',
      messages: [
        { role: 'user', content: content as unknown as string },
      ],
      max_tokens: 2048,
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sovereigns-council.vercel.app',
        'X-Title': 'The Sovereign\'s Council',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}`, details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      content: data.choices?.[0]?.message?.content || '',
    });
  } catch (error) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}