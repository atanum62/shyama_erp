'use client';

import { motion } from 'framer-motion';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors group"
        >
            <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}
