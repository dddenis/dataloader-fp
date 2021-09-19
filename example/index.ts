import { BatchLoadFn, DataLoaderEnv, getDataLoader } from '@dddenis/dataloader-fp';
import { either } from 'fp-ts';
import type { Either } from 'fp-ts/Either';
import type { Reader } from 'fp-ts/Reader';
import type { ReaderTask } from 'fp-ts/ReaderTask';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';

type Env = {
  log: (message: string) => void;
};

type Entity = {
  x: number;
};

declare const batchLoad: BatchLoadFn<Env, Error, string, Entity>;

const dataLoader = getDataLoader({
  batchLoad,
});

const load: ReaderTaskEither<Env & DataLoaderEnv, Error, Entity> = dataLoader.load('id_001');

const loadMany: ReaderTask<
  Env & DataLoaderEnv,
  ReadonlyArray<Either<Error, Entity>>
> = dataLoader.loadMany(['id_001', 'id_002']);

const clear: Reader<Env & DataLoaderEnv, void> = dataLoader.clear('id_001');

const clearAll: Reader<Env & DataLoaderEnv, void> = dataLoader.clearAll();

const prime: Reader<Env & DataLoaderEnv, Either<Error, Entity>> = dataLoader.prime('id_001')(
  either.right({ x: 42 }),
);

// If you have a constant reference to the batch load function,
// it is used as a cache key for the internal DataLoader.
// `dataLoaderA` and `dataLoaderB` share cache

const dataLoaderA = getDataLoader({
  batchLoad,
});

const dataLoaderB = getDataLoader({
  batchLoad,
});

// If you don't have access to same batch load function reference,
// you can use explicit cache key to share internal DataLoader.
// `dataLoaderC` and `dataLoaderD` share cache

declare function mkBatchLoadFn(input: string): BatchLoadFn<Env, Error, string, Entity>;

const key = 'unique-key';

const dataLoaderC = getDataLoader({
  batchLoad: mkBatchLoadFn('something'),
  key,
});

const dataLoaderD = getDataLoader({
  batchLoad: mkBatchLoadFn('something-else'),
  key,
});
