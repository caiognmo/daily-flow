'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  FileDown,
  Filter,
  HardDrive,
  House,
  Link2,
  LogOut,
  MessageCircle,
  Mic2,
  Pencil,
  Plus,
  Printer,
  Radio,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';

const plans = ['PDV', 'Básico', 'Controle', 'Avançado'];
const states = [
  ['AC', 'Acre'],
  ['AL', 'Alagoas'],
  ['AP', 'Amapá'],
  ['AM', 'Amazonas'],
  ['BA', 'Bahia'],
  ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'],
  ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'],
  ['MA', 'Maranhão'],
  ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'],
  ['PA', 'Pará'],
  ['PB', 'Paraíba'],
  ['PR', 'Paraná'],
  ['PE', 'Pernambuco'],
  ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'],
  ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'],
  ['RR', 'Roraima'],
  ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'],
  ['SE', 'Sergipe'],
  ['TO', 'Tocantins'],
];
type Employee = { name: string; role: string };
type FormData = {
  client: string;
  city: string;
  state: string;
  plan: string;
  customPlan: string;
  endDate: string;
  endDateText: string;
  employees: Employee[];
  softwareMode: string;
  softwareName: string;
  customSoftware: string;
  includeAudio: boolean;
  flowText: string;
};
type ReportPayload = FormData & { audioUrl?: string; createdBy?: string };
type SessionInfo = {
  email: string;
  isAdmin: boolean;
  canEdit: boolean;
  canDelete: boolean;
};
type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};
type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (configuration: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: () => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}
const initial: FormData = {
  client: '',
  city: '',
  state: '',
  plan: '',
  customPlan: '',
  endDate: '',
  endDateText: '',
  employees: [{ name: '', role: '' }],
  softwareMode: '',
  softwareName: '',
  customSoftware: '',
  includeAudio: false,
  flowText: '',
};
const fmt = (v: string) => (v ? v.split('-').reverse().join('/') : '—');
const audioUrlForKey = (key: string) =>
  `/api/audio/${key.split('/').map(encodeURIComponent).join('/')}`;
const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};
function Choice({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`choice ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <span>{children}</span>
      {active && <Check size={15} />}
    </button>
  );
}

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  abort: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
const mergeVoiceText = (current: string, transcript: string) =>
  `${current.trim()}${current.trim() ? ' ' : ''}${transcript.trim()}`;
function VoiceButton({
  label,
  onTranscript,
}: {
  label: string;
  onTranscript: (value: string) => void;
}) {
  const [listening, setListening] = useState(false),
    [unsupported, setUnsupported] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  useEffect(() => () => recognitionRef.current?.abort(), []);
  const start = () => {
    const speechWindow = window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      },
      Recognition =
        speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setUnsupported(true);
      return;
    }
    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    try {
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
    }
  };
  return (
    <button
      type="button"
      className={`voice-button ${listening ? 'listening' : ''} ${unsupported ? 'unsupported' : ''}`}
      onClick={start}
      aria-label={`Digitar ${label} por voz`}
      aria-pressed={listening}
      title={
        unsupported
          ? 'Este navegador não oferece digitação por voz.'
          : listening
            ? 'Ouvindo…'
            : `Digitar ${label} por voz`
      }
    >
      <Mic2 />
    </button>
  );
}
function VoiceField({
  children,
  label,
  multiline = false,
  onTranscript,
}: {
  children: React.ReactNode;
  label: string;
  multiline?: boolean;
  onTranscript: (value: string) => void;
}) {
  return (
    <div className={`voice-field ${multiline ? 'voice-multiline' : ''}`}>
      {children}
      <VoiceButton label={label} onTranscript={onTranscript} />
    </div>
  );
}

export default function Home() {
  const [started, setStarted] = useState(false),
    [step, setStep] = useState(1),
    [data, setData] = useState(initial),
    [copied, setCopied] = useState(false);
  const [consulting, setConsulting] = useState(false),
    [saveStatus, setSaveStatus] = useState(''),
    [saving, setSaving] = useState(false),
    [dailyDirty, setDailyDirty] = useState(true);
  const [reportData, setReportData] = useState<ReportPayload | null>(null),
    [linkCopied, setLinkCopied] = useState(false),
    [reportState, setReportState] = useState<'none' | 'loading' | 'error'>(
      'none',
    );
  const [cities, setCities] = useState<string[]>([]),
    [citiesLoading, setCitiesLoading] = useState(false);
  const [recording, setRecording] = useState(false),
    [audioUrl, setAudioUrl] = useState(''),
    [audioBlob, setAudioBlob] = useState<Blob | null>(null),
    [audioSeconds, setAudioSeconds] = useState(0),
    [audioError, setAudioError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null),
    timerRef = useRef<ReturnType<typeof setInterval> | null>(null),
    savePromiseRef = useRef<Promise<string | null> | null>(null);
  const [homeSession, setHomeSession] = useState<SessionInfo | null>(null),
    [authLoading, setAuthLoading] = useState(true),
    [authError, setAuthError] = useState('');
  const [googleClientId, setGoogleClientId] = useState(''),
    [googleReady, setGoogleReady] = useState(false),
    [wrongGoogleAccount, setWrongGoogleAccount] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null),
    [dailyCreator, setDailyCreator] = useState('');
  const update = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    setSaveStatus('');
    setDailyDirty(true);
    setData((o) => ({ ...o, [k]: v }));
  };
  const updateEmployee = (index: number, key: keyof Employee, value: string) =>
    update(
      'employees',
      data.employees.map((employee, i) =>
        i === index ? { ...employee, [key]: value } : employee,
      ),
    );
  const addEmployee = () =>
    update('employees', [...data.employees, { name: '', role: '' }]);
  const removeEmployee = (index: number) =>
    update(
      'employees',
      data.employees.filter((_, i) => i !== index),
    );
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/session', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error('Entre com uma conta Google corporativa autorizada.');
        return response.json() as Promise<SessionInfo>;
      })
      .then((session) => {
        setHomeSession(session);
        setDailyCreator((creator) => creator || session.email);
        setAuthError('');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        setHomeSession(null);
        setAuthError(
          error instanceof Error
            ? error.message
            : 'Acesso restrito às contas SistemasBR.',
        );
      })
      .finally(() => setAuthLoading(false));
    return () => {
      controller.abort();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/config', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ clientId: string }>;
      })
      .then(({ clientId }) => setGoogleClientId(clientId))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        setAuthError('O login Google ainda não está disponível.');
      });
    return () => controller.abort();
  }, []);
  const openAuthPopup = () => {
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      setAuthLoading(true);
      fetch('/api/session', { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) throw new Error();
          return response.json() as Promise<SessionInfo>;
        })
        .then((session) => {
          setHomeSession(session);
          setDailyCreator(session.email);
          setAuthError('');
        })
        .catch(() => setAuthError('Não foi possível iniciar a sessão local.'))
        .finally(() => setAuthLoading(false));
      return;
    }
    const oauth = window.google?.accounts.oauth2;
    if (!oauth || !googleClientId) {
      setAuthError('Aguarde o carregamento do login Google e tente novamente.');
      return;
    }
    setAuthLoading(true);
    setAuthError('Escolha sua conta Google na janela que será aberta.');
    const tokenClient = oauth.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: async (googleResponse) => {
        if (!googleResponse.access_token) {
          setAuthLoading(false);
          setAuthError(
            'A autenticação do Google foi cancelada. Tente novamente.',
          );
          return;
        }
        try {
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ accessToken: googleResponse.access_token }),
          });
          const result = (await response.json()) as {
            code?: string;
            error?: string;
          };
          if (!response.ok) {
            setWrongGoogleAccount(result.code === 'invalid_domain');
            throw new Error(result.error || 'Não foi possível entrar.');
          }
          const sessionResponse = await fetch('/api/session', {
            cache: 'no-store',
          });
          if (!sessionResponse.ok) throw new Error('Sessão não confirmada.');
          const session = (await sessionResponse.json()) as SessionInfo;
          setHomeSession(session);
          setDailyCreator(session.email);
          setWrongGoogleAccount(false);
          setAuthError('');
        } catch (error) {
          setAuthError(
            error instanceof Error
              ? error.message
              : 'Não foi possível concluir o login Google.',
          );
        } finally {
          setAuthLoading(false);
        }
      },
      error_callback: () => {
        setAuthLoading(false);
        setAuthError('Não foi possível abrir o seletor de contas Google.');
      },
    });
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  };
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (
            tool: object,
            options: { signal: AbortSignal },
          ) => void;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    context.registerTool(
      {
        name: 'prepare_daily_summary',
        title: 'Preparar resumo no SigeDaily',
        description:
          'Preenche os dados da daily na interface e abre a etapa de revisão.',
        inputSchema: {
          type: 'object',
          properties: {
            client: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            plan: {
              type: 'string',
              enum: ['PDV', 'Básico', 'Controle', 'Avançado', 'Outro'],
            },
            customPlan: { type: 'string' },
            endDate: { type: 'string' },
            endDateText: { type: 'string' },
            employee: { type: 'string' },
            role: { type: 'string' },
            softwareMode: {
              type: 'string',
              enum: ['none', 'migration', 'custom'],
            },
            softwareName: { type: 'string' },
            customSoftware: { type: 'string' },
            includeAudio: { type: 'boolean' },
            flowText: { type: 'string' },
          },
          required: ['client', 'plan'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: unknown) => {
          if (!input || typeof input !== 'object')
            throw new Error('Dados inválidos');
          setDailyDirty(true);
          setData((old) => ({ ...old, ...(input as Partial<FormData>) }));
          setStarted(true);
          setStep(4);
          return { status: 'ready_for_review' };
        },
      },
      { signal: lifecycle.signal },
    );
    return () => lifecycle.abort();
  }, []);
  useEffect(() => {
    const uf = data.state.trim().toUpperCase();
    if (!states.some(([code]) => code === uf)) {
      setCities([]);
      return;
    }
    const controller = new AbortController();
    setCitiesLoading(true);
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ nome: string }[]>;
      })
      .then((items) => setCities(items.map((item) => item.nome)))
      .catch(() => {
        if (!controller.signal.aborted) setCities([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCitiesLoading(false);
      });
    return () => controller.abort();
  }, [data.state]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search),
      legacyReport = params.get('daily'),
      reportId = params.get('r');
    if (legacyReport) {
      try {
        setReportData(JSON.parse(legacyReport) as ReportPayload);
      } catch {
        setReportState('error');
      }
      return;
    }
    if (!reportId) return;
    const controller = new AbortController();
    setReportState('loading');
    fetch(`/api/reports/${encodeURIComponent(reportId)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Relatório não encontrado.');
        return response.json() as Promise<ReportPayload>;
      })
      .then((report) => {
        setReportData(report);
        setReportState('none');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        setReportState('error');
      });
    return () => controller.abort();
  }, []);
  const plan = data.plan === 'Outro' ? data.customPlan : data.plan;
  const software =
    data.softwareMode === 'none'
      ? 'Não utilizava nenhum software'
      : data.softwareMode === 'migration'
        ? `Migração completa de dados${data.softwareName ? ` — ${data.softwareName}` : ''}`
        : data.customSoftware;
  const flow = [data.includeAudio ? 'Ouça o áudio a seguir' : '', data.flowText]
    .filter(Boolean)
    .join(' — ');
  const employeesLine = data.employees
    .filter((employee) => employee.name || employee.role)
    .map(
      (employee) =>
        `${employee.name || 'Sem nome'}${employee.role ? ` (${employee.role})` : ''}`,
    )
    .join(', ');
  const clientLocation = [data.city, data.state].filter(Boolean).join('/'),
    reportLocation = [data.city, data.state].filter(Boolean).join(' - '),
    clientLine = [data.client, clientLocation && `(${clientLocation})`]
      .filter(Boolean)
      .join(' '),
    dateLine = data.endDateText || fmt(data.endDate);
  const message = useMemo(
    () =>
      [
        `*Cliente:* ${clientLine || '—'}`,
        `*Criado por:* ${dailyCreator || homeSession?.email || '—'}`,
        `*Plano:* ${plan || '—'}`,
        `*Término do treinamento:* ${dateLine}`,
        `*Explicação sobre o fluxo de trabalho junto ao SIGECOM:* ${flow || '—'}`,
        `*Nivelamento dos funcionários:* ${employeesLine || '—'}`,
        `*Adequação no software:* ${software || '—'}`,
      ].join('\n'),
    [
      data,
      plan,
      flow,
      software,
      clientLine,
      dateLine,
      employeesLine,
      dailyCreator,
      homeSession?.email,
    ],
  );
  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Resumo do SigeDaily', text: message });
        return;
      } catch {}
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };
  const startRecording = async () => {
    try {
      setAudioError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream),
        chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: recorder.mimeType || 'audio/webm',
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setSaveStatus('');
        setDailyDirty(true);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setAudioSeconds(0);
      timerRef.current = setInterval(() => setAudioSeconds((s) => s + 1), 1000);
    } catch {
      setAudioError(
        'Não foi possível acessar o microfone. Verifique a permissão do navegador.',
      );
    }
  };
  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const shareAudio = async () => {
    if (!audioBlob) return;
    const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm',
      file = new File(
        [audioBlob],
        `sigedaily-${data.client || 'cliente'}.${ext}`,
        {
          type: audioBlob.type,
        },
      );
    if (
      navigator.share &&
      (!navigator.canShare || navigator.canShare({ files: [file] }))
    ) {
      try {
        await navigator.share({ text: message, files: [file] });
        return;
      } catch {}
    }
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = file.name;
    a.click();
    setAudioError(
      'Áudio baixado. Agora anexe o arquivo na conversa do WhatsApp.',
    );
  };
  const getReportLink = (reportId: string) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('r', reportId);
    return url.toString();
  };
  const saveDaily = () => {
    if (savePromiseRef.current) return savePromiseRef.current;
    setSaving(true);
    const operation = (async () => {
      try {
        if (!data.client.trim() || !plan.trim())
          throw new Error('Preencha o cliente e o plano antes de salvar.');
        setSaveStatus('Salvando e confirmando...');
        const form = new FormData();
        form.append(
          'payload',
          JSON.stringify({
            ...data,
            createdBy: dailyCreator || homeSession?.email,
          }),
        );
        if (audioBlob)
          form.append(
            'audio',
            audioBlob,
            `audio.${audioBlob.type.includes('mp4') ? 'm4a' : 'webm'}`,
          );
        const response = await fetch(
          editingId ? `/api/dailys/${editingId}` : '/api/dailys',
          {
            method: editingId ? 'PUT' : 'POST',
            body: form,
          },
        );
        const result = (await response.json()) as {
          id?: string;
          audioKey?: string | null;
          saved?: boolean;
          error?: string;
        };
        if (!response.ok) throw new Error(result.error || 'Erro ao salvar');
        if (!result.saved || !result.id)
          throw new Error('O servidor não confirmou a daily na lista.');
        setEditingId(result.id);
        const persistedAudioUrl = result.audioKey
          ? audioUrlForKey(result.audioKey)
          : audioUrl.startsWith('blob:')
            ? ''
            : audioUrl;
        setAudioUrl(persistedAudioUrl);
        setDailyDirty(false);
        setSaveStatus(
          editingId ? 'Daily atualizada na lista' : 'Daily salva na lista',
        );
        return result.id;
      } catch (error) {
        setSaveStatus(
          error instanceof Error ? error.message : 'Erro ao salvar',
        );
        return null;
      }
    })();
    savePromiseRef.current = operation;
    void operation.finally(() => {
      savePromiseRef.current = null;
      setSaving(false);
    });
    return operation;
  };
  const ensureSavedReport = async () => {
    if (editingId && !dailyDirty) return editingId;
    return saveDaily();
  };
  const shareReport = async () => {
    const reportId = await ensureSavedReport();
    if (!reportId) return;
    const reportTitle = `Resumo / SigeDaily — ${data.client || 'Cliente'}${reportLocation ? ` (${reportLocation})` : ''}`,
      text = `*${reportTitle}*\n${getReportLink(reportId)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: reportTitle, text });
        return;
      } catch {}
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };
  const copyReportLink = async () => {
    const reportId = await ensureSavedReport();
    if (!reportId) return;
    await navigator.clipboard.writeText(getReportLink(reportId));
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1800);
  };
  const openReport = async () => {
    const reportWindow = window.open('', '_blank');
    const reportId = await ensureSavedReport();
    if (!reportId) {
      reportWindow?.close();
      return;
    }
    if (reportWindow) reportWindow.location.href = getReportLink(reportId);
    else window.location.href = getReportLink(reportId);
  };
  const returnToHome = () => {
    setStarted(false);
    setConsulting(false);
    setStep(1);
    setData(initial);
    setEditingId(null);
    setDailyCreator(homeSession?.email || '');
    setAudioUrl('');
    setAudioBlob(null);
    setAudioSeconds(0);
    setAudioError('');
    setSaveStatus('');
    setDailyDirty(true);
    setCopied(false);
    setLinkCopied(false);
    window.scrollTo({ top: 0 });
  };
  const signOut = async () => {
    if (!['localhost', '127.0.0.1'].includes(window.location.hostname))
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    returnToHome();
    setHomeSession(null);
    setDailyCreator('');
    setWrongGoogleAccount(false);
    setAuthLoading(false);
    setAuthError('Sessão encerrada. Escolha uma conta Google para continuar.');
  };
  if (reportState === 'loading')
    return (
      <main className="public-report report-state">
        <span className="auth-spinner" />
        <b>Carregando relatório...</b>
      </main>
    );
  if (reportState === 'error')
    return (
      <main className="public-report report-state">
        <AlertTriangle />
        <b>Não foi possível abrir este relatório.</b>
        <a href={window.location.pathname}>Voltar ao SigeDaily</a>
      </main>
    );
  if (reportData) return <ReportView data={reportData} />;
  if ((!started && !consulting) || !homeSession)
    return (
      <>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onReady={() => setGoogleReady(true)}
          onError={() => {
            setGoogleReady(false);
            setAuthError('Não foi possível carregar o login Google.');
          }}
        />
        <main className="welcome brand-home">
          <div className="brand-orbs" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="home-context">
            <span>Implantações</span>
            <b>Acompanhamento diário</b>
          </div>
          <div className="home-title" aria-hidden="true">
            SigeDaily
          </div>
          {homeSession && (
            <div className="home-account">
              <ShieldCheck />
              <span>
                <small>Conta autenticada</small>
                <b>{homeSession.email}</b>
              </span>
              <button
                type="button"
                className="account-logout"
                onClick={signOut}
                aria-label="Sair da conta Google"
                title="Sair da conta Google"
              >
                <LogOut />
              </button>
            </div>
          )}
          {authLoading ? (
            <div className="auth-card auth-loading">
              <span className="auth-spinner" />
              <b>Validando acesso seguro</b>
              <small>Verificando sua conta SistemasBR…</small>
            </div>
          ) : homeSession ? (
            <div className="home-actions">
              <button
                className="start home-start"
                onClick={() => setStarted(true)}
              >
                Iniciar daily{' '}
                <span>
                  <ArrowRight />
                </span>
              </button>
              <button
                className="consult-home"
                onClick={() => setConsulting(true)}
              >
                <Search /> Consultar dailys
              </button>
            </div>
          ) : (
            <div className="auth-card">
              <span className="auth-icon">
                <ShieldCheck />
              </span>
              <small>Acesso interno</small>
              <b>Entre para acessar o SigeDaily</b>
              <p>{authError}</p>
              <button
                type="button"
                onClick={openAuthPopup}
                disabled={!googleReady || !googleClientId}
              >
                <UserRound />{' '}
                {wrongGoogleAccount
                  ? 'Escolher outra conta Google'
                  : 'Entrar com Google corporativo'}
              </button>
              <em>@sistemasbr.net ou @sistemasbr.com.br</em>
            </div>
          )}
        </main>
      </>
    );
  if (consulting)
    return (
      <DailyConsultation
        onBack={() => setConsulting(false)}
        onSignOut={signOut}
        onEdit={(row, current) => {
          setData({
            client: current.client || '',
            city: current.city || '',
            state: current.state || '',
            plan: current.plan || '',
            customPlan: current.customPlan || '',
            endDate: current.endDate || '',
            endDateText: current.endDateText || '',
            employees:
              current.employees?.length > 0
                ? current.employees
                : [{ name: '', role: '' }],
            softwareMode: current.softwareMode || '',
            softwareName: current.softwareName || '',
            customSoftware: current.customSoftware || '',
            includeAudio: Boolean(current.includeAudio),
            flowText: current.flowText || '',
          });
          setEditingId(row.id);
          setDailyCreator(row.created_by);
          setAudioUrl(current.audioUrl || '');
          setAudioBlob(null);
          setSaveStatus('');
          setDailyDirty(false);
          setConsulting(false);
          setStarted(true);
          setStep(1);
          window.setTimeout(() => window.scrollTo({ top: 0 }), 0);
        }}
      />
    );
  const can =
    step !== 1 ||
    Boolean(
      data.client && data.plan && (data.plan !== 'Outro' || data.customPlan),
    );
  const stepLabels = [
    'Cliente e plano',
    'Dados do treinamento',
    'Fluxo e software',
    'Revisão e envio',
  ];
  return (
    <main className="app">
      <aside>
        <Brand />
        <nav>
          {[
            ['01', 'Cliente & plano'],
            ['02', 'Treinamento'],
            ['03', 'Fluxo & software'],
            ['04', 'Revisar & enviar'],
          ].map(([n, l], i) => (
            <button
              key={n}
              className={`navstep ${step === i + 1 ? 'current' : ''} ${step > i + 1 ? 'done' : ''}`}
              onClick={() => setStep(i + 1)}
            >
              <span>{step > i + 1 ? <Check size={14} /> : n}</span>
              <b>{l}</b>
            </button>
          ))}
        </nav>
        <div className="status">
          <i /> {homeSession.email}
        </div>
      </aside>
      <section className="work">
        <header className="form-topbar">
          <Brand />
          <div className="topbar-title">
            <small>
              {editingId ? 'Alterando implantação' : 'Cadastro de implantação'}
            </small>
            <strong>{stepLabels[step - 1]}</strong>
          </div>
          <div className="form-user" title={homeSession.email}>
            <ShieldCheck />
            <span>
              <small>Criado por</small>
              <b>{dailyCreator || homeSession.email}</b>
            </span>
          </div>
          <button
            type="button"
            className="form-logout"
            onClick={signOut}
            title="Sair da conta Google"
          >
            <LogOut /> <span>Sair</span>
          </button>
          <div className="topbar-step">
            <span>Etapa {step} de 4</span>
            <div>
              <i style={{ width: `${step * 25}%` }} />
            </div>
          </div>
        </header>
        <div className="progress">
          <i style={{ width: `${step * 25}%` }} />
        </div>
        <div className="form">
          <div className="kicker">
            Etapa 0{step} <span>/ 04</span>
          </div>
          <div className="creator-strip">
            <UserRound />
            <span>
              Daily criada por <b>{dailyCreator || homeSession.email}</b>
            </span>
            {editingId && <em>Modo de edição</em>}
          </div>
          {step === 1 && (
            <section className="panel">
              <h2>Cliente e plano</h2>
              <p className="lead">
                Identifique o cliente e pesquise sua localização no Brasil.
              </p>
              <Label text="Nome do cliente" />
              <VoiceField
                label="nome do cliente"
                onTranscript={(text) =>
                  update('client', mergeVoiceText(data.client, text))
                }
              >
                <input
                  className="input big"
                  placeholder="Ex: Ponto Verde"
                  value={data.client}
                  onChange={(e) => update('client', e.target.value)}
                  autoFocus
                />
              </VoiceField>
              <div className="cols clientcols">
                <div>
                  <Label text="Estado — selecione ou digite" />
                  <VoiceField
                    label="estado"
                    onTranscript={(text) => {
                      update('state', text.toUpperCase());
                      update('city', '');
                    }}
                  >
                    <input
                      className="input"
                      list="brazil-states"
                      placeholder="Busque por UF: MG"
                      maxLength={30}
                      value={data.state}
                      onChange={(e) => {
                        update('state', e.target.value.toUpperCase());
                        update('city', '');
                      }}
                    />
                  </VoiceField>
                  <datalist id="brazil-states">
                    {states.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label
                    text={`Cidade — ${citiesLoading ? 'carregando lista...' : 'selecione ou digite'}`}
                  />
                  <VoiceField
                    label="cidade"
                    onTranscript={(text) => update('city', text)}
                  >
                    <input
                      className="input"
                      list="brazil-cities"
                      placeholder={
                        data.state
                          ? 'Comece a digitar a cidade'
                          : 'Escolha primeiro o estado'
                      }
                      value={data.city}
                      onChange={(e) => update('city', e.target.value)}
                    />
                  </VoiceField>
                  <datalist id="brazil-cities">
                    {cities.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>
              <p className="location-help">
                Digite para pesquisar. Você também pode escrever um valor que
                não esteja na lista.
              </p>
              <fieldset>
                <legend>Plano contratado</legend>
                <div className="choices">
                  {plans.map((p) => (
                    <Choice
                      key={p}
                      active={data.plan === p}
                      onClick={() => update('plan', p)}
                    >
                      {p}
                    </Choice>
                  ))}
                  <Choice
                    active={data.plan === 'Outro'}
                    onClick={() => update('plan', 'Outro')}
                  >
                    Digitar outro
                  </Choice>
                </div>
              </fieldset>
              {data.plan === 'Outro' && (
                <VoiceField
                  label="nome do plano"
                  onTranscript={(text) =>
                    update('customPlan', mergeVoiceText(data.customPlan, text))
                  }
                >
                  <input
                    className="input reveal"
                    placeholder="Digite o nome do plano"
                    value={data.customPlan}
                    onChange={(e) => update('customPlan', e.target.value)}
                  />
                </VoiceField>
              )}
            </section>
          )}
          {step === 2 && (
            <section className="panel">
              <h2>Dados do treinamento</h2>
              <p className="lead">
                Registre a data de término e todos que participaram.
              </p>
              <Label text="Término do treinamento — calendário ou texto" />
              <div className="cols datecols">
                <div className="iconinput">
                  <CalendarDays />
                  <input
                    type="date"
                    value={data.endDate}
                    onChange={(e) => {
                      update('endDate', e.target.value);
                      if (e.target.value) update('endDateText', '');
                    }}
                  />
                </div>
                <VoiceField
                  label="data de término por texto"
                  onTranscript={(text) => {
                    update('endDateText', text);
                    update('endDate', '');
                  }}
                >
                  <input
                    className="input"
                    placeholder="Ou digite: próxima sexta"
                    value={data.endDateText}
                    onChange={(e) => {
                      update('endDateText', e.target.value);
                      if (e.target.value) update('endDate', '');
                    }}
                  />
                </VoiceField>
              </div>
              <div className="team-header">
                <Label text="Funcionários e cargos" />
                <span>
                  {data.employees.length}{' '}
                  {data.employees.length === 1 ? 'pessoa' : 'pessoas'}
                </span>
              </div>
              <div className="employee-list">
                {data.employees.map((employee, index) => (
                  <div className="employee-row" key={index}>
                    <span className="employee-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <VoiceField
                      label={`nome do funcionário ${index + 1}`}
                      onTranscript={(text) =>
                        updateEmployee(
                          index,
                          'name',
                          mergeVoiceText(employee.name, text),
                        )
                      }
                    >
                      <div className="iconinput">
                        <UserRound />
                        <input
                          aria-label={`Nome do funcionário ${index + 1}`}
                          placeholder="Nome completo"
                          value={employee.name}
                          onChange={(e) =>
                            updateEmployee(index, 'name', e.target.value)
                          }
                        />
                      </div>
                    </VoiceField>
                    <VoiceField
                      label={`cargo do funcionário ${index + 1}`}
                      onTranscript={(text) =>
                        updateEmployee(
                          index,
                          'role',
                          mergeVoiceText(employee.role, text),
                        )
                      }
                    >
                      <input
                        className="input"
                        aria-label={`Cargo do funcionário ${index + 1}`}
                        placeholder="Cargo"
                        value={employee.role}
                        onChange={(e) =>
                          updateEmployee(index, 'role', e.target.value)
                        }
                      />
                    </VoiceField>
                    <button
                      className="remove-employee"
                      aria-label={`Remover funcionário ${index + 1}`}
                      disabled={data.employees.length === 1}
                      onClick={() => removeEmployee(index)}
                    >
                      <Trash2 />
                    </button>
                  </div>
                ))}
              </div>
              <button className="add-employee" onClick={addEmployee}>
                <Plus /> Adicionar funcionário
              </button>
            </section>
          )}
          {step === 3 && (
            <section className="panel">
              <h2>Fluxo de trabalho e software</h2>
              <p className="lead">
                Explique o fluxo e informe a adequação do software.
              </p>
              <fieldset>
                <legend>Explicação sobre o fluxo de trabalho</legend>
                <button
                  type="button"
                  className={`audio ${data.includeAudio ? 'selected' : ''}`}
                  onClick={() => update('includeAudio', !data.includeAudio)}
                >
                  <span>
                    <Mic2 />
                  </span>
                  <b>
                    Ouça o áudio a seguir
                    <small>Inclui a orientação antes do seu texto</small>
                  </b>
                  <i>{data.includeAudio && <Check />}</i>
                </button>
                <VoiceField
                  label="explicação do fluxo de trabalho"
                  multiline
                  onTranscript={(text) =>
                    update('flowText', mergeVoiceText(data.flowText, text))
                  }
                >
                  <textarea
                    placeholder="Adicione uma explicação complementar (opcional)"
                    value={data.flowText}
                    onChange={(e) => update('flowText', e.target.value)}
                  />
                </VoiceField>
              </fieldset>
              <fieldset>
                <legend>Adequação no software</legend>
                <div className="software">
                  {' '}
                  <Choice
                    active={data.softwareMode === 'none'}
                    onClick={() => update('softwareMode', 'none')}
                  >
                    Não utilizava nenhum software
                  </Choice>
                  <Choice
                    active={data.softwareMode === 'migration'}
                    onClick={() => update('softwareMode', 'migration')}
                  >
                    Migração completa de dados
                  </Choice>
                  <Choice
                    active={data.softwareMode === 'custom'}
                    onClick={() => update('softwareMode', 'custom')}
                  >
                    Descrição livre
                  </Choice>
                </div>
              </fieldset>
              {data.softwareMode === 'migration' && (
                <VoiceField
                  label="nome do software anterior"
                  onTranscript={(text) =>
                    update(
                      'softwareName',
                      mergeVoiceText(data.softwareName, text),
                    )
                  }
                >
                  <input
                    className="input reveal"
                    placeholder="Nome do software anterior"
                    value={data.softwareName}
                    onChange={(e) => update('softwareName', e.target.value)}
                  />
                </VoiceField>
              )}{' '}
              {data.softwareMode === 'custom' && (
                <VoiceField
                  label="descrição da adequação do software"
                  multiline
                  onTranscript={(text) =>
                    update(
                      'customSoftware',
                      mergeVoiceText(data.customSoftware, text),
                    )
                  }
                >
                  <textarea
                    className="reveal"
                    placeholder="Descreva a adequação necessária"
                    value={data.customSoftware}
                    onChange={(e) => update('customSoftware', e.target.value)}
                  />
                </VoiceField>
              )}
            </section>
          )}
          {step === 4 && (
            <section className="panel review">
              <div className="reviewhead">
                <div>
                  <div className="eyebrow">
                    <Sparkles /> Conferência final
                  </div>
                  <h2>Revisão e envio</h2>
                  <p className="lead">
                    Sua mensagem já está formatada para o WhatsApp.
                  </p>
                </div>
                <CheckCircle2 className="success" />
              </div>
              <div className="preview">
                <div className="previewtop">
                  PRÉVIA DA MENSAGEM <MessageCircle />
                </div>
                <div className="bubble">
                  <p>
                    <b>Cliente:</b> {clientLine || '—'}
                  </p>
                  <p>
                    <b>Criado por:</b>{' '}
                    {dailyCreator || homeSession.email || '—'}
                  </p>
                  <p>
                    <b>Plano:</b> {plan || '—'}
                  </p>
                  <p>
                    <b>Término do treinamento:</b> {dateLine}
                  </p>
                  <p>
                    <b>
                      Explicação sobre o fluxo de trabalho junto ao SIGECOM:
                    </b>{' '}
                    {flow || '—'}
                  </p>
                  <p>
                    <b>Nivelamento dos funcionários:</b> {employeesLine || '—'}
                  </p>
                  <p>
                    <b>Adequação no software:</b> {software || '—'}
                  </p>
                  <small>agora ✓✓</small>
                </div>
              </div>
              <section className="recorder">
                <div className="recorderhead">
                  <span>
                    <Mic2 /> Áudio da daily
                  </span>
                  <small>
                    {recording
                      ? `Gravando • ${String(Math.floor(audioSeconds / 60)).padStart(2, '0')}:${String(audioSeconds % 60).padStart(2, '0')}`
                      : 'Opcional'}
                  </small>
                </div>
                {!recording && !audioUrl && (
                  <button className="record" onClick={startRecording}>
                    <span />
                    <b>Gravar áudio</b>
                  </button>
                )}
                {recording && (
                  <button className="record stopping" onClick={stopRecording}>
                    <Square />
                    <b>Parar gravação</b>
                  </button>
                )}
                {audioUrl && (
                  <div className="audioresult">
                    <audio controls src={audioUrl} />
                    <button onClick={shareAudio}>
                      <Send /> Enviar áudio
                    </button>
                    <a
                      href={audioUrl}
                      download={`sigedaily-${data.client || 'cliente'}.webm`}
                    >
                      <Download /> Baixar
                    </a>
                    <button
                      className="redo"
                      onClick={() => {
                        setAudioUrl('');
                        setAudioBlob(null);
                        setAudioSeconds(0);
                      }}
                    >
                      <RotateCcw /> Refazer
                    </button>
                  </div>
                )}
                {audioError && <p className="audioerror">{audioError}</p>}
              </section>
              <div className="actions">
                <button className="send" onClick={share}>
                  <Send /> Compartilhar texto no WhatsApp
                </button>
                <button className="copy" onClick={copy}>
                  {copied ? <Check /> : <Clipboard />}
                  {copied ? 'Copiado' : 'Copiar mensagem'}
                </button>
              </div>
              <button
                className="reset"
                onClick={() => {
                  setData(initial);
                  setStep(1);
                  setEditingId(null);
                  setDailyCreator(homeSession.email);
                  setAudioUrl('');
                  setAudioBlob(null);
                  setDailyDirty(true);
                }}
              >
                <RotateCcw /> Limpar e criar outra
              </button>
            </section>
          )}
          {step === 4 && (
            <section className="report-link-card">
              <div className="report-link-icon">
                <Link2 />
              </div>
              <div>
                <b>Salvar e compartilhar</b>
                <p>Armazene a daily antes de enviar ao suporte.</p>
              </div>
              <div className="report-link-actions">
                <button
                  className="save-daily"
                  onClick={saveDaily}
                  disabled={saving}
                  aria-busy={saving}
                >
                  <CheckCircle2 />{' '}
                  {saving
                    ? 'Salvando e confirmando...'
                    : saveStatus ||
                      (editingId ? 'Atualizar daily' : 'Salvar daily')}
                </button>
                <button className="send" onClick={shareReport}>
                  <Send /> Enviar resumo com link
                </button>
                <button className="copy" onClick={copyReportLink}>
                  {linkCopied ? <Check /> : <Clipboard />}
                  {linkCopied ? 'Link copiado' : 'Copiar link'}
                </button>
                <button
                  type="button"
                  className="report-open"
                  onClick={openReport}
                >
                  <ExternalLink /> Visualizar
                </button>
              </div>
              <button className="home-return" onClick={returnToHome}>
                <House /> Voltar para a página inicial
              </button>
            </section>
          )}
          <footer>
            <button
              className="back"
              onClick={() =>
                step === 1 ? setStarted(false) : setStep(step - 1)
              }
            >
              <ArrowLeft /> Voltar
            </button>
            {step < 4 && (
              <button
                className="next"
                disabled={!can}
                onClick={() => setStep(step + 1)}
              >
                Continuar <ArrowRight />
              </button>
            )}
          </footer>
        </div>
      </section>
    </main>
  );
}
function Brand({ welcome = false }: { welcome?: boolean }) {
  return (
    <div className={welcome ? 'welcomebrand' : 'brand'}>
      <span>
        <Radio />
      </span>{' '}
      <b>
        SigeDaily<small>Implantações SIGECOM</small>
      </b>
    </div>
  );
}
function Label({ text }: { text: string }) {
  return <label className="label">{text}</label>;
}
function ReportView({ data }: { data: ReportPayload }) {
  const plan = data.plan === 'Outro' ? data.customPlan : data.plan,
    locationText = [data.city, data.state].filter(Boolean).join('/'),
    software =
      data.softwareMode === 'none'
        ? 'Não utilizava nenhum software'
        : data.softwareMode === 'migration'
          ? `Migração completa de dados${data.softwareName ? ` — ${data.softwareName}` : ''}`
          : data.customSoftware,
    flow = [data.includeAudio ? 'Ouça o áudio a seguir' : '', data.flowText]
      .filter(Boolean)
      .join(' — '),
    employees = (data.employees || [])
      .filter((e) => e.name || e.role)
      .map((e) => `${e.name || 'Sem nome'}${e.role ? ` — ${e.role}` : ''}`);
  return (
    <main className="public-report">
      <header>
        <Brand />
        <span>RELATÓRIO DE IMPLANTAÇÃO</span>
      </header>
      <article>
        <div className="report-meta">
          <span>
            DAILY / RESUMO
            {data.createdBy ? ` • CRIADO POR ${data.createdBy}` : ''}
          </span>
          <time>{data.endDateText || fmt(data.endDate)}</time>
        </div>
        <h1>{data.client || 'Cliente'}</h1>
        {locationText && <p className="report-location">{locationText}</p>}
        <div className="report-grid">
          <section>
            <small>Plano contratado</small>
            <strong>{plan || 'Não informado'}</strong>
          </section>
          <section>
            <small>Término do treinamento</small>
            <strong>{data.endDateText || fmt(data.endDate)}</strong>
          </section>
          <section className="wide">
            <small>Explicação sobre o fluxo de trabalho junto ao SIGECOM</small>
            <p>{flow || 'Não informado'}</p>
          </section>
          {data.audioUrl && (
            <section className="wide report-audio">
              <small>Áudio da daily</small>
              <audio controls preload="metadata" src={data.audioUrl} />
              <a
                className="report-audio-open"
                href={data.audioUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink /> Abrir ou baixar o áudio
              </a>
              <p>Gravação anexada a este relatório.</p>
            </section>
          )}
          <section className="wide">
            <small>Nivelamento dos funcionários</small>
            {employees.length ? (
              <ul>
                {employees.map((employee, index) => (
                  <li key={index}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {employee}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Não informado</p>
            )}
          </section>
          <section className="wide">
            <small>Adequação no software</small>
            <p>{software || 'Não informado'}</p>
          </section>
        </div>
        <footer>
          <span>SigeDaily</span>
          <small>Resumo gerado para acompanhamento do suporte</small>
        </footer>
      </article>
    </main>
  );
}
type DailyRow = {
  id: string;
  client: string;
  city: string;
  state: string;
  plan: string;
  end_date: string;
  payload: string;
  audio_key?: string;
  created_by: string;
  created_at: number;
};
type StorageInfo = {
  dailyCount: number;
  estimatedDataBytes: number;
  audioCount: number;
  audioBytes: number;
  audioLimitBytes: number;
  audioPercent: number;
  remainingAudioBytes: number;
  warning: 'ok' | 'warning' | 'critical';
  selection: null | {
    from: string;
    to: string;
    dailyCount: number;
    audioCount: number;
    audioBytes: number;
  };
};
function DailyConsultation({
  onBack,
  onEdit,
  onSignOut,
}: {
  onBack: () => void;
  onEdit: (row: DailyRow, data: ReportPayload) => void;
  onSignOut: () => void;
}) {
  const [rows, setRows] = useState<DailyRow[]>([]),
    [session, setSession] = useState<SessionInfo | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [query, setQuery] = useState(''),
    [uf, setUf] = useState(''),
    [planFilter, setPlanFilter] = useState(''),
    [date, setDate] = useState(''),
    [showPermissions, setShowPermissions] = useState(false);
  const [permEmail, setPermEmail] = useState(''),
    [canEdit, setCanEdit] = useState(false),
    [canDelete, setCanDelete] = useState(false),
    [enabled, setEnabled] = useState(true),
    [notice, setNotice] = useState('');
  const [storage, setStorage] = useState<StorageInfo | null>(null),
    [cleanupFrom, setCleanupFrom] = useState(''),
    [cleanupTo, setCleanupTo] = useState(''),
    [cleaning, setCleaning] = useState(false);
  const load = async () => {
    try {
      setLoading(true);
      const s = await fetch('/api/session');
      if (!s.ok) throw new Error('Acesso restrito às contas SistemasBR.');
      const info = (await s.json()) as SessionInfo;
      setSession(info);
      const response = await fetch('/api/dailys', { cache: 'no-store' });
      if (!response.ok) throw new Error('Não foi possível carregar as dailys.');
      setRows((await response.json()) as DailyRow[]);
      if (info.isAdmin) {
        const storageResponse = await fetch('/api/admin/storage', {
          cache: 'no-store',
        });
        if (storageResponse.ok)
          setStorage((await storageResponse.json()) as StorageInfo);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const filtered = rows.filter((r) => {
    const hay =
      `${r.client} ${r.city} ${r.state} ${r.plan} ${r.created_by}`.toLowerCase();
    return (
      (!query || hay.includes(query.toLowerCase())) &&
      (!uf || r.state === uf) &&
      (!planFilter || r.plan === planFilter) &&
      (!date || r.end_date === date)
    );
  });
  const payload = (row: DailyRow) => {
    const value = JSON.parse(row.payload) as ReportPayload;
    value.createdBy = row.created_by;
    if (row.audio_key) value.audioUrl = audioUrlForKey(row.audio_key);
    return value;
  };
  const link = (row: DailyRow) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('r', row.id);
    return url.toString();
  };
  const remove = async (row: DailyRow) => {
    if (!confirm(`Excluir a daily de ${row.client}?`)) return;
    const response = await fetch(`/api/dailys/${row.id}`, { method: 'DELETE' });
    if (response.ok) setRows((old) => old.filter((r) => r.id !== row.id));
    else setNotice('Você não possui permissão para excluir.');
  };
  const share = async (row: DailyRow) => {
    const text = `*Resumo / SigeDaily — ${row.client}${row.city || row.state ? ` (${[row.city, row.state].filter(Boolean).join(' - ')})` : ''}*\n${link(row)}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
  const pdf = async (row: DailyRow) => {
    const { jsPDF } = await import('jspdf');
    const d = payload(row),
      doc = new jsPDF();
    doc.setTextColor(0, 73, 119);
    doc.setFontSize(22);
    doc.text('SigeDaily', 18, 22);
    doc.setTextColor(35, 55, 65);
    doc.setFontSize(16);
    doc.text(d.client || 'Cliente', 18, 38);
    doc.setFontSize(11);
    const lines = [
      `Local: ${[d.city, d.state].filter(Boolean).join(' - ') || 'Não informado'}`,
      `Plano: ${d.plan === 'Outro' ? d.customPlan : d.plan}`,
      `Término: ${d.endDateText || fmt(d.endDate)}`,
      `Funcionários: ${(d.employees || []).map((e) => `${e.name} (${e.role})`).join(', ') || 'Não informado'}`,
      `Fluxo: ${d.flowText || 'Não informado'}`,
      `Software: ${d.softwareMode === 'none' ? 'Não utilizava software' : d.softwareMode === 'migration' ? `Migração - ${d.softwareName}` : d.customSoftware}`,
    ];
    let y = 52;
    for (const line of lines) {
      const split = doc.splitTextToSize(line, 174);
      doc.text(split, 18, y);
      y += split.length * 6 + 5;
    }
    doc.save(`sigedaily-${d.client || 'cliente'}.pdf`);
  };
  const savePermission = async () => {
    const response = await fetch('/api/permissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: permEmail, canEdit, canDelete, enabled }),
    });
    setNotice(
      response.ok
        ? 'Permissões atualizadas.'
        : 'Não foi possível atualizar as permissões.',
    );
  };
  const previewCleanup = async () => {
    if (!cleanupFrom || !cleanupTo) {
      setNotice('Informe as datas inicial e final da limpeza.');
      return;
    }
    const params = new URLSearchParams({ from: cleanupFrom, to: cleanupTo }),
      response = await fetch(`/api/admin/storage?${params}`, {
        cache: 'no-store',
      });
    if (!response.ok) {
      setNotice('Não foi possível calcular o período selecionado.');
      return;
    }
    setStorage((await response.json()) as StorageInfo);
    setNotice('Período calculado. Confira antes de excluir.');
  };
  const cleanupPeriod = async () => {
    const selection = storage?.selection;
    if (!selection?.dailyCount) return;
    if (
      !confirm(
        `Excluir definitivamente ${selection.dailyCount} daily(s) e ${selection.audioCount} áudio(s), de ${selection.from} até ${selection.to}?`,
      )
    )
      return;
    setCleaning(true);
    let deleted = 0,
      remaining = selection.dailyCount,
      attempts = 0;
    try {
      while (remaining > 0 && attempts < 100) {
        const response = await fetch('/api/admin/storage', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ from: cleanupFrom, to: cleanupTo }),
        });
        const result = (await response.json()) as {
          deleted?: number;
          remaining?: number;
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error || 'Não foi possível limpar o período.');
        deleted += Number(result.deleted || 0);
        remaining = Number(result.remaining || 0);
        attempts += 1;
        if (!result.deleted && remaining) break;
      }
      setNotice(
        remaining
          ? `${deleted} dailys excluídas; ${remaining} ainda aguardam limpeza.`
          : `${deleted} dailys e seus áudios foram excluídos do período.`,
      );
      setCleanupFrom('');
      setCleanupTo('');
      await load();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Erro ao limpar o período.',
      );
    } finally {
      setCleaning(false);
    }
  };
  return (
    <main className="consult-page">
      <header>
        <button onClick={onBack}>
          <ArrowLeft /> Voltar
        </button>
        <Brand />
        <div className="account">
          <ShieldCheck />
          <span>{session?.email || 'Verificando acesso'}</span>
        </div>
        <button className="consult-logout" onClick={onSignOut}>
          <LogOut /> Sair
        </button>
      </header>
      <section className="consult-shell">
        <div className="consult-title">
          <div>
            <span>Central de relatórios</span>
            <h1>Consultar dailys</h1>
            <p>Pesquise, filtre e compartilhe os registros de implantação.</p>
          </div>
          {session?.isAdmin && (
            <button onClick={() => setShowPermissions(!showPermissions)}>
              <Settings2 /> Administração
            </button>
          )}
        </div>
        {session?.isAdmin && storage?.warning !== 'ok' && (
          <div className={`storage-warning ${storage?.warning || ''}`}>
            <AlertTriangle />
            <span>
              <b>Armazenamento de áudios próximo do limite</b>
              <small>
                Restam aproximadamente{' '}
                {formatBytes(storage?.remainingAudioBytes || 0)}. Abra a
                administração para fazer uma limpeza por período.
              </small>
            </span>
          </div>
        )}
        {showPermissions && (
          <section className="permission-card">
            <div>
              <Users />
              <span>
                <b>Permissões da equipe</b>
                <small>Somente e-mails corporativos SistemasBR</small>
              </span>
            </div>
            <input
              placeholder="usuario@sistemasbr.com.br"
              value={permEmail}
              onChange={(e) => setPermEmail(e.target.value)}
            />
            <label>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />{' '}
              Acesso habilitado
            </label>
            <label>
              <input
                type="checkbox"
                checked={canEdit}
                onChange={(e) => setCanEdit(e.target.checked)}
              />{' '}
              Pode alterar
            </label>
            <label>
              <input
                type="checkbox"
                checked={canDelete}
                onChange={(e) => setCanDelete(e.target.checked)}
              />{' '}
              Pode excluir
            </label>
            <button onClick={savePermission}>Salvar permissões</button>
          </section>
        )}
        {showPermissions && session?.isAdmin && storage && (
          <section className={`storage-card ${storage.warning}`}>
            <div className="storage-head">
              <span>
                <HardDrive />
              </span>
              <div>
                <b>Armazenamento do SigeDaily</b>
                <small>
                  {storage.dailyCount} dailys • {storage.audioCount} áudios
                </small>
              </div>
              <strong>{storage.audioPercent.toFixed(1)}%</strong>
            </div>
            <div className="storage-progress" aria-label="Uso do armazenamento">
              <i style={{ width: `${storage.audioPercent}%` }} />
            </div>
            <div className="storage-summary">
              <div>
                <small>Áudios armazenados</small>
                <strong>{formatBytes(storage.audioBytes)} de 1 GB</strong>
              </div>
              <div>
                <small>Espaço restante</small>
                <strong>{formatBytes(storage.remainingAudioBytes)}</strong>
              </div>
              <div>
                <small>Dados dos relatórios</small>
                <strong>{formatBytes(storage.estimatedDataBytes)}</strong>
              </div>
            </div>
            <div className="storage-cleanup">
              <div>
                <b>Limpar dailys por período</b>
                <small>A prévia mostra exatamente o que será excluído.</small>
              </div>
              <div className="storage-fields">
                <label>
                  De
                  <input
                    type="date"
                    value={cleanupFrom}
                    onChange={(event) => setCleanupFrom(event.target.value)}
                  />
                </label>
                <label>
                  Até
                  <input
                    type="date"
                    value={cleanupTo}
                    onChange={(event) => setCleanupTo(event.target.value)}
                  />
                </label>
                <button
                  className="storage-preview-button"
                  onClick={previewCleanup}
                >
                  Calcular período
                </button>
              </div>
            </div>
            {storage.selection && (
              <div className="storage-selection">
                <span>
                  <b>{storage.selection.dailyCount} dailys</b>
                  <small>
                    {storage.selection.audioCount} áudios •{' '}
                    {formatBytes(storage.selection.audioBytes)}
                  </small>
                </span>
                <button
                  className="storage-delete"
                  onClick={cleanupPeriod}
                  disabled={cleaning || !storage.selection.dailyCount}
                >
                  <Trash2 /> {cleaning ? 'Excluindo...' : 'Excluir período'}
                </button>
              </div>
            )}
          </section>
        )}
        <section className="filters">
          <div>
            <Search />
            <input
              placeholder="Cliente, cidade, responsável..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select value={uf} onChange={(e) => setUf(e.target.value)}>
            <option value="">Todos os estados</option>
            {states.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="">Todos os planos</option>
            {plans.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <span>
            <Filter /> {filtered.length} resultados
          </span>
        </section>
        {notice && <p className="consult-notice">{notice}</p>}
        {loading ? (
          <div className="empty">Carregando dailys...</div>
        ) : error ? (
          <div className="empty error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty">Nenhuma daily encontrada.</div>
        ) : (
          <div className="daily-list">
            {filtered.map((row) => (
              <article key={row.id}>
                <div className="daily-main">
                  <small>
                    {new Date(row.created_at).toLocaleDateString('pt-BR')} •{' '}
                    {row.created_by}
                  </small>
                  <h2>{row.client}</h2>
                  <p>
                    {[row.city, row.state].filter(Boolean).join(' - ') ||
                      'Local não informado'}
                  </p>
                  <span>{row.plan || 'Plano não informado'}</span>
                </div>
                <div className="daily-actions">
                  <a href={link(row)} target="_blank" rel="noreferrer">
                    <ExternalLink /> Abrir
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(link(row))}
                  >
                    <Clipboard /> Link
                  </button>
                  <button onClick={() => share(row)}>
                    <MessageCircle /> WhatsApp
                  </button>
                  <button onClick={() => pdf(row)}>
                    <FileDown /> PDF
                  </button>
                  <button
                    onClick={() => {
                      const w = window.open(link(row), '_blank');
                      w?.addEventListener('load', () => w.print());
                    }}
                  >
                    <Printer /> Imprimir
                  </button>
                  {session?.canEdit && (
                    <button onClick={() => onEdit(row, payload(row))}>
                      <Pencil /> Alterar
                    </button>
                  )}
                  {session?.canDelete && (
                    <button className="danger" onClick={() => remove(row)}>
                      <Trash2 /> Excluir
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
