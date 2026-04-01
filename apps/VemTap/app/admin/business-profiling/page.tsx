'use client';

import React, { useState, useEffect } from 'react';
import { 
    ClipboardList, 
    Plus, 
    Search, 
    ChevronRight,
    TrendingUp, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    Building2,
    MapPin,
    ArrowLeft,
    Download,
    Trash2,
    X,
    Zap,
    LayoutDashboard,
    Files
} from 'lucide-react';
import { businessProfilingApi, BusinessProfile, BusinessProfileFormData } from '@/lib/api/business-profiling';
import { notify } from '@/lib/notify';

// --- Sub-components (could be moved to separate files later) ---

const OverviewTab = ({ stats, recentProfiles, onView }: any) => {
    const statCards = [
        { label: 'Total Profiles', value: stats.total, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'High Priority', value: stats.high, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        { label: 'Medium Priority', value: stats.medium, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Low Priority', value: stats.low, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={card.color} size={24} />
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">{card.label}</p>
                        <h3 className="text-2xl font-bold text-text-main">{card.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Profiles */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-text-main flex items-center gap-2">
                             Recent Profiles
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-500 text-xs font-black uppercase tracking-widest px-4">
                                    <th className="px-6 py-4">Business</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentProfiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No profiles yet</td>
                                    </tr>
                                ) : (
                                    recentProfiles.map((p: BusinessProfile) => (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-text-main text-sm">{p.businessName}</div>
                                                <div className="text-xs text-gray-400 capitalize">{p.businessType}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    p.priority === 'High' ? 'bg-red-50 text-red-600' :
                                                    p.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                                }`}>
                                                    {p.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    p.status === 'Closed' ? 'bg-green-100 text-green-700' :
                                                    p.status === 'Interested' ? 'bg-blue-100 text-blue-700' :
                                                    p.status === 'Contacted' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => onView(p.id)}
                                                    className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Status Summary (Simple Bars) */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-text-main mb-6">Status Summary</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Not Contacted', value: stats.notContacted, color: 'bg-gray-200' },
                            { label: 'Contacted', value: stats.contacted, color: 'bg-primary' },
                            { label: 'Interested', value: stats.interested, color: 'bg-blue-500' },
                            { label: 'Closed', value: stats.closed, color: 'bg-green-500' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-gray-500 uppercase tracking-wider">{item.label}</span>
                                    <span className="font-black text-text-main">{item.value}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${item.color}`} 
                                        style={{ width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : '0%' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface FilterState {
    search: string;
    priority: string;
    status: string;
}

const ListTab = ({ profiles, filters, setFilters, onView, onUpdateStatus, onDelete }: any) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search business, location..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={filters.search}
                        onChange={(e) => setFilters((prev: FilterState) => ({ ...prev, search: e.target.value }))}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select 
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-600 flex-1 md:w-40"
                        value={filters.priority}
                        onChange={(e) => setFilters((prev: FilterState) => ({ ...prev, priority: e.target.value }))}
                    >
                        <option value="">Priority (All)</option>
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                    </select>
                    <select 
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-600 flex-1 md:w-40"
                        value={filters.status}
                        onChange={(e) => setFilters((prev: FilterState) => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">Status (All)</option>
                        <option value="Not Contacted">Not Contacted</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Interested">Interested</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Business</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Score</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Building2 size={40} className="text-gray-200" />
                                            <p className="font-medium">No results found matching your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                profiles.map((p: BusinessProfile) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-[10px] font-mono text-gray-400 capitalize whitespace-nowrap">
                                            {p.id.split('_').pop()?.substr(0, 6)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-text-main text-sm">{p.businessName}</div>
                                            <div className="text-xs text-gray-400">{p.contactPerson}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin size={12} />
                                                {p.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-600 capitalize">{p.businessType}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                p.priority === 'High' ? 'bg-red-50 text-red-600' :
                                                p.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                                {p.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select 
                                                className={`text-[10px] font-black uppercase px-2 py-1 rounded border-0 focus:ring-0 cursor-pointer ${
                                                    p.status === 'Closed' ? 'bg-green-50 text-green-700' :
                                                    p.status === 'Interested' ? 'bg-blue-50 text-blue-700' :
                                                    p.status === 'Contacted' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'
                                                }`}
                                                value={p.status}
                                                onChange={(e) => onUpdateStatus(p.id, e.target.value)}
                                            >
                                                <option value="Not Contacted">Not Contacted</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="Interested">Interested</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-black text-primary border border-primary/10">
                                                    {p.score}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button 
                                                    onClick={() => onView(p.id)}
                                                    className="px-4 py-1.5 bg-gray-50 text-text-main text-xs font-black uppercase tracking-wider rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                                                >
                                                    View
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(p.id, p.businessName)}
                                                    className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Delete profile"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const NewProfileTab = ({ onSave }: any) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<BusinessProfileFormData>({
        businessName: '',
        contactPerson: '',
        phone: '',
        email: '',
        location: '',
        businessType: 'Restaurant',
        estimatedFootTraffic: 'Medium',
        operatingHours: '9AM - 9PM',
        hasWifi: false,
        hasCounterSpace: false,
        hasWindowDisplay: false,
        hasTableSetup: false,
        hasDigitalMenu: false,
        qrPlacement: [],
        currentPaymentMethods: ['Cash'],
        currentMarketingChannels: [],
        painPoints: [],
        competitorInfo: '',
        notes: '',
        priority: 'Medium',
        status: 'Not Contacted',
        createdBy: 'Admin', // In real app, from auth state
    });

    const handleCheckboxChange = (field: keyof BusinessProfileFormData, value: string) => {
        const current = formData[field] as string[];
        if (current.includes(value)) {
            setFormData({ ...formData, [field]: current.filter(v => v !== value) });
        } else {
            setFormData({ ...formData, [field]: [...current, value] });
        }
    };

    const sections = [
        { id: 1, title: 'Basic Info', icon: Building2 },
        { id: 2, title: 'Physical Setup', icon: MapPin },
        { id: 3, title: 'Strategy & Notes', icon: TrendingUp }
    ];

    return (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
            {/* Step Indicator */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 flex justify-around">
                {sections.map((s) => (
                    <button 
                        key={s.id}
                        onClick={() => setStep(s.id)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${
                            step === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        <s.icon size={18} />
                        <span className="text-sm font-bold">{s.title}</span>
                    </button>
                ))}
            </div>

            {/* Form Sections */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-24 min-h-[500px]">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-bold text-text-main mb-6">Contact & Business Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Business Name</label>
                                <input 
                                    type="text" required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Enter business name"
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Contact Person</label>
                                <input 
                                    type="text" required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Full name"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Phone Number</label>
                                <input 
                                    type="tel"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="+234..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Email Address</label>
                                <input 
                                    type="email"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="contact@business.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Location/Area</label>
                                <input 
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="e.g. Wuse 2, Abuja"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Priority Level</label>
                                <select 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                >
                                    <option value="High">🔴 High Priority</option>
                                    <option value="Medium">🟠 Medium Priority</option>
                                    <option value="Low">🟢 Low Priority</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Amenities & Assets</label>
                                <div className="space-y-3">
                                    {[
                                        { field: 'hasWifi', label: 'Guest WiFi' },
                                        { field: 'hasCounterSpace', label: 'Counter Space' },
                                        { field: 'hasWindowDisplay', label: 'Window Display' },
                                        { field: 'hasTableSetup', label: 'Dinning Tables' },
                                        { field: 'hasDigitalMenu', label: 'Digital Menu' }
                                    ].map((item) => (
                                        <label key={item.field} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData[item.field as keyof BusinessProfileFormData] ? 'bg-primary border-primary' : 'bg-gray-100 border-gray-200'}`}>
                                                {formData[item.field as keyof BusinessProfileFormData] && <CheckCircle2 size={14} className="text-white" />}
                                            </div>
                                            <input 
                                                type="checkbox" className="hidden"
                                                checked={!!formData[item.field as keyof BusinessProfileFormData]}
                                                onChange={(e) => setFormData({ ...formData, [item.field]: e.target.checked })}
                                            />
                                            <span className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">QR Placement Ideas</label>
                                <div className="space-y-3">
                                    {['Entrance Door', 'Ordering Counter', 'Each Table', 'Restroom Mirror', 'Receipt Wrap', 'Staff Aprons'].map((loc) => (
                                        <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.qrPlacement.includes(loc) ? 'bg-primary border-primary' : 'bg-gray-100 border-gray-200'}`}>
                                                {formData.qrPlacement.includes(loc) && <CheckCircle2 size={14} className="text-white" />}
                                            </div>
                                            <input 
                                                type="checkbox" className="hidden"
                                                checked={formData.qrPlacement.includes(loc)}
                                                onChange={() => handleCheckboxChange('qrPlacement', loc)}
                                            />
                                            <span className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">{loc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Est. Daily Traffic</label>
                                    <select 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                                        value={formData.estimatedFootTraffic}
                                        onChange={(e) => setFormData({ ...formData, estimatedFootTraffic: e.target.value as any })}
                                    >
                                        <option value="High">High (&gt; 100/day)</option>
                                        <option value="Medium">Medium (30-100/day)</option>
                                        <option value="Low">Low (&lt; 30/day)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Business Type</label>
                                    <select 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                                        value={formData.businessType}
                                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                    >
                                        <option>Restaurant</option>
                                        <option>Retail Shop</option>
                                        <option>Salon & Spa</option>
                                        <option>Medical/Clinic</option>
                                        <option>Supermarket</option>
                                        <option>Other Service</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Current Pain Points</label>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {['Slow Checkout', 'Peak Hour Queue', 'No Customer Data', 'Manual Menu', 'Low Return Rate', 'High Paper Waste'].map((point) => (
                                            <button 
                                                key={point}
                                                type="button"
                                                onClick={() => handleCheckboxChange('painPoints', point)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                                    formData.painPoints.includes(point) ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-primary/30'
                                                }`}
                                            >
                                                {point}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Current Marketing</label>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {['Instagram', 'Whastapp Status', 'Flyers', 'Billboards', 'Radio', 'None'].map((chan) => (
                                            <button 
                                                key={chan}
                                                type="button"
                                                onClick={() => handleCheckboxChange('currentMarketingChannels', chan)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                                    formData.currentMarketingChannels.includes(chan) ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-primary/20'
                                                }`}
                                            >
                                                {chan}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">General Notes</label>
                                    <textarea 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px]"
                                        placeholder="Internal notes about the business or owner..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Competitors Nearby</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Who else is in the area?"
                                        value={formData.competitorInfo}
                                        onChange={(e) => setFormData({ ...formData, competitorInfo: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Form Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-40 flex justify-between items-center px-10">
                <p className="text-xs text-gray-400 font-bold hidden md:block">
                    {step === 1 ? 'Step 1: Contact Details' : step === 2 ? 'Step 2: Operations & Assets' : 'Step 3: Strategy'}
                </p>
                <div className="flex gap-4 w-full md:w-auto">
                    {step > 1 ? (
                        <button 
                            onClick={() => setStep(step - 1)}
                            className="flex-1 md:w-32 py-3 bg-gray-50 text-text-main font-black uppercase tracking-widest text-[10px] rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                        >
                            Back
                        </button>
                    ) : (
                        <div className="hidden md:block w-32"></div>
                    )}
                    
                    {step < 3 ? (
                        <button 
                            onClick={() => setStep(step + 1)}
                            className="flex-1 md:w-48 py-3 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
                        >
                            Next Step <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => onSave(formData)}
                            className="flex-1 md:w-64 py-3 bg-green-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                        >
                            Save & Generate Insights <CheckCircle2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Profile Detail / Insights Sub-page ---
const ProfileDetail = ({ profileId, onBack }: { profileId: string, onBack: () => void }) => {
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [activeTab, setActiveTab] = useState('insights');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const loadProfile = async () => {
        const data = await businessProfilingApi.getById(profileId);
        setProfile(data);
    };

    useEffect(() => {
        loadProfile();
    }, [profileId]);

    const handleStatusUpdate = async (newStatus: BusinessProfile['status']) => {
        if (!profile) return;
        setUpdatingStatus(true);
        try {
            await businessProfilingApi.updateStatus(profile.id, newStatus);
            await loadProfile();
            notify.success(`Status updated to ${newStatus}`);
            setShowStatusModal(false);
        } catch {
            notify.error('Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (!profile) return <div className="p-20 text-center animate-pulse">Loading profile data...</div>;

    return (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-2 bg-white rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">{profile.businessName}</h1>
                        <p className="text-sm text-gray-400 font-medium">Profile detail & sales insights</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-text-main text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all">
                        <Download size={16} /> PDF
                    </button>
                    <button 
                        onClick={() => setShowStatusModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                    >
                         Update Status
                    </button>
                </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in-95">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-text-main text-lg">Update Status</h3>
                            <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500">Current: <span className="font-bold text-text-main">{profile.status}</span></p>
                        <div className="space-y-3">
                            {(['Not Contacted', 'Contacted', 'Interested', 'Closed'] as const).map((s) => (
                                <button
                                    key={s}
                                    disabled={updatingStatus || s === profile.status}
                                    onClick={() => handleStatusUpdate(s)}
                                    className={`w-full py-3 px-5 rounded-xl text-sm font-black uppercase tracking-wider transition-all border ${
                                        s === profile.status
                                            ? 'bg-primary text-white border-primary shadow-lg cursor-default'
                                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-primary/5 hover:border-primary/20 hover:text-primary'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Top Score/Package Highlight */}
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-2 border-r border-white/10 pr-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Opportunity Score</p>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black">{profile.score}</span>
                            <span className="text-lg font-bold text-white/50 mb-1">/ 20</span>
                        </div>
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Pitch Summary</p>
                        <p className="text-sm font-medium leading-relaxed italic border-l-2 border-white/20 pl-4">
                            &ldquo;{profile.pitchSummary}&rdquo;
                        </p>
                    </div>
                    <div className="flex justify-center md:justify-end items-center">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[140px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Package</p>
                            <span className="text-sm font-black whitespace-nowrap">{profile.suggestedPackage}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Tabs */}
            <div className="flex gap-4 border-b border-gray-100 overflow-x-auto no-scrollbar">
                {[
                    { id: 'insights', label: 'Sales Insights', icon: TrendingUp },
                    { id: 'details', label: 'Form Details', icon: Files },
                    { id: 'notes', label: 'Notes', icon: ClipboardList }
                ].map((t) => (
                    <button 
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                            activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-text-main'
                        }`}
                    >
                        <t.icon size={18} />
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'insights' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <CheckCircle2 className="text-green-500" size={20} />
                                Expert Recommendations
                            </h3>
                            <div className="space-y-4">
                                {profile.recommendations.map((rec, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-green-600 group-hover:text-white transition-all">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-gray-600 font-medium py-1">{rec}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <AlertCircle className="text-orange-500" size={20} />
                                Identified Pain Points
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.painPoints.length > 0 ? profile.painPoints.map((p, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-full">
                                        {p}
                                    </span>
                                )) : <p className="text-sm text-gray-400">No specific pain points identified.</p>}
                            </div>

                            <hr className="border-gray-50" />
                            
                            <h3 className="font-bold text-text-main pt-2">Recommended Placments</h3>
                            <div className="space-y-3">
                                {profile.qrPlacement.map((p, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                        {p}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-in fade-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            <div className="space-y-6">
                                <section className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b pb-1">Operational Info</h4>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Foot Traffic</p>
                                        <p className="font-bold text-text-main">{profile.estimatedFootTraffic}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Hours</p>
                                        <p className="font-bold text-text-main">{profile.operatingHours}</p>
                                    </div>
                                </section>
                            </div>
                            <div className="space-y-6">
                                <section className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b pb-1">Features Check</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { l: 'Guest WiFi', v: profile.hasWifi },
                                            { l: 'Tables', v: profile.hasTableSetup },
                                            { l: 'Counter', v: profile.hasCounterSpace },
                                            { l: 'Window', v: profile.hasWindowDisplay },
                                            { l: 'Digital Menu', v: profile.hasDigitalMenu }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                {item.v ? <CheckCircle2 size={16} className="text-green-500" /> : <Clock size={16} className="text-gray-200" />}
                                                <span className={`text-sm ${item.v ? 'font-bold text-text-main' : 'text-gray-300'}`}>{item.l}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                            <div className="space-y-6">
                                <section className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b pb-1">Engagement</h4>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Current Marketing</p>
                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {profile.currentMarketingChannels.map((c, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold rounded-full border border-gray-100">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-in fade-in slide-in-from-top-4 max-w-2xl">
                        <div className="space-y-6">
                            <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                                <h3 className="text-yellow-800 font-bold mb-2 flex items-center gap-2">
                                    <ClipboardList size={20} /> Profiling Notes
                                </h3>
                                <p className="text-sm text-yellow-900/70 leading-relaxed italic font-medium">
                                    "{profile.notes || 'No specific notes added yet.'}"
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Nearby Competition</h4>
                                <p className="text-sm font-bold text-text-main hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-2">
                                    <Building2 size={16} /> {profile.competitorInfo || 'None documented'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Page Component ---
export default function BusinessProfilingPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
    const [stats, setStats] = useState<any>({ total: 0, high: 0, medium: 0, low: 0, notContacted: 0, contacted: 0, interested: 0, closed: 0 });
    const [filters, setFilters] = useState({ search: '', priority: '', status: '' });
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await businessProfilingApi.getAll(filters);
            const statsData = await businessProfilingApi.getStats();
            setProfiles(data.data);
            setStats(statsData);
        } catch (error) {
            notify.error('Failed to load profiling data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters, activeTab]);

    const handleSave = async (data: BusinessProfileFormData) => {
        try {
            const newProfile = await businessProfilingApi.create(data);
            notify.success('Business Profile created & scored!');
            setSelectedProfileId(newProfile.id);
            setActiveTab('detail');
        } catch (error) {
            notify.error('Failed to create profile');
        }
    };

    const handleUpdateStatus = async (id: string, status: any) => {
        await businessProfilingApi.updateStatus(id, status);
        fetchData();
        notify.success(`Status updated to ${status}`);
    };

    const handleDeleteRequest = (id: string, name: string) => {
        setDeleteConfirm({ id, name });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        try {
            await businessProfilingApi.delete(deleteConfirm.id);
            notify.success(`"${deleteConfirm.name}" deleted successfully`);
            setDeleteConfirm(null);
            fetchData();
        } catch {
            notify.error('Failed to delete profile');
        }
    };

    const handleView = (id: string) => {
        setSelectedProfileId(id);
        setActiveTab('detail');
    };

    if (activeTab === 'detail' && selectedProfileId) {
        return (
            <div className="p-4 md:p-10 bg-gray-50/50 min-h-screen">
                <ProfileDetail profileId={selectedProfileId} onBack={() => setActiveTab('all')} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 bg-gray-50/50 min-h-screen space-y-8">
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in-95">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                            <Trash2 size={28} className="text-red-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="font-bold text-text-main text-lg">Delete Profile?</h3>
                            <p className="text-sm text-gray-500">This will permanently delete <span className="font-bold text-text-main">&ldquo;{deleteConfirm.name}&rdquo;</span>. This action cannot be undone.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-3 bg-gray-50 text-text-main font-black uppercase tracking-widest text-[10px] rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 py-3 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-text-main">Business Profiling</h1>
                    <p className="text-gray-500 font-medium">Pre-approach scoping & scoring system</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 self-start">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'all', label: 'All Profiles', icon: Files },
                        { id: 'new', label: 'New Profile', icon: Plus }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon size={18} />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="pb-20">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Loading Analytics</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <OverviewTab 
                                stats={stats} 
                                recentProfiles={profiles.slice(0, 5)} 
                                onView={handleView}
                            />
                        )}
                        {activeTab === 'all' && (
                            <ListTab 
                                profiles={profiles} 
                                filters={filters} 
                                setFilters={setFilters} 
                                onView={handleView}
                                onUpdateStatus={handleUpdateStatus}
                                onDelete={handleDeleteRequest}
                            />
                        )}
                        {activeTab === 'new' && (
                            <NewProfileTab onSave={handleSave} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
