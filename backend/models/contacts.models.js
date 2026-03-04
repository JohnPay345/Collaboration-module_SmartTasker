import { evaluate } from "mathjs";
import { config } from "dotenv";
import { pool } from "#root/service/connection.js";

config();

export const ContactsModel = {
  getContacts: async (dataForEvaluate) => {
    try {
      await pool.query("BEGIN");
      if (!dataForEvaluate.hasOwnProperty("weghts") || !dataForEvaluate.hasOwnProperty("estimations")) {
        throw new Error("Weight and estimations for evaluate is required");
      }
      const result = await pool.query(sqlQuery);
      if (!result.rows.length) {
        return { type: "errorMsg", errorMsg: "No contacts found" };
      }
      const { weghts, estimations } = dataForEvaluate;
      const evaluatedContacts = result.rows.map(contact => {
        const { user_id, full_name, job_title, avatarPath,
          count_matches, all_tags_task, count_tasks_employee } = contact;
        const { w_time, w_priority, w_qualification, w_tired } = weghts;
        const { e_time, e_priority } = estimations;
        if (count_tasks_employee > 5) {
          return;
        }
        const e_qualification = evaluate(process.env.FORMULA_QUALIFICATIONS, { count_matches, all_tags_task });
        const e_tired = evaluate(process.env.FORMULA_TIRED, { count_tasks_employee, max_count_tasks: 5 });
        const evaluationDistribution = evaluate(process.env.FORMULA_DISTRIBUTION, {
          w_time, w_priority, w_qualification, w_tired,
          e_time, e_priority, e_qualification, e_tired
        });
        return {
          user_id,
          full_name,
          job_title,
          avatarPath,
          distribution: parseFloat(evaluationDistribution.toFixed(2))
        };
      });
      let betterUserForAssignment = evaluatedContacts[0];
      for (let contact of evaluatedContacts) {
        const { distribution } = contact;
        if (distribution > betterUserForAssignment.distribution) {
          betterUserForAssignment = contact;
        }
      }
      const othersUsersForAssignments = evaluatedContacts.filter(user => JSON.stringify(user) !== JSON.stringify(betterUserForAssignment));
      await pool.query("COMMIT");
      return { type: "result", result: { bestUser: betterUserForAssignment, otherUsers: othersUsersForAssignments, resultGetContacts: result.rows } };
    } catch (error) {
      await pool.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model GetContacts" };
    }
  },
  getContactsByUserId: async (userId) => {
    try {
      return { type: "result", result: result.rows };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model GetContactsByUserId" };
    }
  },
  createContact: async (userId) => {
    try {
      return { type: "result", result: result.rows };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model CreateContact" };
    }
  },
  updateContact: async (userId) => {
    try {
      return { type: "result", result: result.rows };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model UpdateContact" };
    }
  },
  deleteContact: async (userId) => {
    try {
      return { type: "result", result: result.rows };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model DeleteContact" };
    }
  }
}

// Технический долг: Улучшить логику selectDataInTable для поддержки WITH (CTE)
const sqlQuery = `
WITH TaskSkills AS (
    SELECT
        t.task_id,
        string_to_array(t.required_skills, ',') AS task_skills
    FROM
        tasks t
),
CombinedData AS (
    SELECT
        u.user_id,
        CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name) AS full_name,
        u.job_title,
        u.avatarPath,
        t.task_id,
        ts.task_skills,
        u.skills AS user_skills,
        COUNT(ta.task_id) OVER (PARTITION BY ta.user_id) AS count_tasks_employee
    FROM
        users u
    JOIN task_assignments ta ON u.user_id = ta.user_id
    JOIN tasks t ON ta.task_id = t.task_id
    JOIN TaskSkills ts ON t.task_id = ts.task_id
)
SELECT
    cd.user_id,
    cd.full_name,
    cd.job_title,
    cd.avatarPath,
    SUM(CASE WHEN cd.user_skills && cd.task_skills THEN 1 ELSE 0 END) AS count_matches,
    COUNT(DISTINCT cd.task_id) AS all_tags_task,
    MAX(cd.count_tasks_employee) AS count_tasks_employee
FROM
    CombinedData cd
GROUP BY
    cd.user_id
ORDER BY
    cd.user_id;
`;