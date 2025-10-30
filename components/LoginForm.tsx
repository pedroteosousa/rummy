export default function LoginForm(props: { onSubmit: (e: Event) => void }) {
  return (
    <form
      onSubmit={props.onSubmit}
      class="max-w-sm mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg flex flex-col gap-4"
    >
      <h1 class="text-2xl font-bold text-center">Login</h1>
      <input
        type="text"
        name="username"
        placeholder="Username"
        class="border p-2 rounded"
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        class="border p-2 rounded"
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        class="border p-2 rounded"
        required
      />

      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-semibold"
      >
        Login
      </button>
    </form>
  );
}
