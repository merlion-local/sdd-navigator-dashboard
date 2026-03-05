import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "SDD Navigator Dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <header className="header">
          <div className="header__inner">
            <h1 className="title">SDD Navigator</h1>
            <ThemeToggle />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
