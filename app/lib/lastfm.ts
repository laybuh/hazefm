const API_KEY = process.env.NEXT_PUBLIC_LASTFM_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export interface Track {
    name: string;
    artist: string;
    image: string;
    url: string;
}

export async function getTracksByTags(tags: string[], genre: string): Promise<Track[]> {
    const allTracks: Track[] = [];
    const searchTags = genre ? [genre, ...tags] : tags;

    for (const tag of searchTags.slice(0, 3)) {
        try {
            const pages = [
                Math.floor(Math.random() * 10) + 1,
                Math.floor(Math.random() * 10) + 1,
                Math.floor(Math.random() * 10) + 1,
            ];

            for (const page of pages) {
                const res = await fetch(
                    `${BASE_URL}?method=tag.gettoptracks&tag=${encodeURIComponent(tag)}&api_key=${API_KEY}&format=json&limit=10&page=${page}`
                );
                const data = await res.json();
                const tracks = data?.tracks?.track;

                if (Array.isArray(tracks)) {
                    tracks.forEach((t: any) => {
                        allTracks.push({
                            name: t.name,
                            artist: t.artist.name,
                            image: t.image?.[2]?.['#text'] || '',
                            url: t.url,
                        });
                    });
                }
            }
        } catch (err) {
            console.error('Last.fm fetch error:', err);
        }
    }

    const seen = new Set<string>();
    const seenArtists = new Map<string, number>();

    const unique = allTracks.filter((t) => {
        const normalizedName = t.name
            .toLowerCase()
            .replace(/\(.*?\)/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/feat\..*$/i, '')
            .replace(/\s*-\s*.+$/i, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\b(a|an|the|is|are|was|were)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const key = `${normalizedName}-${t.artist.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const shuffled = unique.sort(() => Math.random() - 0.5);

    const varied = shuffled.filter((t) => {
        const count = seenArtists.get(t.artist) || 0;
        if (count >= 2) return false;
        seenArtists.set(t.artist, count + 1);
        return true;
    });

    return varied.slice(0, 15);
}

export async function getTracksByArtist(artistName: string): Promise<{ tracks: Track[], found: boolean }> {
    const allTracks: Track[] = [];
    let found = true;

    try {
        const pages = Array.from({ length: 5 }, () => Math.floor(Math.random() * 20) + 1);

        for (const page of pages) {
            const res = await fetch(
                `${BASE_URL}?method=artist.gettoptracks&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json&limit=10&page=${page}`
            );
            const data = await res.json();

            if (data.error) {
                found = false;
                const fallbackTags = ['chill', 'melancholic', 'atmospheric', 'dreamy', 'ambient'];
                const randomTag = fallbackTags[Math.floor(Math.random() * fallbackTags.length)];
                const randomPage = Math.floor(Math.random() * 10) + 1;
                const fallbackRes = await fetch(
                    `${BASE_URL}?method=tag.gettoptracks&tag=${encodeURIComponent(randomTag)}&api_key=${API_KEY}&format=json&limit=15&page=${randomPage}`
                );
                const fallbackData = await fallbackRes.json();
                const fallbackTracks = fallbackData?.tracks?.track;
                if (Array.isArray(fallbackTracks)) {
                    fallbackTracks.forEach((t: any) => {
                        allTracks.push({
                            name: t.name,
                            artist: t.artist.name,
                            image: t.image?.[2]?.['#text'] || '',
                            url: t.url,
                        });
                    });
                }
                break;
            }

            const tracks = data?.toptracks?.track;
            if (Array.isArray(tracks)) {
                tracks.forEach((t: any) => {
                    allTracks.push({
                        name: t.name,
                        artist: t.artist.name,
                        image: t.image?.[2]?.['#text'] || '',
                        url: t.url,
                    });
                });
            }
        }
    } catch (err) {
        console.error('Last.fm artist fetch error:', err);
    }

    const seen = new Set<string>();

    const unique = allTracks.filter((t) => {
        const normalizedName = t.name
            .toLowerCase()
            .replace(/\(.*?\)/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/feat\..*$/i, '')
            .replace(/\s*-\s*.+$/i, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\b(a|an|the|is|are|was|were)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const key = `${normalizedName}-${t.artist.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return { tracks: unique.sort(() => Math.random() - 0.5).slice(0, 15), found };
}