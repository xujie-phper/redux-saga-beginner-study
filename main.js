import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';
import {createStore, applyMiddleware} from 'redux';
import createSagaMiddleware from 'redux-saga';

import Counter from './Counter';
import reducer from './reducers';

import rootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
    reducer,
    applyMiddleware(sagaMiddleware)
);

//必须在store生成之后
sagaMiddleware.run(rootSaga);

const action = type => store.dispatch({type});

function render() {
    ReactDOM.render(
        <Counter
            value={store.getState()}
            onIncrement={() => action('INCREMENT')}
            onIncrementAsync={() => action('INCREMENT_ASYNC')}
            onDecrement={() => action('DECREMENT')}/>,
        document.getElementById('root')
    )
}

render();
store.subscribe(render);
