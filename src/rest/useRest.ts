import useFieldErrors, { FieldErrors } from '../errors/useFieldErrors'
import useStandardErrors, { StandardErrors } from '../errors/useStandardErrors'
import { computed, ComputedRef, Ref, ref, unref } from 'vue'
import { MaybeRef, useFetch } from '@vueuse/core'
import qs from 'qs'
import getConfig from '../plugin/getConfig'

export type RequestAction = 'post'
  | 'put'
  | 'get'
  | 'delete'

export interface UseRestOptions {
  populate?: MaybeRef<unknown>
  fields?: MaybeRef<unknown>
}

export interface UseRestReturn<ResponseData = unknown> {
  execute: (action: RequestAction, payload?: Record<string, unknown>) => Promise<void>
  populate: Ref<unknown>
  fields: Ref<unknown>
  standardErrors: Ref<StandardErrors<string | number>>
  hasStandardErrors: ComputedRef<boolean>
  validationErrors: Ref<FieldErrors>
  hasValidationErrors: ComputedRef<boolean>
  hasErrors: ComputedRef<boolean>
  isFetching: Ref<boolean>
  data: Ref<ResponseData | null>
  isFinished: Ref<boolean>
}

export default function useRest<ResponseData = unknown> (
  endpointParam: MaybeRef<string>,
  options: UseRestOptions = {},
): UseRestReturn<ResponseData> {
  const config = getConfig()

  const populate = ref(options.populate || [])
  const fields = ref(options.fields || [])
  const endpoint = ref(endpointParam)

  const isFetching = ref(false)

  const standardErrors = useStandardErrors()
  const validationErrors = useFieldErrors()

  const hasErrors = computed(() => {
    return standardErrors.hasErrors.value ||
      validationErrors.hasErrors.value
  })

  const fetcher = useFetch<ResponseData>(
    () => config.apiEndpoint + '/' + endpoint.value,
    {
      headers: config.getRequestHeaders ? config.getRequestHeaders() : undefined
    },
    {
      immediate: false
    }
  )

  async function execute (action: RequestAction, payload: Record<string, unknown> = {}) {
    payload.populate = payload.populate || populate.value
    payload.fields = payload.fields || fields.value

    isFetching.value = true

    // When the action is a "get" request
    // convert the payload to a query string
    if (action === 'get') {
      const queryString = qs.stringify(payload)
      endpoint.value += queryString ? ('?' + qs.stringify(payload)) : ''
      await fetcher.get().json().execute()
      endpoint.value = unref(endpointParam)
    } else if (payload) {
      await fetcher[action](payload).json().execute()
    } else {
      await fetcher[action]().json().execute()
    }

    isFetching.value = false

    if (fetcher.error.value) {
      standardErrors.errors.value.push({
        type: 'standard',
        message: fetcher.error.value,
      })

      if (
        fetcher.data.value?.error?.name === 'ValidationError' &&
        fetcher.data.value?.error?.details?.errors
      ) {
        validationErrors.errors.value = fetcher.data.value?.error.details.errors
      }
    }
  }

  return {
    execute,
    populate,
    fields,
    standardErrors: standardErrors.errors,
    hasStandardErrors: standardErrors.hasErrors,
    validationErrors: validationErrors.errors,
    hasValidationErrors: validationErrors.hasErrors,
    hasErrors,
    isFetching,
    data: fetcher.data,
    isFinished: fetcher.isFinished,
  }
}

export { useRest }
