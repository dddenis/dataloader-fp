import type OriginalDataLoader from 'dataloader';
import { either, readonlyArray, taskEither } from 'fp-ts';
import type { Either } from 'fp-ts/Either';
import { identity, pipe } from 'fp-ts/function';
import type { Reader } from 'fp-ts/Reader';
import type { ReaderTask } from 'fp-ts/ReaderTask';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import type { DataLoaderConfig, DataLoaderEnv } from './types';

export interface DataLoader<R extends DataLoaderEnv, E extends Error, K, A> {
  readonly load: (key: K) => ReaderTaskEither<R, E, A>;
  readonly loadMany: (keys: ReadonlyArray<K>) => ReaderTask<R, ReadonlyArray<Either<E, A>>>;
  readonly clear: (key: K) => Reader<R, void>;
  readonly clearAll: () => Reader<R, void>;
  readonly prime: (key: K) => (value: Either<E, A>) => Reader<R, Either<E, A>>;
}

export function getDataLoader<R, E extends Error, K, A, C = K>(
  config: DataLoaderConfig<R, E, K, A, C>,
): DataLoader<R & DataLoaderEnv, E, K, A> {
  const withDataLoader =
    <B>(f: (dataLoader: OriginalDataLoader<K, A, C>) => B) =>
    (env: R & DataLoaderEnv): B =>
      f(env.getDataLoader(config)(env));

  return {
    load: (key) =>
      withDataLoader((dataLoader) => {
        return taskEither.tryCatch(() => dataLoader.load(key), identity as (x: unknown) => E);
      }),

    loadMany: (keys) =>
      withDataLoader((dataLoader) => async () => {
        return pipe(
          // error catching here is handled by DataLoader
          // https://github.com/graphql/dataloader/blob/6cbe82e1fd9609dd6e1b2b8374fbf37a3e403c49/src/index.js#L144
          (await dataLoader.loadMany(keys)) as ReadonlyArray<A | E>,
          readonlyArray.map((valueOrError) =>
            valueOrError instanceof Error ? either.left(valueOrError) : either.right(valueOrError),
          ),
        );
      }),

    clear: (key) =>
      withDataLoader((dataLoader) => {
        dataLoader.clear(key);
      }),

    clearAll: () =>
      withDataLoader((dataLoader) => {
        dataLoader.clearAll();
      }),

    prime: (key) => (value) =>
      withDataLoader((dataLoader) => {
        dataLoader.clear(key).prime(key, either.toUnion(value));
        return value;
      }),
  };
}
