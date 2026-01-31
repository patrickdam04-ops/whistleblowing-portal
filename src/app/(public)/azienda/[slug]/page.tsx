import HomePage from '@/app/(public)/page'

interface PageProps {
  params: { slug: string }
}

export default function CompanyPortalPage({ params }: PageProps) {
  return <HomePage searchParams={{ client: params.slug }} />
}
