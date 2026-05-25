export interface VideoPlayerProps { src: string; poster?: string; title?: string }

export const VideoPlayer = ({ src, poster, title = 'Wideo' }: VideoPlayerProps) => (
  <figure class="gallery-video-player" data-video-player="">
    <video controls preload="metadata" poster={poster} src={src}></video>
    <figcaption>{title}</figcaption>
  </figure>
)

export default VideoPlayer
