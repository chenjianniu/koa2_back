import Router from 'koa-router'
import requireDir from 'require-dir'

const controllers_v1 = requireDir('./controllers/api/v1')
const controllers_v2 = requireDir('./controllers/api/v2')

export function router_v1() {
  const router = new Router({ prefix: '/api/v1' })
  // 路由
  router.get('/user', controllers_v1.users.list)

  return router
}

export function router_v2() {
  const router = new Router({ prefix: '/api/v2' })
  // 路由
  router.get('/user', controllers_v2.users.list)

  return router
}
