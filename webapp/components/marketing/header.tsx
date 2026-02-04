"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Github, Moon, Sun, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <Link href="/" className="mr-8 flex items-center space-x-2">
                    <UploadCloud className="h-6 w-6" />
                    <span className="font-bold text-lg hidden sm:inline-block">FluxMedia</span>
                </Link>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link
                        href="/docs"
                        className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                        Documentation
                    </Link>
                    <Link
                        href="/playground"
                        className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                        Playground
                    </Link>
                    <Link
                        href="/blog"
                        className="transition-colors hover:text-foreground/80 text-foreground/60 hidden sm:inline-block"
                    >
                        Blog
                    </Link>
                </nav>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <nav className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="https://github.com/codewithveek/fluxmedia" target="_blank" rel="noreferrer">
                                <Github className="h-4 w-4" />
                                <span className="sr-only">GitHub</span>
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            {mounted && theme === "light" ? (
                                <Sun className="h-4 w-4" />
                            ) : (
                                <Moon className="h-4 w-4" />
                            )}
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    );
}
