import { authenticateToken, verifyRefreshToken } from "#root/middleware/authentication.js";
import { ContactsController } from "#controllers/contacts.controller.js";

export const ContactsRoutes = (fastify, options, done) => {
  fastify.get("/contacts/:userId/list", ContactsController.GetContacts);
  fastify.get("/contacts/:userId", ContactsController.GetContactsByUserId);
  fastify.post("/contacts/:userId", ContactsController.CreateContacts);
  fastify.put("/contacts/:userId", ContactsController.UpdateContact);
  fastify.delete("/contacts/:userId", ContactsController.DeleteContact);

  done();
}