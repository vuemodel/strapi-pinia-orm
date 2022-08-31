import { computed, ComputedRef, Ref, ref } from 'vue'

export interface StandardError<ErrorType = string | number> {
  type: ErrorType
  message: string
}

export type StandardErrors<ErrorType = string | number> = StandardError<ErrorType>[]

export interface UseStandardErrorsReturn<ErrorType = string | number> {
  errors: Ref<StandardErrors<ErrorType>>
  hasErrors: ComputedRef<boolean>
}

export function useStandardErrors<ErrorType = string | number> (): UseStandardErrorsReturn<ErrorType> {
  const errors: Ref<StandardErrors<ErrorType>> = ref([])

  const hasErrors = computed(() => !!errors.value.length)

  return {
    errors,
    hasErrors,
  }
}

export {
  useStandardErrors as default,
}
