import { NotificationsModel } from "#models/notifications.models.js";
import { errorReplyCodes, replyResult } from "#root/service/duplicatePartsCode.js";

export const NotificationsController = {
  RegisterTokens: async (req, rep) => {
    try {
      const { userId, deviceToken, deviceType } = req.body;
      const id = req.user.userId;
      if (!deviceToken || !deviceType) {
        return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
      }
      if (id !== userId) {
        return errorReplyCodes.reply403("DEFAULT", `There is no access for user ${userId}`, req, rep);
      }
      const result = await NotificationsModel.registerTokens(userId, deviceToken, deviceType);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at register tokens (device, push)", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  GetSettingsNotifications: async (req, rep) => {
    try {
      const { userId } = req.params;
      const id = req.user.userId;
      if (id !== userId) {
        return errorReplyCodes.reply403("DEFAULT", `There is no access for user ${userId}`, req, rep);
      }
      const result = await NotificationsModel.getSettingsNotifications(userId);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at get settings notifications", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  GetInAppNotifications: async (req, rep) => {
    try {
      const { userId } = req.params;
      const id = req.user.userId;
      if (id !== userId) {
        return errorReplyCodes.reply403("DEFAULT", `There is no access for user ${userId}`, req, rep);
      }
      const result = await NotificationsModel.getInAppNotifications(userId);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at get in_app notifications", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  CreateSettingsNotifications: async (req, rep) => {
    try {
      const { userId, noticeSettings, noticeSettingsTasks, noticeSettingsProjects } = req.body;
      const id = req.user.userId;
      if (!noticeSettings || !noticeSettingsTasks || !noticeSettingsProjects) {
        return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
      }
      if (id !== userId) {
        return errorReplyCodes.reply403("DEFAULT", `There is no access for user ${userId}`, req, rep);
      }
      const result = await NotificationsModel.createSettingsNotifications(userId, noticeSettings, noticeSettingsTasks, noticeSettingsProjects);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at created settings notifications", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  UpdateSettingsNotifications: async (req, rep) => {
    try {
      const { userId, noticeSettings, noticeSettingsTasks, noticeSettingsProjects } = req.body;
      const id = req.user.userId;
      if (!noticeSettings || !noticeSettingsTasks || !noticeSettingsProjects) {
        return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
      }
      if (id !== userId) {
        return errorReplyCodes.reply403("DEFAULT", `There is no access for user ${userId}`, req, rep);
      }
      const result = await NotificationsModel.updateSettingsNotifications(userId, noticeSettings, noticeSettingsTasks, noticeSettingsProjects);
      return replyResult(result, req, rep);
    } catch (error) {
      console.error("Error at update settings notifications", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  }
}