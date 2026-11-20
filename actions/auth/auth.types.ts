export type FieldErrorMap = Record<string, string | undefined>;

export type ActionState<TFields extends FieldErrorMap = FieldErrorMap> = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: TFields;
};

/** Signup conversions the browser pixel repeats (same ids as the CAPI events). */
export type WithMetaEvents = { metaEvents?: { name: string; eventId: string; data?: Record<string, unknown> }[] };

export type RegisterState = WithMetaEvents & ActionState<{
  storeName?: string;
  name?: string;
  country?: string;
  businessType?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  refCode?: string;
}>;

export type LoginState = ActionState<{
  email?: string;
  password?: string;
}>;