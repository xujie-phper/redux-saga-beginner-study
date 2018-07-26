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


