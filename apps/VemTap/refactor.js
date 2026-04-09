const fs = require('fs');
const file = 'C:/Users/PC/Desktop/Vemtap/apps/VemTap/app/admin/business-profiling/GamifiedNewProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

const strategyData = `
const CATEGORY_STRATEGY_DATA: Record<string, {
    qrPlacements: string[],
    scenarios: string[],
    painPoints: string[],
    demoItems: string[]
}> = {
    'Retail & Shops': {
        qrPlacements: ['Checkout Counter', 'Window Decal', 'Shelf Tags', 'Shopping Bags'],
        scenarios: ['Scan for discounts', 'Follow on socials', 'Product reviews'],
        painPoints: ['Low repeat buyers', 'No customer data', 'Out of stock loss', 'Weak engagement'],
        demoItems: ['Digital Catalog', 'Loyalty Points Flow', 'Feedback Form']
    },
    'Food & Hospitality': {
        qrPlacements: ['Table Stands', 'Menu Board', 'Reception Desk', 'Takeaway Bags'],
        scenarios: ['Scan for digital menu', 'Order from table', 'Leave a review'],
        painPoints: ['Long wait times', 'Menu updates cost', 'Poor order tracking', 'No loyalty'],
        demoItems: ['Scan-to-Order Flow', 'Feedback Form', 'Digital Menu']
    },
    'Beauty & Personal Care': {
        qrPlacements: ['Waiting Area Mirror', 'Reception Desk', 'Window Decal', 'Stylist Station'],
        scenarios: ['Book next appointment', 'View price list', 'Follow on Instagram'],
        painPoints: ['No-shows', 'Empty slots', 'No customer retention', 'Booking chaos'],
        demoItems: ['Booking Flow', 'Loyalty Program', 'Digital Price List']
    },
    'Health & Medical': {
        qrPlacements: ['Reception Desk', 'Waiting Area Poster', 'Appointment Cards', 'Entrance Door'],
        scenarios: ['Book follow-up', 'Fill patient details', 'View health tips'],
        painPoints: ['Long queue times', 'Patient confusion', 'Missed follow-ups', 'Manual records'],
        demoItems: ['Registration Form', 'Booking Flow', 'Patient Feedback']
    },
    'Professional Services': {
        qrPlacements: ['Reception Desk', 'Business Cards', 'Waiting Area', 'Meeting Room'],
        scenarios: ['Schedule consultation', 'View portfolio', 'Leave feedback'],
        painPoints: ['Slow response time', 'Lead drop-off', 'No referral tracking'],
        demoItems: ['Booking Flow', 'Digital Business Card', 'Lead Capture Form']
    },
    'Logistics & Transportation': {
        qrPlacements: ['Vehicle Stickers', 'Package Inserts', 'Ticket Counter', 'Waiting Lounge'],
        scenarios: ['Track package', 'Book a ride/ticket', 'Leave feedback'],
        painPoints: ['Manual tracking', 'Customer inquiries', 'No direct booking', 'Lost packages'],
        demoItems: ['Tracking Interface', 'Booking Flow', 'Feedback Form']
    },
    'Event & Entertainment': {
        qrPlacements: ['Tickets/Badges', 'Event Rollups', 'Entrance Banners', 'Tables'],
        scenarios: ['Event registration', 'View schedule', 'Live feedback'],
        painPoints: ['Slow check-in', 'No attendee data', 'Poor engagement', 'Low feedback'],
        demoItems: ['Event Registration Form', 'Digital Schedule', 'Feedback Form']
    },
    'Education & Training': {
        qrPlacements: ['Notice Board', 'Application Forms', 'Reception', 'Classroom Tables'],
        scenarios: ['Apply for course', 'View curriculum', 'Join community'],
        painPoints: ['Poor inquiry follow-up', 'Manual registration', 'Communication gaps'],
        demoItems: ['Registration Form', 'Course Catalog', 'Feedback Form']
    },
    'Agriculture & Farming': {
        qrPlacements: ['Product Packaging', 'Farm Entrance', 'Delivery Vans', 'Market Stand'],
        scenarios: ['View farm process', 'Place bulk order', 'Contact sales'],
        painPoints: ['Poor market access', 'No direct orders', 'Low trust'],
        demoItems: ['Order Form', 'Digital Catalog', 'Contact Card']
    },
    'Government & Public Services': {
        qrPlacements: ['Information Desk', 'Waiting Area Posters', 'Service Counters', 'Entrance'],
        scenarios: ['View requirements', 'Book queue ticket', 'Give feedback'],
        painPoints: ['Long queues', 'Confusion on process', 'Missing documents', 'Poor data'],
        demoItems: ['Information Portal', 'Queue Booking', 'Feedback Form']
    },
    'Religion & NGO': {
        qrPlacements: ['Offering/Donation Envelopes', 'Entrance Banner', 'Programs/Flyers', 'Seat Backs'],
        scenarios: ['Make donation', 'Register for event', 'Join small group'],
        painPoints: ['Low donations', 'Poor event turnout', 'Lost members', 'No data'],
        demoItems: ['Donation Link', 'Event Registration', 'Feedback Form']
    },
    'Technology & Digital Service': {
        qrPlacements: ['Website / Pitch Deck', 'Digital Invoices', 'Social Media Bios', 'Business Cards'],
        scenarios: ['Book discovery call', 'View portfolio', 'Submit requirement'],
        painPoints: ['Lead drop-off', 'Slow onboarding', 'No feedback loop'],
        demoItems: ['Lead Capture', 'Digital Business Card', 'Feedback Form']
    },
    'Real Estate & Property': {
        qrPlacements: ['Property Signboards', 'Flyers', 'Office Reception', 'Open House Handouts'],
        scenarios: ['View property details', 'Book viewing', 'Contact agent'],
        painPoints: ['Slow lead response', 'No property tracking', 'Low trust'],
        demoItems: ['Digital Catalog', 'Viewing Booking Form', 'Lead Capture']
    },
    'Automotive': {
        qrPlacements: ['Waiting Lounge', 'Service Center Desk', 'Vehicle Tags', 'Invoices'],
        scenarios: ['Book next service', 'View car inventory', 'Leave review'],
        painPoints: ['Missed service reminders', 'No inventory visibility', 'Slow booking'],
        demoItems: ['Service Booking', 'Digital Inventory', 'Loyalty Program']
    },
    'Construction & Home Services': {
        qrPlacements: ['Project Site Boards', 'Flyers', 'Vehicles', 'Invoices'],
        scenarios: ['Request a quote', 'View past work', 'Leave review'],
        painPoints: ['Manual quoting', 'Poor lead capture', 'No referral tracking'],
        demoItems: ['Quote Request Form', 'Digital Portfolio', 'Lead Capture']
    },
    'Finance & Financial Services': {
        qrPlacements: ['Banking Halls', 'Teller Counters', 'Flyers', 'Agent Stands (POS)'],
        scenarios: ['Open account', 'Submit loan request', 'Customer feedback'],
        painPoints: ['Long teller lines', 'Manual forms', 'Poor feedback loop'],
        demoItems: ['Account Opening Form', 'Lead Capture', 'Feedback Form']
    },
    'Other': {
        qrPlacements: ['Reception Area', 'Product Packaging', 'Flyers', 'Storefront Window'],
        scenarios: ['Learn more', 'Leave feedback', 'Contact us'],
        painPoints: ['No customer data', 'Poor engagement', 'Low repeat business', 'Manual operations'],
        demoItems: ['Digital Catalog', 'Lead Capture Form', 'Feedback Form']
    }
};

const getStrategyData = (type: string) => CATEGORY_STRATEGY_DATA[type] || CATEGORY_STRATEGY_DATA['Other'];

const PaginatedCategoryQuestions = ({ type, responses, onChange, localStep }: any) => {
    const React = require('react');
    const content = CategorySpecificQuestions({ type, responses, onChange });
    if (!content) return null;
    
    // Validate that we have a standard structure
    let children = [];
    if (content.props && content.props.children) {
        children = React.Children.toArray(content.props.children).filter((c: any) => React.isValidElement(c));
    }
    
    const totalCards = children.length;
    const cardsPerStep = Math.ceil(totalCards / 5) || 1;
    const startIndex = localStep * cardsPerStep;
    const endIndex = startIndex + cardsPerStep;
    
    const slice = children.slice(startIndex, endIndex);
    if(slice.length === 0) {
        return (
            <div className="space-y-6">
                <GameCard>
                    <div className="text-center p-8 space-y-4">
                        <span className="text-4xl text-emerald-500">✨</span>
                        <h3 className="text-xl font-black">All Done With Specifics!</h3>
                        <p className="text-gray-500 text-sm">You have answered all the targeted questions. Click continue to proceed to strategy.</p>
                    </div>
                </GameCard>
            </div>
        )
    }
    return <div className="space-y-6">{slice}</div>;
};
`;

content = content.replace("export default function GamifiedNewProfile", strategyData + "\nexport default function GamifiedNewProfile");

const newStepsRender = `
                    {/* ── STEP 3-7: Partitioned Category Specifics ── */}
                    {step >= 3 && step <= 7 && (
                        <PaginatedCategoryQuestions 
                            type={formData.businessType} 
                            responses={formData.responses} 
                            onChange={handleResponseChange} 
                            localStep={step - 3} 
                        />
                    )}

                    {/* ── STEP 8: Custom QR Strategy ── */}
                    {step === 8 && (() => {
                        const sData = getStrategyData(formData.businessType);
                        return (
                            <div className="space-y-5">
                                <GameCard>
                                    <FieldLabel label="Strategic Placements" emoji="🗺️" tooltip="Where is the best place to put QR/NFC to catch this business's target audience?" />
                                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                                        {sData.qrPlacements.map((place) => (
                                            <ChoicePill key={place} label={place} selected={formData.indoorPlacement.includes(place)} onClick={() => handleCheckboxChange('indoorPlacement', place)} />
                                        ))}
                                    </div>
                                </GameCard>
                                <GameCard>
                                    <FieldLabel label="Primary Customer Action" emoji="🎭" tooltip="What do we want the customer to do when they scan?" />
                                    <div className="space-y-3">
                                        {sData.scenarios.map((scenario) => (
                                            <motion.button
                                                key={scenario} type="button" whileTap={{ scale: 0.97 }}
                                                onClick={() => handleCheckboxChange('specialUse', scenario)}
                                                className={\`w-full p-5 rounded-2xl text-sm font-bold text-left transition-all border-2 flex items-center justify-between \${
                                                    formData.specialUse.includes(scenario) ? 'bg-primary/5 text-primary border-primary/30 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                                                }\`}
                                            >
                                                {scenario}
                                                <div className={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all \${formData.specialUse.includes(scenario) ? 'bg-primary border-primary' : 'border-gray-200'}\`}>
                                                    {formData.specialUse.includes(scenario) && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </GameCard>
                            </div>
                        );
                    })()}

                    {/* ── STEP 9: Custom Sales Plan ── */}
                    {step === 9 && (() => {
                        const sData = getStrategyData(formData.businessType);
                        return (
                            <div className="space-y-5">
                                <GameCard>
                                    <FieldLabel label="Recommended Package" emoji="📦" tooltip="Which tier fits them best?" />
                                    <div className="grid grid-cols-3 gap-3">
                                        {[{n:'Starter',e:'🌱'},{n:'Growth',e:'🚀'},{n:'Enterprise',e:'👑'}].map(({n,e}) => (
                                            <ChoicePill key={n} label={\`\${e} \${n}\`} selected={formData.suggestedPackage === n} onClick={() => setFormData({ ...formData, suggestedPackage: n as any })} />
                                        ))}
                                    </div>
                                </GameCard>
                                <GameCard>
                                    <FieldLabel label="Targeting Pain Points" emoji="🩹" tooltip="What specific problems can Vemtap solve for them?" />
                                    <div className="flex flex-wrap gap-3">
                                        {sData.painPoints.map((prob) => (
                                            <ChoicePill key={prob} label={prob} selected={formData.problemsNoticed.includes(prob)} onClick={() => handleCheckboxChange('problemsNoticed', prob)} />
                                        ))}
                                    </div>
                                </GameCard>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <GameCard>
                                        <FieldLabel label="Target Stakeholder" emoji="🎯" tooltip="Who's the decision maker?" />
                                        <div className="space-y-2">
                                            {['Owner', 'Manager', 'Dept Head'].map((p) => (
                                                <ChoicePill key={p} label={p} selected={formData.whoToSpeakTo === p} onClick={() => setFormData({ ...formData, whoToSpeakTo: p as any })} />
                                            ))}
                                        </div>
                                    </GameCard>
                                    <GameCard>
                                        <FieldLabel label="Pitch Style" emoji="🎤" tooltip="How should we approach them?" />
                                        <GameSelect value={formData.approachStyle} onChange={(e: any) => setFormData({ ...formData, approachStyle: e.target.value })}>
                                            <option>Problem-Solving (Pain first)</option><option>Demo-First (Show, don't tell)</option><option>Financial (ROI first)</option><option>Relationship (Trust first)</option>
                                        </GameSelect>
                                    </GameCard>
                                </div>
                                <GameCard>
                                    <FieldLabel label="Demo Toolkit" emoji="🧰" tooltip="What modules to show off!" />
                                    <div className="flex flex-wrap gap-2">
                                        {sData.demoItems.map((item) => (
                                            <ChoicePill key={item} label={item} selected={formData.demoItems.includes(item)} onClick={() => handleCheckboxChange('demoItems', item)} />
                                        ))}
                                    </div>
                                </GameCard>
                                <GameCard>
                                    <FieldLabel label="Custom Pitch Hook" emoji="🪝" tooltip="A personalized 1-liner to hook their attention." />
                                    <GameTextarea placeholder="e.g. 'I noticed your customers wait 20 minutes...'" value={formData.customPitch} onChange={(e: any) => setFormData({ ...formData, customPitch: e.target.value })} rows={3} />
                                </GameCard>
                            </div>
                        );
                    })()}
`;

const step3Index = content.indexOf('{/* ── STEP 3: Category Specifics ── */}');
const step10Index = content.indexOf('{/* ── STEP 10: Final Boss ── */}');

if (step3Index > -1 && step10Index > -1) {
    content = content.substring(0, step3Index) + newStepsRender + '\n\n' + content.substring(step10Index);
} else {
    console.error('Could not find step boundaries!');
    process.exit(1);
}

const oldMeta = `const STEP_META = [
    { id: 1, title: 'Who Are You?', subtitle: "Let's meet this business!", icon: Building2, emoji: '👋', phase: 'Identity', color: 'from-violet-500 to-purple-600' },
    { id: 2, title: 'Your Vibe', subtitle: 'What makes them unique?', icon: Sparkles, emoji: '✨', phase: 'Identity', color: 'from-pink-500 to-rose-600' },
    { id: 3, title: 'Category Specifics', subtitle: 'Deep dive into their world!', icon: Target, emoji: '🎯', phase: 'Identity', color: 'from-indigo-500 to-blue-600' },
    { id: 4, title: 'Your Scale', subtitle: 'How big is the operation?', icon: TrendingUp, emoji: '📊', phase: 'Identity', color: 'from-blue-500 to-cyan-600' },
    { id: 5, title: 'First Impressions', subtitle: 'What do customers see first?', icon: Target, emoji: '👀', phase: 'Operations', color: 'from-amber-500 to-orange-600' },
    { id: 6, title: 'The Setup', subtitle: 'How is the space organized?', icon: MapPin, emoji: '🏗️', phase: 'Operations', color: 'from-emerald-500 to-green-600' },
    { id: 7, title: 'Customer Flow', subtitle: 'How do people move around?', icon: Rocket, emoji: '🌊', phase: 'Operations', color: 'from-teal-500 to-cyan-600' },
    { id: 8, title: 'QR Strategy', subtitle: 'Plan the placement attack!', icon: ClipboardList, emoji: '📍', phase: 'Strategy', color: 'from-indigo-500 to-blue-600' },
    { id: 9, title: 'Sales Plan', subtitle: 'Time to strategize the pitch!', icon: TrendingUp, emoji: '🎯', phase: 'Strategy', color: 'from-red-500 to-pink-600' },
    { id: 10, title: 'Final Boss', subtitle: 'Score, review & launch!', icon: Crown, emoji: '🏆', phase: 'Review', color: 'from-yellow-500 to-amber-600' },
];`;

const newMeta = `const STEP_META = [
    { id: 1, title: 'Who Are You?', subtitle: "Let's meet this business!", icon: Building2, emoji: '👋', phase: 'Identity', color: 'from-violet-500 to-purple-600' },
    { id: 2, title: 'Your Vibe', subtitle: 'What makes them unique?', icon: Sparkles, emoji: '✨', phase: 'Identity', color: 'from-pink-500 to-rose-600' },
    { id: 3, title: 'Discovery & Scale', subtitle: 'Understanding their volume', icon: Target, emoji: '🎯', phase: 'Identity', color: 'from-indigo-500 to-blue-600' },
    { id: 4, title: 'Experience & Flow', subtitle: 'How do customers interact?', icon: Rocket, emoji: '🌊', phase: 'Operations', color: 'from-teal-500 to-cyan-600' },
    { id: 5, title: 'Sales & Retention', subtitle: 'Where are they losing out?', icon: TrendingUp, emoji: '📊', phase: 'Operations', color: 'from-red-500 to-pink-600' },
    { id: 6, title: 'Marketing & Setup', subtitle: 'Visibility and spaces', icon: MapPin, emoji: '🏗️', phase: 'Operations', color: 'from-amber-500 to-orange-600' },
    { id: 7, title: 'Deep dive issues', subtitle: 'The biggest bottlenecks', icon: TrendingUp, emoji: '🔥', phase: 'Operations', color: 'from-rose-500 to-red-600' },
    { id: 8, title: 'QR Strategy', subtitle: 'Plan the targeted placement!', icon: ClipboardList, emoji: '📍', phase: 'Strategy', color: 'from-blue-500 to-indigo-600' },
    { id: 9, title: 'Sales Pitch', subtitle: 'Time to strategize the pitch!', icon: User, emoji: '🤝', phase: 'Strategy', color: 'from-emerald-500 to-green-600' },
    { id: 10, title: 'Final Boss', subtitle: 'Score, review & launch!', icon: Crown, emoji: '🏆', phase: 'Review', color: 'from-yellow-500 to-amber-600' },
];`;

content = content.replace(oldMeta, newMeta);
fs.writeFileSync(file, content);
console.log('Script done successfully!');
