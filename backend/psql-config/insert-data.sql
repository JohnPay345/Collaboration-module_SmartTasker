-- Вставка данных в таблицу users
INSERT INTO users (first_name, middle_name, last_name, email, phone_number, password, birth_date, start_date, gender, address, job_title, avatarPath, skills, created_user_id, created_at, updated_at) VALUES
('Иван', 'Иванович', 'Петров', 'ivan.petrov@example.com', '+79123456789', crypt('password123', gen_salt('bf')), '1990-05-15', '2020-01-10', 'Мужчина',
'г. Москва, ул. Ленина, д. 1', 'Разработчик', '/uploads/avatars/ivan_avatar.svg', ARRAY['Java', 'PostgreSQL', 'Spring'], NULL, NOW(), DEFAULT),
('Мария', 'Сергеевна', 'Сидорова', 'maria.sidorova@example.com', '+79234567890', crypt('securePass456', gen_salt('bf')), '1985-12-20', '2018-07-01', 'Женщина',
'г. Санкт-Петербург, Невский пр., д. 2', 'Менеджер', '/uploads/avatars/maria_avatar.svg', ARRAY['Управление проектами', 'Командообразование'], NULL, NOW(), DEFAULT),
('Петр', 'Алексеевич', 'Смирнов', 'petr.smirnov@example.com', '+79345678901', crypt('strongPassword789', gen_salt('bf')), '1992-03-01', '2021-03-15', 'Мужчина',
'г. Екатеринбург, ул. Малышева, д. 3', 'Дизайнер', '/uploads/avatars/petr_avatar.svg', ARRAY['UI/UX', 'Figma', 'Adobe Photoshop'], NULL, NOW(), DEFAULT),
('Елена', 'Викторовна', 'Кузнецова', 'elena.kuznetsova@example.com', '+79456789012', crypt('mySecretPass101', gen_salt('bf')), '1988-08-10', '2019-09-01', 'Женщина',
'г. Казань, ул. Баумана, д. 4', 'Аналитик', '/uploads/avatars/elena_avatar.svg', ARRAY['SQL', 'Excel', 'Python'], NULL, NOW(), DEFAULT),
('Алексей', 'Дмитриевич', 'Соколов', 'alexey.sokolov@example.com', '+79567890123', crypt('complexPassword202', gen_salt('bf')), '1995-06-25', '2022-01-20', 'Мужчина',
'г. Новосибирск, Красный пр., д. 5', 'Тестировщик', '/uploads/avatars/alexey_avatar.svg', ARRAY['Selenium', 'JUnit', 'TestRail'], NULL, NOW(), DEFAULT),
('Ольга', 'Андреевна', 'Волкова', 'olga.volkova@example.com', '+79678901234', crypt('topSecret303', gen_salt('bf')), '1991-11-05', '2020-05-10', 'Женщина',
'г. Самара, ул. Ленинградская, д. 6', 'Бухгалтер', '/uploads/avatars/olga_avatar.svg', ARRAY['1С', 'Бухгалтерский учет', 'Налогообложение'], NULL, NOW(), DEFAULT),
('Дмитрий', 'Сергеевич', 'Морозов', 'dmitry.morozov@example.com', '+79789012345', crypt('verySecurePass404', gen_salt('bf')), '1987-04-12', '2017-11-01', 'Мужчина',
'г. Нижний Новгород, ул. Большая Покровская, д. 7', 'Юрист', '/uploads/avatars/dmitry_avatar.svg', ARRAY['Гражданское право', 'Арбитраж', 'Договорное право'], NULL, NOW(), DEFAULT),
('Наталья', 'Ивановна', 'Лебедева', 'natalia.lebedeva@example.com', '+79890123456', crypt('hiddenPass505', gen_salt('bf')), '1983-09-18', '2016-03-01', 'Женщина',
'г. Ростов-на-Дону, ул. Большая Садовая, д. 8', 'HR-менеджер', '/uploads/avatars/natalia_avatar.svg', ARRAY['Подбор персонала', 'Адаптация', 'Мотивация'], NULL, NOW(), DEFAULT),
('Сергей', 'Петрович', 'Козлов', 'sergey.kozlov@example.com', '+79901234567', crypt('ultraSecret606', gen_salt('bf')), '1994-02-28', '2023-02-15', 'Мужчина',
'г. Уфа, ул. Ленина, д. 9', 'Маркетолог', '/uploads/avatars/sergey_avatar.svg', ARRAY['SMM', 'SEO', 'Контекстная реклама'], NULL, NOW(), DEFAULT),
('Светлана', 'Алексеевна', 'Виноградова', 'svetlana.vinogradova@example.com', '+79012345678', crypt('superSecure707', gen_salt('bf')), '1989-07-03', '2019-01-01', 'Женщина',
'г. Красноярск, пр. Мира, д. 10', 'PR-менеджер', '/uploads/avatars/svetlana_avatar.svg', ARRAY['СМИ', 'Пресс-релизы', 'Коммуникации'], NULL, NOW(), DEFAULT);

-- Вставляем данные в user_devices
INSERT INTO user_devices (user_id, device_type, device_token)
SELECT
  user_id,
  'android',  -- Случайный выбор типа устройства
  md5(random()::text) -- device_token (фиктивный токен)
FROM users;

-- Вставляем данные в user_notifications_settings
INSERT INTO user_notifications_settings (user_id, notifications_settings, notifications_settings_tasks, notifications_settings_projects)
SELECT
  user_id,
  '{
      "push": true,
      "inapp": true
  }'::JSONB, -- notifications_settings
  '{
      "task.created": true,
      "task.updated": true,
      "task.completed": true,
      "task.assigned": true,
      "task.unassigned": true,
      "task.commented": true,
      "task.overdue": true,
      "task.priority_changed": true,
      "task.status_changed": true,
      "task.deadline_changed": true,
      "task.due_soon": true
  }'::JSONB, -- notifications_settings_tasks
  '{
      "project.created": true,
      "project.updated": true,
      "project.completed": true,
      "project.goal_completed": true,
      "project.status_changed": true,
      "project.date_changed": true,
      "project.task_created": true,
      "project.overdue": true,
      "project.due_soon": true
  }'::JSONB  -- notifications_settings_projects
FROM users;

-- Вставка данных случайным образом в таблицу user_follows
DO $$
DECLARE
  user_uuids UUID[];
  num_users INTEGER;
  target_inserts INTEGER := 30; -- Желаемое количество уникальных пар
  i INTEGER := 0;

  user1_uuid UUID; -- Всегда меньший ID
  user2_uuid UUID; -- Всегда больший ID

  temp_uuid UUID;
BEGIN
  -- 1. Получаем все существующие UUID
  SELECT ARRAY(SELECT user_id FROM users) INTO user_uuids;
  num_users := array_length(user_uuids, 1);

  IF num_users IS NULL OR num_users < 2 THEN
    RAISE NOTICE 'Недостаточно пользователей.';
    RETURN;
  END IF;

  -- 2. Цикл для генерации и вставки уникальных пар в каноническом порядке
  WHILE i < target_inserts LOOP
    -- Генерируем два случайных, но разных UUID
    user1_uuid := user_uuids[floor(random() * num_users) + 1];
    LOOP
      user2_uuid := user_uuids[floor(random() * num_users) + 1];
        IF user1_uuid IS DISTINCT FROM user2_uuid THEN
          EXIT;
        END IF;
    END LOOP;

    -- Определяем канонический порядок (user1 < user2) для уникальности
    IF user1_uuid > user2_uuid THEN
      temp_uuid := user1_uuid;
      user1_uuid := user2_uuid;
      user2_uuid := temp_uuid;
    END IF;

    -- 3. Пытаемся вставить пару со статусом 'ACCEPTED'
    BEGIN
      INSERT INTO user_follows (follower_id, following_id, status, created_at)
      VALUES (user1_uuid, user2_uuid, 'accepted', DEFAULT);

      i := i + 1; -- Увеличиваем счетчик только при успешной вставке

    EXCEPTION
      WHEN unique_violation THEN
        -- Игнорируем, если пара (user1_uuid, user2_uuid) уже существует
        NULL;
    END;
  END LOOP;
  RAISE NOTICE 'Успешно вставлено % уникальных принятых связей.', i;
END $$;

-- Вставка данных в таблицу projects
INSERT INTO projects (project_name, description, start_date, end_date, status, author_id, tags) VALUES
('Разработка нового сайта компании', 'Создание современного веб-сайта для привлечения клиентов', '2024-01-15', '2024-06-30', 'В работе',
(SELECT user_id FROM users ORDER BY random() LIMIT 1), ARRAY['Веб-разработка', 'Дизайн', 'Маркетинг']),
('Внедрение CRM-системы', 'Автоматизация процессов управления взаимоотношениями с клиентами', '2023-11-01', '2024-03-31', 'Выполнена', 
(SELECT user_id FROM users ORDER BY random() LIMIT 1), ARRAY['CRM', 'Автоматизация', 'Продажи']),
('Оптимизация логистики', 'Снижение затрат на доставку и хранение товаров', '2024-02-01', '2024-05-31', 'В работе', 
(SELECT user_id FROM users ORDER BY random() LIMIT 1), ARRAY['Логистика', 'Склад', 'Транспорт']);

-- Получение последних трех project_id для вставки в project_goals и project_assignments
WITH project_ids AS (
  SELECT project_id FROM projects ORDER BY created_at DESC LIMIT 3
)
-- Вставка данных в таблицу project_goals для первого проекта
INSERT INTO project_goals (project_id, goal_name, goal_description, target_date, goal_status) VALUES
((SELECT project_id FROM project_ids ORDER BY project_id LIMIT 1), 'Разработать дизайн-макет', 'Создание визуального представления сайта', '2024-02-15', 'В работе'),
((SELECT project_id FROM project_ids ORDER BY project_id LIMIT 1), 'Развернуть backend', 'Разработка серверной части сайта', '2024-03-15', 'В работе'),
((SELECT project_id FROM project_ids ORDER BY project_id LIMIT 1), 'Развернуть frontend', 'Разработка клиентской части сайта', '2024-04-15', 'В работе'),
((SELECT project_id FROM project_ids ORDER BY project_id LIMIT 1), 'Заполнить контентом', 'Наполнение сайта текстовой и графической информацией', '2024-05-15', 'В работе'),
((SELECT project_id FROM project_ids ORDER BY project_id LIMIT 1), 'Протестировать сайт', 'Проверка работоспособности и исправление ошибок', '2024-06-01', 'В работе'),
((SELECT project_id FROM project_ids ORDER BY project_id LIMIT 1), 'Опубликовать сайт', 'Размещение сайта в сети Интернет', '2024-06-30', 'В работе'),
-- Вставка данных в таблицу project_goals для второго проекта
((SELECT project_id FROM project_ids ORDER BY project_id OFFSET 1 LIMIT 1), 'Выбрать CRM-систему', 'Определение подходящей системы', '2023-11-15', 'Достигнута'),
((SELECT project_id FROM project_ids ORDER BY project_id OFFSET 1 LIMIT 1), 'Настроить CRM-систему', 'Интеграция системы с существующими базами', '2023-12-15', 'Достигнута'),
((SELECT project_id FROM project_ids ORDER BY project_id OFFSET 1 LIMIT 1), 'Обучить персонал', 'Обучение сотрудников работе с CRM', '2024-01-15', 'Достигнута'),
((SELECT project_id FROM project_ids ORDER BY project_id OFFSET 1 LIMIT 1), 'Внедрить CRM-систему', 'Начать использование системы в работе', '2024-03-31', 'Достигнута'),
-- Вставка данных в таблицу project_goals для третьего проекта
((SELECT project_id FROM project_ids ORDER BY project_id OFFSET 2 LIMIT 1), 'Анализ логистических процессов', 'Изучение текущих процессов и выявление проблем', '2024-02-15', 'В работе'),
((SELECT project_id FROM project_ids ORDER BY project_id OFFSET 2 LIMIT 1), 'Оптимизация маршрутов', 'Разработка более эффективных маршрутов доставки', '2024-03-15', 'В работе'),
((SELECT project_id FROM project_ids ORDER BY project_id OFFSET 2 LIMIT 1), 'Внедрение системы управления складом', 'Автоматизация складских операций', '2024-04-15', 'В работе'),
((SELECT project_id FROM project_ids ORDER BY project_id OFFSET 2 LIMIT 1), 'Сокращение затрат на транспорт', 'Снижение стоимости доставки товаров', '2024-05-31', 'В работе'),
((SELECT project_id FROM project_ids ORDER BY project_id OFFSET 2 LIMIT 1), 'Пересмотреть условия с поставщиками', 'Анализ контрактов, обсудить условия', '2024-05-01', 'В работе');

WITH project_ids AS (
  SELECT project_id FROM projects ORDER BY created_at DESC LIMIT 3
)
-- Вставка данных в таблицу project_assignments для первого проекта
INSERT INTO project_assignments (project_id, user_id)
SELECT (SELECT project_id FROM project_ids ORDER BY project_id LIMIT 1), user_id
FROM users
ORDER BY random()
LIMIT 3;

WITH project_ids AS (
  SELECT project_id FROM projects ORDER BY created_at DESC LIMIT 3
)
-- Вставка данных в таблицу project_assignments для второго проекта
INSERT INTO project_assignments (project_id, user_id)
SELECT (SELECT project_id FROM project_ids ORDER BY project_id OFFSET 1 LIMIT 1), user_id
FROM users
ORDER BY random()
LIMIT 4;

WITH project_ids AS (
  SELECT project_id FROM projects ORDER BY created_at DESC LIMIT 3
)
-- Вставка данных в таблицу project_assignments для третьего проекта
INSERT INTO project_assignments (project_id, user_id)
SELECT (SELECT project_id FROM project_ids ORDER BY project_id OFFSET 2 LIMIT 1), user_id
FROM users
ORDER BY random()
LIMIT 5;

-- Получаем project_id и project_goal_id для дальнейшей связки
WITH project_data AS (
  SELECT p.project_id, p.project_name, pg.project_goal_id, pg.goal_name
  FROM projects p
      LEFT JOIN project_goals pg ON p.project_id = pg.project_id
  ORDER BY p.created_at DESC
)

-- Вставляем задачи для каждого проекта (в соответствии с количеством целей)
INSERT INTO tasks (task_name, description, author_id, project_id, goal_id, start_date, end_date, status, is_urgent, priority,
value, effort, estimated_duration, priority_assessment, qualification_assessment, load_assessment, required_skills)
SELECT
  pd.goal_name || ' - Задача', -- task_name формируем на основе goal_name
  'Описание задачи для ' || pd.goal_name, -- description
  (
    SELECT COALESCE(
      (
        SELECT pa.user_id
        FROM project_assignments pa
        WHERE pa.project_id = pd.project_id
        ORDER BY random()
        LIMIT 1
      ),
      (
        SELECT p.author_id
        FROM projects p
        WHERE p.project_id = pd.project_id
      )
    )
  ), -- author_id: случайный участник проекта (или автор, если участников нет)
  pd.project_id, -- project_id
  pd.project_goal_id,  -- goal_id
  NOW() - INTERVAL '1 week',  -- start_date
  NOW() + INTERVAL '1 week',  -- end_date
  CASE
    WHEN random() < 0.8 THEN 'В работе'::task_status_type -- status_status (80% "В работе")
    ELSE 'Черновик'::task_status_type
  END,
  CASE WHEN random() < 0.2 THEN TRUE ELSE FALSE END, -- is_urgent (20% срочные)
  (CASE WHEN random() < 0.2 THEN '1' WHEN random() < 0.5 THEN '2' ELSE '3' END)::priority_type, -- priority_type
  (CASE WHEN random() < 0.2 THEN '1' WHEN random() < 0.5 THEN '2' ELSE '3' END)::value_type, -- value_type
  (CASE WHEN random() < 0.2 THEN '1' WHEN random() < 0.5 THEN '2' ELSE '3' END)::effort_type, -- effort_type
  floor(random() * 24)::int, -- estimated_duration (часы)
  floor(random() * 10)::int, -- priority_assessment
  floor(random() * 10)::int, -- qualification_assessment
  floor(random() * 10)::int,  -- load_assessment
  ARRAY['SQL', 'Backend', 'Frontend']::TEXT[]  -- required_skills
FROM project_data pd;

-- Для каждой задачи создадим task_assignments (назначения)
WITH task_ids AS (
  SELECT task_id
  FROM tasks
  ORDER BY start_date DESC
)
INSERT INTO task_assignments (task_id, user_id)
SELECT task_id, (
  SELECT user_id
  FROM users
  ORDER BY random()
  LIMIT 1
) FROM task_ids
ORDER BY random()
LIMIT (
  SELECT count(*)
  FROM task_ids
);

-- Добавим немного комментариев (не для всех задач)
WITH task_ids AS (
  SELECT task_id
  FROM tasks
  ORDER BY random ()
  LIMIT 5
)
INSERT INTO task_comments(task_id, user_id, comment_text)
SELECT task_id, (
  SELECT user_id
  FROM users
  ORDER BY random ()
  LIMIT 1
), 'Пример комментария к задаче ' || task_id
FROM task_ids;