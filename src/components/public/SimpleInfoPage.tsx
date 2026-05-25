import { PublicPageLayout, type InfoSection } from './PublicPageLayout'

export const SimpleInfoPage = (props: {
  title: string
  lead: string
  slugLabel: string
  sections: InfoSection[]
  pager?: { label: string; href?: string; active?: boolean }[]
  sidebarTitle?: string
  sidebarItems?: string[]
}) => PublicPageLayout({
  title: props.title,
  lead: props.lead,
  breadcrumbs: [{ label: 'Start', href: '/' }, { label: props.slugLabel }],
  sections: props.sections,
  pager: props.pager,
  sidebarTitle: props.sidebarTitle,
  sidebarItems: props.sidebarItems,
})
