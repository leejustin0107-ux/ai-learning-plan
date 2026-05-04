import { useState, useEffect } from 'react';
import { api } from '../services/api';
 
export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
 
  useEffect(() => {
    api.get('/goals').then(setGoals);
  }, []);
 
  async function handleCreate(e) {
    e.preventDefault();
    const newGoal = await api.post('/goals', { title });
    setGoals([newGoal, ...goals]);
    setTitle('');
  }
 
  if (!goals.length) {
    return (
      <div>
        <h1>Goals</h1>
        <p>Belum ada goal. Tentukan apa yang ingin Anda pelajari.</p>
        <form onSubmit={handleCreate}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Menguasai React hooks" required />
          <button type="submit">Buat Goal</button>
        </form>
      </div>
    );
  }
 
  return (
    <div>
      <h1>Goals</h1>
      <form onSubmit={handleCreate}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal baru..." required />
        <button type="submit">Tambah</button>
      </form>
      <ul>
        {goals.map(g => (
          <li key={g.id}>
            <strong>{g.title}</strong>
            {g.deadline && <span> — deadline: {g.deadline}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}