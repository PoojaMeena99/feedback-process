import "./globals.css";

export const metadata = {
  title: "Feedback Process Prototype",
  description: "Next.js prototype for feedback request workflow",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
