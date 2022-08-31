import { Model } from './Model'
import { Resource } from './Resource'

export type Collection<ModelType extends Model> = Resource<ModelType>[]
  & { attributes?: { count?: number } }
