import { userDto } from "./userTypes";

export interface AuthResponse {
  token: string;
  user: userDto;
}
