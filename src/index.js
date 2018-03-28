import { createAction } from 'redux-actions';

export const API_FETCH_TYPE = '@api';

const defaultSelector = () => null;

export function actionTypeStarted(actionType) {
  return `${API_FETCH_TYPE}/${actionType}/STARTED`;
}

export function actionTypeSuccess(actionType) {
  return `${API_FETCH_TYPE}/${actionType}/SUCCESS`;
}

export function actionTypeFailure(actionType) {
  return `${API_FETCH_TYPE}/${actionType}/FAILURE`;
}

const sanitizeAction = (action) => {
  const stripBlankMeta = (a) => {
    if (!Object.keys(a.meta).length) {
      const { meta, ...rest } = a;
      return rest;
    }

    return a;
  };

  return ([
    stripBlankMeta,
  ].reduce((acc, sanitizer) => (
    sanitizer(acc)
  ), action));
};

const createFetchMiddleware = (
  tokenSelector = defaultSelector, // Defaults to returning null
  baseUrl = '',
) => ({ dispatch, getState }) => next => (action) => {
  if (!action.meta || action.meta.type !== API_FETCH_TYPE) {
    return next(action);
  }

  // Call next to allow this action to continue through redux
  // which allows us to see history, but don't return here, we have work to do!
  next(action);
  const state = getState();
  const { url, method = 'GET', config = {}, type, ...rest } = action.meta;
  const token = tokenSelector(state);

  let endpoint = url;
  if (!/https?:\/\//.test(url)) {
    endpoint = baseUrl + endpoint;
  }

  const baseHeaders = {
    Accept: 'application/json',
  };
  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  config.headers = Object.assign({}, baseHeaders, config.headers);
  config.method = method;

  if (action.payload) {
    config.body = JSON.stringify(action.payload);
    config.headers = Object.assign({}, config.headers, {
      'Content-Type': 'application/json',
    });
  }

  dispatch(createAction(actionTypeStarted(action.type))());

  return fetch(endpoint, config).then((response) => {
    if (!response.ok) {
      const err = new Error(response.statusText);
      err.code = response.status;
      err.message = response.statusText;
      err.response = response;

      dispatch(sanitizeAction(createAction(
        actionTypeFailure(action.type),
        ({ err: payload }) => payload,
        ({ meta }) => meta,
      )({ err, meta: { ...rest } })));

      return Promise.reject(err);
    }

    const contentType = response.headers.get('content-type');
    let resultPromise;

    if (/application\/json/.test(contentType)) {
      resultPromise = response.json();
    } else {
      resultPromise = response.text();
    }

    resultPromise.then(result => (
      dispatch(sanitizeAction(createAction(
        actionTypeSuccess(action.type),
        ({ result: payload }) => payload,
        ({ meta }) => meta,
      )({ result, meta: { ...rest } })))
    ));

    return resultPromise;
  });
};

export default createFetchMiddleware;
