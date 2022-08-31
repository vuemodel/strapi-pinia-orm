import { App } from 'vue-demi'
import { StrapiProviderConfig } from '../types/StrapiProviderConfig'

export interface StrapiPluginOptions {
  providers: Record<string, StrapiProviderConfig>
}

export const StrapiPlugin = {
  install: (app: App, options: StrapiPluginOptions): void => {
    Object.entries(options.providers)
      .forEach(([providerKey, provider]: [string, StrapiProviderConfig]) => {
        app.provide('strapiPiniaOrmConfig:' + providerKey, provider)
      })
  }
}
