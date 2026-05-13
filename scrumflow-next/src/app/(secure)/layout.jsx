import ProtectedLayout from "@/components/ProtectedLayout";

export default function SecureLayout({ children }) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
