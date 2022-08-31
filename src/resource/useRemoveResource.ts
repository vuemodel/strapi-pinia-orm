import { computed, Ref, ref } from 'vue'
import { Model } from 'shared/types/Model'
import { ModelSchema } from 'src/shared/types/ModelSchema'
import useRest from '../rest/useRest'
import { Resource, ResourceNode } from 'types'

export type OnRemoveCallback<ModelType extends Model> = (model: Resource<ModelType>) => void

export interface RemoveResourceOptions<ModelType extends Model> {
  id?: string | number
  onRemove?: OnRemoveCallback<ModelType>
}

export default function useRemoveResource<ModelType extends Model> (
  schema: unknown,
  options: RemoveResourceOptions<ModelType> = {},
) {
  const localSchema = schema as ModelSchema<ModelType>
  const resource: Ref<Resource<ModelType> | null> = ref(null)
  const id = ref(options.id || null)

  const onRemoveCallbacks = ref<OnRemoveCallback<ModelType>[]>([])

  if (options.onRemove) {
    onRemoveCallbacks.value.push(options.onRemove)
  }

  const onRemove = (callback: OnRemoveCallback<ModelType>) => {
    onRemoveCallbacks.value.push(callback)
  }

  const endpoint = ref('')

  const rest = useRest<ResourceNode<ModelType>>(endpoint)

  async function remove (resourceParam?: number | { id: number | string }) {
    if (resourceParam) {
      id.value = typeof resourceParam === 'number'
        ? resourceParam
        : resourceParam.id
    }

    endpoint.value = `${localSchema.entity}/${id.value}`

    await rest.execute('delete')

    if (!rest.hasErrors.value) {
      if (rest.data.value) {
        resource.value = rest.data.value.data
      }

      onRemoveCallbacks.value.forEach(callback => {
        if (resource.value !== null) {
          callback(resource.value)
        }
      })
    }
  }

  const removing = computed(() => {
    return rest.isFetching.value ? id.value : false
  })

  return {
    id,
    remove,
    removing,
    resource,
    hasErrors: rest.hasErrors,
    validationErrors: rest.validationErrors,
    standardErrors: rest.standardErrors,
    hasValidationErrors: rest.hasValidationErrors,
    hasStandardErrors: rest.hasStandardErrors,
    schema: localSchema,
    onRemove,
  }
}

export { useRemoveResource }
