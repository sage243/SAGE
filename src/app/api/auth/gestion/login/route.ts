import { NextResponse } from "next/server";
import { GESTION_SESSION_COOKIE, gestionLoginOk } from "@/lib/auth";

function redirectTo(request: Request, path: string) {
  const incoming = new URL(request.url);
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || incoming.host;
  const [rawHostname, rawPort] = rawHost.split(":");
  const hostname =
    !rawHostname || rawHostname === "0.0.0.0" || rawHostname === "[::]" || rawHostname === "::"
      ? "127.0.0.1"
      : rawHostname;
  const port = rawPort || incoming.port;
  const proto = (request.headers.get("x-forwarded-proto") || incoming.protocol.replace(":", "") || "http").replace(
    /:$/,
    "",
  );
  const origin = `${proto}://${hostname}${port ? `:${port}` : ""}`;
  return NextResponse.redirect(`${origin}${path}`, 303);
}

function setSession(response: NextResponse) {
  response.cookies.set(GESTION_SESSION_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

/** Native HTML form POST — works without client JS (automation-friendly). */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  let username = "";
  let password = "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    username = String(body.username || "");
    password = String(body.password || "");
  } else {
    const form = await request.formData();
    username = String(form.get("username") || "");
    password = String(form.get("password") || "");
  }

  const ok = gestionLoginOk(username, password);
  const isFormPost =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data") ||
    (request.headers.get("accept") || "").includes("text/html");

  if (!ok) {
    if (isFormPost) return redirectTo(request, "/gestion/login?error=1");
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  if (isFormPost) return setSession(redirectTo(request, "/gestion"));
  return setSession(NextResponse.json({ ok: true }));
}
