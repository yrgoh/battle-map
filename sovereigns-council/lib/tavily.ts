// Tavily Search API utilities

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  results: SearchResult[];
}

export async function searchTavily(
  apiKey: string,
  query: string
): Promise<SearchResult[]> {
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
    throw new Error(`Tavily API error: ${response.status} - ${error}`);
  }

  const data: TavilyResponse = await response.json();
  return data.results || [];
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.';
  }

  return results
    .map((r, i) => `${i + 1}. ${r.title}
   ${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}
   Source: ${r.url}`)
    .join('\n\n');
}