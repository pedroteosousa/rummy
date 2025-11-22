import { useState } from "preact/hooks";
import { supabase } from "../lib/supabase/supabaseClient.ts";
import LoginForm from "../components/LoginForm.tsx";

export default function LoginIsland() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const form = e.target as HTMLFormElement;
    const email = (form.email as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;
    const username = (form.username as HTMLInputElement).value;

    if (isSignUp) {
      // 👤 SIGN UP
      const { error } = await supabase.auth.signUp({ email, password, options: {
        data: {
          username: username
        }
      } });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Account created! You can now log in.");
        setIsSignUp(false);
      }
    } else {
      // 🔑 LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = "/";
      }
    }
  }

  return (
    <div class="flex flex-col items-center mt-20">
      <LoginForm onSubmit={handleSubmit} />

      <div class="mt-3">
        {error && <p class="text-red-500 text-center">{error}</p>}
        {message && <p class="text-green-600 text-center">{message}</p>}
      </div>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setMessage(null);
          setIsSignUp(!isSignUp);
          console.log(isSignUp);
        }}
        class="mt-6 text-blue-600 underline"
      >
        {isSignUp ? "Already have an account? Log in" : "Need an account? Sign up"}
      </button>
    </div>
  );
}
