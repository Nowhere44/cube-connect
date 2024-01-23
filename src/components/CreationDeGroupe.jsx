import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Adjust the import path as needed
import RotatingCube from "./RotatingCube";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

const fetcher = (url) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  }).then((res) => res.json());

const CreationDeGroupe = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { data: cities } = useSWR("http://localhost:5000/cities", fetcher);
  const { data: gameGenres } = useSWR(
    "http://localhost:5000/game_genres",
    fetcher
  );
  const { data: gameModes } = useSWR(
    "http://localhost:5000/game_modes",
    fetcher
  );
  const { data: gamePlatforms } = useSWR(
    "http://localhost:5000/game_platforms",
    fetcher
  );
  const { data: communityTypes } = useSWR(
    "http://localhost:5000/community_types",
    fetcher
  );

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedPreferences, setSelectedPreferences] = useState({
    gameGenres: [],
    gameModes: [],
    gamePlatforms: [],
    communityTypes: [],
    skillLevels: [],
    languages: [],
  });

  const skillLevels = ["Beginner", "Intermediate", "Expert", "Pro", "Amateur"];
  const languages = ["English", "French", "Spanish", "German", "Chinese"];

  const togglePreference = (category, name) => {
    setSelectedPreferences((prev) => {
      const currentPreferences = prev[category];
      if (currentPreferences.includes(name)) {
        return {
          ...prev,
          [category]: currentPreferences.filter((item) => item !== name),
        };
      } else {
        return { ...prev, [category]: [...currentPreferences, name] };
      }
    });
  };
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    // Ensure groupPreferences are structured as expected by the server
    const groupPreferences = {
      languages: selectedPreferences.languages, // Assuming languages are stored here
      skillLevels: selectedPreferences.skillLevels, // Assuming skill levels are stored here
      gameGenres: selectedPreferences.gameGenres.map((genre) => genre.genre_id), // Map to required format
      gameModes: selectedPreferences.gameModes.map((mode) => mode.mode_id), // Map to required format
      gamePlatforms: selectedPreferences.gamePlatforms.map(
        (platform) => platform.platform_id
      ), // Map to required format
      communityTypes: selectedPreferences.communityTypes.map(
        (type) => type.type_id
      ), // Map to required format
    };

    const groupData = {
      groupName: data.groupName,
      groupPicture: data.groupPicture,
      groupDescription: data.groupDescription,
      cityId: selectedCity ? selectedCity.city_id : null,
      groupPreferences, // Updated structure
    };

    console.log(groupData); // For debugging

    try {
      const response = await fetch("http://localhost:5000/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        navigate("/lesgroupes");
      } else {
        console.error("Erreur lors de la création du groupe");
      }
    } catch (err) {
      console.error("Erreur lors de lenvoi du formulaire:", err);
    }
  };

  if (
    !cities ||
    !gameGenres ||
    !gameModes ||
    !gamePlatforms ||
    !communityTypes ||
    !skillLevels ||
    !languages
  ) {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex h-screen">
      <div className="m-auto w-full lg:w-1/2 lg:mr-12">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Créer un nouveau groupe
          </h2>

          {/* Group Name */}
          <div className="mb-4">
            <label
              htmlFor="groupName"
              className="block text-sm font-semibold mb-2 text-white"
            >
              Nom du groupe
            </label>
            <input
              type="text"
              id="groupName"
              {...register("groupName", { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
            {errors.groupName && (
              <p className="text-red-500">Le nom du groupe est requis.</p>
            )}
          </div>

          {/* Group Picture */}
          <div className="mb-4">
            <label
              htmlFor="groupPicture"
              className="block text-sm font-semibold mb-2 text-white"
            >
              Photo de profil du groupe
            </label>
            <input
              type="text"
              id="groupPicture"
              {...register("groupPicture")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          {/* Group Description */}
          <div className="mb-4">
            <label
              htmlFor="groupDescription"
              className="block text-sm font-semibold mb-2 text-white"
            >
              Description du groupe
            </label>
            <textarea
              id="groupDescription"
              {...register("groupDescription")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
              rows="4"
            ></textarea>
          </div>

          {/* City Autocomplete */}
          <div className="mb-4">
            <Autocomplete
              options={cities || []}
              getOptionLabel={(option) => option.city_name}
              onChange={(event, value) => setSelectedCity(value)}
              renderInput={(params) => <TextField {...params} label="City" />}
            />
          </div>

          {/* Preference Sections */}
          {[
            {
              label: "Game Genres",
              data: gameGenres,
              category: "gameGenres",
              keyProp: "genre_id",
              displayProp: "genre_name",
            },
            {
              label: "Game Modes",
              data: gameModes,
              category: "gameModes",
              keyProp: "mode_id",
              displayProp: "mode_name",
            },
            {
              label: "Game Platforms",
              data: gamePlatforms,
              category: "gamePlatforms",
              keyProp: "platform_id",
              displayProp: "platform_name",
            },
            {
              label: "Community Types",
              data: communityTypes,
              category: "communityTypes",
              keyProp: "type_id",
              displayProp: "type_name",
            },
            {
              label: "Skill Levels",
              data: skillLevels,
              category: "skillLevels",
            },
            {
              label: "Languages",
              data: languages,
              category: "languages",
            },
          ].map(({ label, data, category, keyProp, displayProp }) => (
            <div key={category} className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-white">
                {label}
              </label>
              <div className="flex flex-wrap gap-2">
                {data.map((item, index) => (
                  <button
                    key={keyProp ? item[keyProp] : index} // Use index as key for skill levels and languages
                    type="button"
                    onClick={() =>
                      togglePreference(
                        category,
                        displayProp ? item[displayProp] : item
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedPreferences[category].includes(
                        displayProp ? item[displayProp] : item
                      )
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-300 text-gray-800"
                    }`}
                  >
                    {displayProp ? item[displayProp] : item}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition duration-300"
          >
            Créer le groupe
          </button>
        </form>
      </div>
    </div>
  );
};
export default CreationDeGroupe;
