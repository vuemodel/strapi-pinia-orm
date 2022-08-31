import { Model as PiniaOrmModel } from 'pinia-orm'

export class Model extends PiniaOrmModel {
  [k: string]: any;
  id: string | number | undefined
}
