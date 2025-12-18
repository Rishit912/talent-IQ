import React, { useState, useEffect } from 'react';

const HeroAnimation = () => {
  const [displayText, setDisplayText] = useState("");
  const codeSnippet = `// System Online...
function collaborate() {
  return "Success";
}

.talent-iq {
  color: shine;
}`;

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(codeSnippet.substring(0, i));
      i++;
      if (i > codeSnippet.length) {
        setTimeout(() => { i = 0; }, 2000);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    /* Use 'scale-90' on small mobile to ensure it fits, then 'scale-100' on desktop */
    <div className="relative w-full max-w-[320px] sm:max-w-md lg:max-w-lg mx-auto transform scale-90 sm:scale-100 transition-transform duration-500">
      
      {/* Floating Tech Tags - Hidden on very small screens to prevent overflow, shown on SM up */}
      <div className="hidden sm:block absolute -left-10 top-10 z-20 space-y-3">
        {['Java', 'Python', 'C++','JavaScript'].map((tech, index) => (
          <div 
            key={tech}
            className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-xl animate-bounce"
            style={{ animationDelay: `${index * 0.2}s`, animationDuration: '3s' }}
          >
            {tech}
          </div>
        ))}
      </div>

      {/* Main Terminal Container */}
      <div className="relative bg-base-300 rounded-2xl p-3 sm:p-4 shadow-2xl border border-primary/20">
        {/* Window Controls */}
        <div className="flex gap-1.5 mb-3 px-1">
          <div className="size-2.5 rounded-full bg-error/70" />
          <div className="size-2.5 rounded-full bg-warning/70" />
          <div className="size-2.5 rounded-full bg-success/70" />
        </div>

        {/* Code Screen */}
        <div className="bg-[#1e1e1e] rounded-xl p-4 min-h-[220px] sm:min-h-[280px] font-mono text-[12px] sm:text-sm leading-relaxed shadow-inner overflow-hidden border border-white/5">
          <pre className="text-success/90">
            <code>
              {displayText}
              <span className="animate-pulse border-r-2 border-primary ml-1"></span>
            </code>
          </pre>
        </div>

        {/* Small "Floating" user bubble to simulate the video feature */}
        <div className="absolute -bottom-4 -right-4 size-16 sm:size-20 rounded-2xl bg-secondary p-1 shadow-xl animate-pulse">
            <div className="w-full h-full bg-neutral rounded-xl flex items-center justify-center">
                <div className="size-4 sm:size-6 rounded-full bg-primary/40 animate-ping" />
            </div>
        </div>
      </div>

      {/* Background Glows */}
      <div className="absolute -z-10 -bottom-10 -right-10 size-40 bg-primary/10 blur-[60px] rounded-full" />
    </div>
  );
};

export default HeroAnimation;