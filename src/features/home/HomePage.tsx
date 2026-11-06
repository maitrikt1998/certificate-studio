import { Link } from "react-router-dom";
import ToolCard from "../../components/ToolCard";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">YOUR CREATIVE WORKSPACE</span>

          <h1>
            Create more.
            <br />
            <span>Work smarter.</span>
          </h1>

          <p className="hero-description">
            Create certificates in bulk, customize designs, and manage
            everyday image tasks from one simple workspace.
          </p>

          <div className="hero-actions">
            <Link to="/bulk" className="primary-button">
              Start bulk certificates <span>→</span>
            </Link>
            <Link to="/editor" className="secondary-button">
              Open editor
            </Link>
          </div>

          <div className="hero-note">
            <span className="status-dot" />
            Designed for offline-first workflows
          </div>
        </div>

        <div className="hero-visual" aria-label="Certificate design preview">
          <div className="preview-glow" />
          <div className="certificate-preview">
            <div className="certificate-inner">
              <span className="preview-label">CERTIFICATE</span>
              <div className="preview-line" />
              <h2>OF ACHIEVEMENT</h2>
              <p>This certificate is proudly presented to</p>
              <h3>Alex Morgan</h3>
              <div className="preview-line short" />
              <p>For outstanding performance and dedication</p>
              <div className="preview-bottom">
                <span>DATE: __________</span>
                <span>SIGNATURE: ______</span>
              </div>
            </div>
          </div>
          <div className="floating-tag">
            <span>✓</span> Bulk-ready workflow
          </div>
        </div>
      </section>

      <section className="tools-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">WORKSPACE</span>
            <h2>What would you like to create?</h2>
            <p>Choose a tool to get started.</p>
          </div>
          <span className="tool-count">4 tools</span>
        </div>

        <div className="tool-grid">
          <ToolCard
            icon="▤"
            category="CERTIFICATES"
            title="Bulk Certificate Generator"
            description="Import student data from Excel or CSV and prepare certificates for an entire class."
            path="/bulk"
          />

          <ToolCard
            icon="✎"
            category="DESIGN"
            title="Certificate Editor"
            description="Customize certificate backgrounds, names, fonts, colors, and text placement."
            path="/editor"
          />

          <ToolCard
            icon="▧"
            category="IMAGE TOOLS"
            title="Image Converter"
            description="Prepare images for your projects by converting between common image formats."
            path="/image-converter"
            available={false}
          />

          <ToolCard
            icon="✧"
            category="IMAGE TOOLS"
            title="Background Remover"
            description="Explore options for removing image backgrounds and preparing clean assets."
            path="/background-remover"
            available={false}
          />
        </div>
      </section>

      <section className="workflow-banner">
        <div className="workflow-icon">✦</div>
        <div>
          <h3>Built to grow with your workflow</h3>
          <p>
            Start with certificates today. More useful tools can be added
            without rebuilding the entire application.
          </p>
        </div>
      </section>
    </div>
  );
}