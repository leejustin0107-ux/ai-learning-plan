import TaskItem from '../components/TaskItem';
import ProgressBar from '../components/ProgressBar';

//ini cuma data sementara untuk test
const sampleTasks = [
  { id: '1', title: 'Belajar React Hooks', duration_estimate: 45, planned_slot: 'morning', status: 'done' },
  { id: '2', title: 'Setup Express routes', duration_estimate: 60, planned_slot: 'afternoon', status: 'todo' },
];


export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <ProgressBar completed={1} total={2} label="Progress minggu ini" />
      {sampleTasks.map(t => (
        <TaskItem key={t.id} task={t} onStatusChange={() => {}} />
      ))}
    </div>
  );
}