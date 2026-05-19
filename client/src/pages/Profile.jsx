import { useState, useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';
import '../styles/profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    timezone: '',
    preferred_time: '',
    weekly_target_hours: '',
    availability: {
      monday: { available: false, start: '', end: ''},
      tuesday: { available: false, start: '', end: ''},
      wednesday: { available: false, start: '', end: ''},
      thursday: { available: false, start: '', end: ''},
      friday: { available: false, start: '', end: ''},
      saturday: { available: false, start: '', end: ''},
      sunday: { available: false, start: '', end: ''},
    }
  });
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const dayOrder = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  useEffect(() => {
    async function fetchProfile() {
      setError(null);
      try {
        const token = localStorage.getItem('token');

        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch profile')
        }

        const data = await res.json();

        setUser(data);
        
      } catch (err) {
        setError(err.message);
      } 
    }

    fetchProfile();
  }, [])

  if (!user) {
    return <p>Loading Profile...</p>
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setError(null);
    try {
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

      //update user
      setUser((prev) => ({
        ...prev,
        ...data,
      }));

      setShowModal(false);
    } catch (err) {
      setError(err.message);
    }
  }


  // run when the edit button is clicked so on form for modal
  function openEditModal() {
    const defaultAvailability = {
      monday: { available: false, start: '', end: ''},
      tuesday: { available: false, start: '', end: ''},
      wednesday: { available: false, start: '', end: ''},
      thursday: { available: false, start: '', end: ''},
      friday: { available: false, start: '', end: ''},
      saturday: { available: false, start: '', end: ''},
      sunday: { available: false, start: '', end: ''},
    }
    setFormData({
      timezone: user.timezone || '',
      preferred_time: user.preferred_time || '',
      weekly_target_hours: user.weekly_target_hours || '',
      availability: { ...defaultAvailability, ...(user.availability || {}),
      }
    });

    setShowModal(true);
  }

  //set the new input value to formData
  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
  
  //set the input value to formData for availability
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

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }
  
  return (
    <div className="main-layout">
      <h1>Profile</h1>

      <div className="profile-content">
        {error && <p className="error">{error}</p>}
        <p><strong>Email:</strong> {user.email}</p>
        <br></br>
        <p><strong>Created At:</strong> {formatDate(user.created_at)}</p>
        <br></br>
        <p><strong>Timezone:</strong> {user.timezone}</p>
        <br></br>
        <p><strong>Preferred Time:</strong> {user.preferred_time}</p>
        <br></br>
        <p><strong>Weekly Target Hours:</strong> {Number(user.weekly_target_hours).toString()} hours</p>
        <br></br>
        <div>
        <strong>Availability:</strong> 
          {dayOrder.map((day) => {
            const info = user.availability?.[day];

            return (
            <p key={day}>
              {day.charAt(0).toUpperCase() + day.slice(1)}:{' '}
              {info.available ? `${info.start} - ${info.end}` : 'Not available'}
            </p>
            )
          })}
        </div>
      </div>

      <button onClick={openEditModal}>Edit Profile</button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Profile</h2>

            <form onSubmit={handleUpdateProfile}>
              <label>timezone:</label>
              <input name="timezone" value={formData.timezone} onChange={handleChange}/>
              <br></br>
              <label>preferred time:</label>
              <select name="preferred_time" value={formData.preferred_time} onChange={handleChange}>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
              <br></br>
              <label>weekly target hours:</label>
              <input name="weekly_target_hours" value={formData.weekly_target_hours} onChange={handleChange}/>
              <br></br>
              <div className="availability-section">
                <h3>Availability</h3>

                {Object.keys(formData.availability).map((day) => (
                  <div className="availability-row" key={day}>
                    <label className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.availability[day].available}
                        onChange={(e) =>
                          handleAvailabilityChange(day, 'available', e.target.checked)
                        }
                      />
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </label>

                    <input
                      type="time"
                      value={formData.availability[day].start}
                      onChange={(e) =>
                        handleAvailabilityChange(day, 'start', e.target.value)
                      }
                      disabled={!formData.availability[day].available}
                    />

                    <input
                      type="time"
                      value={formData.availability[day].end}
                      onChange={(e) =>
                        handleAvailabilityChange(day, 'end', e.target.value)
                        }
                      disabled={!formData.availability[day].available}
                    />
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-button">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}