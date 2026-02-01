/**
 * Configuration options for Cloudflare R2 provider
 */
export interface R2Config {

    /**
     * R2 bucket name
     */
    bucket: string;

    /**
     * R2 Access Key ID
     */
    accessKeyId: string;

    /**
     * R2 Secret Access Key
     */
    secretAccessKey: string;

    /**
     * Custom public URL for the bucket (if configured)
     */
    publicUrl?: string;
}

export interface R2ProviderConfigWithAccountId extends R2Config {
    accountId: string;
}
export interface R2ProviderConfigWithEndpoint extends R2Config {
    endpoint: string;
}
export type R2ProviderConfig = R2ProviderConfigWithAccountId | R2ProviderConfigWithEndpoint;
