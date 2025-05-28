import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import './familydash.css';
import { FaUser, FaMapMarkerAlt, FaIdCard } from 'react-icons/fa';
import defaultProfile from '../assets/images/d1.png';
import userImage from '../assets/images/user.png';
import familyImage from '../assets/images/fam.png';

function FamilyDashboard() {
  const { t } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [members, setMembers] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [fullViewImage, setFullViewImage] = useState(null);
  const [closingModal, setClosingModal] = useState(false); // ✅ added to fix the error
  const navigate = useNavigate();

  const backendBaseUrl = `${window.location.protocol}//${window.location.hostname}:8000`;

  useEffect(() => {
    const getFullImageUrl = (imgPath) => {
      if (!imgPath) return null;
      if (imgPath.startsWith('http')) return imgPath;
      return `${backendBaseUrl}${imgPath}`;
    };

    const fetchFamilyMembers = async (family_id, currentUser) => {
      try {
        const response = await fetch(`${backendBaseUrl}/api/family-members?family_id=${family_id}`);
        const data = await response.json();

        const membersWithFullImg = data.map(member => ({
          ...member,
          profile_image: getFullImageUrl(member.profile_image),
        }));

        setMembers(Array.isArray(membersWithFullImg) ? membersWithFullImg : []);

        if (currentUser?.email) {
          const self = membersWithFullImg.find(m => m.email === currentUser.email);
          if (self) {
            const updatedUser = {
              ...currentUser,
              profile_image: self.profile_image || currentUser.profile_image,
              aadhar_number: self.aadhar_number || currentUser.aadhar_number,
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUserData(updatedUser);
            return;
          }
        }

        setUserData(currentUser);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (user) {
      setUserData(user);
      if (user.family_id) {
        fetchFamilyMembers(user.family_id, user);
      }
    } else {
      navigate('/');
    }
  }, [backendBaseUrl, navigate]);

  useEffect(() => {
    if (/Android/i.test(navigator.userAgent)) {
      document.body.classList.add('android-device');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfileImage = async () => {
    const email = userData?.email || JSON.parse(localStorage.getItem('user'))?.email;

    if (!email || !imageFile) {
      alert('Email or image file missing.');
      return;
    }

    const formData = new FormData();
    formData.append('profile_image', imageFile);

    try {
      const response = await fetch(
        `${backendBaseUrl}/api/update-profile-image-by-email/${encodeURIComponent(email)}/`,
        {
          method: 'PUT',
          body: formData,
        }
      );

      if (response.ok) {
        alert('Profile image updated!');
        const res = await fetch(`${backendBaseUrl}/api/family-members?family_id=${userData.family_id}`);
        const updatedData = await res.json();

        const updatedMembers = updatedData.map(member => ({
          ...member,
          profile_image: (member.profile_image && member.profile_image.startsWith('http'))
            ? member.profile_image
            : `${backendBaseUrl}${member.profile_image}`,
        }));

        setMembers(updatedMembers);
        setImageFile(null);
        setProfileImage(null);

        const updatedUser = {
          ...userData,
          profile_image: updatedMembers.find(m => m.email === email)?.profile_image || userData.profile_image,
        };
        setUserData(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update image.');
      }
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Error updating image.');
    }
  };

  const handleDeleteProfileImage = async () => {
    const email = userData?.email;

    if (!email) {
      alert("User email missing.");
      return;
    }

    try {
      const response = await fetch(
        `${backendBaseUrl}/api/delete-profile-image/${encodeURIComponent(email)}/`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        alert("Profile image deleted.");
        const updatedUser = {
          ...userData,
          profile_image: null,
        };
        setUserData(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        const error = await response.json();
        alert(error.message || "Failed to delete image.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the image.");
    }
  };

  const filteredMembers = members.filter(m => m.email !== userData?.email);

  return (
    <div className="family-dashboard">
      <Navbar />
      <div className="dashboard-content">
        {userData ? (
          <div className="combined-section">
            <div className="left-section">
              <div className="section-label">
                <img src={familyImage} alt="Family" className="section-image" />
                <p id="se">{t('familyMembers')}</p>
              </div>
              {filteredMembers.length > 0 ? (
                <div className="table-wrapper">
                  <table className="family-table">
                    <thead>
                      <tr>
                        <th>{t('name')}</th>
                        <th>{t('aadharNumber')}</th>
                        <th>{t('email')}</th>
                        <th>{t('profile')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member, idx) => (
                        <tr key={idx}>
                          <td>{member.name}</td>
                          <td>{member.aadhar_number}</td>
                          <td>{member.email}</td>
                          <td>
                            {member.profile_image ? (
                              <img
                                src={member.profile_image}
                                alt="Profile"
                                className="profile-image-thumb"
                                style={{ cursor: 'pointer' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = defaultProfile;
                                }}
                                onClick={() => setFullViewImage(member.profile_image)}
                              />
                            ) : (
                              <span>{t('profile')} {t('notAvailable')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>{t('noMembers')}</p>
              )}
            </div>

            <div className="right-section">
              <div className="section-label">
                <img src={userImage} alt="User" className="user-image" />
                <p id="se">{t('userInfo')}</p>
              </div>
              <div className="user-info">
                <div className="info-item">
                  <FaUser className="info-icon" />
                  <p><strong>{t('name')}:</strong> {userData.name}</p>
                </div>
                <div className="info-item">
                  <FaIdCard className="info-icon" />
                  <p><strong>{t('aadharNumber')}:</strong> {userData.aadhar_number || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <FaMapMarkerAlt className="info-icon" />
                  <p><strong>{t('familyId')}:</strong> {userData.family_id}</p>
                </div>
                <div className="info-item">
                  <FaMapMarkerAlt className="info-icon" />
                  <p><strong>{t('area')}:</strong> {userData.area}</p>
                </div>

                <div className="profile-upload">
                  <input
                    type="file"
                    accept="image/*"
                    id="profile-image-input"
                    style={{ display: 'none' }}
                    onChange={handleProfileImageChange}
                  />
                  <div
                    className="profile-preview"
                    onClick={() => document.getElementById('profile-image-input').click()}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={
                        profileImage
                          ? profileImage
                          : userData.profile_image
                          ? userData.profile_image
                          : defaultProfile
                      }
                      alt="Profile"
                      className="profile-preview-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultProfile;
                      }}
                    />
                    <p>{t('clickToSelect')}</p>
                  </div>

                  {imageFile && (
                    <div className="profile-actions">
                      <button onClick={() => { setImageFile(null); setProfileImage(null); }} className="delete-button">
                        {t('remove')}
                      </button>
                      <button onClick={handleUpdateProfileImage} className="update-email-btn">
                        {t('upload')}
                      </button>
                    </div>
                  )}

                  {userData?.profile_image && !imageFile && (
                    <div className="profile-actions">
                      <button onClick={handleDeleteProfileImage} className="delete-button">
                        {t('deleteImage')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={handleLogout} className="logout-button">{t('logout')}</button>
            </div>
          </div>
        ) : (
          <p>{t('loading')}</p>
        )}
        <Link to="/item" className="shop-button">{t('goToShop')}</Link>
      </div>

      {/* Full Image Modal */}
      {fullViewImage && (
        <div
          className={`image-modal ${closingModal ? 'closing' : ''}`}
          onClick={() => {
            setClosingModal(true);
            setTimeout(() => {
              setFullViewImage(null);
              setClosingModal(false);
            }, 400);
          }}
        >
          <img
            src={fullViewImage}
            alt="Full view"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default FamilyDashboard;
