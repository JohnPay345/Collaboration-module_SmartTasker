import { TasksModel } from "#models/tasks.model.js";
import { errorReplyCodes, replyResult } from "#root/service/duplicatePartsCode.js";

export const TasksController = {
  GetTasksByUserId: async (req, rep) => {
    const { userId } = req.params;
    const reqUserId = req.user.userId;
    if (reqUserId !== userId) {
      return errorReplyCodes.reply403("DEFAULT", `There no access for user ${userId}`, req, rep);
    }
    try {
      const result = await TasksModel.getTasksByUserId(userId);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at get tasks", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  GetTaskById: async (req, rep) => {
    const { userId, taskId } = req.params;
    const reqUserId = req.user.userId;
    if (reqUserId !== userId) {
      return errorReplyCodes.reply403("DEFAULT", `There no access for user ${userId}`, req, rep);
    }
    try {
      const result = await TasksModel.getTaskById(taskId);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at get task by id", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  CreateTask: async (req, rep) => {
    const { userId } = req.params;
    const reqUserId = req.user.userId;
    if (!req.body) {
      return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
    }
    const { data } = req.body;
    if (!data || typeof data !== 'object') {
      return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
    }
    if (userId !== reqUserId) {
      return errorReplyCodes.reply403("DEFAULT", `There no access for user ${userId}`, req, rep);
    }
    try {
      const result = await TasksModel.createTask(data);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at create new task", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  UpdateTaskById: async (req, rep) => {
    const { userId, taskId } = req.params;
    const reqUserId = req.user.userId;
    if (!req.body) {
      return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
    }
    const { data } = req.body;
    if (userId !== reqUserId) {
      return errorReplyCodes.reply403("DEFAULT", `There no access for user ${userId}`, req, rep);
    }
    try {
      const result = await TasksModel.updateTaskById(taskId, data);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at update task", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  DeleteTaskById: async (req, rep) => {
    const { userId, taskId } = req.params;
    const reqUserId = req.user.userId;
    if (userId !== reqUserId) {
      return errorReplyCodes.reply403("DEFAULT", `There no access for user ${userId}`, req, rep);
    }
    try {
      const result = await TasksModel.deleteTaskById(taskId, userId);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at delete task", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
}
