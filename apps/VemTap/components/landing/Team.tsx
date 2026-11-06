'use client';

import React, { useState } from 'react';
import { X, Linkedin, Twitter, Mail } from 'lucide-react';

interface TeamMember {
    name: string;
    role: string;
    image: string;
    bio: string;
    expertise: string[];
    linkedin?: string;
    twitter?: string;
    email?: string;
}

const teamMembers: TeamMember[] = [
    {
        name: "Michael Scott",
        role: "Co-Founder, Chief Architect",
        image: "/api/placeholder/400/400",
        bio: "With over 15 years of experience in NFC technology and enterprise solutions, Michael leads our technical vision. Previously at Samsung and Visa, he's pioneered contactless payment systems used by millions worldwide.",
        expertise: ["NFC Architecture", "IoT Systems", "Enterprise Security", "Hardware Design"],
        linkedin: "#",
        twitter: "#",
        email: "michael@vemtap.com"
    },
    {
        name: "Chandler Rigs",
        role: "Co-Founder, Architect",
        image: "/api/placeholder/400/400",
        bio: "Chandler brings deep expertise in software architecture and scalable systems. Former lead architect at Google Cloud, he's designed infrastructure serving billions of requests daily.",
        expertise: ["Cloud Architecture", "System Design", "API Development", "DevOps"],
        linkedin: "#",
        twitter: "#",
        email: "chandler@vemtap.com"
    },
    {
        name: "Isabella Rodriguez",
        role: "Architect",
        image: "/api/placeholder/400/400",
        bio: "Isabella specializes in user-centric design and seamless integration. With a background in fintech and retail tech, she ensures our solutions are both powerful and intuitive.",
        expertise: ["UX Architecture", "Integration Design", "Customer Analytics", "Product Strategy"],
        linkedin: "#",
        email: "isabella@vemtap.com"
    },
    {
        name: "Ava Wilson",
        role: "3D Artist",
        image: "/api/placeholder/400/400",
        bio: "Ava creates stunning visual experiences that bring our hardware to life. Her work in product visualization and 3D design helps clients envision the perfect NFC solution for their needs.",
        expertise: ["3D Modeling", "Product Visualization", "Brand Design", "Motion Graphics"],
        linkedin: "#",
        twitter: "#",
        email: "ava@vemtap.com"
    }
];

export default function Team() {
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    return (
        <section id="team" className="py-24 bg-white overflow-hidden relative">
            <div className="vemtap-container relative z-10">
                {/* Section Header */}
                <div className="text-center vemtap-container mb-16">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 block">04</span>
                    <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-text-main">Our team</h2>
                    <p className="text-lg text-text-secondary font-medium leading-relaxed">
                        We craft solutions that amplify key characteristics, achieving a harmonious balance of
                        function and intent. Through careful analysis and collaborative engagement, our spaces
                        transcend the conventional.
                    </p>
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {teamMembers.map((member, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedMember(member)}
                            className="group cursor-pointer"
                        >
                            {/* Image Container */}
                            <div className="relative aspect-3/4 bg-gray-100 mb-4 overflow-hidden">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-500" />
                            </div>

                            {/* Member Info */}
                            <div>
                                <h3 className="font-display font-bold text-lg text-text-main mb-1 group-hover:text-primary transition-colors">
                                    {member.name}
                                </h3>
                                <p className="text-sm text-text-secondary font-medium">
                                    {member.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Read More Button */}
                <div className="text-center mt-12">
                    <button className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-text-main font-bold rounded-none hover:border-primary hover:text-primary transition-all">
                        Read more
                    </button>
                </div>
            </div>

            {/* Full Profile Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0"
                        onClick={() => setSelectedMember(null)}
                    />
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedMember(null)}
                            className="absolute top-6 right-6 z-10 p-2 bg-white/90 hover:bg-white text-text-main rounded-none border border-gray-200 hover:border-primary transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2">
                            {/* Image Side */}
                            <div className="relative aspect-square md:aspect-auto bg-gray-100">
                                <img
                                    src={selectedMember.image}
                                    alt={selectedMember.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Content Side */}
                            <div className="p-6 md:p-12 flex flex-col">
                                <div className="mb-8">
                                    <h3 className="text-3xl md:text-4xl font-display font-bold text-text-main mb-3 leading-tight">
                                        {selectedMember.name}
                                    </h3>
                                    <p className="text-primary font-bold text-sm uppercase tracking-wider mb-6">
                                        {selectedMember.role}
                                    </p>
                                    <p className="text-text-secondary leading-relaxed mb-8">
                                        {selectedMember.bio}
                                    </p>
                                </div>

                                {/* Expertise */}
                                <div className="mb-8">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                                        Expertise
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMember.expertise.map((skill, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs font-bold text-text-secondary rounded-none"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="mt-auto pt-8 border-t border-gray-200">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                                        Connect
                                    </h4>
                                    <div className="flex gap-3">
                                        {selectedMember.linkedin && (
                                            <a
                                                href={selectedMember.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-gray-50 hover:bg-primary hover:text-white text-text-secondary border border-gray-200 hover:border-primary transition-all"
                                            >
                                                <Linkedin size={18} />
                                            </a>
                                        )}
                                        {selectedMember.twitter && (
                                            <a
                                                href={selectedMember.twitter}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-gray-50 hover:bg-primary hover:text-white text-text-secondary border border-gray-200 hover:border-primary transition-all"
                                            >
                                                <Twitter size={18} />
                                            </a>
                                        )}
                                        {selectedMember.email && (
                                            <a
                                                href={`mailto:${selectedMember.email}`}
                                                className="p-3 bg-gray-50 hover:bg-primary hover:text-white text-text-secondary border border-gray-200 hover:border-primary transition-all"
                                            >
                                                <Mail size={18} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
