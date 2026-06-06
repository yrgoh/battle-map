import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, query } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
        include_answer: true,
        include_raw_content: false,
        include_images: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Tavily API error: ${response.status}`, details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ results: data.results || [] });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}