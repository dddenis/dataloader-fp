import OriginalDataLoader from 'dataloader';
import { either, readonlyArray, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { Reader } from 'fp-ts/Reader';
import type { BatchLoadFn, DataLoaderEnv } from './types';

export function mkDataLoaderEnv(): DataLoaderEnv {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataLoaderCache = new Map<unknown, Reader<any, OriginalDataLoader<any, any>>>();

  return {
    getDataLoader: ({ batchLoad, key, options }) => {
      const cacheKey = key != null ? key : batchLoad;

      let dataLoader = dataLoaderCache.get(cacheKey);

      if (!dataLoader) {
        dataLoader = mkOriginalDataLoader(batchLoad, options);
        dataLoaderCache.set(cacheKey, dataLoader);
      }

      return dataLoader;
    },
  };
}

function mkOriginalDataLoader<R, E extends Error, K, A, C = K>(
  batchLoad: BatchLoadFn<R, E, K, A>,
  options?: OriginalDataLoader.Options<K, A, C>,
): Reader<R, OriginalDataLoader<K, A, C>> {
  let originalDataLoader: OriginalDataLoader<K, A, C>;

  return (env) => {
    if (!originalDataLoader) {
      originalDataLoader = new OriginalDataLoader<K, A, C>((keys) => {
        return pipe(
          batchLoad(keys)(env),
          taskEither.map(readonlyArray.map(either.toUnion)),
          taskEither.getOrElse((error) => () => Promise.reject(error)),
        )();
      }, options);
    }

    return originalDataLoader;
  };
}
