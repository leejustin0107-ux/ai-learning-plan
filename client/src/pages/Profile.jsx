import { useState, useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  
  
  return (
    <div className="main-layout">
      <h1>Profile</h1>

      <div className="profile-content">
        <p><strong>Email:</strong> {user.email}</p>
        <br></br>
        <p><strong>Created At:</strong> {user.created_at}</p>
        <br></br>
        <p><strong>Timezone:</strong> {user.timezone}</p>
        <br></br>
        <p><strong>Preferred Time:</strong> {user.preferred_time}</p>
        <br></br>
        <p><strong>Weekly Target Hours:</strong> {user.weekly_target_hours}</p>
        <br></br>
        <p><strong>Availability:</strong> {user.availability}</p>
      </div>

      <button onClick={() => navigate('/editProfile')}>Edit Profile</button>
    </div>
  );
}