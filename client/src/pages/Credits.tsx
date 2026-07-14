import {
    ArrowUpRight,
    Code2,
    Database,
    LayoutPanelTop,
    ServerCog,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import AuthModal from "../components/AuthModal.tsx";

const technologies = [
    {
        name: "React",
        label: "INTERFACE",
        icon: LayoutPanelTop,
        description: "The component-based foundation behind each polished QuickDine screen.",
        benefit: "Keeps browsing, booking, and account experiences fast and fluid.",
    },
    {
        name: "TypeScript",
        label: "RELIABILITY",
        icon: Code2,
        description: "Adds clear structure and safer data handling throughout the product.",
        benefit: "Helps us deliver dependable features with fewer unexpected errors.",
    },
    {
        name: "Node.js & Express",
        label: "SERVICE LAYER",
        icon: ServerCog,
        description: "Power the server logic that connects diners, restaurants, and reservations.",
        benefit: "Makes live availability and booking updates responsive and scalable.",
    },
    {
        name: "MongoDB",
        label: "DATA",
        icon: Database,
        description: "Securely stores restaurant profiles, guest details, and reservation records.",
        benefit: "Lets us retrieve the right dining information when you need it.",
    },
    {
        name: "JWT Authentication",
        label: "SECURITY",
        icon: ShieldCheck,
        description: "Protects accounts with secure, token-based sign-in and access control.",
        benefit: "Keeps personal information and booking history private.",
    },
    {
        name: "Tailwind CSS",
        label: "DESIGN SYSTEM",
        icon: Sparkles,
        description: "Shapes a consistent visual language across every responsive screen.",
        benefit: "Creates a refined experience that feels considered on every device.",
    },
];

export default function Credits() {
    return (
        <div className="min-h-screen bg-surface flex flex-col">
            <Navbar />
            <AuthModal />

            <main className="flex-1 pt-20">
                <section className="bg-primary text-white overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28 relative">
                        <div className="absolute -right-24 -top-28 size-96 rounded-full border border-white/10" />
                        <div className="absolute -right-8 -top-12 size-64 rounded-full border border-secondary/40" />
                        <p className="relative text-secondary-container text-xs font-medium tracking-[0.26em] uppercase mb-6">Behind the table</p>
                        <div className="relative max-w-3xl">
                            <h1 className="font-display text-5xl md:text-7xl leading-[1.04] tracking-tight">Crafted for better dining, <span className="text-secondary-container italic">one detail at a time.</span></h1>
                            <p className="mt-7 max-w-xl text-white/65 text-base md:text-lg leading-relaxed">QuickDine brings thoughtful technology together to make discovering exceptional restaurants and reserving your table feel effortless.</p>
                        </div>
                    </div>
                </section>

                <section className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
                        <div>
                            <p className="text-secondary text-xs font-medium tracking-[0.22em] uppercase mb-4">Our technology</p>
                            <h2 className="font-display text-4xl md:text-5xl text-primary">Built with purpose.</h2>
                        </div>
                        <p className="max-w-sm text-sm text-black/55 leading-relaxed">Every tool in our stack is chosen to make the experience simpler, safer, and more enjoyable for diners and restaurant teams.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-outline-variant/35">
                        {technologies.map(({ name, label, icon: Icon, description, benefit }) => (
                            <article key={name} className="group bg-surface-container-lowest border-r border-b border-outline-variant/35 p-7 md:p-8 min-h-72 card-hover-effect">
                                <div className="flex items-start justify-between">
                                    <div className="size-11 flex items-center justify-center bg-secondary-container/45 text-secondary">
                                        <Icon size={21} strokeWidth={1.6} />
                                    </div>
                                    <ArrowUpRight size={18} className="text-black/25 group-hover:text-secondary transition-colors" />
                                </div>
                                <p className="mt-9 text-[10px] font-medium tracking-[0.2em] text-secondary uppercase">{label}</p>
                                <h3 className="mt-2 font-display text-2xl text-primary">{name}</h3>
                                <p className="mt-3 text-sm text-black/55 leading-relaxed">{description}</p>
                                <div className="mt-5 pt-4 border-t border-outline-variant/20">
                                    <p className="text-xs leading-relaxed text-primary"><span className="font-medium text-secondary">The benefit — </span>{benefit}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="bg-surface-container-low border-y border-outline-variant/20">
                    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20 grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-10 md:gap-20 items-center">
                        <div>
                            <p className="text-secondary text-xs font-medium tracking-[0.22em] uppercase mb-4">The outcome</p>
                            <h2 className="font-display text-4xl md:text-5xl leading-tight text-primary">Less friction. More memorable meals.</h2>
                        </div>
                        <p className="text-black/60 text-base leading-relaxed">From the moment you explore a restaurant to the confirmation in your inbox, our stack works quietly in the background—so your attention stays where it belongs: on the experience ahead.</p>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
