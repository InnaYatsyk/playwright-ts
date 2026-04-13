export type DataSet<T> = readonly T[];

export function withData<T>(dataset: DataSet<T>): T[] {
  return [...dataset];
}
