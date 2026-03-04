import { config } from "dotenv";
import { evaluate } from "mathjs";
import { pool } from "#root/service/connection.js";
import { insertDataInTable, selectDataInTable, updateDataInTable } from "#root/service/duplicatePartsCode.js";
import { publishMessage } from "#rmq/publisher.js";

config();

export const ProjectsModel = {
  getProjects: async (userId) => {
    try {
      const getProjectOptions = {
        table: "projects",
        columns: ["project_id", "project_name", "description", "status", "author_id"],
        where: { "author_id": userId }
      }
      const sql = await selectDataInTable(getProjectOptions);
      if (sql.type == "Error") {
        return { type: "errorMsg", errorMsg: sql.message };
      }
      const result = await pool.query(sql.message, sql.values);
      if (!result.rows.length) {
        return { type: "errorMsg", errorMsg: "List projects not found" };
      }
      const projectsId = result.rows.map(row => row.project_id);
      let resultsEvaluate = [];
      for (let projectId of projectsId) {
        const getTasksProject = {
          table: [["tasks", "t"]],
          columns: [
            "COUNT(CASE WHEN t.status = 'Выполнена' THEN 1 END) AS completed_tasks",
            "COUNT(*) AS all_tasks"
          ],
          where: { "project_id": projectId }
        }
        const getGoalsProject = {
          table: [["project_goals", "pg"]],
          columns: [
            "COUNT(CASE WHEN pg.goal_status = 'Достигнута' THEN 1 END) AS completed_goals",
            "COUNT(*) AS all_goals"
          ],
          where: { "project_id": projectId }
        }
        const sqlGetTasks = await selectDataInTable(getTasksProject);
        const sqlGetGoals = await selectDataInTable(getGoalsProject);
        if (sqlGetTasks.type == "Error" || sqlGetGoals.type == "Error") {
          throw new Error(`Error when forming an sql query: ${sqlGetTasks.message}, ${sqlGetGoals.message}`);
        }
        const resultGetTasks = await pool.query(sqlGetTasks.message, sqlGetTasks.values);
        const resultGetGoals = await pool.query(sqlGetGoals.message, sqlGetGoals.values);
        if (!resultGetTasks.rows.length || !resultGetGoals.rows.length) {
          throw new Error(`Error when executing an sql query to the tasks and project_goals tables`);
        }
        let [{ completed_tasks, all_tasks }] = resultGetTasks.rows;
        let [{ completed_goals, all_goals }] = resultGetGoals.rows;
        const skope = {
          completed_tasks,
          all_tasks,
          completed_goals,
          all_goals
        }
        const progress = evaluate(process.env.FORMULA_CALCULATE_PROGRESS, skope);
        resultsEvaluate.push({ project_id: projectId, project_progress: progress });
      }
      return { type: "result", result: { evaluations: resultsEvaluate, data: result.rows } }
    } catch (error) {
      console.error(error)
      return { type: "errorMsg", errorMsg: "Error in Model getProjects" };
    }
  },
  getProjectById: async (projectId) => {
    try {
      const options = {
        table: [
          ["projects", "p"]
        ],
        columns: ["p.project_id", "p.project_name", "p.project_description", "p.start_date",
          "p.end_date", "p.status", "p.author_id", "p.tags", "pg.project_goal_id", "pg.goal_name",
          "pg.goal_description", "pg.target_date", "pg.goal_status", "pa.project_assignment_id", "pa.user_id"],
        join: [
          {
            table: [["project_goals", "pg"]],
            type: "LEFT JOIN",
            on: "p.project_id = pg.project_id"
          },
          {
            table: [["project_assignments", "pa"]],
            type: "LEFT JOIN",
            on: "p.project_id = pa.project_id"
          }
        ],
        where: { "p.project_id": projectId }
      };
      const sqlGetProjects = await selectDataInTable(options);
      if (sqlGetProjects.type == "Error") {
        return { type: "errorMsg", errorMsg: sqlGetProjects.message };
      }
      const result = await pool.query(sqlGetProjects.message, sqlGetProjects.values);
      if (!result.rows.length) {
        return { type: "errorMsg", errorMsg: "List projects not found" };
      }
      return { type: "result", result: result.rows }
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model getProjectsById" };
    }
  },
  createProject: async (data) => {
    try {
      await pool.query("BEGIN");
      const options = {
        table: "projects",
        data: data.project,
        columns: ["project_name", "project_description", "status", "author_id"],
        where: { "author_id": userId },
        returningColumns: ["project_id"]
      }
      const sql = await insertDataInTable(options);
      if (sql.type == "Error") {
        throw new Error(sql.message);
      }
      const resultCreateProject = await pool.query(sql.message, Array.from(sql.values.values()));
      if (!resultCreateProject.rows.length) {
        throw new Error("The project has not been created");
      }
      if (data.hasOwnProperty("assignments")) {
        const project_id = resultCreateProject.rows[0].project_id;
        const users_id = data.assignments;
        const checkUsersExists = await pool.query("SELECT user_id FROM users WHERE user_id = ANY($1)", [users_id]);
        const existingUsersId = checkUsersExists.rows.map(row => row.user_id);
        const nonExistingUsers = users_id.filter(userId => !existingUsersId.includes(userId));
        if (nonExistingUsers.length > 0) {
          throw new Error(`Users with ids ${nonExistingUsers.join(", ")} do not exist`);
        }
        for (const user_id of existingUsersId) {
          const resultProjectAssignments = await pool.query(`INSERT INTO project_assignments (project_id, user_id) 
            VALUES ($1, $2) RERURNING project_assignment_id`, [project_id, user_id]);
          const notificationData = {
            data: {
              userId: user_id,
              eventType: "project.assigned",
              title: "Новый проект",
              body: "Вы вошли в состав команды проекта",
              data: {
                project_id: project_id,
                project_name: data.project.project_name,
              }
            }
          }
          publishMessage("project", "project.assigned", notificationData);
          if (!resultProjectAssignments.rows.length) {
            console.error("Error when insert data to project_assignments table", resultProjectAssignments);
            throw new Error("Error when insert data to project_assignments table");
          }
        }
      }
      await pool.query("COMMIT");
      return { type: "result", result: result.rows }
    } catch (error) {
      await pool.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMSg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model createProject" };
    }
  },
  updateProjectById: async (projectId, data) => {
    try {
      await pool.query("BEGIN");
      if (!data.hasOwnProperty("project")) {
        throw new Error("Project data is required");
      }
      const options = {
        tableName: "project",
        data: data.project,
        whereClause: { "project_id": projectId },
        requiredFields: ["project_name", "status", "author_id"],
        returningColumns: ["project_id"]
      }
      const sql = await updateDataInTable(options);
      if (sql.type == "Error") {
        throw new Error(sql.message);
      }
      const resultUpdateProject = await pool.query(sql.message, Array.from(sql.values.values()));
      if (!resultUpdateProject.rows.length) {
        throw new Error("The project has not been updated");
      }
      if (data.hasOwnProperty("assignments")) {
        const project_id = resultCreateProject.rows[0].project_id;
        const users_id = data.assignments;
        const checkUsersExists = await pool.query("SELECT user_id FROM users WHERE user_id = ANY($1)", [users_id]);
        const existingUsersId = checkUsersExists.rows.map(row => row.user_id);
        const nonExistingUsers = users_id.filter(userId => !existingUsersId.includes(userId));
        if (nonExistingUsers.length > 0) {
          throw new Error(`Users with ids ${nonExistingUsers.join(", ")} do not exist`);
        }
        for (const user_id of existingUsersId) {
          const resultProjectAssignments = await pool.query(`INSERT INTO project_assignments (project_id, user_id) 
            VALUES ($1, $2) RERURNING project_assignment_id`, [project_id, user_id]);
          const notificationData = {
            data: {
              userId: user_id,
              eventType: "project.assigned",
              title: "Новый проект",
              body: "Вы вошли в состав команды проекта",
              data: {
                project_id: project_id,
                project_name: data.project.project_name,
              }
            }
          }
          publishMessage("project", "project.assigned", notificationData);
          if (!resultProjectAssignments.rows.length) {
            console.error("Error when insert data to project_assignments table", resultProjectAssignments);
            throw new Error("Error when insert data to project_assignments table");
          }
        }
      }
      if (data.hasOwnProperty("goals")) {
        if (Array.isArray(data.goals)) {
          const getUsersProject = await pool.query(`SELECT user_id FROM projects WHERE project_id = $1`, [projectId]);
          const usersId = getUsersProject.rows.map(row => row.user_id);
          for (let goal in data.goals) {
            const optionsUpdateGoals = {
              tableName: "project_goals",
              data: goal,
              whereClause: { "project_id": projectId },
              requiredFields: ["goal_name", "target_date", "goal_status"],
              returningColumns: ["project_goal_id"]
            }
            const sql = updateDataInTable(optionsUpdateGoals);
            if (sql.type == "Error") {
              throw new Error(sql.message);
            }
            const resultGoals = await pool.query(sql.message, Array.from(sql.values.values()));
            if (!resultGoals.rows.length) {
              throw new Error(`Error when update goals to project_goals table for ${projectId}`);
            }
          }
          for (let userId of usersId) {
            const notificationData = {
              userId: userId,
              eventType: "project.goals",
              title: "Обновлена цели",
              body: "Цели проекты были изменены",
              data: {
                project_id: projectId,
                project_name: data.project.project_name,
              }
            };
            publishMessage("project", "project.goals", notificationData);
          }
        } else {
          throw new Error(`The project ${projectId} goals objective should be represented by array`)
        }
      }
      await pool.query("COMMIT");
      return { type: "result", result: `The project ${projectId} has been updated` };
    } catch (error) {
      await pool.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model updateProject" };
    }
  },
  deleteProjectById: async (projectId) => {
    try {
      await pool.query("BEGIN");
      const result = await pool.query("DELETE FROM projects WHERE project_id = $1 RETURNING project_id, project_name, author_id", [projectId])
      if (!result.rows.length) {
        throw new Error(`Couldn't delete project ${projectId}`);
      }
      const deletedDataProject = result.rows.map(row => {
        return {
          project_id: row.project_id,
          project_name: row.project_name,
          userId: row.author_id
        }
      });
      for (let dataProject of deletedDataProject) {
        const notificationData = {
          userId: dataProject.userId,
          eventType: "project.deleted",
          title: "Удалён проект",
          body: `Удалён проект ${dataProject.project_name}`,
          data: {
            project_id: dataProject.project_id,
            project_name: dataProject.project_name
          }
        }
        publishMessage("project", "project.deleted", notificationData);
      }
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      await pool.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model deleteProject" };
    }
  },
}