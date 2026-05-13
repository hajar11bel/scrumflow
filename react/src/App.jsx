import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Backlog from "./pages/Backlog";
import Sprints from "./pages/Sprints";
import Tasks from "./pages/Tasks";
import Members from "./pages/Members";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route element={<RoleRoute allowedRoles={["PRODUCT_OWNER", "SCRUM_MASTER"]} />}>
                        <Route path="/projects" element={<Projects />} />
                    </Route>

                    <Route element={<RoleRoute allowedRoles={["PRODUCT_OWNER"]} />}>
                        <Route path="/backlog" element={<Backlog />} />
                    </Route>

                    <Route element={<RoleRoute allowedRoles={["SCRUM_MASTER"]} />}>
                        <Route path="/sprints" element={<Sprints />} />
                        <Route path="/members" element={<Members />} />
                    </Route>

                    <Route element={<RoleRoute allowedRoles={["DEVELOPER", "SCRUM_MASTER"]} />}>
                        <Route path="/tasks" element={<Tasks />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;




