import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EditGroupForm = ({
  onSave,
  onDeleteGroup,
  onDeleteMember,
  onCancel,
  requestorId,
  group,
}) => {
  const [groupName, setGroupName] = useState(group.group_name);
  const [groupDescription, setGroupDescription] = useState(
    group.group_description
  );
  const [cityId, setCityId] = useState(group.city_id);
  const [cities, setCities] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`http://localhost:5000/cities`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        setError(error.message);
      }
    };

    const fetchMembers = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/group/${group.group_id}/members`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch members: ${response.status}`);
        }
        const data = await response.json();
        setMembers(data.members);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchCities();
    fetchMembers();
  }, [group.group_id]);

  if (!groupName || !groupDescription || cityId === undefined) {
    return <div>Loading group details...</div>;
  }

  const handleSave = async () => {
    try {
      await onSave(group.group_id, { groupName, groupDescription, cityId });
      navigate("/usergroups");
    } catch (error) {
      setError("Failed to save group");
    }
  };

  if (!group) {
    return <div>Loading group details...</div>;
  }

  return (
    <div className="text-white">
      <input
        className="bg-gray-800 p-2 text-white"
        type="text"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />

      <textarea
        className="bg-gray-800 p-2 text-white"
        value={groupDescription}
        onChange={(e) => setGroupDescription(e.target.value)}
      />

      <select
        className="bg-gray-800 p-2 text-white"
        value={cityId}
        onChange={(e) => setCityId(e.target.value)}
      >
        {cities.map((city) => (
          <option key={city.city_id} value={city.city_id}>
            {city.city_name}
          </option>
        ))}
      </select>

      <h3>Members:</h3>
      {members.map((member) => (
        <div key={member.user_id}>
          {member.name}
          {member.user_id !== requestorId && (
            <button
              className="bg-red-500 text-white p-1"
              onClick={() => onDeleteMember(group.group_id, member.user_id)}
            >
              Remove
            </button>
          )}
        </div>
      ))}

      <button className="bg-blue-500 text-white p-2" onClick={handleSave}>
        Save
      </button>
      <button
        className="bg-red-500 text-white p-2"
        onClick={() => onDeleteGroup(group.group_id)}
      >
        Delete Group
      </button>
      <button className="bg-gray-500 text-white p-2" onClick={onCancel}>
        Cancel
      </button>
      {error && <div>{error}</div>}
    </div>
  );
};

export default EditGroupForm;
