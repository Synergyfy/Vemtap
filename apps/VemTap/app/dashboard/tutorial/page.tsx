'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BarChart3, Users, TrendingUp, MessageSquare, Gift, Download, Settings, Zap, Calendar, PieChart, Table, Target, Bell } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';

interface Feature {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    description: string;
    details: string[];
    component?: string;
}

const features: Feature[] = [
    {
        id: 'overview',
        title: 'Dashboard Overview',
        icon: BarChart3,
        description: 'Your main business dashboard provides real-time insights into your customer engagement and business performance.',
        details: [
            'Monitor key metrics like total visitors, new customers, and repeat rates',
            'View hourly visitor activity patterns',
            'Track audience growth with returning vs new customer breakdowns',
            'Access quick actions for common tasks'
        ]
    },
    {
        id: 'stats',
        title: 'Key Statistics Cards',
        icon: TrendingUp,
        description: 'The top row displays your most important business metrics in easy-to-read cards.',
        details: [
            'Total Visitors: Shows the total number of customer visits',
            'New Customers: Displays first-time visitors this period',
            'Repeat Rate: Percentage of returning customers',
            'Average Stay Time: How long customers typically spend',
            'Each card shows trend indicators (up/down arrows) and percentage changes'
        ],
        component: 'Stats Grid'
    },
    {
        id: 'activity-chart',
        title: 'Visitor Activity Chart',
        icon: BarChart3,
        description: 'Visual representation of customer traffic throughout the day.',
        details: [
            'Hourly breakdown of visitor activity',
            'Blue bars show total visitors per hour',
            'Green portion indicates new customers',
            'Hover over bars to see exact numbers',
            'Use the dropdown to change time periods (Today, This Week, etc.)'
        ],
        component: 'Visitor Activity Chart'
    },
    {
        id: 'audience-growth',
        title: 'Audience Growth Donut',
        icon: PieChart,
        description: 'Circular chart showing the composition of your customer base.',
        details: [
            'Blue segment: Returning customers (loyal visitors)',
            'Green segment: New customers (first-time visitors)',
            'Center shows total visitor count',
            'Percentages help you understand customer retention'
        ],
        component: 'Audience Growth'
    },
    {
        id: 'quick-actions',
        title: 'Quick Actions Panel',
        icon: Zap,
        description: 'Shortcut buttons for frequently performed tasks.',
        details: [
            'New Message: Send SMS or WhatsApp messages to customers',
            'Add Device: Register new NFC devices or tablets',
            'Export Data: Download visitor data for analysis',
            'Click any action to navigate directly to that feature'
        ],
        component: 'Quick Actions'
    },
    {
        id: 'recent-visitors',
        title: 'Recent Visitors Table',
        icon: Table,
        description: 'List of your most recent customer check-ins.',
        details: [
            'Shows customer name, phone number, check-in time, and status',
            'Status badges: "New" for first-time visitors, "Returning" for repeat customers',
            'Action buttons: Send message or preview rewards',
            'Click "View All" to see complete visitor history',
            'Click on any visitor row for detailed information'
        ],
        component: 'Recent Visitors'
    },
    {
        id: 'messaging',
        title: 'Messaging Center',
        icon: MessageSquare,
        description: 'Send personalized messages to your customers.',
        details: [
            'Welcome messages for new customers',
            'Reward notifications and offers',
            'Bulk messaging campaigns',
            'Integration with SMS and WhatsApp'
        ]
    },
    {
        id: 'loyalty',
        title: 'Loyalty & Rewards',
        icon: Gift,
        description: 'Create and manage customer loyalty programs.',
        details: [
            'Set up reward tiers based on visit frequency',
            'Configure automatic rewards for milestones',
            'Track redemption rates and program effectiveness',
            'Customize reward messages and offers'
        ]
    },
    {
        id: 'analytics',
        title: 'Advanced Analytics',
        icon: BarChart3,
        description: 'Deep dive into your business data and trends.',
        details: [
            'Custom date range analysis',
            'Customer segmentation reports',
            'Peak hours and busy periods',
            'Revenue tracking and forecasting'
        ]
    },
    {
        id: 'settings',
        title: 'Settings & Configuration',
        icon: Settings,
        description: 'Customize your business profile and system preferences.',
        details: [
            'Business information and branding',
            'Branch management for multi-location businesses',
            'Device configuration and NFC setup',
            'User permissions and staff accounts'
        ]
    },
    {
        id: 'automations',
        title: 'Automation Rules',
        icon: Target,
        description: 'Set up automatic actions based on customer behavior.',
        details: [
            'Auto-send welcome messages',
            'Reward triggers for visit milestones',
            'Email notifications for important events',
            'Custom workflows for different customer types'
        ]
    },
    {
        id: 'notifications',
        title: 'Notifications',
        icon: Bell,
        description: 'Stay informed about important business events.',
        details: [
            'Real-time alerts for new customers',
            'Low device battery warnings',
            'System maintenance notifications',
            'Custom alert preferences'
        ]
    }
];

export default function TutorialDashboardPage() {
    const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set(['overview']));
    const [selectedFeature, setSelectedFeature] = useState<string>('overview');

    const toggleFeature = (featureId: string) => {
        const newExpanded = new Set(expandedFeatures);
        if (newExpanded.has(featureId)) {
            newExpanded.delete(featureId);
        } else {
            newExpanded.add(featureId);
        }
        setExpandedFeatures(newExpanded);
    };

    const selectedFeatureData = features.find(f => f.id === selectedFeature);

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Dashboard Tutorial"
                description="Learn about all the features and tools available in your business dashboard."
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar with Features List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-4">
                        <h3 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wider">Features Guide</h3>
                        <div className="space-y-2">
                            {features.map((feature) => {
                                const IconComponent = feature.icon;
                                const isExpanded = expandedFeatures.has(feature.id);
                                const isSelected = selectedFeature === feature.id;

                                return (
                                    <div key={feature.id}>
                                        <button
                                            onClick={() => {
                                                setSelectedFeature(feature.id);
                                                toggleFeature(feature.id);
                                            }}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                                                isSelected
                                                    ? 'bg-primary/10 border border-primary/20 text-primary'
                                                    : 'hover:bg-gray-50 text-text-secondary'
                                            }`}
                                        >
                                            <IconComponent size={16} />
                                            <span className="text-sm font-medium flex-1">{feature.title}</span>
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>

                                        {isExpanded && (
                                            <div className="ml-8 mt-2 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-text-secondary leading-relaxed">
                                                    {feature.description}
                                                </p>
                                                {feature.component && (
                                                    <p className="text-xs text-primary font-medium mt-2">
                                                        📍 Found in: {feature.component}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    {selectedFeatureData && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <selectedFeatureData.icon className="text-primary" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-main">{selectedFeatureData.title}</h2>
                                    <p className="text-sm text-text-secondary">{selectedFeatureData.description}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-text-main">How it works:</h3>
                                <ul className="space-y-3">
                                    {selectedFeatureData.details.map((detail, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-primary">{index + 1}</span>
                                            </div>
                                            <p className="text-sm text-text-secondary leading-relaxed">{detail}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {selectedFeatureData.component && (
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <p className="text-sm text-blue-800">
                                        <strong>💡 Tip:</strong> This feature appears in the "{selectedFeatureData.component}" section of your main dashboard.
                                        Visit <a href="/dashboard" className="underline hover:no-underline">your dashboard</a> to see it in action.
                                    </p>
                                </div>
                            )}

                            {/* Feature-specific examples or screenshots could go here */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border border-gray-200 rounded-xl">
                                    <h4 className="text-sm font-bold text-text-main mb-2">Common Use Cases</h4>
                                    <ul className="text-xs text-text-secondary space-y-1">
                                        {selectedFeatureData.id === 'stats' && (
                                            <>
                                                <li>• Monitor daily business performance</li>
                                                <li>• Track marketing campaign effectiveness</li>
                                                <li>• Identify peak business hours</li>
                                            </>
                                        )}
                                        {selectedFeatureData.id === 'activity-chart' && (
                                            <>
                                                <li>• Schedule staff during busy periods</li>
                                                <li>• Plan marketing campaigns for slow times</li>
                                                <li>• Analyze seasonal trends</li>
                                            </>
                                        )}
                                        {selectedFeatureData.id === 'messaging' && (
                                            <>
                                                <li>• Send welcome messages to new customers</li>
                                                <li>• Promote special offers and events</li>
                                                <li>• Request feedback after visits</li>
                                            </>
                                        )}
                                        {selectedFeatureData.id === 'loyalty' && (
                                            <>
                                                <li>• Reward frequent customers</li>
                                                <li>• Increase customer retention</li>
                                                <li>• Gather customer contact information</li>
                                            </>
                                        )}
                                        {!['stats', 'activity-chart', 'messaging', 'loyalty'].includes(selectedFeatureData.id) && (
                                            <li>• Feature-specific use cases coming soon</li>
                                        )}
                                    </ul>
                                </div>

                                <div className="p-4 border border-gray-200 rounded-xl">
                                    <h4 className="text-sm font-bold text-text-main mb-2">Pro Tips</h4>
                                    <ul className="text-xs text-text-secondary space-y-1">
                                        {selectedFeatureData.id === 'stats' && (
                                            <>
                                                <li>• Check trends daily to spot issues early</li>
                                                <li>• Compare periods to measure growth</li>
                                                <li>• Use data to optimize staffing</li>
                                            </>
                                        )}
                                        {selectedFeatureData.id === 'activity-chart' && (
                                            <>
                                                <li>• Look for patterns across days/weeks</li>
                                                <li>• Use data to plan inventory needs</li>
                                                <li>• Identify best times for promotions</li>
                                            </>
                                        )}
                                        {selectedFeatureData.id === 'messaging' && (
                                            <>
                                                <li>• Personalize messages with customer names</li>
                                                <li>• Time messages for maximum impact</li>
                                                <li>• A/B test different message types</li>
                                            </>
                                        )}
                                        {selectedFeatureData.id === 'loyalty' && (
                                            <>
                                                <li>• Start with simple rewards first</li>
                                                <li>• Communicate program benefits clearly</li>
                                                <li>• Track ROI of loyalty investments</li>
                                            </>
                                        )}
                                        {!['stats', 'activity-chart', 'messaging', 'loyalty'].includes(selectedFeatureData.id) && (
                                            <li>• Best practices and tips coming soon</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Navigation */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-text-main mb-4">Quick Start Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-gray-200 rounded-xl hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                            <Settings className="text-primary" size={20} />
                            <h4 className="font-bold text-text-main">Setup Your Business</h4>
                        </div>
                        <p className="text-sm text-text-secondary">Configure your business profile, add branches, and set up devices.</p>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-xl hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                            <MessageSquare className="text-primary" size={20} />
                            <h4 className="font-bold text-text-main">Send Your First Message</h4>
                        </div>
                        <p className="text-sm text-text-secondary">Create and send welcome messages to engage new customers.</p>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-xl hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                            <BarChart3 className="text-primary" size={20} />
                            <h4 className="font-bold text-text-main">Monitor Performance</h4>
                        </div>
                        <p className="text-sm text-text-secondary">Track visitor metrics and analyze business growth trends.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}