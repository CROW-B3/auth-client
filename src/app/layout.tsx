import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";
import '@b3-crow/ui-kit/styles.css';

const sora = Sora({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600"],
	variable: "--font-sora",
	display: "swap",
});

export const metadata: Metadata = {
	title: "CROW - Sign In",
	description: "Unifying Web, CCTV, and Social signals",
};

export default function RootLayout({
	children,
	
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<head>
				<link rel="icon" href="/favicon.webp" type="image/webp"></link>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
			</head>
			<body className={`${sora.variable} antialiased`}>
				<QueryProvider>
					<Toaster
						position="bottom-right"
						toastOptions={{
							duration: 4000,
							style: {
								background: "#1a1a1a",
								color: "#fff",
								border: "1px solid rgba(139, 92, 246, 0.3)",
								borderRadius: "8px",
							},
							success: {
								iconTheme: {
									primary: "#8b5cf6",
									secondary: "#fff",
								},
							},
							error: {
								iconTheme: {
									primary: "#ef4444",
									secondary: "#fff",
								},
							},
						}}
					/>
					{children}
				</QueryProvider>
			</body>
		</html>
	);
}
