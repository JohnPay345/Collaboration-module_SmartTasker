import { errorReplyCodes, replyResult } from "#root/service/duplicatePartsCode.js";
import { ContactsModel } from "#models/contacts.models.js";

export const ContactsController = {
  GetContacts: async (req, rep) => {
    try {
      const { userId } = req.params;
      const reqUserId = req.user.userId;
      if (userId !== reqUserId) {
        return errorReplyCodes.reply403("DEFAULT", `There no access for user ${userId}`, req, rep);
      }
      if (!req.body) {
        return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
      }
      const dataForEvaluate = req.body;
      if (!dataForEvaluate || typeof dataForEvaluate !== 'object') {
        return errorReplyCodes.reply400("MISSING_REQUIRED_FIELD", "", req, rep);
      }
      const result = await ContactsModel.getContacts(dataForEvaluate);
      return replyResult(result, req, rep);
    } catch (error) {
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  GetContactsByUserId: async (req, rep) => {
    try {
      return rep.code(200).send({ code: 200, url: req.url, message: "Success!" });
    } catch (error) {
      console.error("Error at get contacts by user id", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  CreateContacts: async (req, rep) => {
    try {
      return rep.code(200).send({ code: 200, url: req.url, message: "Success!" });
    } catch (error) {
      console.error("Error at create contact", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  UpdateContact: async (req, rep) => {
    try {
      return rep.code(200).send({ code: 200, url: req.url, message: "Success!" });
    } catch (error) {
      console.error("Error at update contact", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
  DeleteContact: async (req, rep) => {
    try {
      return rep.code(200).send({ code: 200, url: req.url, message: "Success!" });
    } catch (error) {
      console.error("Error at delete contacts", error);
      return errorReplyCodes.reply500("DEFAULT", "", req, rep);
    }
  },
}