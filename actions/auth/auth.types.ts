export type FieldErrorMap = Record<string, string | undefined>;

export type ActionState<TFields extends FieldErrorMap = FieldErrorMap> = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: TFields;
};

export type RegisterState = ActionState<{
  storeName?: string;
  name?: string;
  country?: string;
  businessType?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}>;

export type LoginState = ActionState<{
  email?: string;
  password?: string;
}>;