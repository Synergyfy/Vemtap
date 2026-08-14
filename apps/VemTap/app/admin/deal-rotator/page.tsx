import { redirect } from 'next/navigation';

interface DealRotatorRedirectProps {
    searchParams: Promise<{ cluster?: string }>;
}

export default async function AdminDealRotatorRedirect({ searchParams }: DealRotatorRedirectProps) {
    const { cluster } = await searchParams;
    if (cluster) {
        redirect(`/admin/clusters?cluster=${encodeURIComponent(cluster)}&view=rotation`);
    }
    redirect('/admin/clusters');
}