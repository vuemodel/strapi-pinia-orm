import { computed, ComputedRef, Ref, ref } from 'vue'
import { MaybeComputedRef, resolveUnref } from '@vueuse/core'

import useRest from '../rest/useRest'
import { Model } from '../types'
import { CollectionNode } from '../types/CollectionNode'
import { StrapiPopulate } from '../types/StrapiPopulate'
import { StrapiFieldsSelect } from '../plugin/StrapiFieldsSelect'
import { StrapiFiltersObject } from '../types/StrapiFilters'
import { Collection } from '../types/Collection'
import { FieldErrors } from '../errors/useFieldErrors'
import { StandardErrors } from '../errors/useStandardErrors'
import getConfig from '../plugin/getConfig'
import { useRepo } from 'pinia-orm'
import { normalize } from '../utils/normalize'

export type OnFetchCallback<ModelType extends Model> = (models: CollectionNode<ModelType>) => void

export interface UseFetchResourcesOptions<ModelType extends Model> {
  populate?: MaybeComputedRef<StrapiPopulate<ModelType>>
  sort?: MaybeComputedRef<string[]>
  fields?: MaybeComputedRef<StrapiFieldsSelect<ModelType>>
  filters?: MaybeComputedRef<StrapiFiltersObject<ModelType>>
  onFetch?: OnFetchCallback<ModelType>
  immediate?: boolean
  notifyOnError?: boolean
  persist?: boolean
  persistBy?: 'save' | 'replace'
  pagination?: {
    page?: number
    pageSize?: number
    withCount?: boolean
  }
}

export interface UseFetcherResourcesReturn<ModelType extends Model> {
  fetch: () => Promise<void>
  pagination: Ref<{
      page?: number | undefined;
      pageSize?: number | undefined;
      withCount?: boolean | undefined;
  }>
  nextPage: () => Promise<void>
  previousPage: () => Promise<void>
  isFirstPage: ComputedRef<boolean | undefined>
  isLastPage: ComputedRef<boolean | undefined>
  data: Ref<CollectionNode<ModelType> | null>
  fetching: Ref<boolean>
  resources: Ref<Collection<ModelType>>
  hasErrors: ComputedRef<boolean>
  validationErrors: Ref<FieldErrors>
  standardErrors: Ref<StandardErrors<string | number>>
  hasValidationErrors: ComputedRef<boolean>
  hasStandardErrors: ComputedRef<boolean>
  onFetch: (callback: OnFetchCallback<ModelType>) => void
}

export interface PaginationState {
  page: number
  pageCount: number
  pageSize: number
  total: number
}

const defaultOptions = {
  notifyOnError: true,
  persist: true,
  persistBy: 'replace'
}

export default function useFetchResources<ModelType extends typeof Model> (
  modelClass: ModelType,
  options: UseFetchResourcesOptions<InstanceType<ModelType>> = {},
): UseFetcherResourcesReturn<InstanceType<ModelType>> {
  const repo = useRepo(modelClass)

  const entity = modelClass.entity
  options = Object.assign({}, defaultOptions, options)

  const config = getConfig('default')
  const errorNotifier = config.errorNotifiers?.fetch

  const pagination = ref(options.pagination || {})
  const paginationState: Ref<PaginationState | undefined> = ref()

  const onFetchCallbacks = ref<OnFetchCallback<InstanceType<ModelType>>[]>([])

  if (options.onFetch) {
    onFetchCallbacks.value.push(options.onFetch)
  }

  const onFetch = (callback: OnFetchCallback<InstanceType<ModelType>>) => {
    onFetchCallbacks.value.push(callback)
  }

  const resources: Ref<Collection<InstanceType<ModelType>>> = ref([])

  const rest = useRest<CollectionNode<InstanceType<ModelType>>>(entity)

  async function fetch () {
    await rest.execute('get', {
      populate: options.populate ? resolveUnref(options.populate) as StrapiPopulate<InstanceType<ModelType>> : undefined,
      filters: options.filters ? resolveUnref(options.filters) as StrapiFiltersObject<InstanceType<ModelType>> : undefined,
      sort: options.sort ? resolveUnref(options.sort) : undefined,
      fields: options.fields ? resolveUnref(options.fields) : undefined,
      pagination: pagination.value,
    })

    if (!rest.hasErrors.value) {
      if (rest.data.value?.data) {
        resources.value = rest.data.value.data
      }

      if(options.persist) {
        if(options.persistBy === 'replace') {
          repo.flush()
          repo.save(normalize(resources.value))
        } else {
          repo[options.persistBy || 'save'](normalize(resources.value))
        }
      }

      if (rest.data.value?.meta?.pagination) {
        paginationState.value = rest.data.value?.meta?.pagination
      }

      onFetchCallbacks.value.forEach(callback => {
        if (rest.data.value) {
          callback(rest.data.value)
        }
      })
    } else {
      if(errorNotifier) errorNotifier({ entityType: entity })
    }
  }

  if (options.immediate) {
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
