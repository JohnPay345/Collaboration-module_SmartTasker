import { config } from "dotenv";
import { pool } from "#root/service/connection.js";
import { insertDataInTable, selectDataInTable, updateDataInTable } from "#root/service/duplicatePartsCode.js";
import { publishMessage } from "#rmq/publisher.js";

config();

export const TasksModel = {
  getTasksByUserId: async (userId) => {
    try {
      const options = {
        table: "tasks",
        columns: ["task_id", "task_name", "author_id", "project_id",
          "start_date", "end_date", "status", "is_urgent", "priority",
          "value", "effort", "estimated_duration", "priority_assessment",
          "qualification_assessment", "load_assessment", "required_skills"],
        where: { "author_id": userId }
      }
      const sql = await selectDataInTable(options);
      if (sql.type == "Error") {
        return { type: "errorMsg", errorMsg: sql.message };
      }
      const result = await pool.query(sql.message, sql.values);
      console.log(result.rows);
      if (!result.rows.length) {
        return { type: "errorMsg", errorMsg: "List task not found" };
      }
      return { type: "result", result: result.rows };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model getTasks" };
    }
  },
  getTaskById: async (taskId) => {
    try {
      const options = {
        table: [
          ["tasks", "t"],
        ],
        columns: ["t.task_id", "t.task_name", "t.description", "t.author_id", "t.project_id", "t.goal_id",
          "t.start_date", "t.end_date", "t.status", "t.is_urgent", "t.priority", "t.value", "t.effort",
          "t.estimated_duration", "t.priority_assessment", "t.qualification_assessment",
          "t.load_assessment", "t.required_skills", "ta.user_id", "ta.is_completed", "tc.comment_id",
          "tc.comment_text", "tc.created_at", "tc.updated_at", "tc.is_edited"],
        join: [
          {
            table: [["task_assignments", "ta"]],
            type: "LEFT JOIN",
            on: "t.task_id = ta.task_id"
          },
          {
            table: [["task_comments", "tc"]],
            type: "LEFT JOIN",
            on: "t.task_id = tc.task_id"
          }
        ],
        where: { "task_id": taskId }
      }
      const sql = await selectDataInTable(options);
      if (sql.type == "Error") {
        return { type: "errorMsg", errorMsg: sql.message };
      }
      const result = await pool.query(sql.message, sql.values);
      if (!result.rows.length) {
        return { type: "errorMsg", errorMsg: "Task not found" };
      }
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model getTaskById" };
    }
  },
  createTask: async (data) => {
    try {
      await pool.query("BEGIN");
      if (!data.hasOwnProperty("task")) {
        throw new Error("Task data is required");
      }
      const options = {
        tableName: "tasks",
        data: data.task,
        requiredFields: ["task_name", "author_id", "start_date", "status", "priority",
          "value", "effort", "estimated_duration", "priority_assessment", "qualification_assessment",
          "load_assessment"],
        returningColumns: ["task_id"]
      }
      const sql = await insertDataInTable(options);
      if (sql.type == "Error") {
        throw new Error(sql.message);
      }
      const resultCreateTask = await pool.query(sql.message, Array.from(sql.values.values()));
      if (!resultCreateTask.rows.length) {
        throw new Error("The task has not been created");
      }
      if (data.hasOwnProperty("assignments")) {
        const task_id = resultCreateTask.rows[0].task_id;
        const users_id = data.assignments;
        const checkUsersExists = await pool.query("SELECT user_id FROM users WHERE user_id = ANY($1)", [users_id]);
        const existingUsersId = checkUsersExists.rows.map(row => row.user_id);
        const nonExistingUsers = users_id.filter(userId => !existingUsersId.includes(userId));
        if (nonExistingUsers.length > 0) {
          throw new Error(`Users with ids ${nonExistingUsers.join(", ")} do not exist`);
        }
        for (const user_id of existingUsersId) {
          const resultTaskAssignments = await pool.query(`INSERT INTO task_assignments (task_id, user_id, assigned_at, is_completed) \
          VALUES ($1, $2, DEFAULT, DEFAULT) RERURNING task_assignment_id`, [task_id, user_id]);
          const notificationData = {
            data: {
              userId: user_id,
              eventType: "task.assigned",
              title: "Новая задача",
              body: "Поручено новая задача",
              data: {
                task_id: task_id,
                task_name: data.task.task_name,
              }
            }
          }
          publishMessage("task", "task.assigned", notificationData);
          if (!resultTaskAssignments.rows.length) {
            console.error("Error when insert data to task_assignment_id table", resultTaskAssignments);
            throw new Error("Error when insert data to task_assignment_id table");
          }
        }
      }
      const notificationData = {
        data: {
          userId: resultCreateTask.rows[0].task_id,
          eventType: "task.created",
          title: "Новая задача",
          body: "Создана новая задача",
          data: {
            task_id: resultCreateTask.rows[0].task_id,
            task_name: data.task.task_name
          }
        }
      }
      publishMessage("task", "task.created", notificationData);
      await pool.query("COMMIT");
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      await pool.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model createTask" };
    }
  },
  updateTaskById: async (taskId, data) => {
    try {
      await pool.query("BEGIN");
      if (!data.hasOwnProperty("task")) {
        throw new Error("Task data is required");
      }
      const options = {
        tableName: "tasks",
        data: data.task,
        whereClause: { "task_id": taskId },
        requiredFields: ["task_name", "author_id", 'start_date', "status", "priority",
          "value", "effort", "estimated_duration", "priority_assessment", "qualification_assessment",
          "load_assessment"],
        returningColumns: ["task_id"]
      }
      const sql = await updateDataInTable(options);
      if (sql.type == "Error") {
        throw new Error(sql.message);
      }
      const resultUpdateTask = await pool.query(sql.message, Array.from(sql.values.values()));
      if (!resultUpdateTask.rows.length) {
        throw new Error("The task data has not been updated");
      }
      if (data.hasOwnProperty("assignments")) {
        const task_id = resultUpdateTask.rows[0].task_id;
        const users_id = data.assignments;
        const checkUsersExists = await pool.query("SELECT user_id FROM users WHERE user_id = ANY($1)", [users_id]);
        const checkUsersAssignments = await pool.query("SELECT user_id FROM task_assignments WHERE user_id = ANY($1)", [users_id]);
        const existingUsersId = checkUsersExists.rows.map(row => row.user_id);
        const assignmentsUsersId = checkUsersAssignments.rows.map(row => row.user_id);
        const nonExistingUsers = users_id.filter(userId => !existingUsersId.includes(userId));
        if (nonExistingUsers.length > 0) {
          throw new Error(`Users with id ${nonExistingUsers.join(", ")} do not exist`);
        }
        const oldAssignmentsUsers = users_id.filter(userId => assignmentsUsersId.includes(userId));
        const newAssignmentsUsers = users_id.filter(userId => !assignmentsUsersId.includes(userId));
        for (const user_id of oldAssignmentsUsers) {
          const notificationData = {
            data: {
              userId: user_id,
              eventType: "task.updated",
              title: "Обновление задачи",
              body: "Обновлены данные задачи",
              data: {
                task_id: task_id,
                task_name: data.task.task_name,
              }
            }
          }
          publishMessage("task", "task.updated", notificationData);
        }
        for (const user_id of newAssignmentsUsers) {
          const resultTaskAssignments = await pool.query(`INSERT INTO task_assignments (task_id, user_id, assigned_at, is_completed) \
          VALUES ($1, $2, DEFAULT, DEFAULT) RERURNING task_assignment_id`, [task_id, user_id]);
          const notificationData = {
            data: {
              userId: user_id,
              eventType: "task.assigned",
              title: "Новая задача",
              body: "Поручено новая задача",
              data: {
                task_id: task_id,
                task_name: data.task.task_name,
              }
            }
          }
          publishMessage("task", "task.assigned", notificationData);
          if (!resultTaskAssignments.rows.length) {
            console.error("Error when insert data to task_assignment_id table", resultTaskAssignments);
            throw new Error("Error when insert data to task_assignment_id table");
          }
        }
      }
      await pool.query("COMMIT");
      return { type: "result", result: `The task ${taskId} has been updated` };
    } catch (error) {
      await pool.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model updateTask" };
    }
  },
  deleteTaskById: async (taskId) => {
    try {
      await pool.query("BEGIN");
      const result = await pool.query("DELETE FROM tasks WHERE task_id = $1 RETURNING task_id, task_name, author_id", [taskId])
      if (!result.rows.length) {
        throw new Error(`Couldn't delete task ${taskId}`);
      }
      const deletedDataTask = result.rows.map(row => {
        return {
          task_id: row.task_id,
          task_name: row.task_name,
          userId: row.author_id
        }
      });
      for (let dataTask of deletedDataTask) {
        const notificationData = {
          data: {
            userId: dataTask.userId,
            eventType: "task.deleted",
            title: "Удалена задача",
            body: `Удалена задача ${dataTask.task_name}`,
            data: {
              task_id: dataTask.task_id,
              task_name: dataTask.task_name
            }
          }
        }
        publishMessage("task", "task.deleted", notificationData);
      }
      await pool.query("COMMIT");
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      await pool.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model deleteTask" };
    }
  },
}