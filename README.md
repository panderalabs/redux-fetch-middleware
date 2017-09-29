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

It's intended to use as a way to communicate with your primary, authenticated (using the Authorization header) api. If you want to communicate with 3rd party apis, you can overwrite the authorization header and any other configs by passing in a config object with the headers defined.


## How do I use it

Any time you create an action with a meta object with type `@api`, the middleware will automatically make a fetch call using the `method` and `url` also defined on your meta object. If you're making a POST request, the payload from your action will be set as the body in the request.

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

When creating the middleware, you have a couple of options available:

```js
import createFetchMiddleware from '@panderasystems/redux-fetch-middleware';

const fetchMiddleware = createFetchMiddleware(
  state => state.user.token, // A selector to get the Authorization token out of the redux state
  '/api', // The base URL for your api- This can be a fully-qualified URL or just a path
)
```

## More Details

```js
// Posting data
const FOO_POST = 'FOO_POST';
function postFoo(data) {
  return {
    type: FOO_POST,
    payload: data, // payload is set as the body of the request
    meta: {
      type: '@api',
      method: 'POST',
      url: '/foo'
    }
  }
}

// Other configs:
function postFoo(data) {
  type: FOO_POST,
  payload: data,
  meta: {
    type: '@api',
    url: '/foo',
    method: 'GET', // optional: defaults to GET
    config: { // optional: Supports any configuration that can be passed into fetch
      // Note: method and body will be overwritten by the method and payload passed into the meta object
      headers: {
        'Content-Type': 'application/json',
        credentials: 'same-origin', // Used to send across cookies
      }
    }
  }
}

function getExternalResource() {
  type: 'EXTERNAL_GET',
  meta: {
    type: '@api',
    url: 'http://example.com/api/foos',
    config: {
      headers: {
        Authorization: null // Will overwrite the default authorization header
      }
    }
  }
}
```

A Promise is always returned from the dispatch of this action and will be resolved/rejected once the API call is completed. If you want to chain your api calls, feel free to do that!

```js
dispatch(getFoo())
  .then(dispatch(postFoo({foo: 'bar'})))
  .then(dispatch(getExternalResource()))
  // It's not necessary to catch this error as the FAILURE action will be dispatched automatically
  .catch((err) => console.log('Error in the chain'))
```
