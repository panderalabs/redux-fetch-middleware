import { createAction } from 'redux-actions';
import 'isomorphic-fetch';

export const API_FETCH_TYPE = '@api';

const defaultSelector = x => x;

export function actionTypeStarted(actionType) {
  return `${API_FETCH_TYPE}/${actionType}/STARTED`;
}
export function actionTypeSuccess(actionType) {
  return `${API_FETCH_TYPE}/${actionType}/SUCCESS`;
}
export function actionTypeFailure(actionType) {
  return `${API_FETCH_TYPE}/${actionType}/FAILURE`;
}

const createFetchMiddleware = (
  tokenSelector = defaultSelector,
  baseUrl = '',
) => ({ dispatch, getState }) => next => (action) => {
  if (!action.meta || action.meta.type !== API_FETCH_TYPE) {
    return next(action);
  }
  next(action); //Finish dispatching this action so we see it in the history, but
  const state = getState();
  const { url, method = 'GET', config = {} } = action.meta;
  const token = tokenSelector(state);

  let endpoint = url;
  if (!/https?:\/\//.test(url)) {
    endpoint = baseUrl + endpoint;
  }

  const baseHeaders = {
    Authorization: token && `Bearer ${token}`,
    Accept: 'application/json',
  };

  config.headers = Object.assign({}, baseHeaders, config.headers);
  config.method = method;

  if (action.payload) {
    config.body = JSON.stringify(config.body);
  }
  dispatch(createAction(actionTypeStarted(action.type))());
  return fetch(endpoint, config).then((response) => {
    if (!response.ok) {
      const err = new Error(response.statusText);
      err.code = response.status;
      err.message = response.statusText;
      dispatch(createAction(actionTypeFailure(action.type))(err));
      return new Promise.reject(err);
    }

    const type = response.headers.get('content-type');
    let resultPromise;
    if (/application\/json/.test(type)) {
      resultPromise = response.json();
    } else {
      resultPromise = response.text();
    }
    resultPromise.then(result =>
      dispatch(createAction(actionTypeSuccess(action.type))(result))
    );
    return resultPromise;
  });
};

export default createFetchMiddleware;
