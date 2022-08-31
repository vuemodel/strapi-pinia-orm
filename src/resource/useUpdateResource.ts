import { computed, Ref, ref } from 'vue'
import useRest from '../rest/useRest'
import { MaybeRef } from '@vueuse/core'
import { Model } from '../types'
import { ResourceNode } from '../types/ResourceNode'
import { Resource } from '../types/Resource'
import getConfig from '../plugin/getConfig'
import { useRepo } from 'pinia-orm'
import { normalize } from '../utils/normalize'

export type OnUpdateCallback<ModelType extends Model> = (model: ResourceNode<ModelType>) => void

export interface UpdateResourceOptions<ModelType extends Model> {
  form?: Partial<ModelType>
  id?: MaybeRef<string | number | undefined>
  onUpdate?: OnUpdateCallback<ModelType>
  notifyOnError?: boolean
  persist?: boolean
}

const defaultOptions = {
  notifyOnError: true,
  persist: true
}

export default function useUpdateResource<ModelType extends typeof Model> (
  modelClass: ModelType,
  options: UpdateResourceOptions<InstanceType<ModelType>> = {},
) {
  options = Object.assign({}, defaultOptions, options)
  const repo = useRepo(modelClass)
  const entity = modelClass.entity

  const config = getConfig()
  const errorNotifier = config.errorNotifiers?.update

  const form = ref(options.form || {})
  const resource: Ref<Resource<InstanceType<ModelType>> | null> = ref(null)
  const id = ref(options.id || null)

  const onUpdateCallbacks: Ref<OnUpdateCallback<InstanceType<ModelType>>[]> = ref([])

  if (options.onUpdate) {
    onUpdateCallbacks.value.push(options.onUpdate)
  }

  const onUpdate = (callback: OnUpdateCallback<InstanceType<ModelType>>) => {
    onUpdateCallbacks.value.push(callback)
  }

  const endpoint = ref('')

  const rest = useRest<ResourceNode<InstanceType<ModelType>>>(endpoint)

  async function update (idParam?: number | string, attributes: Record<string, unknown> = {}) {
    if(idParam) {
      id.value = idParam
    }

    endpoint.value = `${entity}/${id.value}`

    Object.assign(form.value, attributes)

    await rest.execute('put', { data: form.value })

    if (!rest.hasErrors.value && rest.data.value) {
      if (rest.data.value) {
        resource.value = rest.data.value.data

        if(options.persist) {
          repo.save(normalize(resource.value))
        }
      }


      onUpdateCallbacks.value.forEach(callback => {
        if (rest.data.value !== null) {
          callback(rest.data.value)
        }
      })
    } else {
      if(errorNotifier) errorNotifier({ entityType: entity })
    }
  }

  const updating = computed(() => {
    return rest.isFetching.value ? id.value : false
  })

  return {
    id,
    update,
    form,
    updating,
    resource,
    hasErrors: rest.hasErrors,
    validationErrors: rest.validationErrors,
    standardErrors: rest.standardErrors,
    hasValidationErrors: rest.hasValidationErrors,
    hasStandardErrors: rest.hasStandardErrors,
    onUpdate,
  }
}

export { useUpdateResource }
