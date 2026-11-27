import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { runAssistantChat, aiChatBodySchema } from '../services/ai.service';

const router = Router();

router.post('/chat', requireAuth, async (req, res) => {
  const input = aiChatBodySchema.parse(req.body);
  const result = await runAssistantChat(input.messages, {
    userId: req.auth!.userId,
    role: req.auth!.role
  });
  res.json({ success: true, data: result });
});

export default router;
