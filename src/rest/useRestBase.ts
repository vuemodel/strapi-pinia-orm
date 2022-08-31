import { createFetch } from '@vueuse/core'
import { useLocalStorageTokenRepo } from '@vueauth/strapi'

const tokenRepo = useLocalStorageTokenRepo()

const useRestBase = createFetch({
  baseUrl: 'http://localhost:9000/api',
  options: {
    immediate: false,
    async beforeFetch (context) {
      const token = await tokenRepo.get()
      context.options.headers = {
        domain_id: '2',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    },
  },
})

export default useRestBase
export { useRestBase }
