import { Link } from "react-router-dom";

type ToolCardProps = {
  icon: string;
  title: string;
  description: string;
  path: string;
  category: string;
  available?: boolean;
};

export default function ToolCard({
  icon,
  title,
  description,
  path,
  category,
  available = true,
}: ToolCardProps) {
  return (
    <article className="tool-card">
      <div className="tool-card-top">
        <div className="tool-icon" aria-hidden="true">
          {icon}
        </div>
        <span className={`tool-status ${available ? "ready" : "planned"}`}>
          {available ? "Ready to build" : "Coming soon"}
        </span>
      </div>

      <p className="tool-category">{category}</p>
      <h3>{title}</h3>
      <p className="tool-description">{description}</p>

      <Link
        to={path}
        className={`tool-link ${!available ? "planned-link" : ""}`}
        aria-disabled={!available}
        onClick={(event) => {
          if (!available) event.preventDefault();
        }}
      >
        {available ? "Open tool" : "Coming soon"}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}