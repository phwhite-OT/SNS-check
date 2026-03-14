import './globals.css'

export const metadata = {
    title: 'Time = Asset Dashboard',
    description: 'Convert your lost time to real assets.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            <body>
                {children}
            </body>
        </html>
    )
}
