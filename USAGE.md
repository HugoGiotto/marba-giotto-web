# Measurements package

## 1) Executar a migration
Cole o conteúdo de `supabase/migrations/20251001_measurements.sql` no **Supabase > SQL Editor** e execute.

Isso cria a tabela `public.measurements` (1:1 com `pieces`) e habilita RLS com políticas que ligam a posse da peça (`pieces.user_id = auth.uid()`).

## 2) Copiar o helper
Coloque `src/lib/measurements.ts` no seu projeto.

## 3) Usar no código

### Garantir a linha ao criar uma peça
```ts
import { ensureMeasurementRow } from '@/lib/measurements';
// após inserir a peça e obter newId:
await ensureMeasurementRow(newId, 'cm', 'server');
```

### Salvar medidas (no botão “Salvar medidas”)
```ts
import { upsertMeasurement } from '@/lib/measurements';
await upsertMeasurement(pieceId, {
  width, height, diameter, length, unit
}, 'client');
```

### Carregar medidas para vários cards
```ts
import { fetchMeasurementsByPieceIds } from '@/lib/measurements';
const measures = await fetchMeasurementsByPieceIds(pieceIds, 'server');
// => [{ piece_id, width, height, diameter, length, unit }, ...]
```

### Buscar medidas de uma peça
```ts
import { fetchMeasurement } from '@/lib/measurements';
const m = await fetchMeasurement(pieceId, 'server');
```

> Observação: removemos qualquer dependência de um campo `pieces.measures`. Todas as medidas ficam em `public.measurements`.
