const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readToken } = require('./sentry-render-test');

test('reads a complete generated token and ignores comments and CRLF', () => {
  const token = 'ab'.repeat(32);
  assert.equal(readToken(`# private\r\nSENTRY_TEST_TOKEN=${token}\r\n`), token);
});
test('rejects missing, truncated and malformed tokens without exposing contents', () => {
  for (const input of ['', 'SENTRY_TEST_TOKEN=private-secret', `SENTRY_TEST_TOKEN=${'a'.repeat(63)}`, `SENTRY_TEST_TOKEN=${'z'.repeat(64)}`]) {
    assert.throws(() => readToken(input), (error) => !error.message.includes('private-secret'));
  }
});
