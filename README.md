# Atlas — Treino em Pirâmide

Aplicação web responsiva em React + Vite para registrar treinos A/B/C.

## Rodar localmente
1. Instale Node.js (versão LTS).
2. Extraia o projeto e abra a pasta `treino-piramide` no terminal.
3. Execute:
   ```bash
   npm install
   npm run dev
   ```
4. Abra o endereço local informado pelo Vite.

## Recursos
- Agenda com sequência de treinos que só avança quando todos os exercícios do dia são concluídos.
- Exercícios A/B/C atualizados com os vídeos fornecidos.
- Links diretos para assistir à demonstração de cada exercício.
- Cargas sugeridas para pirâmide crescente ou decrescente.
- Marcação de exercícios concluídos e indicador de dia completo no calendário.
- Adição de exercícios, incluindo link opcional de vídeo.
- Histórico de treinos concluídos.
- Persistência no `localStorage` do navegador.

## Cálculo das cargas
Usa como referência 55%, 72,5%, 82,5% e 95% da carga máxima, arredondando para o múltiplo de 2,5 kg mais próximo. São aproximações baseadas nas faixas indicadas; ajuste conforme a carga disponível e sua capacidade real.

## Nota sobre a agenda
A primeira data em que o app é aberto começa no treino A. O treino previsto avança para o próximo da sequência apenas quando todos os exercícios do treino daquele dia estiverem marcados como concluídos. Se o treino não for concluído, a mesma letra permanece no dia seguinte.
