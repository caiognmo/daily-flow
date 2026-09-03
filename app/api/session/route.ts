import { env } from 'cloudflare:workers';
import {
  isAllowedCompanyEmail,
  requestEmail,
} from '@/lib/request-identity';

export async function GET(request: Request) {
  const email = requestEmail(request);
  const admins = (
    (env as unknown as Record<string, string>).ADMIN_EMAILS ||
    'caio@sistemasbr.com.br,caio@sistemasbr.net'
  )
    .toLowerCase()
    .split(',')
    .map((value) => value.trim());
  const isAdmin = admins.includes(email);
  if (!email || !isAllowedCompanyEmail(email))
    return Response.json({ authenticated: false }, { status: 401 });
  let permission = { canEdit: false, canDelete: false, enabled: true };
  if (isAdmin) permission = { canEdit: true, canDelete: true, enabled: true };
  else {
    const row = await (env.DB as D1Database)
      .prepare(
        'SELECT can_edit,can_delete,enabled FROM permissions WHERE email=?',
      )
      .bind(email)
      .first<{ can_edit: number; can_delete: number; enabled: number }>();
    if (row)
      permission = {
        canEdit: !!row.can_edit,
        canDelete: !!row.can_delete,
        enabled: !!row.enabled,
      };
  }
  if (!permission.enabled)
    return Response.json(
      { authenticated: true, email, enabled: false },
      { status: 403 },
    );
  return Response.json({
    authenticated: true,
    email,
    isAdmin,
    ...permission,
  });
}
