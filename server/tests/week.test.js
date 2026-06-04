const {
  formatLocalDate,
  getWeekStart,
  getWeekEnd,
  getWeekString,
  getCurrentWeekStart,
  getCurrentWeek,
} = require('../src/utils/week');

describe('week utils', () => {
  test('formatLocalDate returns YYYY-MM-DD format', () => {
    const result = formatLocalDate(new Date('2026-05-29T12:00:00'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('getWeekStart returns Monday for a Friday date', () => {
    const result = getWeekStart('2026-05-29');
    expect(result).toBe('2026-05-25');
  });

  test('getWeekEnd returns Sunday for a Friday date', () => {
    const result = getWeekEnd('2026-05-29');
    expect(result).toBe('2026-05-31');
  });

  test('getWeekStart handles Sunday correctly', () => {
    const result = getWeekStart('2026-05-31');
    expect(result).toBe('2026-05-25');
  });

  test('getWeekString returns year-week format', () => {
    const result = getWeekString('2026-05-29');
    expect(result).toMatch(/^2026-W\d{2}$/);
  });

  test('getCurrentWeekStart returns date format', () => {
    const result = getCurrentWeekStart();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('getCurrentWeek returns week format', () => {
    const result = getCurrentWeek();
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });
});