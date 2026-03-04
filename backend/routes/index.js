import qs from "querystring";
import { __dirname } from "#root/utils/dirname.js";
import { TasksRoutes } from "#routes/tasks.routes.js";
import { UserRoutes } from "#routes/user.routes.js";
import { NotificationsRoutes } from "#routes/notifications.routes.js";
import { ProjectsRoutes } from "#routes/projects.routes.js";
import { ContactsRoutes } from "#routes/contacts.routes.js";
import { ChatRoutes } from "#routes/chat.routes.js";

export const routes = (fastify, options, done) => {
  fastify.addContentTypeParser(
    "application/x-www-form-urlencoded",
    function (request, payload, done) {
      let body = "";
      payload.on("data", function (data) {
        body += data;
      });
      payload.on("end", function () {
        done(null, qs.parse(body));
      });
      payload.on("error", done);
    }
  );

  fastify.register(UserRoutes, { prefix: '/api' });
  fastify.register(TasksRoutes, { prefix: '/api' });
  fastify.register(ProjectsRoutes, { prefix: '/api' });
  fastify.register(ContactsRoutes, { prefix: '/api' });
  fastify.register(NotificationsRoutes, { prefix: '/api' });
  fastify.register(ChatRoutes, { prefix: '/api' });
  done();
}