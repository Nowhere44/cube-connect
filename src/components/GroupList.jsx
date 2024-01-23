// GroupList.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { formatDistanceToNow } from "date-fns";

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch("http://localhost:5000/groups", {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        if (response.ok) {
          const data = await response.json();
          setGroups(data);
        } else {
          console.error("Error fetching groups");
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchGroups();
  }, []);

  const sendRequest = async (groupId) => {
    try {
      const response = await fetch("http://localhost:5000/groups/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ groupId }),
      });
      if (response.ok) {
        alert("Request sent successfully");
        // Update the group's status in the state
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group.group_id === groupId ? { ...group, requestSent: true } : group
          )
        );
      } else {
        alert("Error sending request");
      }
    } catch (error) {
      console.error("Error sending request", error);
      alert("Error sending request");
    }
  };

  const getRelativeTime = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const parseLanguages = (languagesString) => {
    const matches = languagesString.match(/[^{}]+(?=\})/g);
    if (matches && matches[0]) {
      return matches[0].split(",");
    }
    return [];
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group.group_id}
            className="bg-black rounded-lg shadow-lg overflow-hidden"
          >
            <img
              src={group.group_picture || "default-image.jpg"}
              alt={group.group_name}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h2 className="text-2xl font-bold text-white">
                {group.group_name}
              </h2>
              {/* Display languages */}
              <div className="mt-2">
                {group.languages && group.languages.length > 0 && (
                  <p className="text-white">
                    Languages: {parseLanguages(group.languages).join(", ")}
                  </p>
                )}
              </div>
              <p className="text-sm text-white">
                {getRelativeTime(group.creation_date)}
              </p>
              <p className="mt-2 text-white">{group.group_description}</p>
              {group.is_admin && (
                <span className="text-white font-bold">Owner</span>
              )}
              {group.is_member && (
                <span className="text-white font-bold">Member</span>
              )}
              {group.requestSent && (
                <span className="text-white font-bold">Request Pending</span>
              )}
              {!group.is_admin && !group.is_member && !group.requestSent && (
                <button
                  onClick={() => sendRequest(group.group_id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
                >
                  Join Group
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupList;
