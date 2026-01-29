import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
    logo: <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>FluxMedia</span>,
    project: {
        link: 'https://github.com/fluxmediajs/fluxmedia',
    },
    docsRepositoryBase: 'https://github.com/fluxmediajs/fluxmedia/tree/main/docs',
    footer: {
        text: 'MIT License © FluxMedia',
    },
    useNextSeoProps() {
        return {
            titleTemplate: '%s – FluxMedia',
        };
    },
    head: (
        <>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="description" content="FluxMedia - Provider-agnostic media uploads for JavaScript" />
            <meta name="og:title" content="FluxMedia Documentation" />
        </>
    ),
    primaryHue: 210,
    sidebar: {
        defaultMenuCollapseLevel: 1,
        toggleButton: true,
    },
    toc: {
        backToTop: true,
    },
};

export default config;
