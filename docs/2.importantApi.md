# 本文主要帮助大家全面掌握saga关键的api，组建完整的异步处理流程
- **takeEvery**

这是一个最常见的api，上文提到过，用来监听主流程的action。

```
function* watchFetchData() {
  yield* takeEvery('FETCH_REQUESTED', fetchData)
}
```
注：takeEvery 允许多个 fetchData 实例同时启动。在某个特定时刻，尽管之前还有一个或多个 fetchData 尚未结束，我们还是可以启动一个新的 fetchData 任务。

```
function* watchFetchData() {
  yield* takeEvery('FETCH_REQUESTED', fetchData)
  yield* takeEvery('DELETE_REQUESTED', fetchData)
}
```

- **takeLatest**

如果我们只想得到最新那个请求的响应（例如，始终显示最新版本的数据）。我们可以使用 takeLatest 辅助函数。

```
import { takeLatest } from 'redux-saga'

function* watchFetchData() {
  yield* takeLatest('FETCH_REQUESTED', fetchData)
}
```
- **call**

call仅仅只是创建一条描述函数调用的信息。

```
// Effect -> 调用 Api.fetch 函数并传递 `./products` 作为参数
{
  CALL: {
    fn: Api.fetch,
    args: ['./products']
  }
}
```
语义和js里面绑定函数this的call类似，用指定的参数去执行当前的函数

```
import { call } from 'redux-saga/effects'

function* fetchProducts() {
  const products = yield call(Api.fetch, '/products')
  // ...
}
```
call 同样支持调用对象方法，你可以使用以下形式，为调用的函数提供一个 this 上下文：

```
yield call([obj, obj.method], arg1, arg2, ...) // 如同 obj.method(arg1, arg2 ...)
```
这主要是为了方便测试generator的流程，其实功能实现上，完全可以这么写：

```
function* fetchProducts() {
  const products = yield Api.fetch('/products')
  console.log(products)
}
```
但是在做单元测试的时候，没法比较返回值。关于单元测试的细节，后面会讲解，这里了解下即可。

- **put**

put用来发起action到store中，上面我们通过call调用了API接口，获取了数据，需要把数据存储到store中。其实功能上完全可以这么写：

```
function* fetchProducts(dispatch)
  const products = yield call(Api.fetch, '/products')
  dispatch({ type: 'PRODUCTS_RECEIVED', products })
}
```
但是，问题还是不方便测试，测试时无法真实模拟一个dispatch函数，所以引入了put。

```
import { call, put } from 'redux-saga/effects'
//...

function* fetchProducts() {
  const products = yield call(Api.fetch, '/products')
  // 创建并 yield 一个 dispatch Effect
  yield put({ type: 'PRODUCTS_RECEIVED', products })
}
```
**总结** : call用来处理异步逻辑，比如调用接口，put用于数据获取，更新后，发起action到store中，更新state。call和put都是为了测试generator逻辑而引入的，模拟真实的函数调用，返回一个plain javascript对象，方便测试。
***
**以上就是构建基本saga工作流需要用的概念，下面逐步介绍下复杂逻辑所涉及的api**
***
- **take**

take 就像我们更早之前看到的 call 和 put。它创建另一个命令对象，告诉 middleware 等待一个特定的 action

```
function* watchAndLog() {
  while (true) {
    const action = yield take('*')
    const state = yield select()

    console.log('action', action)
    console.log('state after', state)
  }
}
```
与call一样，take也会暂停generator，直到监听的action被发起，这里我们监听任何action。

- **fork**

当我们 fork 一个 任务，任务会在后台启动，调用者也可以继续它自己的流程，而不用等待被 fork 的任务结束。是无阻塞版的call函数。

举个简单的实例，我们模拟下用户登陆的行为：

```
import { take, call, put } from 'redux-saga/effects'
import Api from '...'

function* authorize(user, password) {
  try {
    const token = yield call(Api.authorize, user, password)
    yield put({type: 'LOGIN_SUCCESS', token})
    return token
  } catch(error) {
    yield put({type: 'LOGIN_ERROR', error})
  }
}

function* loginFlow() {
  while(true) {
    const {user, password} = yield take('LOGIN_REQUEST')
    const token = yield call(authorize, user, password)
    if(token) {
      yield call(Api.storeItem({token}))
      yield take('LOGOUT')
      yield call(Api.clearItem('token'))
    }
  }
}
```
上面的逻辑是用户登陆，调用接口进行身份验证获取用户token，验证通过后，我们监听LOGOUT行为，暂停登陆流程，等待登出行为，匹配时则进行清理逻辑。
好像很正常，没什么问题。但是我们没有考虑请求失败和异步调用阻塞的问题。所以，我们必须完善下上面的流程代码。

1. 首先是阻塞问题，generator在`yield call(authorize, user, password)`此处等待，如果用户此时点击登出，代码还没有执行到`yield take('LOGOUT')`无法响应登出行为，就出错了。所以，我们不能让流程在验证接口时阻塞，所以需要引进一个新的函数**fork**来替代阻塞的**call**。如果在接口调用过程中，用户登出，我们就取消验证任务。
2. 现在加上接口容错处理，只需要加上错误处理逻辑就行，监听一个请求失败action。`yield take(['LOGOUT', 'LOGIN_ERROR'])`

进行补充后的完整业务逻辑就完成了：

```
import { take, put, call, fork, cancel } from 'redux-saga/effects'

// ...

function* loginFlow() {
  while(true) {
    const {user, password} = yield take('LOGIN_REQUEST')
    // fork return a Task object
    const task = yield fork(authorize, user, password)
    const action = yield take(['LOGOUT', 'LOGIN_ERROR'])
    if(action.type === 'LOGOUT')
      yield cancel(task)
    yield call(Api.clearItem('token'))
  }
}
```
注：上面api函数的使用的返回值，不用太在意，都是plain javascript对象，方便进行流程测试。
