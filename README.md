# Eixo Real — Controle de Manutenção

Aplicativo de controle da frota, checklists e pendências de manutenção. O projeto
foi criado no [Lovable](https://lovable.dev) e pode funcionar de duas formas:

- **Supabase:** dados compartilhados e persistentes nas tabelas do projeto.
- **Demonstração:** dados fictícios salvos apenas no `localStorage` do navegador.

O cabeçalho mostra claramente qual modo está ativo.

## Ligar às tabelas do Supabase / Lovable Cloud

1. Crie ou abra o projeto no Supabase (ou ative o Lovable Cloud).
2. Abra o **SQL Editor**, cole todo o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Em **Settings > API**, copie:
   - `Project URL`;
   - a chave pública `Publishable key` (ou a chave legada `anon`).
4. Copie `.env.example` para `.env.local` e preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

5. Reinicie o aplicativo com `npm run dev`.

Quando a ligação estiver correta, a tela de acesso mostrará “Dados conectados ao
Supabase” e o cabeçalho mostrará “Supabase”. O botão desse indicador força uma
nova leitura das tabelas.

### Tabelas utilizadas

- `app_users`: pessoas e perfis exibidos na tela de acesso;
- `vehicles`: cadastro e estado atual dos veículos;
- `checklist_executions`: respostas, decisão e assinatura dos checklists;
- `maintenance_issues`: pendências, diagnóstico, peças e conclusão.

As telas continuam iguais. Cadastrar/editar veículo, executar checklist e tratar
pendência já grava automaticamente no banco. Excluir um veículo também exclui,
por cascata, seus checklists e pendências.

> **Segurança do MVP:** a seleção de usuário ainda é o acesso simulado original,
> sem senha. As políticas do SQL permitem o uso pela chave pública do projeto.
> Antes de disponibilizar o sistema fora da equipe, substitua esse acesso por
> Supabase Auth e políticas RLS baseadas em `auth.uid()`.

## Usar uma tabela já existente

Se a frota já estiver em Excel ou Google Sheets, importe-a no Supabase para a
tabela `vehicles`, usando exatamente as colunas abaixo:

`id`, `placa`, `frota`, `marca`, `modelo`, `ano`, `tipo`, `implemento`,
`hodometro`, `data_entrada`, `status`, `motorista_principal_id`, `observacoes`,
`foto_url`, `ultima_revisao_km`, `proxima_revisao_km`.

Valores de `status` aceitos: `ok`, `atencao` e `nao_conforme`. O `id` deve ser
único (por exemplo, `v-001`) e datas usam o formato `AAAA-MM-DD`.

## Desenvolvimento

É necessário Node.js e npm.

```sh
npm i
npm run dev
```

Validações:

```sh
npx tsc --noEmit
npm run lint
npm run build
```

## Tecnologias

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Zustand
- Supabase
