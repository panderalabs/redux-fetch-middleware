import test from 'tape';
import configureMockStore from 'redux-mock-store';
import nock from 'nock';

// TODO: Add more tests for redux functionality

import createFetchMiddleware, { actionTypeStarted, actionTypeSuccess, actionTypeFailure } from '../src/index';

test('actionTypeStarted method', (t) => {
  t.plan(2);
  t.equal(actionTypeStarted('FOO'), '@api/FOO/STARTED');
  t.equal(actionTypeStarted('BAR'), '@api/BAR/STARTED');
});

test('actionTypeSuccess method', (t) => {
  t.plan(2);
  t.equal(actionTypeSuccess('FOO'), '@api/FOO/SUCCESS');
  t.equal(actionTypeSuccess('BAR'), '@api/BAR/SUCCESS');
});

test('actionTypeFailure method', (t) => {
  t.plan(2);
  t.equal(actionTypeFailure('FOO'), '@api/FOO/FAILURE');
  t.equal(actionTypeFailure('BAR'), '@api/BAR/FAILURE');
});

test('fetchMiddleware acts on actions with type @api', (t) => {
  t.plan(1);
  nock('http://example.com')
    .get('/foo')
    .reply(200, 'OK!');
  const middlewares = [
    createFetchMiddleware(),
  ];

  const actions = [
    {
      type: 'FOO_GET',
      meta: {
        type: '@api',
        url: 'http://example.com/foo',
      },
    },
    {
      type: '@api/FOO_GET/STARTED',
    },
    {
      type: '@api/FOO_GET/SUCCESS',
      payload: 'OK!',
    },
  ];
  const store = configureMockStore(middlewares)();
  store
    .dispatch(actions[0])
    .then(() => {
      t.deepEqual(store.getActions(), actions);
    })
    .catch(err => t.fail(err));
});

test('fetchMiddleware handles failures by throwing an error', (t) => {
  t.plan(4);
  nock('http://example.com')
    .get('/error')
    .reply(404, 'Not Found');
  const middlewares = [
    createFetchMiddleware(),
  ];
  const action = {
    type: 'FOO_GET',
    meta: {
      type: '@api',
      url: 'http://example.com/error',
    },
  };

  const store = configureMockStore(middlewares)();
  store
    .dispatch(action)
    .then(() => {
      t.fail('Should have gotten an error');
    })
    .catch(() => {
      const actions = store.getActions();
      t.equal(actions.length, 3);
      t.equal(actions[2].type, '@api/FOO_GET/FAILURE');
      t.equal(actions[2].payload.code, 404);
      t.equal(actions[2].payload.message, 'Not Found');
    });
});
