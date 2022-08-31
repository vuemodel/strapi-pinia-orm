import { Model } from './Model'
import { Collection } from './Collection'

export interface CollectionNode<ModelType extends Model> {
  data: Collection<ModelType>
  meta?: {
    pagination: {
      page: number
      pageCount: number
      pageSize: number
      total: number
    }
  }
}
