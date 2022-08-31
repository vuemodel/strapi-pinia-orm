import { Model } from "./Model"

export interface Resource<ModelType extends Model> {
  id: number
  attributes: ModelType
}
