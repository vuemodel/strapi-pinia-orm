import { computed, Ref, ref } from 'vue'
import useRest from '../rest/useRest'
import { MaybeRef } from '@vueuse/core'
import { Model } from '../types'
import { ResourceNode } from '../types/ResourceNode'
import { Resource } from '../types/Resource'

export type OnUpdateCallback<ModelType extends Model> = (model: ResourceNode<ModelType>) => void

export interface UpdateResourceOptions<ModelType extends Model> {
  form?: Partial<ModelType>
  id?: MaybeRef<string | number>
  onUpdate?: OnUpdateCallback<ModelType>
}

export default function useUpdateResource<ModelType extends Model> (
  entity: string,
  options: UpdateResourceOptions<ModelType> = {},
) {
  const form = ref(options.form || {})
  const resource: Ref<Resource<ModelType> | null> = ref(null)
  const id = ref(options.id || null)

  const onUpdateCallbacks: Ref<OnUpdateCallback<ModelType>[]> = ref([])

  if (options.onUpdate) {
    onUpdateCallbacks.value.push(options.onUpdate)
  }

  const onUpdate = (callback: OnUpdateCallback<ModelType>) => {
    onUpdateCallbacks.value.push(callback)
  }

  const endpoint = ref('')

  const rest = useRest<ResourceNode<ModelType>>(endpoint)

  async function update (id: number | string, attributes: Record<string, unknown> = {}) {
    endpoint.value = `${entity}/${id}`

    Object.assign(form.value, attributes)

    await rest.execute('put', { data: { attributes: form.value } })

    if (!rest.hasErrors.value && rest.data.value) {
      if (rest.data.value) {
        resource.value = rest.data.value.data
      }

      onUpdateCallbacks.value.forEach(callback => {
        if (rest.data.value !== null) {
          callback(rest.data.value)
        }
      })
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
