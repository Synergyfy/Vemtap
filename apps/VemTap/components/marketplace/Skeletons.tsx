import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
    return (
        <div className="flex flex-col space-y-3">
            <Skeleton className="h-[250px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    )
}

export function ProductDetailSkeleton() {
    return (
        <div className="animate-pulse space-y-8 vemtap-container py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7 space-y-4">
                    <Skeleton className="aspect-square w-full rounded-2xl" />
                    <div className="grid grid-cols-4 gap-4">
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="aspect-square rounded-xl" />
                    </div>
                </div>
                <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-64 rounded-xl" />
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <Skeleton className="h-12 w-32 rounded-lg" />
                            <Skeleton className="h-12 flex-1 rounded-lg" />
                        </div>
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                </div>
            </div>
            <div className="mt-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}
