import { ComputedRef, Ref, ref } from 'vue'
import useRest from '../rest/useRest'
import { Model } from '../types/Model'
import deepmerge from 'deepmerge'
import { FieldErrors } from '../errors/useFieldErrors'
import { StandardErrors } from '../errors/useStandardErrors'
import { Resource } from '../types/Resource'
import { LooseModelForm } from '../types/LooseModelForm'
import { ResourceNode } from '../types/ResourceNode'
import getConfig from '../plugin/getConfig'
import { useRepo } from 'pinia-orm'
import { normalize } from '../utils/normalize'

export type OnCreateCallback<ModelType extends Model> = (model: Resource<ModelType>) => void

export interface CreateResourceOptions<ModelType extends Model> {
  formDefaults?: () => Record<string, unknown>
  onCreate?: OnCreateCallback<ModelType>
  notifyOnError?: boolean
  persist?: boolean
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

const defaultOptions = {
  notifyOnError: true,
  persist: true
}

export default function useCreateResource<ModelType extends typeof Model> (
  modelClass: ModelType,
  options: CreateResourceOptions<InstanceType<ModelType>> = {},
): UseCreateResourceReturn<InstanceType<ModelType>> {
  const repo = useRepo(modelClass)

  const entity = modelClass.entity
  options = Object.assign({}, defaultOptions, options)

  const config = getConfig()
  const errorNotifer = config.errorNotifiers?.create

  const formDefaults = ref(options.formDefaults || (() => { return {} }))
  const resource: Ref<Resource<InstanceType<ModelType>> | null> = ref(null)

  const onCreateCallbacks: Ref<OnCreateCallback<InstanceType<ModelType>>[]> = ref([])

  if (options.onCreate) {
    onCreateCallbacks.value.push(options.onCreate)
  }

  const onCreate = (callback: OnCreateCallback<InstanceType<ModelType>>) => {
    onCreateCallbacks.value.push(callback)
  }

  const rest = useRest<ResourceNode<InstanceType<ModelType>>>(entity)

  async function create (form: LooseModelForm<InstanceType<ModelType>>) {
    const mergedForm = deepmerge(form, formDefaults.value())

    await rest.execute('post', { data: mergedForm })

    if (!rest.hasErrors.value && rest.data.value) {
      if (rest.data.value.data) {
        resource.value = rest.data.value.data

        if(options.persist) {
          repo.save(normalize(resource.value))
        }
      }

      onCreateCallbacks.value.forEach(callback => {
        if (resource.value !== null) {
          callback(resource.value)
        }
      })
    } else {
      if(errorNotifer && options.notifyOnError) errorNotifer({ entityType: entity })
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
