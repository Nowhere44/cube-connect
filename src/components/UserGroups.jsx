import React, { useEffect, useState } from "react";
import EditGroupForm from "./EditGroupForm"; // Import the EditGroupForm component
import { useNavigate } from "react-router-dom";

const UserGroups = () => {
  const [createdGroups, setCreatedGroups] = useState([]);
  const [memberGroups, setMemberGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState(null); // State for the group being edited
  const [requestorId, setRequestorId] = useState(null); // State for the current user's ID

  const navigate = useNavigate();

  console.log("requestorId", requestorId);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setRequestorId(userId);
    } else {
      console.error("No userId found in localStorage");
    }
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/user/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCreatedGroups(data.createdGroups);
        setMemberGroups(data.memberGroups);
      } else {
        throw new Error("Failed to fetch groups");
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      // Consider setting an error state and displaying it in the UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleGroupUpdate = async (groupId, updatedGroup) => {
    try {
      const response = await fetch(`http://localhost:5000/group/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedGroup),
      });

      if (response.ok) {
        console.log("Group updated successfully");
        await fetchGroups();
        setEditingGroup(null);
      } else {
        console.error("Failed to update group");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleGroupDelete = async (groupId) => {
    try {
      const response = await fetch(`http://localhost:5000/group/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        console.log("Group deleted successfully");
        setCreatedGroups(
          createdGroups.filter((group) => group.group_id !== groupId)
        );
        setMemberGroups(
          memberGroups.filter((group) => group.group_id !== groupId)
        );
        setEditingGroup(null);
      } else {
        console.error("Failed to delete group");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteMember = async (groupId, memberId) => {
    if (!requestorId) {
      console.error("No requestorId available for operation");
      return;
    }

    if (memberId.toString() === requestorId) {
      alert("You cannot remove yourself as an admin.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/group/${groupId}/member/${memberId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("response fetch menbers", response);
      if (response.ok) {
        console.log("Member removed successfully");
        const updatedGroups = createdGroups.map((group) => {
          if (group.group_id === groupId) {
            return {
              ...group,
              members: group.members.filter(
                (member) => member.user_id !== memberId
              ),
            };
          }
          return group;
        });
        setCreatedGroups(updatedGroups);
        await fetchGroups();
      } else {
        console.error("Failed to remove member");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEditGroup = (group) => {
    console.log("Selected group for editing:", group);
    setEditingGroup(group);
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="text-white">
      {editingGroup ? (
        <EditGroupForm
          group={editingGroup} // Pass the entire group object
          onSave={handleGroupUpdate}
          onDeleteGroup={handleGroupDelete}
          onDeleteMember={handleDeleteMember}
          onCancel={() => setEditingGroup(null)}
          requestorId={requestorId}
        />
      ) : (
        <>
          <h2>Your Created Groups</h2>
          {createdGroups.length > 0 ? (
            createdGroups.map((group) => (
              <div key={group.group_id}>
                {group.group_name}
                <button onClick={() => handleEditGroup(group)}>Edit</button>
              </div>
            ))
          ) : (
            <p>No groups created.</p>
          )}

          <h2>Groups You Are a Member Of</h2>
          {memberGroups.length > 0 ? (
            memberGroups.map((group) => (
              <div key={group.group_id}>{group.group_name}</div>
            ))
          ) : (
            <p>No membership groups.</p>
          )}
        </>
      )}
    </div>
  );
};

export default UserGroups;
