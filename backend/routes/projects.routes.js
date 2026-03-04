import { ProjectsController } from "#controllers/projects.controller.js";
import { authenticateToken, verifyRefreshToken } from "#root/middleware/authentication.js";

export const ProjectsRoutes = (fastify, options, done) => {
  fastify.get("/projects/:userId/list", { preHandler: authenticateToken }, ProjectsController.GetProjects);
  fastify.get("/projects/:userId/:projectId", ProjectsController.GetProjectById);
  fastify.post("/projects/:userId", ProjectsController.CreateProject);
  fastify.put("/projects/:userId/:projectId", ProjectsController.UpdateProjectById);
  fastify.delete("/projects/:userId/:projectId", ProjectsController.DeleteProjectById);

  done();
}