import { TasksController } from "#controllers/tasks.controller.js";
import { authenticateToken, verifyRefreshToken } from "#root/middleware/authentication.js";

export const TasksRoutes = (fastify, options, done) => {
  fastify.get("/tasks/:userId/list", { preHandler: authenticateToken }, TasksController.GetTasksByUserId);
  fastify.get("/tasks/:userId/:taskId", TasksController.GetTaskById);
  fastify.post("/tasks/:userId", TasksController.CreateTask);
  fastify.put("/tasks/:userId/:taskId", TasksController.UpdateTaskById);
  fastify.delete("/tasks/:userId/:taskId", TasksController.DeleteTaskById);

  done();
}