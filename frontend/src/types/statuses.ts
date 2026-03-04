export type ProjectStatus =
  | 'В работе'
  | 'Выполнена'
  | 'Сдана'
  | 'Провален'
  | 'Неактуально'
  | 'Приостановлен'
  | 'Черновик';

export type GoalStatus =
  | 'В работе'
  | 'Выполнена'
  | 'Сдана'
  | 'Провален'
  | 'Неактуально'
  | 'Черновик';

export type TaskStatus =
  | 'В работе'
  | 'Выполнена'
  | 'Сдана'
  | 'Провален'
  | 'Неактуально'
  | 'Черновик';

export interface WithProjectStatus {
  status: ProjectStatus;
}

export interface WithTaskStatus {
  status: TaskStatus;
}
