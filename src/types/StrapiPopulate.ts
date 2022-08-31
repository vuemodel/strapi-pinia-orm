import { Model } from './Model'
import { StrapiFilterRelated } from './StrapiFilters'

export type StrapiPopulateArray<ModelType extends Model> = [keyof ModelType]

export type StrapiPopulateEntry = Partial<{
  // at this point the relationship key is unknown, so any string
  [key: string]: {
    populate?: string[] | StrapiPopulateEntry
    sort?: string[]
    filters?: StrapiFilterRelated
    fields?: string[]
    count?: boolean
  } | '*'
}>

export type RootStrapiPopulateEntry<ModelType extends Model> = Partial<{
  // must have a model key
  [Property in keyof ModelType]: {
    populate?: string[] | StrapiPopulateEntry
    sort?: string[]
    filters?: StrapiFilterRelated
    fields?: string[]
    count?: boolean
  }
}>

export type StrapiPopulate<ModelType extends Model> =
  StrapiPopulateArray<ModelType>
  | RootStrapiPopulateEntry<ModelType>
