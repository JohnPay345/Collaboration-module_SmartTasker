import { NotificationsController } from "#controllers/notifications.controller.js";
import { authenticateToken, verifyRefreshToken } from "#root/middleware/authentication.js";

export const NotificationsRoutes = (fastify, options, done) => {
  fastify.post("/notifications/register-tokens", { preHandler: authenticateToken }, NotificationsController.RegisterTokens);
  fastify.get("/notifications/settings/:user_id", { preHandler: authenticateToken }, NotificationsController.GetSettingsNotifications);
  fastify.get("/notifications/inbox/:user_id", { preHandler: authenticateToken }, NotificationsController.GetInAppNotifications);
  fastify.post("/notifications/settings/:user_id", { preHandler: authenticateToken }, NotificationsController.CreateSettingsNotifications);
  fastify.put("/notifications/settings/:user_id", { preHandler: authenticateToken }, NotificationsController.UpdateSettingsNotifications);
  fastify.patch("/notifications/inbox/:userId/:notificationId/read", { preHandler: authenticateToken }, NotificationsController.MarkNotificationRead);

  done();
}