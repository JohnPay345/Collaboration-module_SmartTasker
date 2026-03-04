import { pool } from "#root/service/connection.js";
import { updateDataInTable } from "#root/service/duplicatePartsCode.js";

export const NotificationsModel = {
  registerTokens: async (userId, deviceToken, deviceType) => {
    try {
      const result = await pool.query(
        `INSERT INTO user_devices (user_id, device_type, device_token, created_at) VALUES ($1, $2, $3, NOW()) \
        ON CONFLICT(user_id) DO UPDATE SET device_token = $3 RETURNING device_id`,
        [userId, deviceType, deviceToken]
      );
      if (!result.rows[0].length) {
        return { type: "errorMsg", errorMsg: "Error in register tokens" };
      }
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model registerTokens" };
    }
  },
  getSettingsNotifications: async (userId) => {
    try {
      const result = await pool.query(
        `SELECT notifications_settings, notifications_settings_tasks, notifications_settings_projects
        FROM "user_notifications_settings" WHERE user_id = $1`,
        [userId]
      );
      if (!result.rows[0].length) {
        return { type: "errorMsg", errorMsg: `Notifications settings for user ${userId} not found` };
      }
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model getSettingsNotifications" };
    }
  },
  getInAppNotifications: async (userId) => {
    try {
      const result = await pool.query(`SELECT notification_id, notification_type, notification_title,
        notification_body, notification_data, is_read, created_at FROM in_app_notifications
        WHERE user_id = $1`, [userId]);
      if (!result.rows[0].length) {
        return { type: "errorMsg", errorMsg: `Notifications for user ${userId} not found` };
      }
      return { type: "result", result: result.rows };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model getInAppNotifications" };
    }
  },
  getTokenDevice: async (userId) => {
    try {
      const result = await pool.query(
        `SELECT device_token, device_type FROM user_devices WHERE user_id = $1`,
        [userId]
      );
      if (!result.rows[0].length) {
        return { type: "errorMsg", errorMsg: `Device token for user ${userId} not found` };
      }
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model getTokenDevice" };
    }
  },
  createSettingsNotifications: async (userId, noticeSettings, noticeSettingsTasks, noticeSettingsProjects) => {
    try {
      await pool.query("BEGIN");
      const result = await pool.query(
        `INSERT INTO user_notifications_settings (user_id, notifications_settings, notifications_settings_tasks, notifications_settings_projects) \
        VALUES ($1, $2, $3, $3) RETURNING notifications_id`,
        [userId, noticeSettings, noticeSettingsTasks, noticeSettingsProjects]
      );
      if (!result.rows[0].length) {
        throw new Error("When tring write settings notifications an error has occured");
      }
      await pool.query("COMMIT");
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      await pool.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model createSettingsNotificatons" };
    }
  },
  updateSettingsNotifications: async (userId, noticeSettings, noticeSettingsTasks, noticeSettingsProjects) => {
    try {
      await pool.query("BEGIN");
      const data = {
        "notifications_settings": noticeSettings,
        "notifications_settings_tasks": noticeSettingsTasks,
        "notifications_settings_projects": noticeSettingsProjects,
      };
      const whereConditions = {
        "user_id": userId
      };
      const returningColumns = ["notifications_id"];
      const sql = updateDataInTable("user_notifications_settings", data, whereConditions, returningColumns);
      if (sql.type !== "Error") {
        throw new Error(sql.message)
      }
      const result = await pool.query(sql.message, sql.values);
      if (!result.rows[0].length) {
        throw new Error(`Couldn't update notifications settings for user ${userId}`);
      }
      await pool.query("COMMIT");
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      await pool.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model updateSettingsNotifications" };
    }
  },
  saveInAppNotification: async (notificationData) => {
    try {
      await pool.query("BEGIN");
      const { userId, eventType, title, body, data } = notificationData;
      const result = await pool.query(
        `INSERT INTO notifications (user_id, notification_type, notification_title, notification_body, \
        notification_data, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING notification_id`,
        [userId, eventType, title, body, JSON.stringify(data)]
      );
      if (!result.rows[0].length) {
        throw new Error(`Failed to insert in-app notification for user ${userId}`);
      }
      await pool.query("COMMIT");
      return result.rows[0].id;
    } catch (error) {
      await pool.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model saveInAppNotificatoin" };
    }
  },
}