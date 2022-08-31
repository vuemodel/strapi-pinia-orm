export interface StrapiProviderConfig {
  apiEndpoint: string
  getRequestHeaders?: () => HeadersInit
  errorNotifiers?: {
    create?: (options: { entityType: string }) => void
    update?: (options: { entityType: string }) => void
    remove?: (options: { entityType: string }) => void
    fetch?: (options: { entityType: string }) => void
    fetchOne?: (options: { entityType: string }) => void
  }
}
