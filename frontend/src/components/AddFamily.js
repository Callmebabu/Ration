// AddFamily.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './add.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUser, FaIdCard, FaEnvelope, FaPlus } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';

function AddFamily() {
  const [familyId, setFamilyId] = useState('');
  const [area, setArea] = useState('');
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAadhar, setNewMemberAadhar] = useState('');
  const [newMemberEmailUser, setNewMemberEmailUser] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingAadhar, setEditingAadhar] = useState(null);

  const [isFamilyEditing, setIsFamilyEditing] = useState(false);
  const [originalFamilyId, setOriginalFamilyId] = useState('');

  const areas = [
    "Tagore Nagar", "Muthialpet", "Nellithope", "Puducherry Town",
    "Villianur", "Karaikal", "Cuddalore", "Bakers Street", "Arumparthapuram",
  ];

  const fetchFamilyMembers = useCallback(() => {
    if (!familyId) {
      setMembers([]);
      return;
    }
    axios
      .get(`http://127.0.0.1:8000/api/family-members?family_id=${familyId}`)
      .then((response) => {
        setMembers(response.data);
        toast.info(`👨‍👩‍👧‍👦 Members of family "${familyId}" loaded.`);
      })
      .catch(() => {
        toast.error('❌ Error fetching family members.');
      });
  }, [familyId]);

  useEffect(() => {
    if (familyId.length > 2) {
      fetchFamilyMembers();
    } else {
      setMembers([]);
      setIsEditing(false);
      setEditingAadhar(null);
    }
  }, [familyId, fetchFamilyMembers]);

  const handleAddFamily = () => {
    if (!familyId || !area) {
      toast.warning('⚠️ Provide both Family ID and Area.');
      return;
    }

    axios
      .post('http://127.0.0.1:8000/api/add-family/', { family_id: familyId, area })
      .then(() => {
        toast.success('✅ Family added.');
        setArea('');
        setFamilyId('');
        setMembers([]);
      })
      .catch(() => toast.error('❌ Error adding family.'));
  };

  const handleEditFamily = () => {
    setIsFamilyEditing(true);
    setOriginalFamilyId(familyId);
  };

  const handleUpdateFamily = () => {
    if (!familyId || !area) {
      toast.warning('⚠️ Provide Family ID and Area.');
      return;
    }

    axios
      .put(`http://127.0.0.1:8000/api/update-family/${originalFamilyId}/`, {
        family_id: familyId,
        area,
      })
      .then(() => {
        toast.success('✅ Family updated.');
        setIsFamilyEditing(false);
        setOriginalFamilyId('');
      })
      .catch(() => toast.error('❌ Error updating family.'));
  };

  const handleDeleteFamily = () => {
    if (!window.confirm(`Delete family "${familyId}"?`)) return;

    axios
      .delete(`http://127.0.0.1:8000/api/delete-family/${familyId}/`)
      .then(() => {
        toast.success('✅ Family deleted.');
        setFamilyId('');
        setArea('');
        setMembers([]);
        setIsFamilyEditing(false);
        setOriginalFamilyId('');
      })
      .catch(() => toast.error('❌ Error deleting family.'));
  };

  const handleAddMember = () => {
    const fullEmail = `${newMemberEmailUser}@gmail.com`;
    const emailPattern = /^[a-zA-Z0-9._%+-]+$/;

    if (
      !newMemberName ||
      newMemberAadhar.length !== 12 ||
      !emailPattern.test(newMemberEmailUser)
    ) {
      toast.warning('⚠️ Enter valid name, 12-digit Aadhar, and email username.');
      return;
    }

    axios
      .post('http://127.0.0.1:8000/api/add-member/', {
        family_id: familyId,
        name: newMemberName,
        aadhar_number: newMemberAadhar,
        email: fullEmail,
      })
      .then((response) => {
        toast.success('✅ Member added.');
        setMembers((prev) => [...prev, response.data]);
        setNewMemberName('');
        setNewMemberAadhar('');
        setNewMemberEmailUser('');
      })
      .catch(() => toast.error('❌ Error adding member.'));
  };

  const handleEditMember = (member) => {
    setIsEditing(true);
    setEditingAadhar(member.aadhar_number);
    setNewMemberName(member.name);
    setNewMemberEmailUser(member.email.split('@')[0]);
    setNewMemberAadhar(member.aadhar_number);
  };

  const handleUpdateMember = () => {
    const fullEmail = `${newMemberEmailUser}@gmail.com`;
    const emailPattern = /^[a-zA-Z0-9._%+-]+$/;

    if (
      !newMemberName ||
      newMemberAadhar.length !== 12 ||
      !emailPattern.test(newMemberEmailUser)
    ) {
      toast.warning('⚠️ Enter valid name, 12-digit Aadhar, and email username.');
      return;
    }

    axios
      .put(`http://127.0.0.1:8000/api/update-member/${editingAadhar}/`, {
        family_id: familyId,
        name: newMemberName,
        aadhar_number: newMemberAadhar,
        email: fullEmail,
      })
      .then((response) => {
        toast.success('✅ Member updated.');
        setMembers((prev) =>
          prev.map((m) => (m.aadhar_number === editingAadhar ? response.data : m))
        );
        setIsEditing(false);
        setEditingAadhar(null);
        setNewMemberName('');
        setNewMemberAadhar('');
        setNewMemberEmailUser('');
      })
      .catch(() => toast.error('❌ Error updating member.'));
  };

  const handleDeleteMember = (aadharNumber) => {
    axios
      .delete(`http://127.0.0.1:8000/api/delete-member/${aadharNumber}/`)
      .then(() => {
        toast.success('✅ Member deleted.');
        setMembers((prev) => prev.filter((m) => m.aadhar_number !== aadharNumber));
      })
      .catch(() => toast.error('❌ Error deleting member.'));
  };

  return (
    <div className="add-family-and-member">
      <ToastContainer />
      <h1>𝐀𝐝𝐝 𝐅𝐚𝐦𝐢𝐥𝐲 & 𝐌𝐞𝐦𝐛𝐞𝐫𝐬</h1>

      <div className={`add-family-member-container ${familyId.length > 2 ? 'active' : ''}`}>
        <div className={`add-family ${familyId.length > 2 ? 'shrink' : ''}`}>
          <h2>𝘼𝙙𝙙 𝙉𝙚𝙬 𝙁𝙖𝙢𝙞𝙡𝙮</h2>

          <div className="input-with-icon">
            <FaIdCard className="icon" />
            <input
              type="text"
              placeholder="Family ID"
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              className="input-field"
              disabled={isEditing}
            />
          </div>

          <div className="input-with-icon">
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="input-field select-field"
              disabled={isEditing}
            >
              <option value="">Select Area</option>
              {areas.map((areaItem, index) => (
                <option key={index} value={areaItem}>{areaItem}</option>
              ))}
            </select>
          </div>

          {!isFamilyEditing && members.length > 0 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleEditFamily} className="edit-family-button">Edit Family</button>
              <button onClick={handleDeleteFamily} className="delete-family-button">Delete Family</button>
            </div>
          )}

          {isFamilyEditing && (
            <>
              <button onClick={handleUpdateFamily} className="update-family-button">Update Family</button>
              <button onClick={() => {
                setIsFamilyEditing(false);
                setOriginalFamilyId('');
                setFamilyId('');
                setArea('');
              }} className="cancel-edit-button">Cancel</button>
            </>
          )}

          {!isFamilyEditing && (
            <button onClick={handleAddFamily} className="add-family-button">
              <FaPlus style={{ marginRight: '8px' }} /> Add Family
            </button>
          )}
        </div>

        <div className={`add-family-member ${familyId.length > 2 ? 'visible' : 'hidden'}`}>
          <h2>{isEditing ? '✏️ Edit Member' : `𝘼𝙙𝙙 𝙈𝙚𝙢𝙗𝙚𝙧 𝙩𝙤 𝙁𝙖𝙢𝙞𝙡𝙮: ${familyId}`}</h2>

          <div className="input-with-icon">
            <FaUser className="icon" />
            <input
              type="text"
              placeholder="Enter Member Name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="input-with-icon">
            <FaIdCard className="icon" />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter Aadhar Number (12 digits)"
              value={newMemberAadhar}
              onChange={(e) => setNewMemberAadhar(e.target.value.replace(/\D/g, ''))}
              className="input-field"
              maxLength="12"
              disabled={isEditing}
            />
          </div>

          <div className="input-with-icon email-field">
            <FaEnvelope className="icon" />
            <input
              type="text"
              placeholder="Email username (e.g., john.doe)"
              value={newMemberEmailUser}
              onChange={(e) => setNewMemberEmailUser(e.target.value)}
              className="input-field"
            />
            <small className="email-hint">Email will be: <strong>@gmail.com</strong></small>
          </div>

          <button onClick={isEditing ? handleUpdateMember : handleAddMember} className="add-member-button">
            <FaPlus style={{ marginRight: '8px' }} /> {isEditing ? 'Update Member' : 'Add Member'}
          </button>

          {isEditing && (
            <button onClick={() => {
              setIsEditing(false);
              setEditingAadhar(null);
              setNewMemberName('');
              setNewMemberAadhar('');
              setNewMemberEmailUser('');
            }} className="cancel-edit-button">Cancel Edit</button>
          )}
        </div>
      </div>

      {familyId && members.length > 0 && (
        <div className="family-members-list fade-in">
          <div className="table-header">
            <h3>Members of Family {familyId}</h3>
            <button onClick={fetchFamilyMembers} className="reload-button">
              <FiRefreshCw style={{ marginRight: '6px' }} /> Reload
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Aadhar</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.aadhar_number}>
                  <td>{member.name}</td>
                  <td>{member.aadhar_number}</td>
                  <td>{member.email || 'N/A'}</td>
                  <td>
                    <button onClick={() => handleEditMember(member)} className="edit-button">Edit</button>
                    <button onClick={() => handleDeleteMember(member.aadhar_number)} className="delete-button">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AddFamily;
