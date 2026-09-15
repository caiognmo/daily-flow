'use client';
import { useEffect, useState } from 'react';
import { DateField } from '@/components/date-field';

type UserActivity = {
  email: string;
  last_seen: number | null;
  events: number;
  accesses: number;
  views: number;
  creations: number;
  active_days: number;
};
type ActivityData = {
  logs: {
    id: string;
    email: string;
    action: string;
    report_id: string;
    client: string;
    created_at: number;
  }[];
  total: number;
  users: UserActivity[];
  since: number | null;
};
const labels: Record<string, string> = {
  access: 'Acessou o SigeDaily',
  view: 'Abriu o relatório',
  create: 'Criou uma daily',
  edit: 'Alterou uma daily',
};
const dateText = (time: number | null) =>
  time
    ? new Date(time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    : 'Sem registro';
const today = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

export function ReportActivity() {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('r');
    if (!id) return;
    let sent = false;
    const record = () => {
      if (sent || document.visibilityState !== 'visible') return;
      sent = true;
      void fetch('/api/activity', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reportId: id }),
        keepalive: true,
      }).catch(() => {});
    };
    record();
    document.addEventListener('visibilitychange', record);
    return () => document.removeEventListener('visibilitychange', record);
  }, []);
  return null;
}

export function ActivityPanel({
  reports,
}: {
  reports: { id: string; client: string; city: string; state: string }[];
}) {
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  });
  const [to, setTo] = useState(today);
  const [email, setEmail] = useState('');
  const [report, setReport] = useState('');
  const [action, setAction] = useState('');
  const [inactive, setInactive] = useState(false);
  const [data, setData] = useState<ActivityData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const query = new URLSearchParams({
      from,
      to,
      email,
      report,
      action,
      page: String(page),
    });
    fetch(`/api/admin/activity?${query}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as ActivityData & {
          error?: string;
        };
        if (!response.ok) throw new Error(body.error);
        return body as ActivityData;
      })
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar.');
          setData(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [from, to, email, report, action, page, refresh]);
  const filter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };
  const users =
    data?.users.filter(
      (user) => !inactive || (report ? user.views === 0 : user.events === 0),
    ) || [];
  return (
    <section className="activity-panel" aria-labelledby="activity-title">
      <div className="activity-heading">
        <div>
          <h2 id="activity-title">Histórico de utilização</h2>
          <p>Privado • exclusivo do Caio</p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
          Atualizar
        </button>
      </div>
      <p>
        Contas autenticadas, horários de Brasília. Abrir não comprova leitura.
        Acessos sem login não são identificados. Registros disponíveis a partir
        desta atualização{data?.since ? ` (${dateText(data.since)})` : ''}.
      </p>
      <div className="activity-filters">
        <DateField
          id="activity-from"
          label="De"
          value={from}
          onChange={filter(setFrom)}
        />
        <DateField
          id="activity-to"
          label="Até"
          value={to}
          onChange={filter(setTo)}
        />
        <label>
          Usuário (e-mail completo)
          <input
            type="search"
            placeholder="Todos os usuários"
            value={email}
            onChange={(e) =>
              filter(setEmail)(e.target.value.trim().toLowerCase())
            }
          />
        </label>
        <label>
          Relatório
          <select
            value={report}
            onChange={(e) => filter(setReport)(e.target.value)}
          >
            <option value="">Todos os relatórios</option>
            {reports.map((row) => (
              <option key={row.id} value={row.id}>
                {row.client} ({row.city} - {row.state})
              </option>
            ))}
          </select>
        </label>
        <label>
          Ação no histórico
          <select
            value={action}
            onChange={(e) => filter(setAction)(e.target.value)}
          >
            <option value="">Todas as ações</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading && <p role="status">Carregando histórico…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && data && (
        <>
          <h3>Resumo por usuário no período</h3>
          <p>
            Inclui contas conhecidas por permissões, autoria ou acesso. Para
            acompanhar alguém que nunca entrou, cadastre seu e-mail em
            Permissões da equipe. O filtro de ação se aplica somente ao
            histórico abaixo.
          </p>
          <label className="activity-toggle">
            <input
              type="checkbox"
              checked={inactive}
              onChange={(e) => setInactive(e.target.checked)}
            />
            {report
              ? 'Somente quem não tem abertura registrada deste relatório no período'
              : 'Somente quem está sem atividade registrada no período'}
          </label>
          <div
            className="activity-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Resumo de utilização por usuário"
          >
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Última atividade geral</th>
                  <th>Dias ativos</th>
                  <th>Acessos</th>
                  <th>Aberturas</th>
                  <th>Dailys criadas</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.email}>
                    <td>
                      <button
                        className="activity-user"
                        onClick={() => filter(setEmail)(user.email)}
                      >
                        {user.email}
                      </button>
                      {(report ? user.views === 0 : user.events === 0) && (
                        <small>
                          Sem {report ? 'abertura' : 'atividade'} registrada no
                          período
                        </small>
                      )}
                    </td>
                    <td>{dateText(user.last_seen)}</td>
                    <td>{user.active_days}</td>
                    <td>{user.accesses}</td>
                    <td>{user.views}</td>
                    <td>{user.creations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!users.length && <p>Nenhum usuário corresponde aos filtros.</p>}
          <h3>Histórico de ações · {data.total} registros</h3>
          <p>
            Acessos repetidos são agrupados em intervalos de 30 minutos;
            reaberturas do mesmo relatório em até 1 minuto são agrupadas.
          </p>
          <div
            className="activity-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Histórico de ações"
          >
            <table>
              <thead>
                <tr>
                  <th>Data e hora</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Relatório</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={log.id}>
                    <td>{dateText(log.created_at)}</td>
                    <td>{log.email}</td>
                    <td>{labels[log.action] || log.action}</td>
                    <td>
                      {log.report_id ? (
                        <a
                          href={`/?r=${encodeURIComponent(log.report_id)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {log.client || 'Relatório'}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.logs.length && (
            <p>Nenhum registro encontrado neste período.</p>
          )}
          <nav
            className="activity-pagination"
            aria-label="Páginas do histórico"
          >
            <button
              disabled={page === 0}
              onClick={() => setPage((value) => value - 1)}
            >
              Anterior
            </button>
            <span>
              Página {page + 1} de {Math.max(1, Math.ceil(data.total / 50))}
            </span>
            <button
              disabled={(page + 1) * 50 >= data.total}
              onClick={() => setPage((value) => value + 1)}
            >
              Próxima
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
