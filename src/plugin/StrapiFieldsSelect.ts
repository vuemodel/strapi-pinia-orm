import { Model } from "../types/Model"

export type StrapiFieldsSelect<ModelType extends Model> = [keyof ModelType]
