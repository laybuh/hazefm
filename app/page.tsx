'use client';

import { useState, useRef, useEffect } from 'react';
import { getMoodTags, MOOD_OPTIONS } from './lib/moodMap';
import { getTracksByTags, getTracksByArtist, Track } from './lib/lastfm';
import { searchYouTube } from './lib/youtube';
import Dropdown from './components/Dropdown';

const BG_VIDEOS = [
  '7nMsw5twDLs',
  'rq-0vwG0kQ4',
  'BrnDlRmW5hs',
  'on9BTX6dHN0',
  'vtjYDHuL5tY',
  'mQ-W0BjkaDY',
  '8NKw--UU8K8',
];

export default function Home() {
  const [tab, setTab] = useState<'mood' | 'artist'>('mood');
  const [feeling, setFeeling] = useState('');
  const [artist, setArtist] = useState('');
  const [artistNotFound, setArtistNotFound] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [currentYtId, setCurrentYtId] = useState<string | null>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchTracks = async () => {
    if (tab === 'mood') {
      const tags = getMoodTags(feeling);
      return await getTracksByTags(tags, '');
    } else {
      const { tracks, found } = await getTracksByArtist(artist);
      setArtistNotFound(!found);
      return tracks;
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setArtistNotFound(false);
    const results = await fetchTracks();
    setTracks(results);
    setCurrentIndex(0);
    setLoading(false);
    setSubmitted(true);
    setPaused(false);
    setPlaylistOpen(false);
    if (results.length > 0) loadYouTubeVideo(results[0]);
  };

  const handleRefresh = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setArtistNotFound(false);
    const results = await fetchTracks();
    setTracks(results);
    setCurrentIndex(0);
    setLoading(false);
    setPaused(false);
    setPlaylistOpen(false);
    if (results.length > 0) loadYouTubeVideo(results[0]);
  };

  const loadYouTubeVideo = async (track: Track) => {
    setYtLoading(true);
    setPaused(false);
    const { videoId, error } = await searchYouTube(track.name, track.artist);
    if (error === 'quota') setQuotaError(true);
    setCurrentYtId(videoId);
    setYtLoading(false);
  };

  const handleBack = () => {
    setSubmitted(false);
    setTracks([]);
    setFeeling('');
    setArtist('');
    setArtistNotFound(false);
    setCurrentYtId(null);
    setPaused(false);
    setQuotaError(false);
    setPlaylistOpen(false);
  };

  const skipTrack = async () => {
    const next = (currentIndex + 1) % tracks.length;
    setCurrentIndex(next);
    await loadYouTubeVideo(tracks[next]);
  };

  const selectTrack = async (index: number) => {
    setCurrentIndex(index);
    await loadYouTubeVideo(tracks[index]);
    if (isMobile) setPlaylistOpen(false);
  };

  const shuffleTracks = async () => {
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setTracks(shuffled);
    setCurrentIndex(0);
    await loadYouTubeVideo(shuffled[0]);
  };

  const togglePause = () => {
    if (iframeRef.current) {
      if (paused) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      } else {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
      setPaused(!paused);
    }
  };

  const prevBg = () => setBgIndex((i) => (i - 1 + BG_VIDEOS.length) % BG_VIDEOS.length);
  const nextBg = () => setBgIndex((i) => (i + 1) % BG_VIDEOS.length);

  const canGenerate = tab === 'mood' ? feeling.trim() !== '' : artist.trim() !== '';
  const searchLabel = tab === 'mood' ? feeling : artist;

  const controlBtnStyle = {
    background: 'none',
    border: 'none',
    color: '#7ababa',
    fontFamily: 'var(--font-mono)',
    fontSize: isMobile ? '0.65rem' : '0.7rem',
    letterSpacing: '0.15em',
    cursor: 'pointer',
  };

  if (loading) {
    return (
      <main style={{
        width: '100vw',
        height: '100vh',
        background: '#080810',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        color: '#4a9a9a',
      }}>
        <p style={{ letterSpacing: '0.3em', fontSize: '0.85rem' }}>
          Generating your playlist...
        </p>
      </main>
    );
  }

  if (submitted && tracks.length > 0) {
    const current = tracks[currentIndex];

    return (
      <main style={{
        width: '100vw',
        height: '100vh',
        background: '#080810',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-mono)',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Hidden audio player */}
        {currentYtId && (
          <iframe
            ref={iframeRef}
            key={currentYtId}
            src={`https://www.youtube.com/embed/${currentYtId}?autoplay=1&controls=0&modestbranding=1&rel=0&enablejsapi=1`}
            style={{
              position: 'absolute',
              top: '-9999px',
              left: '-9999px',
              width: '1px',
              height: '1px',
              border: 'none',
              pointerEvents: 'none',
            }}
            allow="autoplay; encrypted-media"
          />
        )}

        {/* Background video */}
        <iframe
          key={`bg-${bgIndex}`}
          src={`https://www.youtube.com/embed/${BG_VIDEOS[bgIndex]}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&playlist=${BG_VIDEOS[bgIndex]}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(1.3)',
            width: '100%',
            height: '100%',
            border: 'none',
            pointerEvents: 'none',
            zIndex: 0,
          }}
          allow="autoplay"
        />

        {/* Dark overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(8, 8, 16, 0.99)',
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Scanlines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none',
          zIndex: 3,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '1rem' : '1.25rem 2rem',
          borderBottom: '1px solid #0d2b2b',
          position: 'relative',
          zIndex: 4,
          background: 'rgba(8, 8, 16, 0.4)',
        }}>
          <div onClick={handleBack} style={{
            fontSize: isMobile ? '0.9rem' : '1.1rem',
            color: '#4a9a9a',
            letterSpacing: '0.5em',
            fontWeight: 700,
            fontStyle: 'italic',
            cursor: 'pointer',
          }}>haze.fm</div>

          <div style={{
            fontSize: '0.6rem',
            color: '#7ababa',
            letterSpacing: '0.15em',
            maxWidth: isMobile ? '100px' : '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{searchLabel}</div>

          <button onClick={handleBack} style={{
            background: 'none',
            border: '1px solid #2d6a6a',
            color: '#7ababa',
            padding: '6px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            letterSpacing: '0.15em',
          }}>
            new search
          </button>
        </div>

        {/* Main content */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 4,
          flexDirection: 'row',
        }}>

          {/* Player */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '1.5rem 1rem' : '2rem',
            gap: '1.5rem',
            position: 'relative',
          }}>

            {/* Now playing card */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              padding: isMobile ? '1.5rem 1rem' : '2rem',
              border: '1px solid #1a4a4a',
              background: 'rgba(8, 8, 16, 0.5)',
              width: isMobile ? '100%' : 'auto',
              minWidth: isMobile ? 'unset' : '300px',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: '0.6rem',
                color: '#5a9a9a',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}>
                {ytLoading ? 'loading...' : 'now playing'}
              </p>

              {tab === 'artist' && artistNotFound && (
                <p style={{
                  fontSize: '0.55rem',
                  color: '#5a7a5a',
                  letterSpacing: '0.12em',
                  marginBottom: '0.25rem',
                  fontStyle: 'italic',
                }}>
                  Artist not found. Playing something you might like instead...
                </p>
              )}

              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                color: '#c8e5e5',
                letterSpacing: '0.05em',
              }}>
                {current.name}
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: '#5a9a9a',
                letterSpacing: '0.15em',
              }}>
                {current.artist}
              </p>

              {quotaError && (
                <p style={{
                  fontSize: '0.6rem',
                  color: '#5a7a5a',
                  letterSpacing: '0.15em',
                  marginTop: '0.75rem',
                }}>
                  Daily search limit reached. Try again tomorrow.
                </p>
              )}
            </div>

            {/* Controls */}
            <div style={{
              display: 'flex',
              gap: isMobile ? '1rem' : '1.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              <button onClick={shuffleTracks} style={controlBtnStyle}>shuffle</button>
              <button onClick={togglePause} style={controlBtnStyle}>
                {paused ? 'play ▶' : 'pause ⏸'}
              </button>
              <button onClick={skipTrack} style={controlBtnStyle}>skip →</button>
              <button onClick={handleRefresh} style={{ ...controlBtnStyle, color: '#4a8a8a' }}>↺ regenerate</button>
              <p style={{ fontSize: '0.65rem', color: '#5a9a9a', letterSpacing: '0.1em' }}>
                {currentIndex + 1} / {tracks.length}
              </p>
            </div>

            {/* Scene controls */}
            <div style={{
              position: 'absolute',
              bottom: isMobile ? '4.5rem' : '1.5rem',
              left: isMobile ? '1rem' : '2rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
            }}>
              <button onClick={prevBg} style={{ ...controlBtnStyle, color: '#4a8a8a', fontSize: '0.6rem' }}>⏮ scene</button>
              <button onClick={nextBg} style={{ ...controlBtnStyle, color: '#4a8a8a', fontSize: '0.6rem' }}>scene ⏭</button>
            </div>

            {/* Mobile playlist toggle bar */}
            {isMobile && (
              <div
                onClick={() => setPlaylistOpen(!playlistOpen)}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '0.85rem 1.25rem',
                  background: 'rgba(8, 8, 16, 0.9)',
                  borderTop: '1px solid #0d2b2b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <p style={{ fontSize: '0.7rem', color: '#c8e5e5', letterSpacing: '0.05em' }}>
                    {current.name}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: '#5a9a9a', letterSpacing: '0.1em' }}>
                    {current.artist}
                  </p>
                </div>
                <p style={{ fontSize: '0.6rem', color: '#2d6a6a', letterSpacing: '0.2em' }}>
                  {playlistOpen ? '▼ close' : '▲ playlist'}
                </p>
              </div>
            )}
          </div>

          {/* Desktop sidebar */}
          {!isMobile && (
            <div style={{
              width: '280px',
              borderLeft: '1px solid #0d2b2b',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(8, 8, 16, 0.5)',
            }}>
              <div style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #0d2b2b',
                fontSize: '0.65rem',
                color: '#5a9a9a',
                letterSpacing: '0.25em',
              }}>
                PLAYLIST
              </div>
              {tracks.map((track, i) => (
                <div
                  key={i}
                  onClick={() => selectTrack(i)}
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid #0a1a1a',
                    cursor: 'pointer',
                    background: i === currentIndex ? 'rgba(45, 106, 106, 0.2)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <p style={{
                    fontSize: '0.72rem',
                    color: i === currentIndex ? '#c8e5e5' : '#7ababa',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{track.name}</p>
                  <p style={{
                    fontSize: '0.62rem',
                    color: i === currentIndex ? '#5a9a9a' : '#3a6a6a',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{track.artist}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile slide-up playlist */}
        {isMobile && (
          <div style={{
            position: 'absolute',
            bottom: playlistOpen ? 0 : '-100%',
            left: 0,
            right: 0,
            height: '65vh',
            background: '#080810',
            borderTop: '1px solid #1a4a4a',
            zIndex: 10,
            transition: 'bottom 0.35s ease',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #0d2b2b',
              fontSize: '0.65rem',
              color: '#5a9a9a',
              letterSpacing: '0.25em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>PLAYLIST</span>
              <span
                onClick={() => setPlaylistOpen(false)}
                style={{ cursor: 'pointer', color: '#2d6a6a', fontSize: '0.6rem' }}
              >✕ close</span>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {tracks.map((track, i) => (
                <div
                  key={i}
                  onClick={() => selectTrack(i)}
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid #0a1a1a',
                    cursor: 'pointer',
                    background: i === currentIndex ? 'rgba(45, 106, 106, 0.2)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <p style={{
                    fontSize: '0.72rem',
                    color: i === currentIndex ? '#c8e5e5' : '#7ababa',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{track.name}</p>
                  <p style={{
                    fontSize: '0.62rem',
                    color: i === currentIndex ? '#5a9a9a' : '#3a6a6a',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{track.artist}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    );
  }

  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      background: '#080810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      padding: '1rem',
    }}>

      <div onClick={handleBack} style={{
        fontSize: isMobile ? '1.6rem' : '2rem',
        color: '#4a9a9a',
        letterSpacing: '0.6em',
        marginBottom: '2rem',
        fontWeight: 700,
        fontStyle: 'italic',
        cursor: 'pointer',
      }}>
        haze.fm
      </div>

      <div style={{
        background: 'transparent',
        border: '1px solid #1a4a4a',
        padding: isMobile ? '1.75rem 1.25rem' : '2.5rem 2rem',
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{
            fontSize: '0.65rem',
            color: '#6a9a9a',
            letterSpacing: '0.1em',
            lineHeight: '1.7',
            textAlign: 'center',
          }}>
            Search by mood or an artist you enjoy and receive a curated playlist tailored to you.
          </p>
        </div>

        <div style={{ borderTop: '1px solid #0d2b2b' }} />

        <div style={{ display: 'flex', borderBottom: '1px solid #0d2b2b' }}>
          {(['mood', 'artist'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: tab === t ? '1px solid #4a9a9a' : '1px solid transparent',
                color: tab === t ? '#a8c5c5' : '#2d6a6a',
                padding: '0.5rem 1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'mood' && (
          <Dropdown
            label="Mood"
            placeholder="Select a mood..."
            options={MOOD_OPTIONS}
            value={feeling}
            onChange={setFeeling}
          />
        )}

        {tab === 'artist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{
              fontSize: '0.6rem',
              color: '#5a9a9a',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}>Artist</label>
            <input
              type="text"
              placeholder="Type an artist name..."
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #2d6a6a',
                color: '#a8c5c5',
                padding: '10px 0',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            marginTop: '0.5rem',
            background: isHovered && canGenerate
              ? 'rgba(74, 154, 154, 0.3)'
              : canGenerate
                ? 'rgba(45, 106, 106, 0.15)'
                : 'transparent',
            border: '1px solid',
            borderColor: canGenerate ? '#4a9a9a' : '#2d6a6a',
            color: '#a8c5c5',
            padding: '14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            letterSpacing: '0.35em',
            transition: 'all 0.3s ease',
            width: '100%',
            opacity: canGenerate ? 1 : 0.7,
          }}
        >
          GENERATE
        </button>

      </div>

    </main>
  );
}