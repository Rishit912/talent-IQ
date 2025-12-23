function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-base-300 bg-base-200/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-xs md:flex-row md:items-center md:justify-between">
        <div className="text-base-content/70">
          <span className="font-semibold text-base-content">Talent-IQ</span>
          <span className="mx-1">·</span>
          <span>Interview & coding assessment platform</span>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-3 text-base-content/60">
          <span>
            &copy; {year} Talent-IQ. All rights reserved.
          </span>
          <span>
            Developed by <span className="font-medium text-base-content">Rishit Dangi</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
