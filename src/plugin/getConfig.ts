import { inject } from "vue"
import { StrapiProviderConfig } from "../types/StrapiProviderConfig"

export default function getConfig (providerKey = 'default') {
  const config = inject<StrapiProviderConfig>('strapiPiniaOrmConfig:' + providerKey)

  if(!config) {
    throw new Error('Error getting the default strapi config. Did you install the strapi rest plugin?')
  }

  return config
}
