import { Ref, ref } from 'vue'
import useRest from '../rest/useRest'
import { MaybeRef } from '@vueuse/core'
import { Model } from '../types'
import { ResourceNode } from '../types/ResourceNode'
import { Resource } from '../types/Resource'
import { StrapiPopulate } from '../types/StrapiPopulate'
import { StrapiFieldsSelect } from '../plugin/StrapiFieldsSelect'

export type OnFetchCallback<ModelType extends Model> = (resourceNode: ResourceNode<ModelType>) => void

export interface FetchResourceOptions<ModelType extends Model> {
  id?: MaybeRef<number>
  populate?: StrapiPopulate<ModelType>
  fields?: StrapiFieldsSelect<ModelType>
  immediate?: boolean
}

export default function useFetchResource<ModelType extends Model> (
  entity: string,
  options: FetchResourceOptions<ModelType> = {},
) {
  const id = ref(options.id || null)
  const populate = ref(options.populate || [])
  const fields = ref(options.fields || [])

  const resource: Ref<Resource<ModelType> | null> = ref(null)
  const endpoint = ref('')

  const onFetchCallbacks = ref<OnFetchCallback<ModelType>[]>([])

  const onFetch = (callback: OnFetchCallback<ModelType>) => {
    onFetchCallbacks.value.push(callback)
  }

  const rest = useRest<ResourceNode<ModelType>>(endpoint, { populate, fields })

  async function fetch (resourceParam?: { id: number, attributes: Record<string, unknown> } | number) {
    let fetchId: number | null

    if (typeof resourceParam === 'number') {
      fetchId = resourceParam
    } else if (resourceParam?.id) {
      fetchId = resourceParam?.id
    } else {
      fetchId = id.value
    }

    if (!fetchId) {
      throw new Error('No id provided: cannot fetch resource without an identifier')
    }

    endpoint.value = `${entity}/${fetchId}`

    await rest.execute('get')

    if (!rest.hasErrors.value) {
      if (rest.data.value?.data) {
        resource.value = rest.data.value.data
      }

      onFetchCallbacks.value.forEach(callback => {
        if (rest.data.value !== null) {
          callback(rest.data.value)
        }
      })
    }
  }

  if (options.immediate && id.value) {
    fetch(id.value)
  }

  return {
    fetch,
    id,
    data: rest.data,
    fetching: rest.isFetching,
    resource,
    hasErrors: rest.hasErrors,
    validationErrors: rest.validationErrors,
    standardErrors: rest.standardErrors,
    hasValidationErrors: rest.hasValidationErrors,
    hasStandardErrors: rest.hasStandardErrors,
    onFetch,
  }
}

export { useFetchResource }
