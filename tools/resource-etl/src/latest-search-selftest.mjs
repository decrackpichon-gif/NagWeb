import assert from 'node:assert/strict';
import { createLatestSearch } from './runtime/latest-search.mjs';
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const tasks = [];
const applied = [];
const errors = [];
let busy = false;
let finished = 0;
const search = createLatestSearch(
  filters => { const task = deferred(); tasks.push({ filters, ...task }); return task.promise; },
  { onStart: () => { busy = true; }, onResult: data => applied.push(data),
    onError: error => errors.push(error.message), onFinish: () => { busy = false; finished++; } }
);
const oldRequest = search.run({ query: 'old' });
const newRequest = search.run({ query: 'new' });
tasks[1].resolve('new result');
await newRequest;
assert.deepEqual(applied, ['new result']);
assert.equal(busy, false);
tasks[0].resolve('old result');
await oldRequest;
assert.deepEqual(applied, ['new result'], 'Late older responses cannot overwrite current results');
assert.equal(finished, 1, 'Old requests cannot clear busy state');

const pendingRequest = search.run({ query: 'typing' });
search.invalidate();
tasks[2].resolve('stale while debounce is pending');
await pendingRequest;
assert.deepEqual(applied, ['new result'], 'Typing invalidates active searches immediately');
const latest = search.run({ query: 'latest' });
tasks[3].resolve('latest result');
await latest;
assert.deepEqual(applied, ['new result', 'latest result']);
assert.equal(busy, false);

const invalid = search.run({ query: 'old failure' });
const valid = search.run({ query: 'active failure' });
tasks[4].reject(Error('obsolete failure'));
await invalid;
assert.deepEqual(errors, []);
tasks[5].reject(Error('visible failure'));
await valid;
assert.deepEqual(errors, ['visible failure']);
assert.equal(busy, false, 'Failures cannot leave the grid permanently busy');
const recovery = search.run({ query: 'recovery' });
tasks[6].resolve('recovered');
await recovery;
assert.equal(applied.at(-1), 'recovered');
assert.equal(busy, false);
console.log('Latest-search race, cancellation, rejection and recovery: OK');
