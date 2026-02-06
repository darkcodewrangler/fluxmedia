import Link from "next/link";
import { UploadCloud } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t py-12 md:py-16 lg:py-20 bg-muted/30 px-3 md:px-5">
            <div className="container grid grid-cols-1 gap-8 md:grid-cols-4">
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <UploadCloud className="h-6 w-6" />
                        <span className="font-bold text-lg">FluxMedia</span>
                    </div>
                    <p className="text-sm text-muted-foreground w-full max-w-xs">
                        Switch providers, not code. The TypeScript-first media library for modern applications.
                    </p>
                </div>
                <div>
                    <h4 className="font-medium mb-4">Product</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
                        <li><Link href="/playground" className="hover:text-foreground">Playground</Link></li>
                        <li><Link href="/changelog" className="hover:text-foreground">Changelog</Link></li>
                        <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-medium mb-4">Resources</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                        <li><Link href="https://github.com/codewithveek/fluxmedia" className="hover:text-foreground">GitHub</Link></li>
                        <li><Link href="https://www.npmjs.com/package/@fluxmedia/core" className="hover:text-foreground">NPM</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-medium mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                        <li><Link href="/license" className="hover:text-foreground">MIT License</Link></li>
                    </ul>
                </div>
            </div>
            <div className="container mt-12 pt-8 border-t text-sm text-muted-foreground text-center">
                © {new Date().getFullYear()} FluxMedia Contributors. Built with ❤️ and TypeScript.
            </div>
        </footer>
    );
}
