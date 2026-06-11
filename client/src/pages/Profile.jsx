import { useEffect, useState } from 'react';
import { PageSkeleton } from '../components/Skeleton';
import '../styles/profile.css';

const dayOrder = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const defaultAvailability = {
  monday: { available: false, start: '', end: '' },
  tuesday: { available: false, start: '', end: '' },
  wednesday: { available: false, start: '', end: '' },
  thursday: { available: false, start: '', end: '' },
  friday: { available: false, start: '', end: '' },
  saturday: { available: false, start: '', end: '' },
  sunday: { available: false, start: '', end: '' },
};

function formatDay(day) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatDate(dateString) {
  if (!dateString) return 'Not available';
  return new Date(dateString).toLocaleDateString();
}

function formatValue(value, fallback = 'Not set') {
  return value || fallback;
}

export default function Profile() {
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    timezone: '',
    preferred_time: '',
    weekly_target_hours: '',
    availability: defaultAvailability,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');

      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setUser(data);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  function openEditModal() {
    setFormData({
      timezone: user.timezone || '',
      preferred_time: user.preferred_time || 'evening',
      weekly_target_hours: user.weekly_target_hours || '',
      availability: {
        ...defaultAvailability,
        ...(user.availability || {}),
      },
    });

    setShowModal(true);
  }

  function closeEditModal() {
    setShowModal(false);
    setError(null);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAvailabilityChange(day, field, value) {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value,
        },
      },
    }));
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);

      const token = localStorage.getItem('token');

      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          timezone: formData.timezone,
          preferred_time: formData.preferred_time,
          weekly_target_hours: Number(formData.weekly_target_hours),
          availability: formData.availability,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser((prev) => ({
        ...prev,
        ...data,
      }));

      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <PageSkeleton type="profile" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-page">
        <h1>Profile</h1>

        <div className="profile-error" role="alert">
          {error}
        </div>

        <button
          type="button"
          className="profile-primary-button"
          onClick={fetchProfile}
          aria-label="Retry loading profile"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div>
          <h1>Profile</h1>
          <p>Manage your learning preferences and weekly availability.</p>
        </div>

        <button
          type="button"
          className="profile-primary-button"
          onClick={openEditModal}
          aria-label="Edit profile settings"
        >
          Edit Profile
        </button>
      </section>

      {error && (
        <div className="profile-error" role="alert">
          {error}
        </div>
      )}

      <section className="profile-card">
        <div className="profile-card-header">
          <div className="profile-avatar" aria-hidden="true">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div>
            <h2>{user.email}</h2>
            <p>Account created on {formatDate(user.created_at)}</p>
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-item">
            <span>Timezone</span>
            <strong>{formatValue(user.timezone)}</strong>
          </div>

          <div className="profile-info-item">
            <span>Preferred Time</span>
            <strong>{formatValue(user.preferred_time)}</strong>
          </div>

          <div className="profile-info-item">
            <span>Weekly Target</span>
            <strong>
              {user.weekly_target_hours
                ? `${Number(user.weekly_target_hours)} hours`
                : 'Not set'}
            </strong>
          </div>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-section-header">
          <h2>Weekly Availability</h2>
          <p>These times help the AI suggest better study tasks.</p>
        </div>

        <div className="availability-grid">
          {dayOrder.map((day) => {
            const info = user.availability?.[day] || defaultAvailability[day];

            return (
              <article
                key={day}
                className={`availability-card ${
                  info.available ? 'available' : 'unavailable'
                }`}
              >
                <div>
                  <h3>{formatDay(day)}</h3>
                  <p>
                    {info.available
                      ? `${info.start || '--:--'} - ${info.end || '--:--'}`
                      : 'Not available'}
                  </p>
                </div>

                <span>{info.available ? 'Available' : 'Off'}</span>
              </article>
            );
          })}
        </div>
      </section>

      {showModal && (
        <div className="profile-modal-overlay">
          <div
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            <div className="profile-modal-header">
              <div>
                <h2 id="edit-profile-title">Edit Profile</h2>
                <p>Update your study preferences and availability.</p>
              </div>

              <button
                type="button"
                className="profile-modal-close"
                onClick={closeEditModal}
                aria-label="Close edit profile modal"
              >
                ×
              </button>
            </div>

            <form className="profile-form" onSubmit={handleUpdateProfile}>
              <div className="profile-form-grid">
                <div className="profile-form-field">
                  <label htmlFor="timezone">Timezone</label>
                  <input
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    placeholder="Asia/Kuala_Lumpur"
                  />
                </div>

                <div className="profile-form-field">
                  <label htmlFor="preferred-time">Preferred Time</label>
                  <select
                    id="preferred-time"
                    name="preferred_time"
                    value={formData.preferred_time}
                    onChange={handleChange}
                  >
                    <option value="">Select preferred time</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>

                <div className="profile-form-field">
                  <label htmlFor="weekly-target-hours">
                    Weekly Target Hours
                  </label>
                  <input
                    id="weekly-target-hours"
                    name="weekly_target_hours"
                    type="number"
                    min="1"
                    max="80"
                    value={formData.weekly_target_hours}
                    onChange={handleChange}
                    placeholder="Example: 8"
                  />
                </div>
              </div>

              <section className="availability-edit-section">
                <h3>Availability</h3>

                <div className="availability-edit-list">
                  {dayOrder.map((day) => {
                    const dayInfo =
                      formData.availability[day] || defaultAvailability[day];

                    return (
                      <div className="availability-edit-row" key={day}>
                        <label className="availability-checkbox">
                          <input
                            type="checkbox"
                            checked={dayInfo.available}
                            onChange={(e) =>
                              handleAvailabilityChange(
                                day,
                                'available',
                                e.target.checked
                              )
                            }
                          />
                          <span>{formatDay(day)}</span>
                        </label>

                        <input
                          type="time"
                          value={dayInfo.start}
                          onChange={(e) =>
                            handleAvailabilityChange(day, 'start', e.target.value)
                          }
                          disabled={!dayInfo.available}
                          aria-label={`${formatDay(day)} start time`}
                        />

                        <input
                          type="time"
                          value={dayInfo.end}
                          onChange={(e) =>
                            handleAvailabilityChange(day, 'end', e.target.value)
                          }
                          disabled={!dayInfo.available}
                          aria-label={`${formatDay(day)} end time`}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-primary-button"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}