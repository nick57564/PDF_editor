import Link from "next/link";

const tools = [
  { href: "/editor",   icon: "✏️", title: "Edit Text",   desc: "Click any text in a PDF to edit it inline." },
  { href: "/merge",    icon: "🔗", title: "Merge PDFs",   desc: "Combine multiple PDF files into one." },
  { href: "/split",    icon: "✂️", title: "Split PDF",    desc: "Extract or remove pages from a PDF." },
  { href: "/sign",     icon: "✍️", title: "Fill & Sign",  desc: "Fill forms and add your signature." },
  { href: "/annotate", icon: "🖊️", title: "Annotate",     desc: "Highlight, draw and add notes to PDFs." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">PDF Editor</h1>
          <p className="text-gray-500 mt-2">Free. No account. Files never leave your device.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-3">{t.icon}</div>
              <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{t.title}</div>
              <div className="text-sm text-gray-500 mt-1">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
