# 这里我们介绍多任务的并行处理
### 多任务并行处理

yield会中断generator，一步一步的执行。如果，我们想同时执行多个任务，请求多个接口，可以这么操作：

```
import { call } from 'redux-saga/effects'

// 正确写法, effects 将会同步执行
const [users, repos] = yield [
  call(fetch, '/users'),
  call(fetch, '/repos')
]
```
当我们需要 yield 一个包含 effects 的数组， generator 会被阻塞直到所有的 effects 都执行完毕，或者当一个 effect 被拒绝 （就像 Promise.all 的行为）。
### 多在多个 Effects 之间启动 race
有时候我们同时启动多个任务，但又不想等待所有任务完成，我们只希望拿到 胜利者：即第一个被 resolve（或 reject）的任务。 race Effect 提供了一个方法，在多个 Effects 之间触发一个竞赛（race）。

下面的示例演示了触发一个远程的获取请求，并且限制了 1 秒内响应，否则作超时处理。

```
import { race, call, put } from 'redux-saga/effects'
import { delay } from 'redux-saga'

function* fetchPostsWithTimeout() {
  const {posts, timeout} = yield race({
    posts: call(fetchApi, '/posts'),
    timeout: call(delay, 1000)
  })

  if (posts)
    put({type: 'POSTS_RECEIVED', posts})
  else
    put({type: 'TIMEOUT_ERROR'})
}
```
掌握到这里，处理一般的业务功能都应该没问题了。剩下的就是在实践中慢慢领悟。下面我们会集中聊聊saga的单元测试，作为进阶。
