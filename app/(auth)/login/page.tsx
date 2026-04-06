import { LoginForm } from "../_components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
}
