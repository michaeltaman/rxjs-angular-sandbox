export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar?: string; // Можно добавить фото профиля
}

export interface RegisterUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  invite_code?: string | null;
}
