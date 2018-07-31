# saga的基本流程介绍
saga本身就是redux的一个中间件，用来处理异步逻辑。
所以第一步就是引入'redux-saga'库的createSagaMiddleware方法，用来生成saga实例。

- 创建一个 Saga middleware 和要运行的 Saga
- 将这个 Saga middleware 连接至 Redux store

```
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

//...
import { incrementAsync } from './sagas'

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
    reducer,
    applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(incrementAsync);
```
## saga作为中间件注入完成后，我们可以开始做异步调用了。
这里我们用延迟1秒来模拟api调用。在组件里，dispatch对应的action来触发saga的逻辑
```
function render() {
  ReactDOM.render(
    <Counter
      value={store.getState()}
      onIncrement={() => action('INCREMENT')}
      onDecrement={() => action('DECREMENT')}
      onIncrementAsync={() => action('INCREMENT_ASYNC')} />,
    document.getElementById('root')
  )
}
```
与 redux-thunk 不同，上面组件 dispatch 的是一个 plain Object 的 action。现在react的组件dispatch了action，接下来我们需要在saga内部监听这个action，进行响应逻辑。
```
// Our worker Saga: 将执行异步的 increment 任务
export function* incrementAsync() {
  yield delay(1000)
  yield put({ type: 'INCREMENT' })
}

// Our watcher Saga: 在每个 INCREMENT_ASYNC action spawn 一个新的 incrementAsync 任务
export function* watchIncrementAsync() {
  yield takeEvery('INCREMENT_ASYNC', incrementAsync)
}
```
上面的逻辑很简单，saga会监听INCREMENT_ASYNC，并在接收到INCREMENT_ASYNC时，触发incrementAsync函数，执行异步逻辑。watchIncrementAsync会export到启动文件，项目初始化时注入到saga中间件，这样一个简单的saga流程就搭建好了。

