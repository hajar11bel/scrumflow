import RoleLayout from "@/components/RoleLayout";

export default function MembersSectionLayout({ children }) {
    return <RoleLayout allowedRoles={["SCRUM_MASTER"]}>{children}</RoleLayout>;
}
