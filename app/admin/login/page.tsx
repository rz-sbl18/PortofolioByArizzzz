"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError("Email atau password salah.");
      return;
    }
    router.replace("/admin");
  }

  return (
    <form className="login" onSubmit={submit}>
      <span className="mono amber small">&gt; admin login</span>
      <h1 style={{ margin: 0, fontSize: 32 }}>Masuk</h1>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <div className="msg msg-err" role="alert">{error}</div>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</button>
    </form>
  );
}
