import RoleLayout from "@/components/RoleLayout";

export default function BacklogSectionLayout({ children }) {
    return <RoleLayout allowedRoles={["PRODUCT_OWNER"]}>{children}</RoleLayout>;
}
