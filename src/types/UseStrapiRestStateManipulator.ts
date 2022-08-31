import { Collection } from "./Collection"
import { Model } from "./Model"
import { Resource } from "./Resource"

export interface UseStrapiRestStateManipulator {
  insert: (entity: string, record: Resource<Model> | Collection<Model>) => void
  replace: (entity: string, record: Resource<Model> | Collection<Model>) => void
  remove: (entity: string, record: Resource<Model>) => void
}
