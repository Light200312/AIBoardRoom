import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

function AuthPage({ onAuthenticate }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const submit = async () => {
    setError("");
    if (!form.password || (!form.email && !form.username)) {
      setError("Provide credentials.");
      return;
    }
    if (isRegister && !form.username) {
      setError("Username is required for registration.");
      return;
    }

    setLoading(true);
    try {
      await onAuthenticate(mode, {
        username: form.username,
        email: form.email,
        identifier: form.email || form.username,
        password: form.password,
      });
    } catch (e) {
      setError(e.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">AI Council</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {isRegister ? "Create account" : "Sign in"} to start your session.
        </p>

        <div className="space-y-3">
          {isRegister && (
            <Input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            />
          )}
          <Input
            placeholder={isRegister ? "Email" : "Email or Username"}
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <Input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        {error ? <p className="text-red-600 dark:text-red-400 text-sm mt-3">{error}</p> : null}

        <Button className="w-full mt-5" onClick={submit} loading={loading}>
          {isRegister ? "Register" : "Login"}
        </Button>

        <button
          className="mt-4 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          onClick={() => {
            setMode(isRegister ? "login" : "register");
            setError("");
          }}
        >
          {isRegister ? "Already have an account? Login" : "Need an account? Register"}
        </button>
      </div>
    </div>
  );
}

export { AuthPage };
