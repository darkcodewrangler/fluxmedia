import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import type { ReactNode } from 'react'

export const metadata = {
    title: {
        default: 'FluxMedia',
        template: '%s – FluxMedia'
    },
    description: 'FluxMedia - Provider-agnostic media uploads for JavaScript',
    openGraph: {
        title: 'FluxMedia Documentation',
        description: 'Provider-agnostic media uploads for JavaScript'
    }
}

const navbar = (
    <Navbar
        logo={<span style={{ fontWeight: 700, fontSize: '1.25rem' }}>FluxMedia</span>}
        projectLink="https://github.com/codewithveek/fluxmedia"
    />
)

const footer = <Footer>MIT {new Date().getFullYear()} © FluxMedia</Footer>

export default async function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" dir="ltr" suppressHydrationWarning>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            <body>
                <Layout
                    navbar={navbar}
                    pageMap={await getPageMap()}
                    docsRepositoryBase="https://github.com/codewithveek/fluxmedia/tree/main/docs"
                    footer={footer}
                    sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: true }}
                    toc={{ backToTop: true }}
                >
                    {children}
                </Layout>
            </body>
        </html>
    )
}
