import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/useAuth";
import { featureService } from "../services/featureService";
import { projectService } from "../services/projectService";
import { sprintService } from "../services/sprintService";
import { taskService } from "../services/taskService";
import DeveloperDashboard from "./dashboard/DeveloperDashboard";
import ProductOwnerDashboard from "./dashboard/ProductOwnerDashboard";
import ScrumMasterDashboard from "./dashboard/ScrumMasterDashboard";
import "../App.css";

function Dashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [stats, setStats] = useState({
        projects: 0,
        features: 0,
        activeSprints: 0,
        tasksTodo: 0,
        tasksInProgress: 0,
        tasksDone: 0,
    });

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const projects = await projectService.getAll();
                const allSprints = (await Promise.all(
                    projects.map((project) => sprintService.getByProject(project.id))
                )).flat();
                const allTasks = user?.role === "DEVELOPER"
                    ? await taskService.getByDeveloper(user.userId)
                    : await taskService.getAll();
                const allFeatures = (await Promise.all(
                    projects.map((project) => featureService.getByProject(project.id))
                )).flat();

                setStats({
                    projects: projects.length,
                    features: allFeatures.length,
                    activeSprints: allSprints.filter((sprint) => sprint.status === "ACTIVE").length,
                    tasksTodo: allTasks.filter((task) => task.status === "TODO").length,
                    tasksInProgress: allTasks.filter((task) => task.status === "IN_PROGRESS").length,
                    tasksDone: allTasks.filter((task) => task.status === "DONE").length,
                });
            } catch (error) {
                console.error("Erreur chargement dashboard :", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.userId) {
            loadDashboardData();
        }
    }, [user?.role, user?.userId]);

    const statCards = useMemo(() => {
        if (user?.role === "PRODUCT_OWNER") {
            return [
                { label: "Projets", value: stats.projects, sub: "suivi global", dot: "blue", path: "/projects" },
                { label: "User stories", value: stats.features, sub: "dans les backlogs", dot: "amber", path: "/backlog" },
                { label: "Sprints actifs", value: stats.activeSprints, sub: "en cours", dot: "green", path: "/projects" },
                { label: "Stories livrées", value: stats.tasksDone, sub: "tâches DONE", dot: "blue", path: "/backlog" },
            ];
        }

        if (user?.role === "SCRUM_MASTER") {
            return [
                { label: "Projets", value: stats.projects, sub: "à coordonner", dot: "blue", path: "/projects" },
                { label: "Sprints actifs", value: stats.activeSprints, sub: "pilotage équipe", dot: "green", path: "/sprints" },
                { label: "Tasks en cours", value: stats.tasksInProgress, sub: "charge actuelle", dot: "amber", path: "/tasks" },
                { label: "Tasks terminées", value: stats.tasksDone, sub: "déjà livrées", dot: "blue", path: "/tasks" },
            ];
        }

        return [
            { label: "Mes tasks TODO", value: stats.tasksTodo, sub: "à commencer", dot: "amber", path: "/tasks" },
            { label: "Mes tasks en cours", value: stats.tasksInProgress, sub: "focus actuel", dot: "blue", path: "/tasks" },
            { label: "Mes tasks DONE", value: stats.tasksDone, sub: "déjà livrées", dot: "green", path: "/tasks" },
            { label: "Sprints actifs", value: stats.activeSprints, sub: "contexte sprint", dot: "blue", path: "/tasks" },
        ];
    }, [stats, user?.role]);

    const completionPct = (stats.tasksDone + stats.tasksInProgress + stats.tasksTodo) === 0
        ? 0
        : Math.round((stats.tasksDone / (stats.tasksDone + stats.tasksInProgress + stats.tasksTodo)) * 100);

    const filteredStatCards = statCards.filter((card) =>
        card.label.toLowerCase().includes(search.toLowerCase()) ||
        card.sub.toLowerCase().includes(search.toLowerCase())
    );

    const dashboardProps = { loading, statCards: filteredStatCards, completionPct };

    return (
        <div className="layout">
            <Sidebar />

            <div className="main-content">
                <Navbar
                    pageTitle="Dashboard"
                    breadcrumb={`ScrumFlow · ${user?.role || "Workspace"}`}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Filtrer les indicateurs..."
                />

                <div className="page-content">

                    <div className="dash-header">
                        <div>
                            <h2 className="dash-title">Bonjour {user?.fullName || "Utilisateur"}</h2>
                            <span className="dash-subtitle">Vue {user?.role || "membre"} · Données en temps réel</span>
                        </div>
                    </div>

                    {user?.role === "PRODUCT_OWNER" && <ProductOwnerDashboard {...dashboardProps} />}
                    {user?.role === "SCRUM_MASTER" && <ScrumMasterDashboard {...dashboardProps} />}
                    {user?.role === "DEVELOPER" && <DeveloperDashboard {...dashboardProps} />}

                </div>
            </div>
        </div>
    );
}

export default Dashboard;