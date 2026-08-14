'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { Plus, Edit2, Trash2, Search, ShoppingBag, Gift, Users } from 'lucide-react';
import { 
    useCatalogueOffersAdmin, 
    useDeleteCatalogueOffer, 
    CatalogueOffer 
} from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import toast from 'react-hot-toast';
import OfferModal from '@/components/dashboard/catalogue/OfferModal';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';
import UsageIndicator from '@/components/dashboard/UsageIndicator';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { Tag } from 'lucide-react';

export default function OffersPage() {
    const { activeBranchId } = useActiveBranch();
    const { capabilities } = useSubscriptionStore();
    const [searchQuery, setSearchQuery] = useState('');
    
    const { data: offers = [], isLoading } = useCatalogueOffersAdmin({ 
        branchId: activeBranchId || undefined 
    });
    
    const deleteMutation = useDeleteCatalogueOffer();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOffer, setSelectedProduct] = useState<CatalogueOffer | null>(null);

    const handleEdit = (e: React.MouseEvent, offer: CatalogueOffer) => {
        e.stopPropagation();
        setSelectedProduct(offer);
        setIsModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this offer?')) {
            try {
                await deleteMutation.mutateAsync(id);
                toast.success('Offer deleted successfully');
            } catch (error) {
                toast.error('Failed to delete offer');
            }
        }
    };

    const handleAdd = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': 
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 w-fit">ACTIVE</span>;
            case 'inactive': 
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 w-fit">INACTIVE</span>;
            default: 
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-semibold uppercase tracking-wider w-fit">{status.toUpperCase()}</span>;
        }
    };

    const filteredOffers = offers.filter(o => 
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns: Column<CatalogueOffer>[] = [
        {
            header: 'Offer',
            accessor: (offer: CatalogueOffer) => (
                <div className="flex items-center gap-3">
                    {offer.mainImage ? (
                        <img src={offer.mainImage} alt={offer.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                            <ShoppingBag size={20} />
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-text-main">{offer.name}</p>
                        <p className="text-[10px] text-text-secondary line-clamp-1 max-w-[200px]">{offer.description}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Price',
            accessor: (offer: CatalogueOffer) => (
                <div className="flex flex-col">
                    <span className="font-bold text-primary text-sm">₦{Number(offer.calculatedPrice).toLocaleString()}</span>
                    <span className="text-[10px] text-text-secondary font-semibold uppercase">{offer.pricingType.replace('_', ' ')}</span>
                </div>
            )
        },
        {
            header: 'Items',
            accessor: (offer: CatalogueOffer) => (
                <div className="flex -space-x-2 overflow-hidden">
                    {offer.items?.slice(0, 3).map((item, idx) => (
                        <div key={item.id} className="inline-block size-7 rounded-full ring-2 ring-white overflow-hidden bg-gray-100 border border-gray-200" title={item.name}>
                            {item.mainImage ? (
                                <img src={item.mainImage} alt={item.name} className="size-full object-cover" />
                            ) : (
                                <div className="size-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                                    {item.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    ))}
                    {(offer.items?.length || 0) > 3 && (
                        <div className="inline-flex items-center justify-center size-7 rounded-full ring-2 ring-white bg-gray-50 text-[10px] font-bold text-text-secondary border border-gray-200">
                            +{(offer.items?.length || 0) - 3}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Stock',
            accessor: (offer: CatalogueOffer) => (
                <span className={`text-xs font-bold ${(offer.quantity ?? 0) <= 5 && offer.quantity !== null ? 'text-red-500' : 'text-text-main'}`}>
                    {offer.quantity === null ? 'Unlimited' : `${offer.quantity} Left`}
                </span>
            )
        },
        {
            header: 'Points',
            accessor: (offer: CatalogueOffer) => (
                <div className="flex items-center gap-1.5">
                    <div className="size-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <Users size={10} />
                    </div>
                    <span className="text-xs font-bold text-text-main">{offer.loyaltyPoints || 0} pts</span>
                </div>
            )
        },
        {
            header: 'Reward',
            accessor: (offer: CatalogueOffer) => offer.reward ? (
                <div className="flex items-center gap-2.5">
                    <div className="relative size-8 rounded-full overflow-hidden border border-emerald-100 bg-emerald-50 shrink-0">
                        {offer.reward.imageUrl ? (
                            <img src={offer.reward.imageUrl} alt={offer.reward.name} className="size-full object-cover" />
                        ) : (
                            <div className="size-full flex items-center justify-center text-emerald-600">
                                <Gift size={14} />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-emerald-700 truncate max-w-[120px] uppercase tracking-tight leading-none mb-1">
                            {offer.reward.name}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-500 uppercase">
                            <Users size={8} />
                            <span>{offer.reward.pointCost || 0} pts</span>
                        </div>
                    </div>
                </div>
            ) : (
                <span className="text-[10px] text-text-secondary font-medium italic opacity-60">None</span>
            )
        },
        {
            header: 'Status',
            accessor: (offer: CatalogueOffer) => getStatusBadge(offer.status)
        },
        {
            header: 'Actions',
            accessor: (offer: CatalogueOffer) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => handleEdit(e, offer)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all cursor-pointer"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={(e) => handleDelete(e, offer.id)}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <PageLockWrapper feature="catalogue" featureName="Catalogue">
            <div className="p-4 md:p-8">
                <div className="mb-6">
                    <UsageIndicator
                        label="Offers Limit"
                        usage={capabilities?.capabilities?.catalogueOffers}
                        icon={<Gift size={18} />}
                    />
                </div>

                <PageHeader
                title="Bundle Offers"
                description="Create and manage item bundles with special pricing and rewards"
                actions={
                    <button 
                        onClick={handleAdd} 
                        className="flex items-center gap-2 h-10 px-5 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-hover transition-all shadow-sm shadow-primary/20 cursor-pointer"
                    >
                        <Plus size={16} />
                        New Offer
                    </button>
                }
            />

            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search offers..."
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredOffers}
                isLoading={isLoading}
                emptyState={
                    <EmptyState
                        icon="shopping-bag"
                        title="Your first offer is waiting — create a deal to attract customers"
                        description="Start bundling items to drive more sales and engagement."
                    />
                }
            />

            <OfferModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                offer={selectedOffer}
                activeBranchId={activeBranchId || undefined}
            />
        </div>
        </PageLockWrapper>
    );
}
