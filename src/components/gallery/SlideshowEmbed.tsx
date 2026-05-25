import Carousel from './Carousel'

export interface SlideshowEmbedProps {
  title: string
  images: Array<{ src: string; alt?: string; caption?: string }>
}

export const SlideshowEmbed = ({ title, images }: SlideshowEmbedProps) => (
  <section class="gallery-slideshow-embed">
    <header><h2>{title}</h2></header>
    <Carousel images={images} />
  </section>
)

export default SlideshowEmbed
