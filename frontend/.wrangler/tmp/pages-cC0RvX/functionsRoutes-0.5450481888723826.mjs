import { onRequest as __admin___path___js_onRequest } from "C:\\Users\\admin\\Documents\\code\\codebase-auditor\\frontend\\functions\\admin\\[[path]].js"
import { onRequest as __api___path___js_onRequest } from "C:\\Users\\admin\\Documents\\code\\codebase-auditor\\frontend\\functions\\api\\[[path]].js"
import { onRequest as __auth___path___js_onRequest } from "C:\\Users\\admin\\Documents\\code\\codebase-auditor\\frontend\\functions\\auth\\[[path]].js"

export const routes = [
    {
      routePath: "/admin/:path*",
      mountPath: "/admin",
      method: "",
      middlewares: [],
      modules: [__admin___path___js_onRequest],
    },
  {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  {
      routePath: "/auth/:path*",
      mountPath: "/auth",
      method: "",
      middlewares: [],
      modules: [__auth___path___js_onRequest],
    },
  ]