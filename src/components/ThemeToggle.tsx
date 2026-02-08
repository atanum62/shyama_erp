'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch by waiting until mounted
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-10 w-10 flex items-center justify-center bg-secondary rounded-xl opacity-20" />;
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-secondary hover:bg-stone-200 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm border border-border"
            aria-label="Toggle theme"
        >
            <div className="relative h-5 w-5">
                <Sun
                    className={`h-full w-full text-orange-500 absolute transition-all duration-500 transform ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                        }`}
                />
                <Moon
                    className={`h-full w-full text-blue-500 absolute transition-all duration-500 transform ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
                        }`}
                />
            </div>
        </button>
    );
}
