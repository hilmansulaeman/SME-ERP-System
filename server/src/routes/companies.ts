import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Companies route - to be implemented' });
});

export default router;
