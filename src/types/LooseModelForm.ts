import { Model } from "./Model"

export type LooseModelForm<ModelType extends Model> =
  Partial<{ [Key in keyof ModelType]: ModelType[Key] | number | number[] }> &
  Record<string, unknown>
