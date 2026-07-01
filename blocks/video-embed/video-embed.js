/**
 * Video Embed block — lazy-loaded YouTube/Vimeo/MP4 player with poster image.
 *
 * Authored structure:
 * | Video Embed |
 * | --- |
 * | https://www.youtube.com/watch?v=VIDEO_ID |
 *
 * Optionally with poster image:
 * | Video Embed |
 * | --- |
 * | poster-image.jpg |
 * | https://www.youtube.com/watch?v=VIDEO_ID |
 *
 * @param {Element} block The video-embed block element
 */

function getVideoSource(url) {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      let videoId;
      if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.slice(1);
      } else {
        videoId = u.searchParams.get('v');
      }
      return videoId ? { type: 'youtube', id: videoId, embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` } : null;
    }
    // Vimeo
    if (u.hostname.includes('vimeo.com')) {
      const videoId = u.pathname.split('/').filter(Boolean).pop();
      return videoId ? { type: 'vimeo', id: videoId, embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1` } : null;
    }
    // Direct MP4
    if (u.pathname.endsWith('.mp4') || u.pathname.endsWith('.webm')) {
      return { type: 'native', url: url.toString() };
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  let posterPicture = null;
  let videoUrl = null;

  // Parse rows: could be [poster, url] or just [url]
  rows.forEach((row) => {
    const cell = row.children[0];
    if (!cell) return;
    const picture = cell.querySelector('picture');
    const link = cell.querySelector('a');
    const text = cell.textContent.trim();

    if (picture && !posterPicture) {
      posterPicture = picture;
    } else if (link) {
      videoUrl = link.href;
    } else if (text.startsWith('http')) {
      videoUrl = text;
    }
  });

  if (!videoUrl) return;

  const source = getVideoSource(videoUrl);
  if (!source) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'video-embed-wrapper';

  if (source.type === 'native') {
    // Direct video element
    const video = document.createElement('video');
    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;
    if (posterPicture) {
      const img = posterPicture.querySelector('img');
      if (img) video.poster = img.src;
    }
    const src = document.createElement('source');
    src.src = source.url;
    src.type = source.url.endsWith('.webm') ? 'video/webm' : 'video/mp4';
    video.append(src);
    wrapper.append(video);
  } else {
    // YouTube/Vimeo — click-to-play pattern for performance
    const placeholder = document.createElement('div');
    placeholder.className = 'video-embed-placeholder';
    placeholder.setAttribute('role', 'button');
    placeholder.setAttribute('tabindex', '0');
    placeholder.setAttribute('aria-label', `Play ${source.type} video`);

    // Poster
    if (posterPicture) {
      placeholder.append(posterPicture);
    } else if (source.type === 'youtube') {
      const img = document.createElement('img');
      img.src = `https://i.ytimg.com/vi/${source.id}/hqdefault.jpg`;
      img.alt = 'Video thumbnail';
      img.loading = 'lazy';
      img.width = 480;
      img.height = 360;
      placeholder.append(img);
    }

    // Play button overlay
    const playBtn = document.createElement('div');
    playBtn.className = 'video-embed-play';
    playBtn.innerHTML = '<svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red"/><path d="M45 24 27 14v20" fill="white"/></svg>';
    placeholder.append(playBtn);

    function loadIframe() {
      const iframe = document.createElement('iframe');
      iframe.src = source.embedUrl;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      iframe.title = `${source.type} video player`;
      wrapper.textContent = '';
      wrapper.append(iframe);
    }

    placeholder.addEventListener('click', loadIframe);
    placeholder.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        loadIframe();
      }
    });

    wrapper.append(placeholder);
  }

  block.textContent = '';
  block.append(wrapper);
}

