-- Создание базы данных
CREATE DATABASE "smartTasker" ENCODING UTF8;

-- Создание специального пользователя для работы с таблицами в БД
CREATE USER "worker1" WITH PASSWORD 's@ic5lyIK$tM';

\c "smartTasker" "ST_c&Rsov@aya789";

-- Подключение расширений для работы
CREATE EXTENSION pgcrypto;
CREATE EXTENSION "uuid-ossp";

-- Создание функции для получение uuid администратора
CREATE OR REPLACE FUNCTION get_admin_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN '59e3a168-0a05-4cfa-a03d-f4aa328fd976';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Запрет всем на выполение функции, и выдача прав на выполнение от "worker1"
REVOKE ALL ON FUNCTION get_admin_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_admin_user_id() TO "worker1"; -- Разрешить выполнение конкретному пользователю, который будет делать запросы


-- Выдаём права на все таблицы в схеме public на пользователя worker1
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "worker1";
GRANT CREATE ON SCHEMA public TO "worker1";

-- Подключаемся к БД от пользователя worker1
\c "smartTasker" "worker1"

-- Enum для пола
CREATE TYPE gender_type AS ENUM ('Мужчина', 'Женщина');

-- Enum для статуса приглашённого
CREATE TYPE status_invitation_type AS ENUM ('Зарегистрирован', 'Не зарегистрирован');

-- Enum для статуса задачи
CREATE TYPE task_status_type AS ENUM ('Черновик', 'В работе', 'Выполнена', 'Неактуальна', 'Провалена');

-- Enum для статуса проекта
CREATE TYPE project_status_type AS ENUM ('Черновик', 'В работе', 'Выполнена', 'Неактуальна', 'Провален', 'Приостановлен');

-- Enum для статуса цели
CREATE TYPE goal_status_type AS ENUM ('В работе', 'Достигнута', 'Провалена', 'Неактуальна');

-- Enum для приоритета
CREATE TYPE priority_type AS ENUM ('1', '2', '3', '4', '5');

-- Enum для ценностей
CREATE TYPE value_type AS ENUM ('1', '2', '3', '4', '5');

-- Enum для усилий
CREATE TYPE effort_type AS ENUM ('1', '2', '3', '4', '5');

-- Enum для типов устройств
CREATE TYPE device_type AS ENUM('android', 'ios', 'web');

-- Enum для типов чатов
CREATE TYPE chat_type AS ENUM('private', 'task', 'project');

-- Enum для типов сообщений
CREATE TYPE message_type AS ENUM('text', 'image');

-- Здесь можно добавить таблицу roles (Роли пользователей)
-- и связать его с таблицей users

-- Создание таблицы users (Пользователи/Сотрудники)
CREATE TABLE IF NOT EXISTS users(
  user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL, -- Фамилия
  middle_name VARCHAR(100) NOT NULL, -- Имя
  last_name VARCHAR(100), -- Отчество
  email VARCHAR(255) UNIQUE NOT NULL, -- Email
  phone_number VARCHAR(20), -- Телефон
  password TEXT NOT NULL, -- Пароль
  birth_date DATE, -- День рождение
  start_date DATE, -- Начало работы
  gender gender_type DEFAULT 'Мужчина' NOT NULL, -- Используем ENUM для пола
  address TEXT, -- Адрес проживания
  job_title VARCHAR(255), -- Должность
  avatarPath TEXT, -- Путь к изображению профиля
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Последний вход
  -- Можно добавить роли или другой способ назначения прав доступа
  -- Можно добавить столбец role_id, который ссылается на таблицу roles
  skills TEXT[], -- Массив навыков
  created_user_id uuid REFERENCES users(user_id) ON DELETE SET NULL, -- Идентификатор пользователя, который создал запись сотрудника
  created_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Дата создания пользователя
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL -- Дата обновления пользователя
);

-- Создание таблицы user_devices (Информация об устройствах пользователей)
CREATE TABLE user_devices (
  device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
  user_id UUID REFERENCES users (user_id) ON DELETE CASCADE NOT NULL, --  Ссылка на пользователя
  device_type device_type DEFAULT 'android' NOT NULL, -- Тип устройства
  device_token TEXT NOT NULL, -- Токен устройства
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы user_notifications_settings (Информация об настройках уведомлений пользователей)
CREATE TABLE IF NOT EXISTS user_notifications_settings(
  notifications_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  notifications_settings JSONB DEFAULT '{
    "push": true,
    "inapp": true
  }'::JSONB,
  notifications_settings_tasks JSONB DEFAULT '{
    "task.created": true,
    "task.updated": true,
    "task.completed": true,
    "task.assigned": true,
    "task.unassigned": true,
    "task.commented": true,
    "task.overdue": true,
    "task.priorty_changed": true,
    "task.status_changed": true,
    "task.deadline_changed": true,
    "task.due_soon": true
  }'::JSONB,
  notifications_settings_projects JSONB DEFAULT '{
    "project.created": true,
    "project.updated": true,
    "project.completed": true,
    "project.goal_completed": true,
    "project.status_changed": true,
    "project.date_changed": true,
    "project.task_created": true,
    "project.overdue": true,
    "project.due_soon": true
  }'::JSONB
);

-- Создание таблицы user_follows (Друзья, коллеги)
CREATE TABLE IF NOT EXISTS user_follows(
  follows_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id uuid REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
  status VARCHAR (25) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Гарантируем, что ID не равны (пользователь не может подписаться на себя)
  CONSTRAINT check_self_follow CHECK (follower_id <> following_id)
);

-- Создание таблицы invitation (Информация об приглашениях пользователей по email)
CREATE TABLE IF NOT EXISTS invitation(
  invitation_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(user_id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  status_invitation status_invitation_type DEFAULT 'Не зарегистрирован' NOT NULL
);

-- Создание таблицы projects (Проекты)
CREATE TABLE IF NOT EXISTS projects (
  project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name VARCHAR(255) NOT NULL, -- Название проекта
  description TEXT, -- Описание проекта
  start_date DATE DEFAULT NOW(), -- Дата начала проекта
  end_date DATE, -- Дата конца проекта (дедлайн)
  status project_status_type NOT NULL, -- Используем ENUM для статуса проекта
  author_id UUID REFERENCES users (user_id) NOT NULL, -- UUID в ссылке на users
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы project_goals (Цели проекта)
CREATE TABLE IF NOT EXISTS project_goals (
  project_goal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects (project_id) ON DELETE CASCADE NOT NULL, -- UUID в ссылке на projects
  goal_name VARCHAR(150) DEFAULT 'Без цели' NOT NULL, -- Название цели
  goal_description TEXT, -- Описание цели
  target_date DATE DEFAULT CURRENT_DATE NOT NULL, -- Крайний срок цели (будем преобразовывать формат dd.mm.YYYY в YYYY-mm-dd)
  goal_status goal_status_type DEFAULT 'В работе' NOT NULL -- Статус цели
);

-- Создание таблицы project_assignments (Команда проекта)
CREATE TABLE IF NOT EXISTS project_assignments (
  project_assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects (project_id) ON DELETE CASCADE NOT NULL, -- UUID в ссылке на projects
  user_id UUID REFERENCES users (user_id) ON DELETE SET DEFAULT DEFAULT get_admin_user_id() NOT NULL -- UUID в ссылке на users
);

-- Создание таблицы tasks (Задачи)
CREATE TABLE IF NOT EXISTS tasks (
  task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_name VARCHAR(255) NOT NULL, -- Название задачи
  description TEXT, -- Описание задачи
  author_id UUID REFERENCES users (user_id) ON DELETE CASCADE NOT NULL, -- UUID в ссылке на users
  project_id UUID REFERENCES projects (project_id) DEFAULT NULL, -- UUID в ссылке на projects
  goal_id UUID REFERENCES project_goals (project_goal_id) DEFAULT NULL, -- UUID в ссылке на project_goals
  start_date DATE DEFAULT NOW() NOT NULL, -- Дата начала задачи
  end_date DATE, -- Крайний срок задачи
  status task_status_type NOT NULL, -- Используем ENUM для статуса задачи
  is_urgent BOOLEAN DEFAULT FALSE, -- Boolean срочно/не срочно
  priority priority_type NOT NULL, -- Используем ENUM для приоритета
  value value_type NOT NULL, -- Используем ENUM для ценностей
  effort effort_type NOT NULL, -- Используем ENUM для усилий
  estimated_duration INT NOT NULL, -- Оценка срока
  priority_assessment INT NOT NULL, -- Оценка приориета
  qualification_assessment INT NOT NULL, -- Оценка квалификации
  load_assessment INT NOT NULL, -- Оценка нагрузки
  required_skills TEXT[] -- Массив навыков для задач
);

-- Создание таблицы task_assignments (Назначения задач пользователям)
CREATE TABLE IF NOT EXISTS task_assignments (
  task_assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks (task_id) ON DELETE CASCADE NOT NULL, -- UUID в ссылке на tasks
  user_id UUID REFERENCES users (user_id) ON DELETE SET DEFAULT DEFAULT get_admin_user_id() NOT NULL, -- UUID в ссылке на users
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Время назначения
  is_completed BOOLEAN DEFAULT FALSE, -- Выполнена задача или нет
  completed_at TIMESTAMP WITH TIME ZONE -- Когда выполнили
);

-- Создание таблицы task_comments (Комментарии к задачам)
CREATE TABLE IF NOT EXISTS task_comments (
  comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks (task_id) ON DELETE CASCADE NOT NULL, -- Ссылка на задачу
  user_id UUID REFERENCES users (user_id) ON DELETE SET DEFAULT DEFAULT get_admin_user_id() NOT NULL, -- Автор комментария
  comment_text TEXT NOT NULL, -- Текст комментария
  created_at TIMESTAMP WITH TIME ZONE, -- Дата создания комментария
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Дата редактирования сообщения
  is_edited BOOLEAN DEFAULT FALSE -- Был ли отредактирован комментарий
);

-- Создание таблицы notifications (Хранение in-app уведомлений)
CREATE TABLE IF NOT EXISTS in_app_notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users (user_id) ON DELETE CASCADE NOT NULL, --  Получатель уведомления
  notification_type VARCHAR(50) NOT NULL, -- Тип уведомления
  notification_title VARCHAR(100) NOT NULL, -- Заголовок уведомления
  notification_body TEXT NOT NULL, -- Основной текст
  notification_data JSONB, --  Дополнительные данные
  is_read BOOLEAN DEFAULT false NOT NULL, -- Прочитано сообщение или нет
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Дата создания уведомления/сообщения
);

-- Создание таблицы chats (Общее количество чатов и их типы)
CREATE TABLE IF NOT EXISTS chats(
  chat_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_type chat_type DEFAULT 'private' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы chat_messages (Сообщения в чатах и их содержание)
CREATE TABLE IF NOT EXISTS chat_messages(
  chat_messages_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id uuid REFERENCES chats(chat_id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(user_id) NOT NULL,
  message_text TEXT NOT NULL,
  message_type message_type DEFAULT 'text' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы chat_members (участники чата; last_read_message_id NULL = ещё не читал)
CREATE TABLE IF NOT EXISTS chat_members(
  chat_members_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(user_id) NOT NULL,
  chat_id uuid REFERENCES chats(chat_id) ON DELETE CASCADE NOT NULL,
  last_read_message_id uuid REFERENCES chat_messages(chat_messages_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chat_id)
);

-- Создание индексов для ускорения поиска
CREATE INDEX idx_users_email ON users (email); -- Индекс по email в users
CREATE INDEX idx_tasks_status ON tasks (status); -- Индекс по статусу задачи в tasks
CREATE INDEX idx_tasks_project_id ON tasks (project_id); -- Индекс по project_id в tasks
CREATE INDEX idx_tasks_author_user_id ON tasks (author_id); -- Индекс по user_id в tasks
CREATE INDEX idx_task_assignments_task_id ON task_assignments (task_id); -- Индекс по task_id в task_assingments
CREATE INDEX idx_task_assignments_user_id ON task_assignments (user_id); -- Индекс по user_id в task_assingments
CREATE INDEX idx_task_assignments_is_completed ON task_assignments (is_completed); -- Индекс по is_completed в task_assingments
CREATE INDEX idx_task_comments_task_id ON task_comments (task_id); -- Индекс по task_id в task_comments
CREATE INDEX idx_user_devices_user_id ON user_devices (user_id); -- Индек по user_id в user_devices
CREATE INDEX idx_notifications_user_id ON in_app_notifications (user_id); -- Индек по user_id в in_app_notifications
CREATE INDEX idx_notifications_is_read ON in_app_notifications (is_read); -- Индек по user_id в in_app_notifications
CREATE INDEX idx_chat_messages_chat_id ON chat_messages (chat_id);
CREATE INDEX idx_chat_members_chat_id ON chat_members (chat_id);
CREATE INDEX idx_chat_members_user_id ON chat_members (user_id);

-- Индексы для ограничений
-- Гарантирует что пара ключей (A, B) и (B, A) не будет существовать
CREATE UNIQUE INDEX idx_unique_follow_pair ON user_follows (
 LEAST(follower_id, following_id),
 GREATEST(follower_id, following_id)
);