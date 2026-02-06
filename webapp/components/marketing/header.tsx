"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Github, Moon, Sun, UploadCloud, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export function Header({ stats }: { stats?: React.ReactNode }) {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    // Close mobile menu on route change or resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const navLinks = [
        { href: "/docs", label: "Documentation" },
        { href: "/playground", label: "Playground" },
        { href: "/blog", label: "Blog" },
        { href: "/changelog", label: "Changelog" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-6">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <UploadCloud className="h-6 w-6 text-indigo-500" />
                    <span className="font-bold text-lg">FluxMedia</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    {stats}
                    <nav className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
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

                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </nav>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-border/40 bg-background">
                    <nav className="container flex flex-col py-4 px-4 space-y-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60 py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-2 border-t border-border/40">
                            <Link
                                href="https://github.com/codewithveek/fluxmedia"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center space-x-2 text-sm font-medium text-foreground/60 py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Github className="h-4 w-4" />
                                <span>GitHub</span>
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
