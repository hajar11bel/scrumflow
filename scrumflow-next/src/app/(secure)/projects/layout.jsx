import RoleLayout from "@/components/RoleLayout";

export default function ProjectsSectionLayout({ children }) {
    return (
        <RoleLayout allowedRoles={["PRODUCT_OWNER", "SCRUM_MASTER"]}>
            {children}
        </RoleLayout>
    );
}
