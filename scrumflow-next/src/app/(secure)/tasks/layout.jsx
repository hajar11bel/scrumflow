import RoleLayout from "@/components/RoleLayout";

export default function TasksSectionLayout({ children }) {
    return (
        <RoleLayout allowedRoles={["DEVELOPER", "SCRUM_MASTER"]}>
            {children}
        </RoleLayout>
    );
}
