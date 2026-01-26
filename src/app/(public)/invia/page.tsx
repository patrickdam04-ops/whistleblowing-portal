import SubmitReportPage from '@/app/submit-report/page'

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function Page({ searchParams }: PageProps) {
  return <SubmitReportPage searchParams={searchParams} />
}
