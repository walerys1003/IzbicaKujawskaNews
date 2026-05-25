export interface CompareBeforeAfterProps {
  beforeUrl: string
  afterUrl: string
  beforeLabel?: string
  afterLabel?: string
}

export const CompareBeforeAfter = ({ beforeUrl, afterUrl, beforeLabel = 'Przed', afterLabel = 'Po' }: CompareBeforeAfterProps) => (
  <div class="gallery-compare" data-gallery-compare="">
    <div><img src={beforeUrl} alt={beforeLabel} /><span>{beforeLabel}</span></div>
    <div><img src={afterUrl} alt={afterLabel} /><span>{afterLabel}</span></div>
  </div>
)

export default CompareBeforeAfter
