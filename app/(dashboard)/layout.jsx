import { Navbar } from "./_components/navbar";

const DashboardLayout = ({ children }) => {
  return (
    <main className="relative min-h-full overflow-x-hidden bg-[#f7f0e6] text-[#10233f]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_20%,rgba(194,159,122,0.18),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(91,128,158,0.12),transparent_26%),radial-gradient(circle_at_55%_92%,rgba(139,158,126,0.14),transparent_32%)]" />
        <div className="absolute inset-0 opacity-[0.55] bg-[linear-gradient(rgba(40,55,74,0.024)_1px,transparent_1px),linear-gradient(90deg,rgba(40,55,74,0.018)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="absolute inset-0 opacity-[0.18] bg-[radial-gradient(circle_at_center,rgba(57,42,25,0.08)_1px,transparent_1px)] bg-[size:18px_18px]" />

        <svg className="animate-sketch-float absolute -left-12 top-0 h-[320px] w-[320px] text-[#7e715f]/25" viewBox="0 0 320 320" fill="none" aria-hidden="true">
          <path d="M54 12 C-12 68 8 162 87 174 C151 184 131 84 70 112 C24 134 78 236 166 252 C226 263 282 231 304 184" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="8 10" />
          <path d="M48 248 C70 224 92 226 104 250" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <svg className="animate-sketch-float-delay absolute right-[-44px] top-52 h-[260px] w-[260px] text-[#7e715f]/22" viewBox="0 0 260 260" fill="none" aria-hidden="true">
          <path d="M14 130 C58 116 88 92 124 57 C144 38 179 46 188 72 C204 119 132 122 132 122 C132 122 199 134 232 180" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="10 12" />
          <path d="M188 192 L244 162 L214 218 L205 185 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>

        <svg className="absolute bottom-4 left-0 hidden h-[250px] w-[260px] text-[#6f655a]/18 md:block" viewBox="0 0 260 250" fill="none" aria-hidden="true">
          <path d="M52 238 H158 C166 238 172 231 170 223 L151 104 H61 L42 223 C40 231 45 238 52 238Z" stroke="currentColor" strokeWidth="2" />
          <path d="M76 104 L62 20 M103 104 L104 15 M130 104 L154 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 228 C64 202 91 202 132 214 C164 224 189 216 220 192" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="6 8" />
        </svg>

        <div className="animate-float-slow absolute left-[6%] top-[36%] h-5 w-10 rotate-[-28deg] rounded-full bg-[#caa577]/20" />
        <div className="animate-float-delay absolute right-[7%] top-[58%] h-4 w-4 rounded-full border border-[#8b9e7e]/35" />
        <div className="animate-float-slower absolute left-[50%] top-9 h-3 w-3 rotate-45 bg-[#5b809e]/15" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1760px] flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-8">
        <Navbar />
        <section className="mt-4 flex-1 overflow-hidden rounded-[28px] border border-white/70 bg-[#fffaf3]/76 shadow-[0_28px_90px_rgba(45,34,23,0.10)] ring-1 ring-[#eadfce]/70 backdrop-blur-xl sm:mt-6 sm:rounded-[38px]">
          {children}
        </section>
      </div>
    </main>
  );
};

export default DashboardLayout;
