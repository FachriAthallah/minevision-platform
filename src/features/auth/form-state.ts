export type AuthField =
  | "username"
  | "email"
  | "password"
  | "repeatPassword";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<AuthField, string[]>>;
};

export const initialAuthFormState: AuthFormState = {
  status: "idle",
};
