import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { createApp } from '../app.js'

test('POST /api/auth/login authenticates the seeded demo user', async () => {
  const app = createApp()

  const response = await request(app).post('/api/auth/login').send({
    email: 'candidate@sidlabs.com',
    password: 'SidLabs@2026',
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.user.email, 'candidate@sidlabs.com')
  assert.match(response.headers['set-cookie'][0], /assessment_token=/)
})

test('POST /api/auth/login rejects invalid credentials', async () => {
  const app = createApp()

  const response = await request(app).post('/api/auth/login').send({
    email: 'candidate@sidlabs.com',
    password: 'wrong-pass',
  })

  assert.equal(response.statusCode, 401)
  assert.equal(response.body.message, 'Invalid email or password.')
})

test('GET /api/auth/session requires an authenticated cookie', async () => {
  const app = createApp()

  const response = await request(app).get('/api/auth/session')

  assert.equal(response.statusCode, 401)
  assert.equal(response.body.message, 'Authentication required.')
})
