"use client";

import { KeyRound, LogIn, Mail, ShieldCheck, User, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { PRODUCT_NAME } from "@/lib/ui-copy";

type AuthMode = "login" | "register";

const PASSWORD_MIN_LENGTH = 8;
const LOGIN_ERROR = "邮箱或密码不正确，请检查后重试。";
const REGISTER_ERROR = "注册失败，请检查信息后重试。";

export function LoginRegistrationPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const validationError = getRegistrationValidationError({
          name,
          email,
          password,
          confirmPassword,
        });

        if (validationError) {
          setError(validationError);
          return;
        }

        const response = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password, confirmPassword }),
        });

        if (!response.ok) {
          setError(REGISTER_ERROR);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: "/",
      });

      if (!result?.ok || result.error) {
        setError(LOGIN_ERROR);
        return;
      }

      setMessage(mode === "register" ? "账号已创建，正在进入系统。" : "登录成功，正在进入系统。");
      router.replace("/");
      router.refresh();
    } catch {
      setError(mode === "register" ? REGISTER_ERROR : LOGIN_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitLabel = mode === "register" ? "创建账号并进入系统" : "进入系统首页";

  return (
    <main className="auth-shell">
      <section className="auth-stage" aria-label={`${PRODUCT_NAME} 认证入口`}>
        <div className="auth-copy">
          <div className="auth-kicker">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Secure Skills Gateway</span>
          </div>

          <div className="auth-copy-main">
            <span className="auth-command">~/skillsrepo/auth</span>
            <h1>{PRODUCT_NAME}</h1>
            <p>内部 Skills 管理入口。注册用户默认以员工权限进入，管理动作继续由后端 RBAC 校验。</p>
          </div>

          <dl className="auth-signal-grid" aria-label="认证状态说明">
            <div>
              <dt>auth.mode</dt>
              <dd>credentials</dd>
            </div>
            <div>
              <dt>session.role</dt>
              <dd>{mode === "register" ? "employee" : "verified"}</dd>
            </div>
            <div>
              <dt>rbac.source</dt>
              <dd>server</dd>
            </div>
          </dl>
        </div>

        <form className="auth-card" onSubmit={(event) => void submitAuth(event)}>
          <div className="auth-card-header">
            <p>Identity Checkpoint</p>
            <h2>{mode === "register" ? "创建账号" : "登录系统"}</h2>
          </div>

          <div className="auth-tabs" aria-label="认证模式">
            <button
              aria-pressed={mode === "login"}
              className={mode === "login" ? "active" : ""}
              type="button"
              onClick={() => switchMode("login")}
            >
              <LogIn size={17} aria-hidden="true" />
              登录
            </button>
            <button
              aria-pressed={mode === "register"}
              className={mode === "register" ? "active" : ""}
              type="button"
              onClick={() => switchMode("register")}
            >
              <UserPlus size={17} aria-hidden="true" />
              注册
            </button>
          </div>

          {mode === "register" ? (
            <label className="auth-field">
              <span>姓名</span>
              <div>
                <User size={17} aria-hidden="true" />
                <input
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </label>
          ) : null}

          <label className="auth-field">
            <span>邮箱</span>
            <div>
              <Mail size={17} aria-hidden="true" />
              <input
                autoComplete="email"
                inputMode="email"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <label className="auth-field">
            <span>密码</span>
            <div>
              <KeyRound size={17} aria-hidden="true" />
              <input
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                minLength={mode === "register" ? PASSWORD_MIN_LENGTH : undefined}
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          {mode === "register" ? (
            <label className="auth-field">
              <span>确认密码</span>
              <div>
                <KeyRound size={17} aria-hidden="true" />
                <input
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </label>
          ) : null}

          <button aria-busy={isSubmitting} className="auth-submit" disabled={isSubmitting} type="submit">
            {mode === "register" ? <UserPlus size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
            {isSubmitting ? "正在处理..." : submitLabel}
          </button>

          <div aria-live="polite" className="auth-feedback">
            {error ? <p className="notice error">{error}</p> : null}
            {message ? <p className="notice success">{message}</p> : null}
          </div>
        </form>
      </section>
    </main>
  );
}

function getRegistrationValidationError({
  name,
  email,
  password,
  confirmPassword,
}: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string {
  if (!name.trim() || !email.trim() || !password || !confirmPassword) {
    return "请填写完整的注册信息。";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `密码至少需要 ${PASSWORD_MIN_LENGTH} 位。`;
  }

  if (password !== confirmPassword) {
    return "两次输入的密码不一致。";
  }

  return "";
}
