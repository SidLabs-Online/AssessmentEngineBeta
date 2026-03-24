import { createApp } from './app.js'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'

export async function startServer() {
  await connectDatabase()

  const app = createApp()

  app.listen(env.port, () => {
    console.info(`[server] server started on port ${env.port}`)
  })

  return app
}
