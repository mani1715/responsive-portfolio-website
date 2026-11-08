import ProjectImage from './ProjectImage';
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Github, Star, Eye } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import './portfolio-components.css';


const ProjectCard = ({ project, onQuickView }) => {
  if (!project) return null;

  const id = project.id || project._id;
  const title = project.title || 'Untitled Project';
  const slug = project.slug || id;
  const category = project.category || 'Web Development';
  const description = project.description || '';
  const imageUrl = project.image_url || project.image || '';
  const techStack = project.tech_stack || project.technologies || [];
  const featured = Boolean(project.featured);
  const liveDemoUrl = project.live_demo_url || project.liveUrl;
  const githubUrl = project.github_url || project.githubUrl;

  return (
    <Card className="project-card-premium" data-admin-editable={`project-${id}`}>
      {/* Featured Badge */}
      {featured && (
        <div className="project-featured-badge">
          <Star className="h-3 w-3" fill="currentColor" />
          <span>Featured</span>
        </div>
      )}

      {/* Project Image */}
      <div className="project-card-image-wrapper">
        <ProjectImage
          src={imageUrl}
          alt={title}
          className="project-card-image"
          loading="lazy"

        />

        {/* Hover Overlay */}
        <div className="project-card-overlay">
          <div className="project-overlay-buttons">
            <Link to={`/portfolio/${slug || id}`} className="project-overlay-btn btn-view" style={{ textDecoration: 'none' }}>
              <span>View Case Study</span>
            </Link>

            {onQuickView && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView(project);
                }}
                className="project-overlay-btn btn-view"
              >
                <Eye className="h-4 w-4 mr-1" />
                <span>Quick View</span>
              </button>
            )}

            {liveDemoUrl && (
              liveDemoUrl.startsWith('/') ? (
                <Link to={liveDemoUrl} className="project-overlay-btn btn-demo" style={{ textDecoration: 'none' }}>
                  <ExternalLink className="h-4 w-4" />
                  <span>Live demo</span>
                </Link>
              ) : (
                <a href={liveDemoUrl} target="_blank" rel="noopener noreferrer" className="project-overlay-btn btn-demo" style={{ textDecoration: 'none' }}>
                  <ExternalLink className="h-4 w-4" />
                  <span>Visit website</span>
                </a>
              )
            )}
          </div>
        </div>

        {/* Category Badge */}
        {category && (
          <div className="project-category-badge">
            {category}
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="project-card-content">
        <h3 className="project-card-title">
          {title}
        </h3>

        <p className="project-card-description">
          {description}
        </p>

        {/* Tech Stack */}
        <div className="project-tech-tags">
          {techStack.slice(0, 4).map((tech, idx) => (
            <span key={idx} className="tech-tag">
              {tech}
            </span>
          ))}
          {techStack.length > 4 && (
            <span className="tech-tag tech-tag-more">
              +{techStack.length - 4}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="project-card-footer">
          <Link to={`/portfolio/${slug || id}`} className="project-read-more">
            View Details →
          </Link>

          {liveDemoUrl && (
            liveDemoUrl.startsWith('/') ? (
              <Link
                to={liveDemoUrl}
                className="project-live-external-link"
                title="View live demo"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#7C5CFF', textDecoration: 'none' }}
              >
                <span>Live Demo</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <a
                href={liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="project-live-external-link"
                title="Visit live website"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#7C5CFF', textDecoration: 'none' }}
              >
                <span>Visit Site</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )
          )}

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-github-link"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      <div className="project-card-gradient"></div>
    </Card>
  );
};

export default ProjectCard;
