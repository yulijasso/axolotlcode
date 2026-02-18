import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
    title: "Axolotl Code",
    description: "Cloud-based code editor powered by AI",
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en-US">
                <head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link
                        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
                        rel="stylesheet"
                    />
                    <link rel="shortcut icon" href="/favicons/favicon.ico" />
                    <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
                    <link rel="manifest" href="/manifest.json" />
                    <meta name="theme-color" content="#0d0d0d" />
                </head>
                <body>
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
