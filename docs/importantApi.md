# 本文主要帮助大家全面掌握saga关键的api，组建完整的异步处理流程
- takeEvery
这是一个最常见的api，上文提到过，用来监听主流程的action。
```
function* watchFetchData() {
  yield* takeEvery('FETCH_REQUESTED', fetchData)
}
```
注：takeEvery 允许多个 fetchData 实例同时启动。在某个特定时刻，尽管之前还有一个或多个 fetchData 尚未结束，我们还是可以启动一个新的 fetchData 任务
```
function* watchFetchData() {
  yield* takeEvery('FETCH_REQUESTED', fetchData)
  yield* takeEvery('DELETE_REQUESTED', fetchData)
}
```

-takeLatest
如果我们只想得到最新那个请求的响应（例如，始终显示最新版本的数据）。我们可以使用 takeLatest 辅助函数。
```
import { takeLatest } from 'redux-saga'

function* watchFetchData() {
  yield* takeLatest('FETCH_REQUESTED', fetchData)
}
```

