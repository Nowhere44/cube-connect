import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet/dist/leaflet.css";
import { useAuth } from "./AuthContext";
import L from "leaflet";
import caveImage from "../assets/8193275.png";
import redIconPosition from "../assets/pngimg.com_-_gps_PNG12.png";
import { useMap } from "react-leaflet";
import "leaflet-geosearch/dist/geosearch.css";

const LocateControl = ({ position }) => {
  const map = useMap();

  const handleClick = () => {
    position && map.flyTo(position, map.getZoom());
  };

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return (
    <button
      onClick={handleClick}
      style={{ position: "absolute", bottom: "50px", right: "10px" }}
    >
      Retour à ma position
    </button>
  );
};

const SearchControl = () => {
  const map = useMap();

  useEffect(() => {
    const searchControl = new GeoSearchControl({
      provider: new OpenStreetMapProvider(),
      style: "bar",
      autoComplete: true,
      autoCompleteDelay: 250,
      showMarker: true,
      showPopup: false,
      marker: {
        icon: new L.Icon({
          iconUrl: redIconPosition,
          iconSize: [60, 60],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      },
    });

    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);

  return null;
};

const MyMap = () => {
  const [userPosition, setUserPosition] = useState(null);
  const [groups, setGroups] = useState([]);
  const { isAuthenticated } = useAuth();

  const mapRef = useRef();

  const addGeoSearchControl = (map) => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: "bar",
      autoComplete: true,
      autoCompleteDelay: 250,
      showMarker: true,
      showPopup: false,
      marker: {
        icon: new L.Icon({
          iconUrl: redIconPosition,
          iconSize: [60, 60],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      },
    });

    map.addControl(searchControl);
    const searchBarElement = document.querySelector(".leaflet-bar");
    if (searchBarElement) {
      searchBarElement.classList.add(
        "bg-red-400",
        "p-2",
        "rounded-lg",
        "shadow-md",
        "border",
        "border-gray-300"
      );
    }
  };

  useEffect(() => {
    isAuthenticated && fetchUserLocation() && fetchGroupLocations();
  }, [isAuthenticated]);

  const fetchUserLocation = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in local storage");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/user/location", {
        headers: { Authorization: "Bearer " + token },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          setUserPosition({
            position: [parseFloat(data.latitude), parseFloat(data.longitude)],
            iconUrl: data.profile_picture || "default-user-icon.jpg",
          });
        } else {
          // Handle case where latitude and longitude are not found
          console.error("Latitude and longitude data not found");
          setUserPosition(null);
        }
      } else {
        // Handle HTTP errors
        console.error(`HTTP error! Status: ${response.status}`);
        setUserPosition(null);
      }
    } catch (error) {
      console.error("Failed to fetch user location:", error);
    }
  };

  const fetchGroupLocations = async () => {
    const response = await fetch("http://localhost:5000/groups/locations", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    if (response.ok) {
      const data = await response.json();
      setGroups(
        data.map((group) => ({
          ...group,
          iconUrl: group.group_picture || "default-group-icon.jpg",
        }))
      );
    } else {
      console.error("Failed to fetch group locations");
    }
  };

  return (
    <MapContainer
      whenCreated={(mapInstance) => {
        mapRef.current = mapInstance;
        addGeoSearchControl(mapInstance);
      }}
      center={userPosition?.position || [51.505, -0.09]} // Use optional chaining to avoid errors
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <SearchControl />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {userPosition?.position && (
        <Marker
          position={userPosition.position}
          icon={
            new L.Icon({
              iconUrl: userPosition.iconUrl,
              iconSize: [60, 60],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })
          }
        >
          <Popup>Vous êtes ici</Popup>
        </Marker>
      )}

      {groups.map((group) => (
        <Marker
          key={group.group_id}
          position={[group.latitude, group.longitude]}
          icon={
            new L.Icon({
              iconUrl: group.iconUrl,
              iconSize: [60, 60],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })
          }
        >
          <Popup>
            {group.group_name}
            <br />
            {group.description}
          </Popup>
        </Marker>
      ))}

      <LocateControl position={userPosition?.position} />
    </MapContainer>
  );
};

export default MyMap;
