export const processTypes = [
  { value: 'implementation', label: 'Nova implementação', color: '#0073c9' },
  { value: 'technical-visit', label: 'Visita técnica', color: '#16804a' },
  {
    value: 'implemented-client',
    label: 'Cliente implementado',
    color: '#7950b5',
  },
] as const;
export type ProcessType = (typeof processTypes)[number]['value'];
// Reports created before process types remain new implementations.
export function processInfo(value?: unknown) {
  return (
    processTypes.find((process) => process.value === value) ?? processTypes[0]
  );
}
export const technicalFields = [
  {
    key: 'erpParameters',
    label: 'Parametrizações realizadas',
    placeholder:
      'Ex.: regras fiscais, permissões e configurações ajustadas no ERP.',
  },
  {
    key: 'enabledModules',
    label: 'Módulos habilitados',
    placeholder: 'Quais módulos foram ativados e como serão utilizados?',
  },
  {
    key: 'newTools',
    label: 'Novas ferramentas implementadas',
    placeholder: 'Descreva as ferramentas ou integrações disponibilizadas.',
  },
  {
    key: 'supportNotes',
    label: 'Orientações para o suporte',
    placeholder:
      'O que o suporte precisa saber sobre as mudanças e o acompanhamento?',
  },
] as const;
