export interface CarouselProps {
  images: Array<{ src: string; alt?: string; caption?: string }>
}

export const Carousel = ({ images }: CarouselProps) => (
  <div class="gallery-carousel" data-gallery-carousel="">
    <div class="gallery-carousel__track">
      {images.map((image) => (
        <figure class="gallery-carousel__slide">
          <img src={image.src} alt={image.alt || image.caption || 'Slajd galerii'} loading="lazy" />
          {image.caption ? <figcaption>{image.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  </div>
)

export default Carousel
