"use client";
export default function SourcesError({reset}:{reset:()=>void}){return <div className="min-h-screen bg-[#020817] px-6 pt-40 text-center text-white" role="alert"><h1 className="text-3xl">Katalog sumber belum dapat dimuat</h1><button onClick={reset} className="mt-5 rounded-full bg-brand-cyan px-5 py-3 font-bold text-[#020817]">Coba lagi</button></div>}
