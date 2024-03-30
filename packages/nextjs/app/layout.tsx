import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Web3Provider from "./Web3Provider";
import "./globals.css";

const roboto = Roboto({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Web3 Next App",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className={roboto.className}>
				<main className="bg-gray-900 flex min-h-screen flex-col items-center justify-center">
					<Web3Provider>{children}</Web3Provider>
				</main>
			</body>
		</html>
	);
}
