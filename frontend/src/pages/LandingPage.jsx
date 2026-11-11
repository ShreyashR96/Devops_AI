import React from 'react';
import { Link } from 'react-router-dom';

// Reusable Neo-Brutalist Push Button Component
const Button = ({ children, variant = 'primary', className = '', to }) => {
  const baseStyle = "inline-block text-center px-8 py-4 border-2 border-black rounded-xl transition-all duration-200 font-bold tracking-wide cursor-pointer";
  
  const variants = {
    primary: "bg-black text-white shadow-[8px_8px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#000]",
    secondary: "bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]",
    nav: "bg-black text-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] px-6 py-2"
  };

  if (to) {
    return (
      <Link to={to} className={`${baseStyle} ${variants[variant]} ${className}`}>
        {children}
      </Link>
    );
  }
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default function LandingPage() {
  const features = [
    { title: "Deployment Agent", desc: "Automate builds, container starts, and rollbacks via Docker API & GitHub integration." },
    { title: "Docker Expert", desc: "Optimize images, clear caches, and generate complex docker-compose.yml files instantly." },
    { title: "System Monitoring", desc: "Real-time tracking of CPU, RAM, Disk, and Network via Prometheus and Grafana." },
    { title: "Auto-Documentation", desc: "Generate READMEs, API docs, and architecture diagrams directly from your codebase." },
    { title: "Database Manager", desc: "Analyze slow queries, manage backups, and generate schema indexes for Mongo & Postgres." },
    { title: "Agent Orchestrator", desc: "Intelligent routing that ensures the right agent handles your specific DevOps prompt." }
  ];

  const steps = ["Connect Repo", "Define Agents", "Deploy Automatically"];

  const personas = [
    { type: "DevOps Engineer", bg: "bg-[#b7c6c2]", text: "text-black", desc: "Stop writing boilerplate Dockerfiles. Let the AI handle the mundane pipeline setups." },
    { type: "Startup Founder", bg: "bg-[#ffe17c]", text: "text-black", shadow: "shadow-[8px_8px_0px_0px_#000]", desc: "Deploy your entire MERN stack with a single prompt. Zero DevOps experience required." },
    { type: "Backend Developer", bg: "bg-[#272727]", text: "text-white", desc: "Keep your API docs perfectly in sync with your controllers automatically." }
  ];

  return (
    <div className="min-h-screen bg-[#171e19] text-black">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full h-20 bg-[#ffe17c] border-b-2 border-black z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black border-2 border-black flex items-center justify-center">
            <span className="text-[#ffe17c] font-black text-xl"> </span>
          </div>
          <span className="font-heading font-extrabold text-2xl tracking-tighter">DEVAGENT's</span>
        </div>
        <div className="hidden md:flex gap-8 font-medium text-lg">
          <a href="#features" className="hover:underline decoration-2 underline-offset-4">Agents</a>
          <a href="#how-it-works" className="hover:underline decoration-2 underline-offset-4">How it Works</a>
        </div>
        <Button variant="nav" to="/dashboard">Open Dashboard</Button>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 bg-[#ffe17c] bg-dot-pattern min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-block bg-white px-4 py-2 border-2 border-black rounded-full font-bold text-sm shadow-[2px_2px_0px_0px_#000]">
              NEW: AI DevOps Orchestrator 2.0
            </div>
            <h1 className="font-heading text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
              AUTOMATE YOUR <span className="text-stroke-2">INFRASTRUCTURE</span> FAST.
            </h1>
            <p className="text-xl font-medium max-w-lg">
              Deploy, monitor, and document your stack with a specialized team of AI agents. No more YAML headaches.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" to="/dashboard">Open Dashboard</Button>
              <Button variant="secondary" to="#features">Read Documentation</Button>
            </div>
          </div>

          {/* Browser Mockup Dashboard */}
          <div className="bg-white border-2 border-black rounded-2xl shadow-[12px_12px_0px_0px_#000] overflow-hidden flex flex-col h-[500px]">
            <div className="bg-black h-12 flex items-center px-4 gap-2 border-b-2 border-black shrink-0">
              <div className="w-4 h-4 rounded-full bg-[#ff5f57] border-2 border-black"></div>
              <div className="w-4 h-4 rounded-full bg-[#febc2e] border-2 border-black"></div>
              <div className="w-4 h-4 rounded-full bg-[#28c840] border-2 border-black"></div>
            </div>
            <div className="p-6 bg-[#f4f4f5] flex-grow grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-[#171e19] rounded-xl border-2 border-black p-4 text-white">
                <span className="font-heading text-xl text-[#b7c6c2]">User: Deploy latest production branch.</span>
                <br />
                <span className="font-mono text-sm text-[#ffe17c] mt-2 block">&gt; Deployment Agent initiated...</span>
                <span className="font-mono text-sm text-green-400 block">&gt; Health checks passed. Deployed successfully.</span>
              </div>
              <div className="bg-[#b7c6c2] border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000]">
                <h4 className="font-heading font-bold text-lg border-b-2 border-black pb-2 mb-2">CPU Usage</h4>
                <div className="h-16 flex items-end gap-1">
                  {[40, 70, 45, 90, 65, 80].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="w-full bg-[#171e19] border-t-2 border-r-2 border-black"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000]">
                 <h4 className="font-heading font-bold text-lg border-b-2 border-black pb-2 mb-2">Active Agents</h4>
                 <ul className="font-medium space-y-2 text-sm mt-2">
                   <li className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full border border-black"></div>Docker</li>
                   <li className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full border border-black"></div>Database</li>
                 </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-[#ffe17c] border-b-2 border-black px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-5xl font-black mb-16 text-center tracking-tighter">THE AGENT FLEET</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features?.map((feature, idx) => (
              <div key={idx} className="bg-white border-2 border-black rounded-xl p-8 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 transition-transform">
                <div className="w-16 h-16 bg-[#b7c6c2] border-2 border-black mb-6 hover:bg-[#ffe17c] transition-colors flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  <span className="font-heading font-black text-2xl">0{idx + 1}</span>
                </div>
                <h3 className="font-heading text-2xl font-extrabold mb-4">{feature?.title}</h3>
                <p className="font-medium text-gray-800 leading-relaxed">{feature?.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (Dark Mode) */}
      <section id="how-it-works" className="py-24 bg-[#171e19] text-white px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-5xl font-black mb-20 tracking-tighter text-[#ffe17c]">HOW IT WORKS</h2>
          <div className="flex flex-col md:flex-row justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-[#272727] -z-10 hidden md:block"></div>
            {steps?.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center mb-12 md:mb-0 bg-[#171e19] px-4">
                <div className={`w-24 h-24 rounded-full border-4 border-black mb-6 flex items-center justify-center text-3xl font-black ${
                  idx === 0 ? 'bg-[#b7c6c2] text-black shadow-[0_0_15px_rgba(183,198,194,0.5)]' : 
                  idx === 1 ? 'bg-[#ffe17c] text-black shadow-[0_0_15px_rgba(255,225,124,0.5)]' : 
                  'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]'
                }`}>
                  {idx + 1}
                </div>
                <h4 className="font-heading text-2xl font-bold">{step}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Personas */}
      <section className="py-24 bg-white px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          {personas?.map((persona, idx) => (
            <div key={idx} className={`${persona?.bg} ${persona?.text} border-2 border-black rounded-2xl p-8 ${persona?.shadow || 'shadow-[4px_4px_0px_0px_#000]'}`}>
              <div className="inline-block bg-white text-black px-4 py-1 border-2 border-black rounded-full text-xs font-bold mb-6">
                {persona?.type}
              </div>
              <p className="font-heading text-3xl font-bold leading-tight">"{persona?.desc}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Final CTA */}
      <footer className="bg-[#171e19] border-t-2 border-black">
        <div className="bg-[#ffe17c] py-24 px-8 text-center border-b-2 border-black">
          <h2 className="font-heading text-6xl md:text-8xl font-black tracking-tighter mb-8 text-black">
            READY TO DEPLOY?
          </h2>
          <Button variant="primary" to="/dashboard">Open Dashboard</Button>
        </div>
        <div className="max-w-7xl mx-auto py-12 px-8 grid md:grid-cols-4 gap-8 text-white">
          <div>
            <div className="flex items-center gap-2 mb-4">
               <div className="w-8 h-8 bg-[#ffe17c] border-2 border-black flex items-center justify-center">
                 <span className="text-black font-black text-sm"> </span>
               </div>
               <span className="font-heading font-extrabold text-xl">FLASHO</span>
            </div>
            <p className="text-[#b7c6c2]">Automated DevOps for modern teams.</p>
          </div>
          <div>
            <h5 className="font-heading text-xl font-bold mb-4 text-[#ffe17c]">Product</h5>
            <ul className="space-y-2 text-[#b7c6c2]">
              <li><a href="#features" className="hover:text-white transition-colors">Agents</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-heading text-xl font-bold mb-4 text-[#ffe17c]">Resources</h5>
            <ul className="space-y-2 text-[#b7c6c2]">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-heading text-xl font-bold mb-4 text-[#ffe17c]">Connect</h5>
            <div className="flex gap-4">
               {[1, 2, 3].map((i) => (
                 <a key={i} href="#" className="w-10 h-10 bg-[#272727] border-2 border-gray-600 hover:border-[#ffe17c] hover:bg-black transition-colors flex items-center justify-center rounded">
                   <div className="w-4 h-4 bg-[#b7c6c2]"></div>
                 </a>
               ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}