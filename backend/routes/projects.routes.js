import { ProjectsController } from "#controllers/projects.controller.js";
import { authenticateToken, verifyRefreshToken } from "#root/middleware/authentication.js";

export const ProjectsRoutes = (fastify, options, done) => {
  fastify.get("/projects/:userId/list", { preHandler: authenticateToken }, ProjectsController.GetProjects);
  fastify.get("/projects/:userId/:projectId", { preHandler: authenticateToken }, ProjectsController.GetProjectById);
  fastify.post("/projects/:userId", { preHandler: authenticateToken }, ProjectsController.CreateProject);
  fastify.put("/projects/:userId/:projectId", { preHandler: authenticateToken }, ProjectsController.UpdateProjectById);
  fastify.delete("/projects/:userId/:projectId", { preHandler: authenticateToken }, ProjectsController.DeleteProjectById);

  done();
}