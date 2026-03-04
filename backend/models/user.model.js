import bcrypt from 'bcrypt';
import { config } from "dotenv";
import { pool } from "#root/service/connection.js";
import { generateTokens, getFieldUser } from "#root/service/token.js";
import { __dirname } from "#root/utils/dirname.js";
import { generateAvatar } from '#root/service/generateAvatar.js';
import { insertDataInTable, updateDataInTable } from '#root/service/duplicatePartsCode.js';
import path from "path";
config();

export const UserModel = {
  register: async (data) => {
    try {
      await pool.query("BEGIN");
      if (!data.hasOwnProperty("user")) {
        throw new Error("User data is required");
      }
      const isUser = await pool.query("SELECT * FROM users WHERE email = $1", [data.user.email]);
      if (isUser.rows.length) {
        throw new Error("User already exists");
      }
      const salt = await bcrypt.genSalt(12);
      data.user.password = await bcrypt.hash(data.user.password, salt);
      const { first_name, middle_name } = data.user;
      const fullName = `${first_name}-${middle_name}`;
      const fileName = `${Date.now()}-${fullName}.svg`;
      const filePath = path.join(__dirname, 'uploads', 'avatars', fileName);
      const avatarPath = `/uploads/avatars/${fileName}`;
      data.user.avatarPath = avatarPath;
      data.user.created_at = 'CURRENT_TIMESTAMP';
      data.user.updated_at = 'DEFAULT';
      const options = {
        tableName: "users",
        data: data.user,
        requiredFields: ["first_name", "middle_name", "email", "phone_number", "password", "gender",
          "avatarPath", "created_at", "updated_at"],
        returningColumns: ["user_id"]
      }
      const sqlRegister = await insertDataInTable(options);
      if (sqlRegister.type == "Error") {
        throw new Error(sqlRegister.message);
      }
      const result = await pool.query(sqlRegister.message, Array.from(sqlRegister.values.values()));
      let userId = "";
      if (result.rows[0].user_id) {
        await generateAvatar(fullName, filePath);
        userId = result.rows[0].user_id;
      } else {
        throw new Error("The user has not been created");
      }
      if (!data.hasOwnProperty("user_device")) {
        throw new Error("User data device is required");
      }
      const resultUserDevice = await pool.query("INSERT INTO user_devices(user_id, device_type, device_token, \
         created_at, updated_at) VALUES ($1, $2, $3, NOW(), DEFAULT) RETURNING device_id", [userId, data.user_device.device_type, data.user_device.device_token]);
      const resultUserNotificationsSettings = await pool.query("INSERT INTO user_notifications_settings(user_id) \
        VALUES($1) RETURNING notifications_id", [result.rows[0].user_id]);
      if (!resultUserDevice.rowCount || !resultUserNotificationsSettings.rowCount) {
        throw new Error("Query to the tables (user_devices, user_notifications_settings) not was executed");
      }
      await pool.query("COMMIT");
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model Register" };
    }
  },
  login: async (email, password) => {
    try {
      const isUser = await pool.query("SELECT user_id, first_name, middle_name, email, password FROM users WHERE email = $1", [email]);
      if (!isUser.rows.length) {
        return { type: "errorMsg", errorMsg: "Wrong email or password" };
      }
      const isPassword = await bcrypt.compare(password, isUser.rows[0].password);
      if (!isPassword) {
        return { type: "errorMsg", errorMsg: "Wrong email or password" };
      }
      const { user_id } = isUser.rows[0];
      const fullName = `${isUser.rows[0].first_name} ${isUser.rows[0].middle_name}`;
      const tokens = generateTokens({ userId: user_id, fullName });
      return { type: "result", result: { user_id: user_id, tokens } }
    } catch (error) {
      console.error(error);
      return { type: "errorMsg", errorMsg: "Error in Model Login" };
    }
  },
  getAllUsers: async () => {
    try {
      const result = await pool.query(`SELECT user_id, first_name, middle_name,
        last_name, email, phone_number, birth_date,
        start_date, gender, address, job_title,
        avatarPath, last_login, skills FROM users`);
      return { type: "result", result: result.rows };
    } catch (error) {
      console.error(error)
      return { type: "errorMsg", errorMsg: "Error in Model GetAllUsers" }
    }
  },
  getUserById: async (id, reqUserId) => {
    try {
      const result = await pool.query(`WITH AcceptedColleagues AS (
      -- Находим ВСЕХ, с кем у requested_user_id есть подтвержденная связь
      SELECT CASE WHEN f.follower_id = $1 THEN f.following_id
        ELSE f.follower_id END AS colleague_id FROM user_follows f WHERE f.status = 'accepted'
        AND ($1 = f.follower_id OR $1 = f.following_id))
      -- Агрегируем полученные ID в единый список
      SELECT user_id, first_name, middle_name,
      last_name, email, phone_number, birth_date,
      start_date, gender, address, job_title,
      avatarPath, last_login, skills,
      -- Подзапрос для списка коллег (jsonb)
      (SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', uc.user_id,
            'first_name', uc.first_name,
            'middle_name', uc.middle_name,
            'last_name', uc.last_name,
            'email', uc.email,
            'phone_number', uc.phone_number,
            'birth_date', uc.birth_date,
            'start_date', uc.start_date,
            'gender', uc.gender,
            'address', uc.address,
            'job_title', uc.job_title,
            'avatarPath', uc.avatarPath,
            'last_login', uc.last_login,
            'skills', uc.skills
          )
        ),'[]'::jsonb)
        FROM AcceptedColleagues ac
        JOIN users uc ON ac.colleague_id = uc.user_id
      ) AS colleagues_list,
      -- Подзапрос для количества коллег
      (SELECT COUNT(*)
        FROM AcceptedColleagues ac
        JOIN users uc ON ac.colleague_id = uc.user_id
      ) AS colleagues_count,
      -- Статус связи с текущим пользователем
      (SELECT status FROM user_follows
       WHERE (follower_id = $2 AND following_id = $1)
          OR (follower_id = $1 AND following_id = $2)
       LIMIT 1
      ) AS connection_status FROM users u
      WHERE u.user_id = $2;`, [id, reqUserId]);
      if (!result.rows.length) {
        return { type: "errorMsg", errorMsg: "User not found" };
      }
      return { type: "result", result: result.rows[0] };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model GetUserById" };
    }
  },
  updateUser: async (userId, data) => {
    try {
      await pool.query("BEGIN");
      if (!data.hasOwnProperty("user")) {
        throw new Error("User data is required");
      }
      const isUser = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
      if (!isUser) {
        throw new Error("User not found");
      }
      if (data.user.password) {
        const salt = await bcrypt.genSalt(12);
        data.user.password = await bcrypt.hash(password, salt);
      }
      const options = {
        tableName: "users",
        data: data.user,
        whereClause: { "user_id": userId },
        requiredFields: ["first_name", "middle_name", "email", "password", "gender", "updated_at"],
        returningColumns: ["user_id"]
      }
      const sql = await updateDataInTable(options);
      if (sql.type == "Error") {
        throw new Error(sql.message);
      }
      const resultUpdateUser = await pool.query(sql.message, sql.values);
      if (!resultUpdateUser.rows.length) {
        throw new Error("The user has not been updated");
      }
      await pool.query("COMMIT");
      return { type: "result", result: resultUpdateUser.rows[0] };
    } catch (error) {
      console.log(error);
      await poll.query("ROLLBACK");
      if (error instanceof Error) {
        return { type: "errorMsg", errorMsg: error.message };
      }
      return { type: "errorMsg", errorMsg: "Error in Model updateUser" };
    }
  },
  deleteUser: async (id) => {
    try {
      const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      if (!user.rows.length) {
        return { type: "errorMsg", errorMsg: "User not found" };
      }
      const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
      return { type: "result", result: "User has been deleted" };
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model deleteUser" };
    }
  },
  updateTokens: async (id, authHeader) => {
    const result = await pool.query("SELECT user_id, CONCAT(first_name, ' ', middle_name) AS fullName FROM users WHERE user_id = $1", [id]);
    if (!result.rows.length) {
      return { type: "errorMsg", errorMsg: "User not found" };
    }
    let payload = getFieldUser(authHeader, ['userId', 'name']);
    if (id !== payload.userId) {
      return { type: "errorMsg", errorMsg: "Invalid id" };
    }
    try {
      const { user_id, fullname: fullName } = result.rows[0];
      console.log(result.rows[0])
      const tokens = generateTokens({ userId: user_id, fullName });
      return { type: "result", result: { user_id: id, tokens } }
    } catch (error) {
      return { type: "errorMsg", errorMsg: "Error in Model updateTokens" };
    }
  },
  // Получение статистики пользователя
  getUserStats: async (userId) => {
    try {
      // Получаем задачи пользователя
      const tasksResult = await pool.query(`
        WITH user_tasks AS (
          SELECT t.* 
          FROM tasks t
          LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
          WHERE t.author_id = $1 OR ta.user_id = $1
        )
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'Выполнено' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'В работе' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN is_urgent = true THEN 1 END) as urgent_tasks,
          COUNT(CASE WHEN end_date < CURRENT_DATE AND status != 'Выполнено' THEN 1 END) as overdue_tasks
        FROM user_tasks
      `, [userId]);

      // Получаем проекты пользователя
      const projectsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'Завершен' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status = 'В работе' THEN 1 END) as in_progress_projects,
          COUNT(CASE WHEN is_urgent = true THEN 1 END) as urgent_projects,
          COUNT(CASE WHEN end_date < CURRENT_DATE AND status != 'Завершен' THEN 1 END) as overdue_projects
        FROM projects 
        WHERE author_id = $1 OR $1 = ANY(member_ids)
      `, [userId]);

      // Получаем цели пользователя
      const goalsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_goals,
          COUNT(CASE WHEN goal_status = 'Достигнута' THEN 1 END) as completed_goals,
          COUNT(CASE WHEN goal_status = 'В работе' THEN 1 END) as in_progress_goals,
          COUNT(CASE WHEN end_date < CURRENT_DATE AND goal_status != 'Достигнута' THEN 1 END) as overdue_goals
        FROM goals 
        WHERE author_id = $1 OR $1 = ANY(member_ids)
      `, [userId]);

      // Получаем активность пользователя
      const activityResult = await pool.query(`
        WITH user_activities AS (
          SELECT created_at FROM tasks WHERE author_id = $1
          UNION ALL
          SELECT created_at FROM task_assignments ta 
          JOIN tasks t ON ta.task_id = t.task_id 
          WHERE ta.user_id = $1
          UNION ALL
          SELECT created_at FROM projects WHERE author_id = $1 OR $1 = ANY(member_ids)
          UNION ALL
          SELECT created_at FROM goals WHERE author_id = $1 OR $1 = ANY(member_ids)
        )
        SELECT 
          COUNT(DISTINCT DATE(created_at)) as active_days,
          MAX(created_at) as last_activity
        FROM user_activities
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `, [userId]);

      // Получаем распределение задач по приоритетам
      const priorityResult = await pool.query(`
        WITH user_tasks AS (
          SELECT t.* 
          FROM tasks t
          LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
          WHERE t.author_id = $1 OR ta.user_id = $1
        )
        SELECT 
          priority,
          COUNT(*) as count
        FROM user_tasks
        WHERE status != 'Выполнено'
        GROUP BY priority
        ORDER BY count DESC
      `, [userId]);

      // Получаем распределение задач по статусам
      const statusResult = await pool.query(`
        WITH user_tasks AS (
          SELECT t.* 
          FROM tasks t
          LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
          WHERE t.author_id = $1 OR ta.user_id = $1
        )
        SELECT 
          status,
          COUNT(*) as count
        FROM user_tasks
        GROUP BY status
        ORDER BY count DESC
      `, [userId]);

      return {
        type: "result",
        result: {
          tasks: {
            ...tasksResult.rows[0],
            by_priority: priorityResult.rows,
            by_status: statusResult.rows
          },
          projects: projectsResult.rows[0],
          goals: goalsResult.rows[0],
          activity: activityResult.rows[0]
        }
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return { type: "errorMsg", errorMsg: "Error getting user statistics" };
    }
  },

  // Получение последних активностей пользователя
  getUserRecentActivity: async (userId, limit = 10) => {
    try {
      const result = await pool.query(`
        WITH user_tasks AS (
          SELECT t.* 
          FROM tasks t
          LEFT JOIN task_assignments ta ON t.task_id = ta.task_id
          WHERE t.author_id = $1 OR ta.user_id = $1
        )
        SELECT 
          'task' as type,
          task_id as id,
          task_name as name,
          status,
          created_at,
          updated_at
        FROM user_tasks
        
        UNION ALL
        
        SELECT 
          'project' as type,
          project_id as id,
          project_name as name,
          status,
          created_at,
          updated_at
        FROM projects 
        WHERE author_id = $1 OR $1 = ANY(member_ids)
        
        UNION ALL
        
        SELECT 
          'goal' as type,
          goal_id as id,
          goal_name as name,
          goal_status as status,
          created_at,
          updated_at
        FROM goals 
        WHERE author_id = $1 OR $1 = ANY(member_ids)
        
        ORDER BY updated_at DESC
        LIMIT $2
      `, [userId, limit]);

      return { type: "result", result: result.rows };
    } catch (error) {
      console.error('Error in getUserRecentActivity:', error);
      return { type: "errorMsg", errorMsg: "Error getting user recent activity" };
    }
  },

  // Получение эффективности пользователя
  getUserPerformance: async (userId, days = 30) => {
    try {
      const result = await pool.query(`
        WITH date_range AS (
          SELECT generate_series(
            CURRENT_DATE - ($2 || ' days')::interval,
            CURRENT_DATE,
            '1 day'::interval
          )::date as date
        ),
        user_activities AS (
          SELECT created_at, status FROM tasks WHERE author_id = $1
          UNION ALL
          SELECT t.created_at, t.status 
          FROM task_assignments ta 
          JOIN tasks t ON ta.task_id = t.task_id 
          WHERE ta.user_id = $1
          UNION ALL
          SELECT created_at, status FROM projects 
          WHERE author_id = $1 OR $1 = ANY(member_ids)
          UNION ALL
          SELECT created_at, goal_status as status FROM goals 
          WHERE author_id = $1 OR $1 = ANY(member_ids)
        ),
        daily_stats AS (
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as created_count,
            COUNT(CASE 
              WHEN status IN ('Выполнено', 'Завершен', 'Достигнута') 
              THEN 1 
            END) as completed_count
          FROM user_activities
          GROUP BY DATE(created_at)
        )
        SELECT 
          dr.date,
          COALESCE(ds.created_count, 0) as created_count,
          COALESCE(ds.completed_count, 0) as completed_count
        FROM date_range dr
        LEFT JOIN daily_stats ds ON dr.date = ds.date
        ORDER BY dr.date
      `, [userId, days]);

      return { type: "result", result: result.rows };
    } catch (error) {
      console.error('Error in getUserPerformance:', error);
      return { type: "errorMsg", errorMsg: "Error getting user performance" };
    }
  }
}