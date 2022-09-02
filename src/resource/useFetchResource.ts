import { Ref, ref } from 'vue'
import useRest from '../rest/useRest'
import { MaybeComputedRef, MaybeRef, resolveUnref } from '@vueuse/core'
import { Model } from '../types'
import { ResourceNode } from '../types/ResourceNode'
import { Resource } from '../types/Resource'
import { StrapiPopulate } from '../types/StrapiPopulate'
import { StrapiFieldsSelect } from '../plugin/StrapiFieldsSelect'
import getConfig from '../plugin/getConfig'
import { useRepo } from 'pinia-orm'
import { normalize } from '../utils/normalize'

export type OnFetchCallback<ModelType extends Model> = (resourceNode: ResourceNode<ModelType>) => void

export interface FetchResourceOptions<ModelType extends Model> {
  id?: MaybeRef<number | undefined>
  populate?: MaybeComputedRef<StrapiPopulate<ModelType>>
  fields?: MaybeComputedRef<StrapiFieldsSelect<ModelType>>
  onFetch?: OnFetchCallback<ModelType>
  immediate?: boolean
  notifyOnError?: boolean
  persist?: boolean
}

const defaultOptions = {
  persist: true,
  notifyOnError: true
}

export default function useFetchResource<ModelType extends typeof Model> (
  modelClass: ModelType,
  options: FetchResourceOptions<InstanceType<ModelType>> = {},
) {
  const repo = useRepo(modelClass)

  const entity = modelClass.entity
  options = Object.assign({}, defaultOptions, options)

  const config = getConfig()
  const errorNotifier = config.errorNotifiers?.fetch

  const idRef = ref(options.id || null)

  const resource: Ref<Resource<InstanceType<ModelType>> | null> = ref(null)
  const endpoint = ref('')

  const onFetchCallbacks = ref<OnFetchCallback<InstanceType<ModelType>>[]>([])

  const onFetch = (callback: OnFetchCallback<InstanceType<ModelType>>) => {
    onFetchCallbacks.value.push(callback)
  }

  if (options.onFetch) {
    onFetchCallbacks.value.push(options.onFetch)
  }

  const rest = useRest<ResourceNode<InstanceType<ModelType>>>(endpoint)

  async function fetch (resourceParam?: { id: number, attributes: Record<string, unknown> } | number) {
    let fetchId: number | undefined

    if (typeof resourceParam === 'number') {
      fetchId = resourceParam
    } else if (resourceParam?.id) {
      fetchId = resourceParam?.id
    } else if(typeof idRef.value === 'number') {
      fetchId = idRef.value
    }

    if (!fetchId) {
      throw new Error('No id provided: cannot fetch resource without an identifier')
    }

    endpoint.value = `${entity}/${fetchId}`

    await rest.execute('get', {
      populate: options.populate ? resolveUnref(options.populate) as StrapiPopulate<InstanceType<ModelType>> : undefined,
      fields: options.fields ? resolveUnref(options.fields) : undefined,
    })

    if (!rest.hasErrors.value) {
      if (rest.data.value?.data) {
        resource.value = rest.data.value.data

        if(options.persist) {
          repo.save(normalize(resource.value))
        }
      }

      onFetchCallbacks.value.forEach(callback => {
        if (rest.data.value !== null) {
          callback(rest.data.value)
        }
      })
    } else {
      if(errorNotifier && options.notifyOnError) errorNotifier({ entityType: entity })
    }
  }

  if (options.immediate && idRef.value) {
    fetch(idRef.value)
  }

  return {
    fetch,
    id: idRef,
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
