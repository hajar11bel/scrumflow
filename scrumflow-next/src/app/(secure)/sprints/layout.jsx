import RoleLayout from "@/components/RoleLayout";

export default function SprintsSectionLayout({ children }) {
    return <RoleLayout allowedRoles={["SCRUM_MASTER"]}>{children}</RoleLayout>;
}
