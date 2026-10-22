import React, { useState } from 'react';

export default function Today({ state, config, act, notify }) {
  const [busyId, setBusyId] = useState(null);
  const { tasks, doneToday, user, band } = state;
  const goal = user.dailyGoal;
  const pct = Math.min(100, Math.round((doneToday / goal) * 100));
  const goalMet = band.lastGoalDate === state.today;

  const groups = [];
  tasks.forEach((t) => {
    let g = groups.find((x) => x.name === t.category);
    if (!g) { g = { name: t.category, items: [] }; groups.push(g); }
    g.items.push(t);
  });

  const complete = async (t) => {
    setBusyId(t.id);
    const next = await act(`/api/tasks/${t.id}/complete`);
    setBusyId(null);
    if (next?.reward) {
      const s = config.STATS[next.reward.stat];
      notify(next.reward.goal || `+${next.reward.gain} ${s.label}${next.reward.energy ? '  ⚡+1' : ''}`);
    }
  };
  const undo = async (t) => {
    setBusyId(t.id);
    await act(`/api/tasks/${t.id}/undo`);
    setBusyId(null);
  };

  return (
    <section>
      <div className={`goal-card ${goalMet ? 'met' : ''}`}>
        <div className="goal-row">
          <h2 className="display goal-title">{goalMet ? 'Goal hit today!' : "Today's setlist"}</h2>
          <span className="goal-count">{doneToday} / {goal}</span>
        </div>
        <div className="goal-bar"><span style={{ width: `${pct}%` }} /></div>
        <p className="goal-text">
          {goalMet
            ? `Streak: ${band.streak} day${band.streak === 1 ? '' : 's'}. Gigs earn ${band.streakBonus}% extra fans. Keep ticking for more energy.`
            : `Finish ${goal - doneToday > 0 ? goal - doneToday : 0} more to hit your daily goal and grow your streak. Every task gives ⚡1 energy.`}
        </p>
      </div>

      {tasks.length === 0 && <p className="empty">No tasks yet. Ask a grown-up to add some in Band → Parent area.</p>}

      {groups.map((g) => (
        <div className="task-group" key={g.name}>
          <h3 className="group-title">{g.name}</h3>
          <ul className="tasks">
            {g.items.map((t) => {
              const s = config.STATS[t.stat];
              return (
                <li key={t.id} className={`task ${t.done ? 'done' : ''}`}>
                  <button className="task-main" disabled={t.done || busyId === t.id} onClick={() => complete(t)}
                    aria-label={t.done ? `${t.title}, done` : `Mark ${t.title} done`}>
                    <span className="check" aria-hidden="true">{t.done ? '✓' : ''}</span>
                    <span className="task-icon" aria-hidden="true">{t.icon}</span>
                    <span className="task-title">{t.title}</span>
                    <span className="task-reward">{s.icon} +{t.amount}</span>
                  </button>
                  {t.done && (
                    <button className="undo" onClick={() => undo(t)} disabled={busyId === t.id}>Undo</button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
