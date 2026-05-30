function formatLocalDate(date) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);

  d.setDate(diff);

  return formatLocalDate(d);
}

function getWeekEnd(date) {
  const start = new Date(`${getWeekStart(date)}T00:00:00`);
  start.setDate(start.getDate() + 6);

  return formatLocalDate(start);
}

function getWeekString(date) {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getCurrentWeekStart() {
  return getWeekStart(new Date());
}

function getCurrentWeek() {
  return getWeekString(new Date());
}

module.exports = {
  formatLocalDate,
  getWeekStart,
  getWeekEnd,
  getWeekString,
  getCurrentWeekStart,
  getCurrentWeek,
};