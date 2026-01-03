'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { employeeService } from '../services/api';

export default function ProfilePage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
    }
  }, [authLoading, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Mock profile data for now
      setProfile({
        _id: user?.id,
        Employname: user?.email?.split('@')[0] || 'User',
        email: user?.email,
        role: user?.role,
        phone: '+91 9876543210',
        department: 'Engineering',
        position: 'Software Developer',
        joiningDate: '2024-01-15',
        employmentType: 'full-time',
        status: 'active',
        image: '',
        address: {
          street: '123 Main Street',
          city: 'Jammu',
          state: 'Jammu & Kashmir',
          pincode: '180001',
          country: 'India',
        },
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+91 9876543211',
          relation: 'Spouse',
        },
        leaveBalance: {
          paid: 12,
          sick: 6,
          unpaid: 0,
        },
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditData({
      phone: profile?.phone || '',
      image: profile?.image || '',
      address: { ...profile?.address },
      emergencyContact: { ...profile?.emergencyContact },
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // API call would go here
      // await employeeService.update(profile._id, editData);
      
      setProfile(prev => ({ ...prev, ...editData }));
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="empty-state">
        <h3>Profile not found</h3>
        <p>Unable to load your profile information.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and manage your personal information</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Profile Card */}
        <Card hover={false} style={{ padding: '32px', textAlign: 'center' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '48px',
              color: 'white',
              fontWeight: '600',
            }}
          >
            {profile.Employname?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>
            {profile.Employname}
          </h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '12px' }}>{profile.position}</p>
          <StatusBadge status={profile.status} />
          
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--gray-200)' }}>
            <InfoRow label="Department" value={profile.department} />
            <InfoRow label="Employee Type" value={profile.employmentType} />
            <InfoRow label="Joined" value={new Date(profile.joiningDate).toLocaleDateString()} />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '24px' }}
            onClick={handleEdit}
          >
            Edit Profile
          </button>
        </Card>

        {/* Details Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Contact Information */}
          <Card hover={false} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Phone" value={profile.phone} />
            </div>
          </Card>

          {/* Address */}
          <Card hover={false} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Address
            </h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              {profile.address?.street}<br />
              {profile.address?.city}, {profile.address?.state} {profile.address?.pincode}<br />
              {profile.address?.country}
            </p>
          </Card>

          {/* Emergency Contact */}
          <Card hover={false} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Emergency Contact
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <InfoRow label="Name" value={profile.emergencyContact?.name} />
              <InfoRow label="Phone" value={profile.emergencyContact?.phone} />
              <InfoRow label="Relation" value={profile.emergencyContact?.relation} />
            </div>
          </Card>

          {/* Leave Balance */}
          <Card hover={false} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Leave Balance
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--success)' }}>
                  {profile.leaveBalance?.paid}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>Paid Leave</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--warning)' }}>
                  {profile.leaveBalance?.sick}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>Sick Leave</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--gray-600)' }}>
                  {profile.leaveBalance?.unpaid}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>Unpaid Leave</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit Profile"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <ButtonSpinner /> : null}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label>Phone Number</label>
            <input
              type="tel"
              className="input"
              value={editData.phone || ''}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Profile Image URL</label>
            <input
              type="url"
              className="input"
              value={editData.image || ''}
              onChange={(e) => setEditData({ ...editData, image: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Street Address</label>
            <input
              type="text"
              className="input"
              value={editData.address?.street || ''}
              onChange={(e) => setEditData({ 
                ...editData, 
                address: { ...editData.address, street: e.target.value } 
              })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label>City</label>
              <input
                type="text"
                className="input"
                value={editData.address?.city || ''}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  address: { ...editData.address, city: e.target.value } 
                })}
              />
            </div>
            <div className="input-group">
              <label>Pincode</label>
              <input
                type="text"
                className="input"
                value={editData.address?.pincode || ''}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  address: { ...editData.address, pincode: e.target.value } 
                })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)' }}>{value || '-'}</div>
    </div>
  );
}
