'use client';

import React, { useState, useCallback } from 'react';
import { X, Globe, Map as MapIcon, Store, Building2, Layers, Save, Loader2, MapPin, RotateCcw, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { adminClustersApi } from '@/lib/api/clusters';
import type { Cluster, ClusterType, CreateClusterDto } from '@/lib/api/clusters';
import { LocationAutocomplete, type NominatimResult } from './LocationAutocomplete';
import ClusterMap from './ClusterMap';

interface ClusterFormModalProps {
    open: boolean;
    cluster: Cluster | null;
    clusters: Cluster[];
    onClose: () => void;
    onSaved: () => void;
}

const TYPE_OPTIONS: { value: ClusterType; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }>; description: string; radiusM: number | null }[] = [
    { value: 'country', label: 'Country', icon: Globe, description: 'National deal collection.', radiusM: 200000 },
    { value: 'state', label: 'State', icon: MapIcon, description: 'A state or region within a country.', radiusM: 50000 },
    { value: 'market', label: 'Market', icon: Store, description: 'A district, estate or market area.', radiusM: 10000 },
    { value: 'building', label: 'Building', icon: Building2, description: 'A mall, complex or single building.', radiusM: 500 },
    { value: 'custom', label: 'Custom', icon: Layers, description: 'Any other custom grouping.', radiusM: 2000 },
];

const RADIUS_PRESETS = [500, 1000, 2000, 5000, 10000, 50000];

const emptyForm = (): CreateClusterDto => ({
    name: '',
    description: '',
    type: 'market',
    parentId: null,
    country: '',
    state: '',
    city: '',
    area: '',
    latitude: null,
    longitude: null,
    radiusM: null,
    isActive: true,
});

const fromCluster = (cluster: Cluster): CreateClusterDto => ({
    name: cluster.name,
    description: cluster.description || '',
    type: cluster.type,
    parentId: cluster.parentId ?? null,
    country: cluster.country || '',
    state: cluster.state || '',
    city: cluster.city || '',
    area: cluster.area || '',
    latitude: cluster.latitude ?? null,
    longitude: cluster.longitude ?? null,
    radiusM: cluster.radiusM ?? null,
    isActive: cluster.isActive,
});

/** Pull the most relevant text component for each level out of a Nominatim result. */
function extractComponents(place: NominatimResult) {
    const addr = place?.address || {};
    const country = addr.country || '';
    const state = addr.state || addr.region || '';
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const area = addr.suburb || addr.neighbourhood || addr.hamlet || addr.quarter || '';
    return { country, state, city, area };
}

export default function ClusterFormModal({ open, cluster, clusters, onClose, onSaved }: ClusterFormModalProps) {
    const [form, setForm] = useState<CreateClusterDto>(() => (cluster ? fromCluster(cluster) : emptyForm()));
    const [saving, setSaving] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const [locating, setLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const set = useCallback((patch: Partial<CreateClusterDto>) => {
        setForm(prev => ({ ...prev, ...patch }));
    }, []);

    const applyPlace = useCallback((place: NominatimResult) => {
        const comps = extractComponents(place);
        const lat = Number(place.lat);
        const lng = Number(place.lon);
        const patch: Partial<CreateClusterDto> = { ...comps };
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            patch.latitude = Number(lat.toFixed(6));
            patch.longitude = Number(lng.toFixed(6));
        }
        if (form.radiusM == null) {
            const typeDefault = TYPE_OPTIONS.find(o => o.value === form.type)?.radiusM ?? 2000;
            patch.radiusM = typeDefault;
        }
        set(patch);
    }, [form.radiusM, form.type, set]);

    const handleMarkerDrag = useCallback((lat: number, lng: number) => {
        set({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
    }, [set]);

    const handleUseMyLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported on this device');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                set({
                    latitude: Number(pos.coords.latitude.toFixed(6)),
                    longitude: Number(pos.coords.longitude.toFixed(6)),
                    radiusM: form.radiusM ?? 2000,
                });
                setLocating(false);
                toast.success('Pin dropped at your current location');
            },
            () => {
                setLocating(false);
                toast.error('Could not get your location — check permissions');
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }, [form.radiusM, set]);

    const handleResetLocation = useCallback(() => {
        set({ latitude: null, longitude: null, radiusM: null, country: '', state: '', city: '', area: '' });
        setMapKey(prev => prev + 1);
    }, [set]);

    const parentCandidates = clusters.filter(c => c.id !== cluster?.id);

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Please enter a cluster name');
            return;
        }
        if (form.latitude == null || form.longitude == null) {
            toast.error('Set a location on the map (search a place or drop a pin)');
            return;
        }
        setSaving(true);
        try {
            if (cluster) {
                await adminClustersApi.update(cluster.id, form);
                toast.success('Cluster updated');
            } else {
                await adminClustersApi.create(form);
                toast.success('Cluster created');
            }
            onSaved();
            onClose();
        } catch {
            toast.error('Failed to save cluster');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    const hasPin = form.latitude != null && form.longitude != null;
    const currentRadius = form.radiusM ?? 0;

    const inputClass = "w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                >
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                        <div>
                            <h3 className="font-display font-bold text-lg text-text-main">
                                {cluster ? 'Edit Cluster' : 'Create Cluster'}
                            </h3>
                            <p className="text-xs text-text-secondary font-medium">
                                {cluster ? cluster.name : 'Group businesses by location for deal collections.'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>Cluster Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => set({ name: e.target.value })}
                                    placeholder="e.g. Lekki Phase 1, Victoria Island, Ikeja City Mall"
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>Cluster Type</label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {TYPE_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        const isActive = form.type === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => set({ type: opt.value, radiusM: opt.radiusM })}
                                                title={opt.description}
                                                className={cn(
                                                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                                                    isActive
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                                )}
                                            >
                                                <Icon size={18} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>Parent Cluster (Optional)</label>
                                <select
                                    value={form.parentId || ''}
                                    onChange={(e) => set({ parentId: e.target.value || null })}
                                    className={cn(inputClass, "appearance-none")}
                                >
                                    <option value="">None — top-level cluster</option>
                                    {parentCandidates.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* ===================== LOCATION ===================== */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className={labelClass}>
                                        <MapPin size={11} className="inline" /> Location
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleResetLocation}
                                        className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <RotateCcw size={10} /> Reset
                                    </button>
                                </div>

                                {/* One search box to rule them all */}
                                <div className="space-y-1.5">
                                    <label className={labelClass}>Search a place</label>
                                    <LocationAutocomplete
                                        label=""
                                        showLabel={false}
                                        value={searchQuery}
                                        onChange={(v, place) => {
                                            setSearchQuery(v);
                                            if (place) {
                                                applyPlace(place);
                                                setSearchQuery('');
                                            }
                                        }}
                                        placeholder="Search country, state, city or area… e.g. 'Lekki Phase 1'"
                                        type="area"
                                        countryRestrict="ng"
                                        icon={<MapPin size={16} />}
                                    />
                                </div>

                                {/* Fine-grained cascading fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <LocationAutocomplete
                                        label="Country"
                                        value={form.country || ''}
                                        onChange={(v, place) => { set({ country: v }); if (place) applyPlace(place); }}
                                        placeholder="e.g. Nigeria"
                                        type="country"
                                        className="flex-1"
                                    />
                                    <LocationAutocomplete
                                        label="State"
                                        value={form.state || ''}
                                        onChange={(v, place) => { set({ state: v }); if (place) applyPlace(place); }}
                                        placeholder="e.g. Lagos"
                                        type="state"
                                        countryRestrict="ng"
                                        className="flex-1"
                                    />
                                    <LocationAutocomplete
                                        label="City / LGA"
                                        value={form.city || ''}
                                        onChange={(v, place) => { set({ city: v }); if (place) applyPlace(place); }}
                                        placeholder="e.g. Eti-Osa"
                                        type="city"
                                        countryRestrict="ng"
                                        className="flex-1"
                                    />
                                    <LocationAutocomplete
                                        label="Area / Building"
                                        value={form.area || ''}
                                        onChange={(v, place) => { set({ area: v }); if (place) applyPlace(place); }}
                                        placeholder="e.g. Lekki Phase 1"
                                        type="area"
                                        countryRestrict="ng"
                                        className="flex-1"
                                    />
                                </div>

                                {/* Map with draggable pin + radius */}
                                <div className="relative h-56 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                    <ClusterMap
                                        key={mapKey}
                                        clusters={[]}
                                        selectedCluster={null}
                                        onSelectCluster={() => {}}
                                        center={hasPin ? { lat: form.latitude!, lng: form.longitude! } : undefined}
                                        markerPosition={hasPin ? { lat: form.latitude!, lng: form.longitude! } : undefined}
                                        radiusMeters={form.radiusM}
                                        onMarkerDrag={handleMarkerDrag}
                                    />

                                    {/* Search-on-map hint */}
                                    {!hasPin && (
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur rounded-lg px-3 py-1.5 text-[10px] font-bold text-gray-500 shadow flex items-center gap-1.5 whitespace-nowrap">
                                            <MapPin size={11} className="text-primary" />
                                            Search a place above, or use my location
                                        </div>
                                    )}

                                    {/* Use my location */}
                                    {!hasPin && (
                                        <button
                                            type="button"
                                            onClick={handleUseMyLocation}
                                            disabled={locating}
                                            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur rounded-lg text-[11px] font-black text-primary shadow hover:bg-white transition-all disabled:opacity-50"
                                        >
                                            {locating ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />}
                                            {locating ? 'Locating…' : 'Use my location'}
                                        </button>
                                    )}

                                    {hasPin && (
                                        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                                            <div className="flex-1 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-[10px] font-medium text-gray-600 truncate">
                                                {form.latitude!.toFixed(5)}, {form.longitude!.toFixed(5)}
                                                {currentRadius > 0 ? ` • ${(currentRadius / 1000).toFixed(1)}km radius` : ''}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleUseMyLocation}
                                                disabled={locating}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-[10px] font-black text-primary shadow hover:bg-white transition-all disabled:opacity-50 shrink-0"
                                            >
                                                {locating ? <Loader2 size={11} className="animate-spin" /> : <LocateFixed size={11} />}
                                                {locating ? '…' : 'My location'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Radius presets */}
                                <div className="space-y-1.5">
                                    <label className={labelClass}>Coverage Radius</label>
                                    <div className="flex flex-wrap gap-2">
                                        {RADIUS_PRESETS.map(r => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => set({ radiusM: r })}
                                                className={cn(
                                                    "px-3.5 py-2 rounded-xl text-[11px] font-black transition-all border",
                                                    currentRadius === r
                                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                        : "bg-white text-gray-500 border-gray-100 hover:border-primary/30 hover:text-primary"
                                                )}
                                            >
                                                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="range"
                                        min={100}
                                        max={200000}
                                        step={100}
                                        value={currentRadius}
                                        onChange={(e) => set({ radiusM: Number(e.target.value) })}
                                        className="w-full accent-primary"
                                    />
                                    <div className="flex items-center justify-between text-[9px] font-bold text-gray-400">
                                        <span>100m</span>
                                        <span className="text-primary">{currentRadius >= 1000 ? `${(currentRadius / 1000).toFixed(1)}km` : `${currentRadius}m`}</span>
                                        <span>200km</span>
                                    </div>
                                </div>

                                <p className="text-[10px] font-medium text-text-secondary leading-snug ml-1">
                                    Drag the pin on the map to fine-tune. Auto-matching includes offers within this radius of the point.
                                </p>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>Description (Optional)</label>
                                <textarea
                                    value={form.description || ''}
                                    onChange={(e) => set({ description: e.target.value })}
                                    rows={3}
                                    placeholder="What does this cluster cover?"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                />
                            </div>

                            <div className="md:col-span-2 flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                                <div>
                                    <p className="text-sm font-black text-text-main">Active</p>
                                    <p className="text-xs text-text-secondary font-medium">Inactive clusters stop resolving scans and matching deals.</p>
                                </div>
                                <button
                                    onClick={() => set({ isActive: !form.isActive })}
                                    className={cn(
                                        "relative w-12 h-7 rounded-full transition-colors",
                                        form.isActive ? "bg-emerald-500" : "bg-gray-300"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "absolute top-1 size-5 rounded-full bg-white shadow transition-all",
                                            form.isActive ? "left-6" : "left-1"
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-gray-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {cluster ? 'Save Changes' : 'Create Cluster'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}