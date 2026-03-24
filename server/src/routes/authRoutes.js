import { Router } from 'express'
import { getSession, login, logout } from '../controllers/authController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/login', login)
router.get('/session', requireAuth, getSession)
router.post('/logout', logout)

export default router
