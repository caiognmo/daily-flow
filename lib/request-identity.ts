const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export const isAllowedCompanyEmail = (email: string) =>
  email.endsWith('@sistemasbr.net') || email.endsWith('@sistemasbr.com.br');

export const requestEmail = (request: Request) => {
  const hostname = new URL(request.url).hostname.toLowerCase();
  if (LOCAL_HOSTS.has(hostname)) return 'caio@sistemasbr.com.br';

  const accessEmail = request.headers.get(
    'cf-access-authenticated-user-email',
  );
  const sitesEmail = hostname.endsWith('.chatgpt.site')
    ? request.headers.get('oai-authenticated-user-email')
    : null;

  return (accessEmail || sitesEmail || '').trim().toLowerCase();
};
