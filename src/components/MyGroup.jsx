import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import Chat from "./Chat";

const MyGroup = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const response = await fetch("http://localhost:5000/groups/my-group", {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        if (response.ok) {
          const groupsData = await response.json();
          setGroups(groupsData);
        } else {
          console.error("Error fetching group details");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchMyGroups();
  }, []);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
  };

  return (
    <div className="container mx-auto p-4 bg-black text-white">
      {selectedGroup ? (
        <Chat groupId={selectedGroup.group_id} />
      ) : groups.length > 0 ? (
        groups.map((group, index) => (
          <div
            key={index}
            onClick={() => handleGroupSelect(group)}
            className="mb-8 p-4 bg-gray-800 rounded-lg shadow-xl"
          >
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              {group.group_name}
            </h2>
            <img
              src={group.group_picture}
              alt={group.group_name}
              className="w-full h-auto rounded-md mb-2"
            />
            <p className="mb-4">{group.group_description}</p>
            <h3 className="text-xl font-semibold mb-2">Members:</h3>
            <ul className="list-disc list-inside">
              {group.members.map((member, memberIndex) => (
                <li key={memberIndex} className="mb-1">
                  <span className="font-semibold">
                    {member.name} {member.surname}
                  </span>{" "}
                  -{" "}
                  <span
                    className={`text-sm ${
                      member.role === "admin"
                        ? "text-red-500"
                        : "text-green-400"
                    }`}
                  >
                    {member.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>Loading group information...</p>
      )}
    </div>
  );
};

export default MyGroup;
