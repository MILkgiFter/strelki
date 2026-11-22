// Окно «Задания» (п. 12.2): 3 задания дня с прогрессом, награды, тост «выполнено» во время игры.
// Логика — tasks.js (без DOM), здесь показ, сохранение и выдача бустеров.
import { TASKS } from './config.js';
import { t } from './i18n.js';
import { sfx, unlock } from './sound.js';
import { dayIndex } from './level.js';
import { grantSet } from './boosters.js';
import { tasksEvent, tasksStatus, claimTask } from './tasks.js';
import { $, load, save } from './store.js';
import { toast } from './boosters-ui.js';

const ICONS = { hint: '🔍', eraser: '🧽', life: '♥' };
let api = null; // { boost: () => запас, saveBoost, updateHud }

const today = () => dayIndex(new Date());
const rewardText = (r) =>
  Object.entries(r)
    .map(([k, n]) => `${ICONS[k]}${n > 1 ? '×' + n : ''}`)
    .join(' ');
const taskText = (task) => t('task_' + task.kind, task.goal);

// событие игры: { type: 'arrow', n } или { type: 'win', ... } (см. tasks.js)
export function tasksOnEvent(ev) {
  const day = today();
  const { state, completed } = tasksEvent(load(TASKS.key, null), day, ev);
  save(TASKS.key, state);
  for (const task of completed) toast(t('taskDoneToast', taskText(task)));
  if (completed.length) updateTasksButton();
}

export function updateTasksButton() {
  const list = tasksStatus(load(TASKS.key, null), today());
  const ready = list.some((x) => x.done && !x.got);
  const done = list.filter((x) => x.done).length;
  $('tasks-note').textContent = ready ? t('tasksNoteReady') : t('tasksNote', done, list.length);
  $('open-tasks').classList.toggle('ready', ready);
}

function render() {
  const list = tasksStatus(load(TASKS.key, null), today());
  const box = $('tasks-list');
  box.innerHTML = '';
  for (const x of list) {
    const row = document.createElement('div');
    row.className = 'task' + (x.got ? ' got' : x.done ? ' done' : '');
    const pct = Math.round((100 * x.n) / x.goal);
    row.innerHTML = `
      <div class="task-text"><div class="task-name">${taskText(x)}</div>
        <div class="task-bar"><i style="width:${pct}%"></i></div>
        <div class="task-n">${x.n} / ${x.goal} · ${rewardText(x.reward)}</div></div>
      ${x.got ? '<span class="task-ok">✓</span>' : x.done ? `<button class="btn task-claim" data-claim="${x.id}">${t('streakClaim')}</button>` : ''}`;
    box.appendChild(row);
  }
  const all = list.every((x) => x.got);
  $('tasks-bonus').textContent = all ? t('tasksBonusGot') : t('tasksBonus', rewardText(TASKS.bonus));
}

export function initTasksUI(a) {
  api = a;
  $('open-tasks').addEventListener('click', () => {
    unlock();
    sfx.click();
    render();
    $('tasks').hidden = false;
  });
  $('tasks-close').addEventListener('click', () => {
    sfx.click();
    $('tasks').hidden = true;
  });
  $('tasks-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-claim]');
    if (!b) return;
    unlock();
    const day = today();
    const { state, reward, bonus } = claimTask(load(TASKS.key, null), day, b.dataset.claim);
    save(TASKS.key, state);
    grantSet(api.boost(), reward);
    api.saveBoost();
    api.updateHud();
    sfx.hint();
    toast(t(bonus ? 'tasksBonusToast' : 'reward', rewardText(reward)));
    render();
    updateTasksButton();
  });
}
