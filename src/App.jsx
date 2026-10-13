import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, Check, ChevronLeft, ChevronRight, Dumbbell, History, Plus, RotateCcw, Settings2, X } from 'lucide-react';

const STORAGE_KEY = 'atlas-treino-v1';
const initialWorkouts = {
  A: { name: 'Peito, ombros e tríceps', exercises: [
    { id: 'a1', name: 'Crucifixo com halter no banco reto', max: 20, video: 'https://youtu.be/onlhEKDWJX0' },
    { id: 'a2', name: 'Supino reto com barra', max: 60, video: 'https://youtube.com/shorts/VL0-GN0yQ-g' },
    { id: 'a3', name: 'Supino inclinado com halteres com isometria alternada', max: 24, video: 'https://youtu.be/HgNOu-Z7Ho0' },
    { id: 'a4', name: 'Desenvolvimento de ombros no aparelho', max: 30, video: 'https://youtube.com/shorts/ySanBXnVn2s' },
    { id: 'a5', name: 'Elevação lateral e frontal com halteres', max: 12, video: 'https://youtube.com/shorts/iWcTTmmdZ7w' },
    { id: 'a6', name: 'Tríceps com barra na polia', max: 35, video: 'https://youtu.be/oe3i94k5KeQ' },
    { id: 'a7', name: 'Tríceps francês sentado com halter', max: 16, video: 'https://youtu.be/3a2lxkuM2ok' },
    { id: 'a8', name: 'Abdominal remador', max: 0, video: 'https://youtube.com/shorts/h9aWWZAK2iY', bodyweight: true },
  ]},
  B: { name: 'Costas e bíceps', exercises: [
    { id: 'b1', name: 'Pulldown com barra na polia', max: 35, video: 'https://youtu.be/ea0K8dLMwNM' },
    { id: 'b2', name: 'Puxada com triângulo', max: 50, video: 'https://youtu.be/i43IIMgMjZE' },
    { id: 'b3', name: 'Remada serrote unilateral', max: 24, video: 'https://youtu.be/hhRuxJkRDVI' },
    { id: 'b4', name: 'Encolhimento de ombro com barra na polia', max: 35, video: 'https://youtu.be/rOFU9s-0EqM' },
    { id: 'b5', name: 'Rosca com corda na polia', max: 20, video: 'https://youtu.be/BrfYYCrV3YQ' },
    { id: 'b6', name: 'Rosca alternada com halteres', max: 12, video: 'https://youtu.be/BqbMRXlGNXk' },
    { id: 'b7', name: 'Rosca Scott no aparelho', max: 25, video: 'https://youtube.com/shorts/_RgD2goi-rc' },
  ]},
  C: { name: 'Pernas e abdômen', exercises: [
    { id: 'c1', name: 'Cadeira extensora', max: 45, video: 'https://youtube.com/shorts/CnCaRRvqyPc' },
    { id: 'c2', name: 'Agachamento no smith', max: 60, video: 'https://youtu.be/2HYz5AmHypU' },
    { id: 'c3', name: 'Leg press 45', max: 140, video: 'https://youtu.be/Ihvg62fnVmE' },
    { id: 'c4', name: 'Cadeira adutora', max: 40, video: 'https://youtube.com/shorts/rM6XGw-R6aY' },
    { id: 'c5', name: 'Cadeira flexora', max: 40, video: 'https://youtube.com/shorts/_vAS4pZu7Z4' },
    { id: 'c6', name: 'Panturrilha em pé no aparelho', max: 40, video: 'https://youtube.com/shorts/k4NSr14GsiE' },
    { id: 'c7', name: 'Abdominal supra', max: 0, video: 'https://youtu.be/MMcfmt0pNeo', bodyweight: true },
  ]},
};
const pyramid = [
  { label: 'Aquecimento', percent: 0.55, reps: '12–15', detail: '55% da carga máxima' },
  { label: 'Transição', percent: 0.725, reps: '10', detail: '72,5% da carga máxima' },
  { label: 'Trabalho', percent: 0.825, reps: '8', detail: '82,5% da carga máxima' },
  { label: 'Força máxima', percent: 0.95, reps: '4–6', detail: '95% da carga máxima' },
];
const pad = n => String(n).padStart(2, '0');
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseDate = key => { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d,12); };
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate()+n); return d; };
const fmtShort = d => `${pad(d.getDate())} ${['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][d.getMonth()]}`;
const fmtLong = d => d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

const roundWeight = n => Math.max(0, Math.round(n / 2.5) * 2.5);
const isWorkoutComplete = (date, workout, logs) => {
  const exercises = workout?.exercises || [];
  if (!exercises.length) return false;
  const dayLog = logs[date] || {};
  return exercises.every(ex => !!dayLog[ex.id]?.done);
};
// A sessão só avança quando todos os exercícios do dia anterior foram concluídos.
// Se o treino não foi concluído, o mesmo treino permanece previsto no próximo dia.
const workoutForDate = (targetDate, state) => {
  const schedule = (state.schedule || ['A','B','C']).filter(letter => state.workouts[letter]);
  if (!schedule.length) return 'A';
  const anchor = state.anchorDate || dateKey(new Date());
  let currentDate = anchor;
  let index = Math.max(0, schedule.indexOf(state.anchorWorkout || schedule[0]));
  const target = targetDate;
  if (target < anchor) {
    // Para datas anteriores ao início do acompanhamento, exibe a sequência regressiva padrão.
    const diff = Math.round((parseDate(anchor) - parseDate(target)) / 86400000);
    return schedule[((index - diff) % schedule.length + schedule.length) % schedule.length];
  }
  while (currentDate < target) {
    const currentLetter = schedule[index % schedule.length];
    const currentWorkout = state.workouts[currentLetter];
    if (isWorkoutComplete(currentDate, currentWorkout, state.logs)) index = (index + 1) % schedule.length;
    currentDate = dateKey(addDays(parseDate(currentDate), 1));
  }
  return schedule[index % schedule.length];
};

const loadState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return { ...saved, workouts: { ...initialWorkouts, ...(saved.workouts || {}) }, logs: saved.logs || {}, schedule: saved.schedule || ['A','B','C'], anchorDate: saved.anchorDate || dateKey(new Date()), anchorWorkout: saved.anchorWorkout || 'A' };
  } catch {}
  return { workouts: initialWorkouts, logs: {}, schedule: ['A','B','C'], pyramidOrder: 'ascending', anchorDate: dateKey(new Date()), anchorWorkout: 'A' };
};

function App() {
  const [state, setState] = useState(loadState);
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [editing, setEditing] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newExercise, setNewExercise] = useState('');
  const [newMax, setNewMax] = useState('40');
  const [newVideo, setNewVideo] = useState('');
  const [newWorkout, setNewWorkout] = useState('A');
  const [toast, setToast] = useState('');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  const selected = parseDate(selectedDate);
  const todayKey = dateKey(new Date());
  const dayDiff = Math.round((parseDate(selectedDate) - parseDate(todayKey)) / 86400000);
  const workoutLetter = workoutForDate(selectedDate, state);
  const workout = state.workouts[workoutLetter] || state.workouts.A;
  const log = state.logs[selectedDate] || {};
  const completed = workout.exercises.filter(ex => log[ex.id]?.done).length;
  const progress = workout.exercises.length ? completed / workout.exercises.length * 100 : 0;
  const dateStrip = useMemo(() => Array.from({length: 7}, (_, i) => addDays(addDays(selected, -3), i)), [selectedDate]);

  const updateState = updater => setState(prev => updater(prev));
  const toggleDone = ex => updateState(prev => {
    const current = prev.logs[selectedDate] || {};
    return { ...prev, logs: { ...prev.logs, [selectedDate]: { ...current, [ex.id]: { ...(current[ex.id] || {}), done: !current[ex.id]?.done, completedAt: !current[ex.id]?.done ? new Date().toISOString() : null } } } };
  });
  const updateMax = (ex, value) => {
    const max = Number(value);
    if (!Number.isFinite(max) || max < 0) return;
    updateState(prev => ({ ...prev, workouts: { ...prev.workouts, [workoutLetter]: { ...prev.workouts[workoutLetter], exercises: prev.workouts[workoutLetter].exercises.map(item => item.id === ex.id ? { ...item, max } : item) } } }));
    setEditing(null);
  };
  const addExercise = e => {
    e.preventDefault();
    if (!newExercise.trim() || !Number.isFinite(Number(newMax)) || Number(newMax) <= 0) return;
    updateState(prev => ({ ...prev, workouts: { ...prev.workouts, [newWorkout]: { ...prev.workouts[newWorkout], exercises: [...prev.workouts[newWorkout].exercises, { id: `${newWorkout.toLowerCase()}-${Date.now()}`, name: newExercise.trim(), max: Number(newMax), ...(newVideo.trim() ? { video: newVideo.trim() } : {}) }] } } }));
    setNewExercise(''); setNewMax('40'); setNewVideo(''); setToast('Exercício adicionado');
    setTimeout(() => setToast(''), 2200);
  };
  const resetProgress = () => {
    updateState(prev => { const logs = { ...prev.logs }; delete logs[selectedDate]; return { ...prev, logs }; });
  };
  const getSets = ex => {
    const sets = pyramid.map(p => ({ ...p, weight: roundWeight(ex.max * p.percent) }));
    return state.pyramidOrder === 'descending' ? sets.reverse() : sets;
  };
  const setSchedule = value => updateState(prev => ({ ...prev, schedule: value.split('').filter(x => prev.workouts[x]) }));

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Activity size={19}/></div><span>ATLAS<span className="brand-dot">.</span></span></div>
      <button className="icon-btn" aria-label="Configurações" onClick={() => setShowSettings(true)}><Settings2 size={20}/></button>
    </header>

    <main className="main-content">
      <section className="greeting">
        <div><div className="eyebrow"><span className="live-dot"/> SEU TREINO, SEU RITMO</div>
          <h1>Vamos treinar<span className="accent">.</span></h1>
          <p className="subtitle">Consistência é o que constrói resultado.</p>
        </div>
        <div className="streak"><Dumbbell size={17}/><span>{completed}/{workout.exercises.length}</span><small>feitos</small></div>
      </section>

      <section className="calendar-card">
        <div className="calendar-head"><div><CalendarDays size={16}/><span>AGENDA DE TREINOS</span></div>
          <button className="today-btn" onClick={() => setSelectedDate(todayKey)}>Hoje</button></div>
        <div className="date-strip">
          {dateStrip.map((d, i) => {
            const key = dateKey(d);
            const letter = workoutForDate(key, state);
            const isActive = key === selectedDate;
            const dayWorkout = state.workouts[letter];
            const dayComplete = isWorkoutComplete(key, dayWorkout, state.logs);
            return <button key={key} className={`date-item ${isActive ? 'active' : ''} ${key === todayKey ? 'is-today' : ''} ${dayComplete ? 'day-complete' : ''}`} onClick={() => setSelectedDate(key)}>
              <span className="date-week">{['dom','seg','ter','qua','qui','sex','sáb'][d.getDay()]}</span>
              <span className="date-number">{d.getDate()}</span>
              <span className={`date-letter ${dayComplete ? 'done-letter' : ''}`}>{dayComplete ? '✓' : letter}</span>
            </button>;
          })}
        </div>
        <div className="calendar-foot"><span>{fmtLong(selected)}</span><div className="date-arrows"><button aria-label="Dia anterior" onClick={() => setSelectedDate(dateKey(addDays(selected,-1)))}><ChevronLeft size={16}/></button><button aria-label="Próximo dia" onClick={() => setSelectedDate(dateKey(addDays(selected,1)))}><ChevronRight size={16}/></button></div></div>
      </section>

      <section className="workout-heading">
        <div className="workout-letter">{workoutLetter}</div>
        <div className="workout-title"><span className="eyebrow">TREINO DO DIA</span><h2>{workout.name}</h2></div>
        <button className="history-btn" onClick={() => setShowHistory(v => !v)} title="Histórico"><History size={19}/></button>
      </section>

      <section className="progress-wrap">
        <div className="progress-label"><span>Progresso do treino</span><strong>{Math.round(progress)}%</strong></div>
        <div className="progress-track"><div className="progress-fill" style={{width: `${progress}%`}}/></div>
      </section>

      <div className="section-heading"><h3>Exercícios</h3><span>{workout.exercises.length} exercícios</span></div>

      <section className="exercise-list">
        {workout.exercises.map((ex, index) => {
          const isDone = !!log[ex.id]?.done;
          const sets = getSets(ex);
          return <article key={ex.id} className={`exercise-card ${isDone ? 'completed' : ''}`}>
            <div className="exercise-top">
              <div className="exercise-index">{String(index+1).padStart(2,'0')}</div>
              <div className="exercise-info"><h4>{ex.name}</h4><div className="exercise-meta">{ex.bodyweight ? <span className="bodyweight-label">Peso corporal</span> : <button className="max-edit" onClick={() => setEditing({ id: ex.id, name: ex.name, max: String(ex.max) })}>Carga máxima: <strong>{ex.max} kg</strong><span> · editar</span></button>}{ex.video && <a className="video-link" href={ex.video} target="_blank" rel="noreferrer"><span className="play-icon">▶</span> Ver vídeo</a>}</div></div>
              <button className={`check-btn ${isDone ? 'checked' : ''}`} onClick={() => toggleDone(ex)} aria-label={isDone ? 'Desmarcar exercício' : 'Marcar exercício como feito'}>{isDone ? <Check size={20}/> : <span/>}</button>
            </div>
            <div className="sets-label"><span>SÉRIE</span><span>{ex.bodyweight ? 'CARGA' : 'CARGA SUGERIDA'}</span><span>REPS</span></div>
            <div className="sets-list">{ex.bodyweight ? <div className="bodyweight-note"><span>4 séries</span><strong>Peso corporal</strong><span>12–20 reps</span></div> : sets.map((set, i) => <div className={`set-row ${i === sets.length-1 && state.pyramidOrder === 'ascending' ? 'heavy-set' : ''}`} key={set.label}>
              <div className="set-name"><span className="set-number">{i+1}</span><span>{set.label}</span></div>
              <div className="set-weight">{set.weight.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<small> kg</small></div>
              <div className="set-reps">{set.reps}</div>
            </div>)}</div>
          </article>;
        })}
      </section>

      <button className="add-exercise-btn" onClick={() => setShowSettings(true)}><Plus size={18}/> Gerenciar exercícios</button>

      {showHistory && <section className="history-panel"><div className="panel-title"><h3>Histórico recente</h3><button className="icon-btn small" onClick={() => setShowHistory(false)}><X size={17}/></button></div>
        {Object.keys(state.logs).filter(k => Object.values(state.logs[k]).some(v => v.done)).sort((a,b) => b.localeCompare(a)).slice(0,7).map(k => <div className="history-row" key={k}><span>{parseDate(k).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span><span>{Object.values(state.logs[k]).filter(v=>v.done).length} exercícios concluídos</span></div>)}
        {!Object.keys(state.logs).some(k => Object.values(state.logs[k]).some(v => v.done)) && <p className="empty-state">Seus treinos concluídos aparecerão aqui.</p>}
        <button className="reset-btn" onClick={resetProgress}><RotateCcw size={14}/> Limpar registro deste dia</button>
      </section>}

      <footer><span>ATLAS TRAINING</span><span>Feito para evoluir.</span></footer>
    </main>

    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}><div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-heading"><div><span className="eyebrow">ATUALIZAR REFERÊNCIA</span><h2>{editing.name}</h2></div><button className="icon-btn" onClick={() => setEditing(null)}><X size={20}/></button></div>
      <p className="modal-copy">Informe sua carga máxima atual. As cargas sugeridas para cada série serão recalculadas automaticamente.</p>
      <form onSubmit={e => {e.preventDefault(); updateMax({id:editing.id}, editing.max);}}>
        <label>Carga máxima (kg)</label><div className="input-with-unit"><input autoFocus type="number" min="0" step="0.5" value={editing.max} onChange={e => setEditing({...editing,max:e.target.value})} required/><span>kg</span></div>
        <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setEditing(null)}>Cancelar</button><button className="primary-btn" type="submit">Salvar carga</button></div>
      </form>
    </div></div>}

    {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><div className="modal settings-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-heading"><div><span className="eyebrow">PERSONALIZE</span><h2>Configurar treinos</h2></div><button className="icon-btn" onClick={() => setShowSettings(false)}><X size={20}/></button></div>
      <label className="field-label">Ordem da pirâmide</label><div className="segmented"><button className={state.pyramidOrder !== 'descending' ? 'selected' : ''} onClick={() => updateState(p => ({...p,pyramidOrder:'ascending'}))}>Crescente <small>leve → pesado</small></button><button className={state.pyramidOrder === 'descending' ? 'selected' : ''} onClick={() => updateState(p => ({...p,pyramidOrder:'descending'}))}>Decrescente <small>pesado → leve</small></button></div>
      <p className="schedule-hint">A sequência só avança quando você conclui todos os exercícios do dia. Se faltar ou deixar o treino incompleto, ele será mantido para o próximo dia.</p><label className="field-label">Sequência dos treinos</label><div className="sequence-options">{['ABC','ACB','AB','ABCAB'].map(seq => <button key={seq} className={state.schedule.join('')===seq?'selected':''} onClick={() => setSchedule(seq)}>{seq.split('').join(' · ')}</button>)}</div>
      <div className="divider"/>
      <h3 className="form-section-title">Adicionar exercício</h3>
      <form onSubmit={addExercise}>
        <label className="field-label">Adicionar ao treino</label><div className="workout-pills">{['A','B','C'].map(l=><button type="button" key={l} className={newWorkout===l?'selected':''} onClick={()=>setNewWorkout(l)}>Treino {l}</button>)}</div>
        <label className="field-label">Nome do exercício</label><input className="text-input" value={newExercise} onChange={e=>setNewExercise(e.target.value)} placeholder="Ex.: Crucifixo inclinado" required/>
        <label className="field-label">Carga máxima (kg)</label><input className="text-input" type="number" min="0" step="0.5" value={newMax} onChange={e=>setNewMax(e.target.value)} required/>
        <label className="field-label">Link do vídeo (opcional)</label><input className="text-input" type="url" value={newVideo} onChange={e=>setNewVideo(e.target.value)} placeholder="https://youtu.be/..."/>
        <button className="primary-btn full" type="submit"><Plus size={17}/> Adicionar exercício</button>
      </form>
      <p className="fine-print">Seus dados ficam salvos neste navegador. Use a carga máxima como referência conservadora e ajuste conforme sua execução e orientação profissional.</p>
      <button className="secondary-btn full" onClick={() => setShowSettings(false)}>Concluir</button>
    </div></div>}
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
  </div>;
}

export default App;