import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/index.css";
import "@/styles/App.css";
import Providers from "./providers";

export const metadata = {
    title: "ScrumFlow",
    description: "ScrumFlow — workspace agile",
};

export default function RootLayout({ children }) {
    return (
        <html lang="fr">
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
                />
            </head>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
