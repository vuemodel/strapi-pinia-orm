import { Model } from "./Model"

type FieldValue = string | number | null

export type StrapiFilterOperator = '$eq' |
    '$ne' |
    '$lt' |
    '$lte' |
    '$gt' |
    '$gte' |
    '$in' |
    '$notIn' |
    '$contains' |
    '$notContains' |
    '$containsi' |
    '$notContainsi' |
    '$null' |
    '$notNull' |
    '$between' |
    '$startsWith' |
    '$endsWith' |
    '$or' |
    '$and'

export type StrapiFilterOperatorObject = Record<'$eq', FieldValue | boolean>
  | Record<'$ne', FieldValue>
  | Record<'$lt', number>
  | Record<'$lte', number>
  | Record<'$gt', number>
  | Record<'$gte', number>
  | Record<'$in', FieldValue[]>
  | Record<'$notIn', FieldValue[]>
  | Record<'$contains', FieldValue>
  | Record<'$notContains', FieldValue>
  | Record<'$containsi', FieldValue>
  | Record<'$notContainsi', FieldValue>
  | Record<'$null', boolean>
  | Record<'$notNull', boolean>
  | Record<'$between', [string, string] | [number, number]>
  | Record<'$startsWith', string>
  | Record<'$endsWith', string>

export type StrapiOrFilter = Record<'$or', Record<string, StrapiFilterOperatorObject>[]>
export type StrapiAndFilter = Record<'$and', Record<string, StrapiFilterOperatorObject>[]>

// | Partial<{ [Property in keyof ModelType]: StrapiFilter | { [key: string]: StrapiFilter } }>

export type StrapiFilterRelated = Partial<{
  // must have a model key
  [key: string]:
    // Basic filter (like $eq)
    StrapiFilterOperatorObject |
    //
    StrapiFilterRelated
}>

type RootStrapiFilterObject<ModelType extends Model> = Partial<{
  // must have a model key
  [Property in keyof ModelType]:
    // Basic filter (like $eq)
    StrapiFilterOperatorObject |
    //
    StrapiFilterRelated
}>

export type StrapiFiltersObject<ModelType extends Model> =
  | Record<'$or', RootStrapiFilterObject<ModelType>[]>
  | Record<'$and', RootStrapiFilterObject<ModelType>[]>
  | RootStrapiFilterObject<ModelType>
