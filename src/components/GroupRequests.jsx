import React, { useState, useEffect } from "react";

const GroupRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "http://localhost:5000/groups/manage-requests",
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }
        const data = await response.json();
        setRequests(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleRequest = async (requestId, accept) => {
    try {
      const response = await fetch(
        "http://localhost:5000/groups/respond-to-request",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({ requestId, accept }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to respond to request");
      }
      setRequests(
        requests.filter((request) => request.request_id !== requestId)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <p>Loading requests...</p>;
  }

  if (error) {
    return <p>There was an error: {error}</p>;
  }

  if (requests.length === 0) {
    return <p>No requests to manage.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-4">
        Gérer les Demandes de Groupe
      </h2>
      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={`${request.request_id}-${request.group_id}`}
            className="bg-white shadow-lg rounded-lg p-4 flex justify-between items-center"
          >
            <p className="text-lg font-semibold">
              Demande de{" "}
              <span className="text-blue-600">{request.requester_name}</span>{" "}
              pour rejoindre{" "}
              <span className="text-blue-600">{request.group_name}</span>
            </p>
            <div>
              <button
                onClick={() => handleRequest(request.request_id, true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-l"
              >
                Accepter
              </button>
              <button
                onClick={() => handleRequest(request.request_id, false)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-r"
              >
                Refuser
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupRequests;
