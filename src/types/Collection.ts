import { Model } from 'shared/types/Model'
import { Resource } from './Resource'

export type Collection<ModelType extends Model> = Resource<ModelType>[]
  & { attributes?: { count?: number } }
