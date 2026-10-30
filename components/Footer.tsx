import Link from "next/link";

type Props = {
  github?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  email?: string | null;
};

export default function Footer({ github, linkedin, instagram, email }: Props) {
  return (
    <footer className="footer">
      <div className="container">
        <p className="serif footer-title">Mari terhubung.</p>
        <div className="chips">
          {email && (
            <a className="pill" href={`mailto:${email}`}>
              Email
            </a>
          )}
          {linkedin && (
            <a className="pill" href={linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
          {github && (
            <a className="pill" href={github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          )}
          {instagram && (
            <a className="pill" href={instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
          <Link className="pill" href="/kontak">
            Semua kontak
          </Link>
        </div>
        <p className="muted small">© 2026 Muhamad Rizki</p>
      </div>
    </footer>
  );
}
