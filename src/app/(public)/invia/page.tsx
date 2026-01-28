import SubmitReportPage from '@/app/submit-report/page'

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default function Page({ searchParams }: PageProps) {
  const clientName = getParam(searchParams?.client)
  return <SubmitReportPage searchParams={searchParams} clientName={clientName} />
}
