export interface PanoramaViewerProps { imageUrl: string; title?: string }

export const PanoramaViewer = ({ imageUrl, title = 'Panorama' }: PanoramaViewerProps) => (
  <section class="gallery-panorama">
    <h3>{title}</h3>
    <div class="gallery-panorama__viewport"><img src={imageUrl} alt={title} /></div>
  </section>
)

export default PanoramaViewer
