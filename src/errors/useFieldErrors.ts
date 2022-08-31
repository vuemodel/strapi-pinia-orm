import { computed, ComputedRef, Ref, ref } from 'vue'

export type FieldError = {
  message?: string
  name?: string
  path?: string[]
}

export type FieldErrors = Record<string, FieldError>

export interface UseFieldErrorsReturn {
  errors: Ref<FieldErrors>
  hasErrors: ComputedRef<boolean>
}

export function useFieldErrors (): UseFieldErrorsReturn {
  const errors = ref<FieldErrors>({})
  const hasErrors = computed(() => !!Object.keys(errors.value).length)

  return {
    errors,
    hasErrors,
  }
}

export {
  useFieldErrors as default,
}
