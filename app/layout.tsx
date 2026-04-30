import type { Metadata } from "next"
import { Bebas_Neue, Archivo, Archivo_Narrow, JetBrains_Mono } from "next/font/google"
import "./globals.css"

// Brand typography — matches the Claude Design system
const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  display: "swap",
})

const archivo = Archivo({
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
})

const archivoNarrow = Archivo_Narrow({
  weight: ["500", "600", "700"],
  variable: "--font-archivo-narrow",
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Tiro a Puerta Challenge",
  description: "La quiniela del Mundial 2026. Un tiro. Un día. Sobrevive.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${bebasNeue.variable} ${archivo.variable} ${archivoNarrow.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0B0D18] text-white">
        {children}
      </body>
    </html>
  )
}
