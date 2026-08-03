"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter(); const params = useSearchParams();
  const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) { setError((await response.json()).error ?? "Anmeldung nicht möglich."); setLoading(false); return; }
    const next = params.get("next"); router.replace(next?.startsWith("/") ? next : "/"); router.refresh();
  }
  return <main className={styles.page}><section className={styles.card}><div className={styles.brand}><b>M</b>media<span>pulse</span></div><p className={styles.eyebrow}>INTERNER ZUGANG</p><h1>Willkommen zurück.</h1><p className={styles.intro}>Bitte geben Sie das in 1Password hinterlegte Dashboard-Passwort ein.</p><form className={styles.form} onSubmit={submit}><label htmlFor="password">Passwort</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required /><button disabled={loading}>{loading ? "Prüfe Zugang…" : "Dashboard öffnen →"}</button>{error && <span className={styles.error}>{error}</span>}</form><small className={styles.note}>Der Zugang ist für autorisierte Teammitglieder bestimmt.</small></section></main>;
}
