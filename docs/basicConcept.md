# saga的基本流程介绍
saga本身就是redux的一个中间件，用来处理一步逻辑。
所以第一步就是引入'redux-saga'库的createSagaMiddleware方法，用来生成saga实例。

-创建一个 Saga middleware 和要运行的 Sagas
-将这个 Saga middleware 连接至 Redux store

```
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

//...
import { helloSaga } from './sagas'

const store = createStore(
  reducer,
  applyMiddleware(createSagaMiddleware(helloSaga))
)
```
#saga作为中间件注入完成后，我们可以开始做异步调用了
这里我们用延迟1秒来模拟api调用。在组件里，dispatch相应的action来出发saga的逻辑
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
与 redux-thunk 不同，上面组件 dispatch 的是一个 plain Object 的 action。现在react的组件dispatch了action，接下来我们需要去在saga内部监听这个action，作出响应处理。
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
上面的逻辑很简单，saga接收到INCREMENT_ASYNC的action时，触发incrementAsync函数，执行异步逻辑。watchIncrementAsync会export到启动文件，初始化时注入到saga中间件，这样一个简单的saga流程就搭建好了。

