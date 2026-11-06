export const designPresets = {
    // Containers
    card: "bg-white rounded-2xl border border-gray-50 shadow-sm transition-all hover:shadow-md",
    cardDark: "bg-text-main rounded-2xl shadow-xl transition-all",
    
    // Typography
    title: "font-display font-black text-3xl md:text-5xl text-text-main tracking-tight leading-[1.1]",
    subtitle: "text-text-secondary font-display font-black text-2xl md:text-3xl opacity-40 leading-tight",
    badge: "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4",
    body: "text-base text-text-secondary font-medium leading-relaxed",
    metric: "font-display font-black text-4xl md:text-5xl text-text-main",
    metricLabel: "text-[10px] font-black uppercase tracking-widest text-text-secondary",
    
    // Buttons
    buttonPrimary: "bg-primary hover:bg-primary-hover text-white font-bold px-8 py-3.5 rounded-full transition-all transform hover:scale-105 shadow-xl shadow-primary/25 text-sm flex items-center justify-center gap-2",
    buttonSecondary: "bg-white text-text-main font-bold px-8 py-3.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-all text-sm flex items-center justify-center gap-2",
    
    // Grid/Layout
    sectionPadding: "py-24 px-4 sm:px-6 lg:px-8",
    containerMaxWidth: "max-w-7xl mx-auto",

    // Homepage sections
    homeSection: "py-8 md:py-12 px-4 sm:px-6 lg:px-8",
    homeSectionInner: "max-w-7xl mx-auto",
    homeSectionTitle: "text-xl md:text-2xl font-bold text-gray-900 tracking-tight",
    homeSectionSubtitle: "text-sm text-gray-500 mt-1",
    homeSectionLink: "text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0",

    // Horizontal scroll containers
    snapContainer: "flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4",
    snapItem: "snap-start shrink-0",
    scrollContainer: "flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4",
    scrollItem: "shrink-0",
};
