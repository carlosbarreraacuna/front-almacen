import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";

export const metadata: Metadata = {
  title: "POS Almacén - Sistema de Gestión",
  description: "Sistema de punto de venta y gestión de almacén",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
