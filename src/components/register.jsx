import { useForm } from "react-hook-form";
import useSWR from "swr";
import { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [selectedPreferences, setSelectedPreferences] = useState({
    gameGenres: [],
    gameModes: [],
    gamePlatforms: [],
    communityTypes: [],
    skillLevels: [],
    languages: [],
  });
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

  const [selectedCity, setSelectedCity] = useState("");

  const matchCity = (inputValue, item) => {
    return (
      item.city_name.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
    );
  };

  const skillLevels = ["Beginner", "Intermediate", "Expert", "Pro", "Amateur"];
  const languages = ["English", "French", "Spanish", "German", "Chinese"];

  const togglePreference = (category, name) => {
    setSelectedPreferences((prev) => {
      if (category === "skillLevels") {
        return { ...prev, [category]: [name] };
      } else {
        return {
          ...prev,
          [category]: prev[category].includes(name)
            ? prev[category].filter((item) => item !== name)
            : [...prev[category], name],
        };
      }
    });
  };

  const onSubmit = async (data) => {
    const userData = {
      first_name: data.firstName,
      last_name: data.lastName,
      gender: data.gender,
      username: data.username,
      email: data.email,
      password: data.password,
      city_id: selectedCity,
      profile_picture: data.profilePicture,
      preferences: selectedPreferences,
    };

    try {
      const response = await fetch("http://localhost:5000/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      await response.json();
      console.log("Registration successful");

      setSelectedPreferences({
        gameGenres: [],
        gameModes: [],
        gamePlatforms: [],
        communityTypes: [],
        skillLevels: [],
        languages: [],
      });
      setSelectedCity("");
      reset();
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  if (
    !cities ||
    !gameGenres ||
    !gameModes ||
    !gamePlatforms ||
    !communityTypes
  ) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="form">
        {/* First Name */}
        <div>
          <label htmlFor="firstName">First Name</label>
          <input {...register("firstName", { required: true })} />
          {errors.firstName && <span>This field is required</span>}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName">Last Name</label>
          <input {...register("lastName", { required: true })} />
          {errors.lastName && <span>This field is required</span>}
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-medium leading-6 text-white">
            Gender
          </label>
          <div className="mt-2">
            {["male", "female", "other"].map((gender) => (
              <label key={gender} className="inline-flex items-center mr-6">
                <input
                  type="radio"
                  {...register("gender", { required: true })}
                  value={gender}
                  className="form-radio text-indigo-600"
                />
                <span className="ml-2">
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <span className="text-red-500">This field is required</span>
          )}
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username">Username</label>
          <input {...register("username", { required: true })} />
          {errors.username && <span>This field is required</span>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email">Email</label>
          <input {...register("email", { required: true })} type="email" />
          {errors.email && <span>This field is required</span>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password">Password</label>
          <input
            {...register("password", { required: true })}
            type="password"
          />
          {errors.password && <span>This field is required</span>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            {...register("confirmPassword", { required: true })}
            type="password"
          />
          {errors.confirmPassword && <span>This field is required</span>}
        </div>

        {/* Profile Picture */}
        <div>
          <label htmlFor="profilePicture">Profile Picture URL</label>
          <input {...register("profilePicture")} type="text" />
        </div>

        {/* City Autocomplete */}
        <Autocomplete
          id="city-autocomplete"
          options={cities || []}
          getOptionLabel={(option) => option.city_name}
          renderInput={(params) => <TextField {...params} label="City" />}
          onChange={(event, newValue) => {
            setSelectedCity(newValue ? newValue.city_id : "");
          }}
          filterOptions={(options, state) => {
            return options.filter((option) =>
              matchCity(state.inputValue, option)
            );
          }}
        />
        {[
          { name: "Game Genres", data: gameGenres, category: "gameGenres" },
          { name: "Game Modes", data: gameModes, category: "gameModes" },
          {
            name: "Game Platforms",
            data: gamePlatforms,
            category: "gamePlatforms",
          },
          {
            name: "Community Types",
            data: communityTypes,
            category: "communityTypes",
          },
          { name: "Skill Levels", data: skillLevels, category: "skillLevels" },
          { name: "Languages", data: languages, category: "languages" },
        ].map(({ name, data, category }) => (
          <div key={name}>
            <h3 className="font-bold">{name}</h3>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(data) ? (
                data.map((item, index) => {
                  const text =
                    item.genre_name ||
                    item.mode_name ||
                    item.platform_name ||
                    item.type_name ||
                    item;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => togglePreference(category, text)} // Here we pass the name
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedPreferences[category].includes(text)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-300 text-gray-800"
                      }`}
                    >
                      {text}
                    </button>
                  );
                })
              ) : (
                <div>Data not available</div>
              )}
            </div>
          </div>
        ))}
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
