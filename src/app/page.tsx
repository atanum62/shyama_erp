'use client';

import { motion } from 'framer-motion';
import { Database, Image as ImageIcon, Rocket, Shield, Zap, ChevronRight } from 'lucide-react';
import { FeatureCard } from '@/components/FeatureCard';
import { useSession, signIn, signOut } from 'next-auth/react';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <main className="min-h-screen">
      {/* Header/Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Shyama ERP
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {status === 'authenticated' ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted hidden sm:inline">
                  Welcome, <span className="font-semibold text-foreground">{session.user?.name}</span>
                </span>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn(undefined, { callbackUrl: '/dashboard' })}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-32 lg:pt-40 lg:pb-48">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(99,102,241,0.1)_0%,rgba(2,6,23,0)_100%)]" />

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                Next-Gen ERP Solution
              </span>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                Powering Business with Premium Tech
              </h1>
              <p className="text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
                A robust, scalable, and beautifully designed ERP built with Next.js, MongoDB, and Cloudinary. Ready for production and future-proof.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="px-8 py-4 bg-primary text-white rounded-md font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center gap-2 group">
                  Get Started
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-secondary text-foreground rounded-md font-semibold hover:bg-secondary/80 transition-colors">
                  View Demo
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Database className="w-6 h-6" />}
              title="MongoDB Ready"
              description="Full Mongoose integration with cached connections for serverless environments."
            />
            <FeatureCard
              icon={<ImageIcon className="w-6 h-6" />}
              title="Smart Image Upload"
              description="Abstracted storage layer using Cloudinary, ready for Cloudflare R2 migration."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Type Safe"
              description="End-to-end TypeScript support ensuring reliability and great developer experience."
            />
            <FeatureCard
              icon={<Rocket className="w-6 h-6" />}
              title="Production Ready"
              description="Optimized for Render and Vercel with structured environment configurations."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Tailwind v4"
              description="Built with the latest Tailwind CSS for rapid and modern UI development."
            />
            <FeatureCard
              icon={<Rocket className="w-6 h-6" />}
              title="ERP Core"
              description="A solid foundation for building complex Enterprise Resource Planning systems."
            />
          </div>
        </div>
      </section>
    </main>
  );
}
