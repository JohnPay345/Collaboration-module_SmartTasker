import { UserController } from "#controllers/user.controller.js";
import { authenticateToken, verifyRefreshToken } from "#root/middleware/authentication.js";
import { uploadAvatars } from "#root/service/multer.js";

export const UserRoutes = (fastify, options, done) => {
  fastify.post("/register", UserController.register);
  fastify.post("/login", UserController.login);
  fastify.get("/users", { preHandler: authenticateToken }, UserController.getAllUsers);
  fastify.get("/users/:userId", { preHandler: [authenticateToken, uploadAvatars.single("avatar")] }, UserController.getUserById);
  fastify.get("/users/:userId/stats", { preHandler: authenticateToken }, UserController.getUserStats);
  fastify.put("/users/:userId", { preHandler: [authenticateToken, uploadAvatars.single("avatar")] }, UserController.updateUser);
  fastify.delete("/users/:userId", { preHandler: authenticateToken }, UserController.deleteUser);
  fastify.get("/updateTokens/:userId", { preHandler: verifyRefreshToken }, UserController.updateTokens)

  done();
}