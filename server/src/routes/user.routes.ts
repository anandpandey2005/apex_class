import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User.model';

const router = Router();

router.use(authenticate);

router
  .route('/')
  .get(getUsers)
  .post(authorizeRoles(UserRole.ADMIN), createUser);

router
  .route('/:id')
  .put(authorizeRoles(UserRole.ADMIN), updateUser)
  .delete(authorizeRoles(UserRole.ADMIN), deleteUser);

export default router;
