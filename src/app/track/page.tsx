import TrackClient from './track-client'

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export const dynamic = 'force-dynamic'

export default function TrackPage({ searchParams }: PageProps) {
  const clientParam = getParam(searchParams?.client)
  return <TrackClient clientParam={clientParam} />
}
