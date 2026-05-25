export interface LightboxProps {
  images: Array<{ src: string; alt?: string; caption?: string }>
}

export const Lightbox = ({ images }: LightboxProps) => (
  <div class="gallery-lightbox" data-gallery-lightbox="">
    {images.map((image, index) => (
      <a href={image.src} class="gallery-lightbox__item" data-gallery-open="" data-index={String(index)}>
        <img src={image.src} alt={image.alt || image.caption || `Zdjęcie ${index + 1}`} loading="lazy" />
        <span>{image.caption || `Zdjęcie ${index + 1}`}</span>
      </a>
    ))}
  </div>
)

export default Lightbox
