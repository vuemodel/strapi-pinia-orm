import { Model } from './Model'
import { Resource } from './Resource'

export interface ResourceNode<ModelType extends Model> {
  data: Resource<ModelType>
}
