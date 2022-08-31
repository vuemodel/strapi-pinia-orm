export interface StrapiProviderConfig {
  apiEndpoint: string
  getRequestHeaders?: () => HeadersInit
}
