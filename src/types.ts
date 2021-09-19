import type OriginalDataLoader from 'dataloader';
import type { Either } from 'fp-ts/Either';
import type { Reader } from 'fp-ts/Reader';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';

export interface DataLoaderEnv {
  readonly getDataLoader: <R, E extends Error, K, A, C = K>(
    input: DataLoaderConfig<R, E, K, A, C>,
  ) => Reader<R, OriginalDataLoader<K, A, C>>;
}

export type DataLoaderConfig<R, E extends Error, K, A, C = K> = {
  batchLoad: BatchLoadFn<R, E, K, A>;
  key?: unknown;
  options?: OriginalDataLoader.Options<K, A, C>;
};

export type BatchLoadFn<R, E extends Error, K, A> = (
  keys: ReadonlyArray<K>,
) => ReaderTaskEither<R, E, ReadonlyArray<Either<E, A>>>;
