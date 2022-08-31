import { ComputedRef, Ref, ref } from 'vue'
import useRest from '../rest/useRest'
import { Model } from '../types/Model'
import deepmerge from 'deepmerge'
import { FieldErrors } from '../errors/useFieldErrors'
import { StandardErrors } from '../errors/useStandardErrors'
import { Resource } from '../types/Resource'
import { LooseModelForm } from '../types/LooseModelForm'
import { ResourceNode } from '../types/ResourceNode'

export type OnCreateCallback<ModelType extends Model> = (model: Resource<ModelType>) => void

export interface CreateResourceOptions<ModelType extends Model> {
  form?: LooseModelForm<ModelType>
  formDefaults?: () => Record<string, unknown>
  onCreate?: OnCreateCallback<ModelType>
}

export interface UseCreateResourceReturn<ModelType extends Model> {
  create: (form: LooseModelForm<ModelType>) => Promise<void>,
  formDefaults: Ref<() => Record<string, unknown>>,
  data: Ref<ResourceNode<ModelType> | null>,
  creating: Ref<boolean>,
  resource: Ref<Resource<ModelType> | null>,
  hasErrors: ComputedRef<boolean>,
  validationErrors: Ref<FieldErrors>,
  standardErrors: Ref<StandardErrors<string | number>>,
  hasValidationErrors: ComputedRef<boolean>,
  hasStandardErrors: ComputedRef<boolean>,
  onCreate: (callback: OnCreateCallback<ModelType>) => void,
}

export default function useCreateResource<ModelType extends Model> (
  entity: string,
  options: CreateResourceOptions<ModelType> = {},
): UseCreateResourceReturn<ModelType> {
  const formDefaults = ref(options.formDefaults || (() => { return {} }))
  const resource: Ref<Resource<ModelType> | null> = ref(null)

  const onCreateCallbacks: Ref<OnCreateCallback<ModelType>[]> = ref([])

  if (options.onCreate) {
    onCreateCallbacks.value.push(options.onCreate)
  }

  const onCreate = (callback: OnCreateCallback<ModelType>) => {
    onCreateCallbacks.value.push(callback)
  }

  const rest = useRest<ResourceNode<ModelType>>(entity)

  async function create (form: LooseModelForm<ModelType>) {
    const mergedForm = deepmerge(form, formDefaults.value())

    await rest.execute('post', { data: mergedForm })

    if (!rest.hasErrors.value && rest.data.value) {
      if (rest.data.value.data) {
        resource.value = rest.data.value.data
      }

      onCreateCallbacks.value.forEach(callback => {
        if (resource.value !== null) {
          callback(resource.value)
        }
      })
    }
  }

  return {
    create,
    formDefaults,
    data: rest.data,
    creating: rest.isFetching,
    resource,
    hasErrors: rest.hasErrors,
    validationErrors: rest.validationErrors,
    standardErrors: rest.standardErrors,
    hasValidationErrors: rest.hasValidationErrors,
    hasStandardErrors: rest.hasStandardErrors,
    onCreate,
  }
}

export { useCreateResource }
