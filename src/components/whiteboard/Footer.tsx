import { Github, Linkedin, Instagram, Youtube, Twitter, Mail, Globe } from "lucide-react";

const LINKS = [
  { icon: Github, label: "GitHub", href: "https://github.com/ParthChittalwar" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/parthchittalwar" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/parth_chittalwar/" },
  { icon: Youtube, label: "YouTube", href: "https://www.youtube.com/@parth_chittalwar" },
  { icon: Twitter, label: "X", href: "https://x.com/itzz_me_parth" },
  { icon: Mail, label: "Email", href: "mailto:parthchittalwar@gmail.com" },
  { icon: Globe, label: "Portfolio", href: "https://portfolio-5yf.pages.dev/" },
];

export function Footer() {
  return (
    <div
      className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur"
      style={{ boxShadow: "var(--shadow-toolbar)" }}
    >
      <span className="hidden sm:inline">
        Built by <span className="font-medium text-foreground">Parth Chittalwar</span> · Open source · v1.0.3
      </span>
      <span className="inline sm:hidden font-medium text-foreground">Parth Chittalwar</span>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-0.5">
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            aria-label={l.label}
            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent hover:text-foreground"
          >
            <l.icon size={12} />
          </a>
        ))}
      </div>
    </div>
  );
}
