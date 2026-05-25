export interface AudioPlayerProps { src: string; title?: string; waveform?: number[] }

export const AudioPlayer = ({ src, title = 'Audio', waveform = [] }: AudioPlayerProps) => (
  <figure class="gallery-audio-player" data-audio-player="">
    <figcaption>{title}</figcaption>
    <div class="gallery-audio-player__waveform">{waveform.map((value) => <span style={`height:${Math.max(8, value * 48)}px`}></span>)}</div>
    <audio controls preload="metadata" src={src}></audio>
  </figure>
)

export default AudioPlayer
