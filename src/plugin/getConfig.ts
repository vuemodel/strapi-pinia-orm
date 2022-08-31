import { inject } from "vue-demi"
import { StrapiProviderConfig } from "../types/StrapiProviderConfig"

export default function getConfig (provider = 'default') {
  const config = inject<StrapiProviderConfig>(provider)

  if(!config) {
    throw new Error('Error getting the default strapi config. Did you install the strapi rest plugin?')
  }

  return config
}
