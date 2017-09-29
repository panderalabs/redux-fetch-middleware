Redux Fetch Middleware
=============

```js
npm install --save @panderasystems/redux-fetch-middleware
npm install --save whatwg-fetch // It's assumed that fetch is available on the client you're using
```

## Why Do I Need This?

This middleware allows you to dispatch actions that trigger an API fetch call, in the process dispatching new actions when the transaction has started, completed successfully, or failed.

Instead of doing this:

```js
const FOO_FETCH_SUCCESS = 'FETCH_FOO_SUCCESS';
function fooFetchSuccess(result) {
  return {
    type: FOO_FETCH_SUCCESS,
    payload: result,
  };
}

const FOO_FETCH_FAILURE = 'FETCH_FOO_FAILURE';
function fooFetchFailure(err) {
  return {
    type: FOO_FETCH_FAILURE,
    payload: err,
    error: true,
  };
}

const FOO_FETCH_STARTED = 'FETCH_FOO_STARTED';
function fooFetchStarted() {
  return {
    type: FOO_FETCH_STARTED,
  };
}

function fetchFoo() {
  return (dispatch, getState) => {
    dispatch(fooFetchStarted());
    const token = getState().user.token;
    fetch('/api/foo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return result.json();
    })
    .then(result => dispatch(fooFetchSuccess(result)))
    .catch(err => dispatch(fooFetchFailure(err)))
  };
}
```

You can now do this:

```js
const FOO_FETCH = 'FOO_FETCH';
function fetchFoo() {
  return {
    type: 'FOO_FETCH',
    meta: {
      type: '@api',
      method: 'GET',
      url: '/foo'
    }
  }
}
```



## How do I use it

Any time you create an action with a meta object with type `@api`, the middleware will automatically make a fetch call using the `method` and `url` also defined on your meta object.

```js
const FOO_FETCH = 'FOO_FETCH';

function getFoo() {
  return {
    type: FOO_FETCH,
    meta: {
      type: '@api',
      method: 'GET',
      url: '/foo',
    }
  };
}
```

## Installation

```
npm install --save @panderasystems/redux-fetch-middleware
```

Too enable it in your project, use [`applyMiddleware()`](http://redux.js.org/docs/api/applyMiddleware.html):

```js
import { createStore, applyMiddleware } from 'redux';
import createFetchMiddleware from '@panderasystems/redux-fetch-middleware';
import rootReducer from './reducers/index';

const store = createStore(
  rootReducer,
  applyMiddleware(createFetchMiddleware())
);
```

### Available options

When creating the middlware, you have a couple of options available:

```js
import createFetchMiddleware from '@panderasystems/redux-fetch-middleware';

const fetchMiddleware = createFetchMiddleware(
  state => state.user.token, // A selector to get the Authorization token out of the redux state
  '/api', // The base URL for your api- This can be a fully-qualified URL or just a path
)
```

## More examples

```js
// Posting data
const FOO_POST = 'FOO_FETCH';
function postFoo(data) {
  return {
    type: 'FOO_POST',
    payload: data,
    meta: {
      type: '@api',
      method: 'POST',
      url: '/foo'
    }
  }
}

// Other configs:
function postFoo() {
  type: 'FOO_POST',
  payload: data,
  meta: {
    type: '@api',
    url: '/foo',
    method: 'GET', // optional: default to GET
    config: { // optional: Supports any configuration that can be passed into fetch
      // Note: method and body will be overwritten by the method and payload passed into the meta object
      headers: {
        'Content-Type': 'application/json',
        credentials: 'same-origin', // Used to send across cookies
      }
    }
  }
}

```
