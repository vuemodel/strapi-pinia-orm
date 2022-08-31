import { computed, Ref, ref } from 'vue'
import { MaybeComputedRef, resolveUnref } from '@vueuse/core'

import useRest from '../rest/useRest'
import { Model } from '../types'
import { CollectionNode } from '../types/CollectionNode'
import { StrapiPopulate } from '../types/StrapiPopulate'
import { StrapiFieldsSelect } from '../plugin/StrapiFieldsSelect'
import { StrapiFiltersObject } from '../types/StrapiFilters'
import { Collection } from '../types/Collection'

export type OnFetchCallback<ModelType extends Model> = (models: CollectionNode<ModelType>) => void

export interface UseFetchResourcesOptions<ModelType extends Model> {
  populate?: MaybeComputedRef<StrapiPopulate<ModelType>>
  sort?: MaybeComputedRef<string[]>
  fields?: MaybeComputedRef<StrapiFieldsSelect<ModelType>>
  filters?: MaybeComputedRef<StrapiFiltersObject<ModelType>>
  onFetch?: OnFetchCallback<ModelType>
  immediate?: boolean
  pagination?: {
    page?: number
    pageSize?: number
    withCount?: boolean
  }
}

// export interface UseFetcherResourcesReturn {
//   fetch
//   pagination
//   nextPage
//   previousPage
//   isFirstPage
//   isLastPage
//   data
//   fetching
//   resources
//   hasErrors
//   validationErrors
//   standardErrors
//   hasValidationErrors
//   hasStandardErrors
//   onFetch
// }

export interface PaginationState {
  page: number
  pageCount: number
  pageSize: number
  total: number
}

export default function useFetchResources<ModelType extends Model> (
  entity: string,
  options: UseFetchResourcesOptions<ModelType> = {},
) {
  const populate = ref(options.populate || [])
  const immediate = ref(options.immediate || false)
  const sort = ref(options.sort || [])
  const pagination = ref(options.pagination || {})

  const paginationState: Ref<PaginationState | undefined> = ref()

  const onFetchCallbacks = ref<OnFetchCallback<ModelType>[]>([])

  if (options.onFetch) {
    onFetchCallbacks.value.push(options.onFetch)
  }

  const onFetch = (callback: OnFetchCallback<ModelType>) => {
    onFetchCallbacks.value.push(callback)
  }

  const resources: Ref<Collection<ModelType>> = ref([])

  const rest = useRest<CollectionNode<ModelType>>(entity, { populate })

  async function fetch () {
    await rest.execute('get', {
      filters: options.filters ? resolveUnref(options.filters) as StrapiFiltersObject<ModelType> : undefined,
      sort: options.sort ? resolveUnref(options.sort) : undefined,
      fields: options.fields ? resolveUnref(options.fields) : undefined,
      pagination: pagination.value,
    })

    if (!rest.hasErrors.value) {
      if (rest.data.value?.data) {
        resources.value = rest.data.value.data
      }

      if (rest.data.value?.meta?.pagination) {
        paginationState.value = rest.data.value?.meta?.pagination
      }

      onFetchCallbacks.value.forEach(callback => {
        if (rest.data.value) {
          callback(rest.data.value)
        }
      })
    }
  }

  if (immediate.value) {
    fetch()
  }

  const isFirstPage = computed(() => {
    return paginationState.value && paginationState.value.page === 1
  })

  const isLastPage = computed(() => {
    return paginationState.value &&
      paginationState.value.page >= paginationState.value.pageCount
  })

  async function nextPage () {
    if (!paginationState.value) {
      throw new Error('pagination state must be set')
    }
    if (isLastPage.value) {
      throw new Error('Cannot fetch next page when on the last page')
    }
    paginationState.value.page += 1
    await fetch()
  }

  async function previousPage () {
    if (!paginationState.value) {
      throw new Error('pagination state must be set')
    }
    if (isFirstPage.value) {
      throw new Error('Cannot fetch previous page when on the first page')
    }
    paginationState.value.page -= 1
    await fetch()
  }

  return {
    fetch,
    pagination,
    nextPage,
    previousPage,
    isFirstPage,
    isLastPage,
    data: rest.data,
    fetching: rest.isFetching,
    resources,
    hasErrors: rest.hasErrors,
    validationErrors: rest.validationErrors,
    standardErrors: rest.standardErrors,
    hasValidationErrors: rest.hasValidationErrors,
    hasStandardErrors: rest.hasStandardErrors,
    onFetch,
  }
}

export { useFetchResources }
