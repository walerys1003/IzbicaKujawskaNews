export interface TimelineItem { label: string; description: string }
export interface TimelineProps { items: TimelineItem[] }

export const Timeline = ({ items }: TimelineProps) => (
  <ol class="gallery-timeline">
    {items.map((item) => (
      <li>
        <strong>{item.label}</strong>
        <p>{item.description}</p>
      </li>
    ))}
  </ol>
)

export default Timeline
