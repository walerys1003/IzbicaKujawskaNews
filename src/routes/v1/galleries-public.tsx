import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { loadGallery } from '../../lib/media/gallery-store'
import Lightbox from '../../components/gallery/Lightbox'
import Carousel from '../../components/gallery/Carousel'
import GridMasonry from '../../components/gallery/GridMasonry'
import SlideshowEmbed from '../../components/gallery/SlideshowEmbed'
import CompareBeforeAfter from '../../components/gallery/CompareBeforeAfter'
import PanoramaViewer from '../../components/gallery/PanoramaViewer'
import MapPhotos from '../../components/gallery/MapPhotos'
import Timeline from '../../components/gallery/Timeline'
import VideoPlayer from '../../components/gallery/VideoPlayer'
import AudioPlayer from '../../components/gallery/AudioPlayer'

const route = new Hono<AppEnv>()

route.get('/:slug', async (c) => {
  const gallery = await loadGallery(c.env, c.req.param('slug'))
  const images = gallery.items.map((item) => ({ src: item.imageUrl, alt: item.caption, caption: item.caption }))
  return c.html(
    <html lang="pl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{gallery.title} — Galeria Izbica24</title>
        <link rel="stylesheet" href="/static/gallery.css" />
        <link rel="stylesheet" href="/static/audio-player.css" />
      </head>
      <body>
        <main class="gallery-shell">
          <section class="gallery-hero">
            <p><a href="/">← Powrót do portalu</a></p>
            <h1>{gallery.title}</h1>
            <p>{gallery.description}</p>
          </section>
          <SlideshowEmbed title="Slideshow" images={images} />
          <Lightbox images={images} />
          <GridMasonry images={images} />
          <CompareBeforeAfter beforeUrl={gallery.items[0]?.imageUrl || gallery.coverImage} afterUrl={gallery.items[1]?.imageUrl || gallery.coverImage} />
          <PanoramaViewer imageUrl={gallery.coverImage} />
          <MapPhotos items={gallery.items} />
          <Timeline items={gallery.items.map((item, index) => ({ label: item.takenAt || `Etap ${index + 1}`, description: item.caption }))} />
          <VideoPlayer src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" poster={gallery.coverImage} title="Wideo powiązane" />
          <AudioPlayer src="https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3" title="Audio relacji" waveform={[0.1,0.3,0.6,0.4,0.5,0.7,0.2,0.55]} />
          <Carousel images={images} />
        </main>
        <script src="/static/gallery.js" defer></script>
        <script src="/static/audio-player.js" defer></script>
        <script src="/static/video-player.js" defer></script>
      </body>
    </html>,
  )
})

export default route
