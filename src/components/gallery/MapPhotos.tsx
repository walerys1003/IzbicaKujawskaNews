export interface MapPhotoItem { imageUrl: string; caption: string; lat?: number; lng?: number }
export interface MapPhotosProps { items: MapPhotoItem[] }

export const MapPhotos = ({ items }: MapPhotosProps) => (
  <section class="gallery-map">
    <h3>Mapa zdjęć</h3>
    <ul>
      {items.map((item) => <li><strong>{item.caption}</strong> — {item.lat ?? 0}, {item.lng ?? 0}</li>)}
    </ul>
  </section>
)

export default MapPhotos
