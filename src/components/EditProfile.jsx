import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router-dom";

const fetcher = (url) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  }).then((res) => res.json());

export default function EditProfile() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();
  const { data: cities } = useSWR("http://localhost:5000/cities", fetcher);
  const { data: gamePlatforms } = useSWR(
    "http://localhost:5000/game_platforms",
    fetcher
  );
  const { data: gameGenres } = useSWR(
    "http://localhost:5000/game_genres",
    fetcher
  );
  const { data: gameModes } = useSWR(
    "http://localhost:5000/game_modes",
    fetcher
  );
  const { data: communityTypes } = useSWR(
    "http://localhost:5000/community_types",
    fetcher
  );

  const navigate = useNavigate();

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
    setSelectedPreferences((prevPreferences) => {
      if (category === "skillLevels") {
        return {
          ...prevPreferences,
          [category]: prevPreferences[category][0] === name ? [] : [name],
        };
      } else if (category === "languages") {
        const currentLanguages = prevPreferences[category] || [];
        const isAlreadySelected = currentLanguages.includes(name);
        return {
          ...prevPreferences,
          [category]: isAlreadySelected
            ? currentLanguages.filter((item) => item !== name)
            : [...currentLanguages, name],
        };
      } else {
        const currentPreferences = prevPreferences[category] || [];
        const isAlreadySelected = currentPreferences.includes(name);
        return {
          ...prevPreferences,
          [category]: isAlreadySelected
            ? currentPreferences.filter((item) => item !== name)
            : [...currentPreferences, name],
        };
      }
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:5000/user/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        const userData = await response.json();

        if (cities) {
          setSelectedCity(
            cities.find((c) => c.city_id === userData.profile.city_id) || null
          );
        }

        setValue("firstName", userData.profile.name);
        setValue("lastName", userData.profile.surname);
        setValue("email", userData.profile.email);
        setValue("username", userData.profile.nickname);
        setValue("profilePicture", userData.profile.profile_picture);
        setSelectedCity(userData.profile.city_id);

        const parsedSkillLevel = userData.preferences.skill_level
          ? userData.preferences.skill_level.replace(/[{}]/g, "").split(",")
          : [];
        const parsedLanguages = userData.preferences.language
          ? userData.preferences.language.replace(/[{}]/g, "").split(",")
          : [];

        setSelectedPreferences({
          gameGenres: userData.preferences.game_genres || [],
          gameModes: userData.preferences.game_modes || [],
          gamePlatforms: userData.preferences.game_platforms || [],
          communityTypes: userData.preferences.community_types || [],
          skillLevels: parsedSkillLevel,
          languages: parsedLanguages,
        });
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchUserData();
  }, [setValue, cities]);

  const onSubmit = async (data) => {
    const updatedData = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      username: data.username,
      city_id: selectedCity,
      profile_picture: data.profilePicture,
      preferences: {
        gameGenres: selectedPreferences.gameGenres,
        gameModes: selectedPreferences.gameModes,
        skillLevel: selectedPreferences.skillLevels,
        gamePlatforms: selectedPreferences.gamePlatforms,
        communityTypes: selectedPreferences.communityTypes,
        languages: selectedPreferences.languages,
      },
    };

    try {
      const response = await fetch("http://localhost:5000/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      console.log("Profile updated successfully");
      navigate("/lesgroupes");
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  if (!cities) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="form">
        {/* Basic information form fields */}
        <div>
          <label htmlFor="firstName">First Name</label>
          <input {...register("firstName", { required: true })} />
          {errors.firstName && <span>This field is required</span>}
        </div>
        <div>
          <label htmlFor="lastName">Last Name</label>
          <input {...register("lastName", { required: true })} />
          {errors.lastName && <span>This field is required</span>}
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input {...register("email", { required: true })} type="email" />
          {errors.email && <span>This field is required</span>}
        </div>
        <div>
          <label htmlFor="username">Username</label>
          <input {...register("username", { required: true })} />
          {errors.username && <span>This field is required</span>}
        </div>
        <div>
          <label htmlFor="profilePicture">Profile Picture URL</label>
          <input {...register("profilePicture")} type="text" />
        </div>

        {/* City Autocomplete */}
        <Autocomplete
          id="city-autocomplete"
          options={cities || []}
          getOptionLabel={(option) => option?.city_name || ""}
          renderInput={(params) => <TextField {...params} label="City" />}
          onChange={(event, newValue) => {
            setSelectedCity(newValue);
          }}
          value={selectedCity}
          isOptionEqualToValue={(option, value) =>
            option?.city_id === value?.city_id
          }
        />
        {/* Preferences fields */}
        <div className="preferences">
          {/* Game Genres */}
          <div>
            <h3>Game Genres</h3>
            <div className="flex flex-wrap gap-2">
              {gameGenres?.map((genre, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    togglePreference("gameGenres", genre.genre_name)
                  }
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedPreferences.gameGenres.includes(genre.genre_name)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {genre.genre_name}
                </button>
              ))}
            </div>
          </div>

          {/* Game Modes */}
          <div>
            <h3>Game Modes</h3>
            <div className="flex flex-wrap gap-2">
              {gameModes?.map((mode, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => togglePreference("gameModes", mode.mode_name)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedPreferences.gameModes.includes(mode.mode_name)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {mode.mode_name}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Levels */}
          <div>
            <h3>Skill Levels</h3>
            <div className="flex flex-wrap gap-2">
              {skillLevels?.map((level, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => togglePreference("skillLevels", level)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedPreferences.skillLevels.includes(level)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* language */}
          <div>
            <h3>Language</h3>
            <div className="flex flex-wrap gap-2">
              {languages?.map((language, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => togglePreference("languages", language)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedPreferences.languages.includes(language)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* Game Platforms */}
          <div>
            <h3>Game Platforms</h3>
            <div className="flex flex-wrap gap-2">
              {gamePlatforms?.map((platform, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    togglePreference("gamePlatforms", platform.platform_name)
                  }
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedPreferences.gamePlatforms.includes(
                      platform.platform_name
                    )
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {platform.platform_name}
                </button>
              ))}
            </div>
          </div>

          {/* Community Types */}
          <div>
            <h3>Community Types</h3>
            <div className="flex flex-wrap gap-2">
              {communityTypes?.map((type, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    togglePreference("communityTypes", type.type_name)
                  }
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedPreferences.communityTypes.includes(type.type_name)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {type.type_name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
}
