const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export type YouTubeError = 'quota' | 'notFound' | null;

export async function searchYouTube(trackName: string, artist: string): Promise<{ videoId: string | null, error: YouTubeError }> {
  const query = `${artist} ${trackName} official audio`;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=1&key=${YT_API_KEY}`
    );
    const data = await res.json();

    if (data.error) {
      if (data.error.errors?.[0]?.reason === 'quotaExceeded') {
        return { videoId: null, error: 'quota' };
      }
      return { videoId: null, error: 'notFound' };
    }

    if (data.items && data.items.length > 0) {
      return { videoId: data.items[0].id.videoId, error: null };
    }

    return { videoId: null, error: 'notFound' };
  } catch (err) {
    console.error('YouTube search error:', err);
    return { videoId: null, error: 'notFound' };
  }
}