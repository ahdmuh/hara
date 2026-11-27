import About from "./About";
import Footer from "./Footer";
import Games from "./Games";
import Header from "./Header";
import Hero from "./Hero";
import TakePart from "./TakePart";
import Team from "./Team";

export default function Landing()
{
    return (
        <>
            <Header />
            <main>
                <Hero />
                <About />
                <Games />
                <TakePart />
                <Team />
            </main>
            <Footer />
        </>
    );
}
