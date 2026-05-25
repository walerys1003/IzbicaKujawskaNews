export interface GridMasonryProps {
  images: Array<{ src: string; alt?: string; caption?: string }>
}

export const GridMasonry = ({ images }: GridMasonryProps) => (
  <div class="gallery-masonry">
    {images.map((image) => (
      <figure class="gallery-masonry__item">
        <img src={image.src} alt={image.alt || image.caption || 'Zdjęcie galerii'} loading="lazy" />
        {image.caption ? <figcaption>{image.caption}</figcaption> : null}
      </figure>
    ))}
  </div>
)

export default GridMasonry
