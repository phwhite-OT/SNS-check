import './globals.css'

export const metadata = {
    title: 'Time = Asset Dashboard',
    description: 'Convert your lost time to real assets.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            <body>
                <div className="app-container">
                    <header className="header">
                        <div className="logo">⏳ Time = Asset</div>
                    </header>
                    <main className="main-content">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    )
}
