import axios, { AxiosError } from 'axios';

// Типы ошибок API
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Коды ошибок
export enum ErrorCode {
  // Общие ошибки
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Ошибки аутентификации
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Ошибки ресурсов
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INVALID_OPERATION = 'INVALID_OPERATION',

  // Ошибки валидации
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  INVALID_DATE = 'INVALID_DATE',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
}

// Класс для API ошибок
export class ApiException extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// Функция для обработки ошибок axios
export const handleApiError = (error: unknown): ApiException => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;

    // Обработка сетевых ошибок
    if (!axiosError.response) {
      return new ApiException(
        ErrorCode.NETWORK_ERROR,
        'Ошибка сети. Проверьте подключение к интернету.'
      );
    }

    const { status, data } = axiosError.response;

    // Обработка ошибок по статусу
    switch (status) {
      case 400:
        return new ApiException(
          ErrorCode.VALIDATION_ERROR,
          data?.message || 'Неверный запрос',
          data?.details
        );

      case 401:
        if (data?.code === ErrorCode.TOKEN_EXPIRED) {
          // Очищаем токен при истечении срока
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
        return new ApiException(
          ErrorCode.UNAUTHORIZED,
          data?.message || 'Требуется авторизация'
        );

      case 403:
        return new ApiException(
          ErrorCode.ACCESS_DENIED,
          data?.message || 'Доступ запрещен'
        );

      case 404:
        return new ApiException(
          ErrorCode.NOT_FOUND,
          data?.message || 'Ресурс не найден'
        );

      case 409:
        return new ApiException(
          ErrorCode.ALREADY_EXISTS,
          data?.message || 'Ресурс уже существует'
        );

      default:
        return new ApiException(
          ErrorCode.UNKNOWN_ERROR,
          data?.message || 'Произошла неизвестная ошибка'
        );
    }
  }

  // Обработка неизвестных ошибок
  return new ApiException(
    ErrorCode.UNKNOWN_ERROR,
    'Произошла неизвестная ошибка'
  );
};

// Хук для обработки ошибок в компонентах
export const useErrorHandler = () => {
  const handleError = (error: unknown) => {
    const apiError = handleApiError(error);

    // Здесь можно добавить логику отображения ошибок
    // Например, показ уведомления или модального окна
    console.error('API Error:', {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details
    });

    // Можно добавить специфичную обработку для разных типов ошибок
    switch (apiError.code) {
      case ErrorCode.UNAUTHORIZED:
        // Редирект на страницу логина
        window.location.href = '/login';
        break;

      case ErrorCode.VALIDATION_ERROR:
        // Показать ошибки валидации в форме
        break;

      case ErrorCode.NETWORK_ERROR:
        // Показать уведомление о проблемах с сетью
        break;
    }

    return apiError;
  };

  return { handleError };
}; 