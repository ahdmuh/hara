export default function App()
{
    return (
        <main style={{ minHeight: "100vh", margin: 0, display: "grid", placeContent: "center", gap: 8, padding: 24, textAlign: "center", fontFamily: "system-ui", background: "#000", color: "#fff" }}>
            <h1 style={{ margin: 0, fontSize: "clamp(2.5rem, 8vw, 5rem)" }}>HARA</h1>
            <p style={{ margin: 0, maxWidth: 480, opacity: 0.8 }}>
                A tabletop hand rehabilitation device that turns finger exercises into games.
            </p>
            <p style={{ margin: 0, opacity: 0.5 }}>A University of Calgary engineering capstone project. Coming Soon.</p>
        </main>
    );
}
