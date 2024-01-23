import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/login";
import Register from "./components/register";
import News from "./components/News";
import CreationDeGroupe from "./components/CreationDeGroupe";
import MyMap from "./components/UserLocationMarker";
import { useAuth } from "./components/AuthContext";
import Layout from "./components/Layout";
import GroupList from "./components/GroupList";
import GroupRequests from "./components/GroupRequests";
import MyGroup from "./components/MyGroup";
import UserGroups from "./components/UserGroups";
import EditGroupForm from "./components/EditGroupForm";
import EditProfile from "./components/EditProfile";

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<News />} />
          <Route
            path="/login"
            element={
              !isAuthenticated ? <Login /> : <Navigate to="/lesgroupes" />
            }
          />
          <Route
            path="/register"
            element={
              !isAuthenticated ? <Register /> : <Navigate to="/lesgroupes" />
            }
          />
          <Route
            path="/creationdegroupe"
            element={
              isAuthenticated ? <CreationDeGroupe /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/lesgroupes"
            element={isAuthenticated ? <GroupList /> : <Navigate to="/login" />}
          />
          <Route
            path="/map"
            element={isAuthenticated ? <MyMap /> : <Navigate to="/login" />}
          />

          <Route
            path="/grouprequests"
            element={
              isAuthenticated ? <GroupRequests /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/mygroup"
            element={isAuthenticated ? <MyGroup /> : <Navigate to="/login" />}
          />

          <Route
            path="/usergroups"
            element={
              isAuthenticated ? <UserGroups /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/editgroup/:groupId"
            element={
              isAuthenticated ? <EditGroupForm /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/editprofile"
            element={
              isAuthenticated ? <EditProfile /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
