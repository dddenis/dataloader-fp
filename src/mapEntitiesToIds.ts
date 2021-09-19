import { option, readonlyArray, readonlyRecord, semigroup } from 'fp-ts';
import { pipe } from 'fp-ts/function';

export function mapEntitiesToIds<A, B, K extends string = string>(
  getId: (entity: A) => K,
  onNone: (id: K) => B,
  onSome: (entity: A) => B,
  ids: ReadonlyArray<K>,
) {
  return (entities: ReadonlyArray<A>): ReadonlyArray<B> => {
    const entitiesMap = readonlyRecord.fromFoldableMap(
      semigroup.first<A>(),
      readonlyArray.Foldable,
    )(entities, (entity) => [getId(entity), entity]);

    return ids.map((id) => {
      return pipe(
        readonlyRecord.lookup(id)(entitiesMap),
        option.fold(() => onNone(id), onSome),
      );
    });
  };
}
