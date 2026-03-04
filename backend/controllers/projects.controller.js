import { ProjectsModel } from "#models/projects.models.js";
import { errorReplyCodes, replyResult } from "#root/service/duplicatePartsCode.js";

export const ProjectsController = {
  GetProjects: async (req, rep) => {
    const { userId } = req.params;
    const reqUserId = req.user.userId;
    if (reqUserId !== userId) {
      return errorReplyCodes.reply403("DEFAULT", `There no acces for user ${userId}`, req, rep);
    }
    try {
      const result = await ProjectsModel.getProjects(userId);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at get projects", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  GetProjectById: async (req, rep) => {
    const { userId, projectId } = req.params;
    const reqUserId = req.user.userId;
    if (reqUserId !== userId) {
      return errorReplyCodes.reply403("DEFAULT", `There no acces for user ${userId}`, req, rep);
    }
    try {
      const result = await ProjectsModel.getProjectById(projectId);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at get project by id", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  CreateProject: async (req, rep) => {
    const { userId } = req.params;
    const reqUserId = req.user.userId;
    if (reqUserId !== userId) {
      return errorReplyCodes.reply403("DEFAULT", `There no acces for user ${userId}`, req, rep);
    }
    if (!req.body) {
      return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
    }
    const { data } = req.body;
    if (!data || typeof data !== 'object') {
      return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
    }
    try {
      const result = await ProjectsModel.createProject(data)
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at create new project", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  UpdateProjectById: async (req, rep) => {
    const { userId, projectId } = req.params;
    const reqUserId = req.user.userId;
    if (reqUserId !== userId) {
      return errorReplyCodes.reply403("DEFAULT", `There no acces for user ${userId}`, req, rep);
    }
    if (!req.body) {
      return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
    }
    const { data } = req.body;
    if (!data || typeof data !== 'object') {
      return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
    }
    try {
      const result = await ProjectsModel.updateProjectById(projectId, data);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at update project", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  DeleteProjectById: async (req, rep) => {
    const { userId, projectId } = req.params;
    const reqUserId = req.user.userId;
    if (reqUserId !== userId) {
      return errorReplyCodes.reply403("DEFAULT", `There no acces for user ${userId}`, req, rep);
    }
    try {
      const result = await ProjectsModel.deleteProjectById(projectId)
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at delete project", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
}