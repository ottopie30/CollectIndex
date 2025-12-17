import { Analytics } from '@/components/analytics/Analytics'

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Analytics />
            {children}
        </>
    )
}
