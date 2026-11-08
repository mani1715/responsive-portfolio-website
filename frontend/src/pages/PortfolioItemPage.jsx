import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { 
  ArrowLeft, 
  ExternalLink, 
  Github, 
  Calendar, 
  Tag as TagIcon, 
  User, 
  Sparkles, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import projectService from '../services/projectService';
import settingsService from '../services/settingsService';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import ImageGallery from '../components/portfolio/ImageGallery';
import TechStack from '../components/portfolio/TechStack';
import DevelopmentProcess from '../components/portfolio/DevelopmentProcess';
import ShareButtons from '../components/ShareButtons';
import './pages.css';

const PortfolioItemPage = () => {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [project, setProject] = useState(() => {
    try {
      const cached = projectService.getCachedProjects();
      const found = cached.find(p => p.slug === id || String(p.id) === id);
      if (found) {
        return {
          id: found.id,
          title: found.title,
          slug: found.slug,
          category: found.category,
          description: found.description,
          shortDesc: found.description,
          longDesc: found.case_study_content || found.description,
          image: found.image_url || found.image || '',
          images: (found.images && found.images.length > 0) ? found.images : [found.image_url || found.image || ''],
          technologies: found.tech_stack || found.technologies || [],
          techStack: found.tech_stack || found.technologies || [],
          featured: found.featured,
          liveLink: found.live_demo_url || found.liveUrl,
          githubLink: found.github_url || found.githubUrl,
          status: found.status,
          date: found.completion_date,
          clientName: found.client_name,
          metrics: found.metrics,
          features: found.key_features || [],
          duration: found.project_duration,
          teamSize: found.team_size
        };
      }
    } catch (e) {}
    return null;
  });
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(() => {
    try {
      const cached = projectService.getCachedProjects();
      return !cached.some(p => p.slug === id || String(p.id) === id);
    } catch (e) {
      return true;
    }
  });
  const [shareEnabled, setShareEnabled] = useState(true);
  
  // Fetch project and related projects from API
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setLoadError(false);
        setProject(null);
        setCurrentImageIndex(0);
        // Fetch all public projects
        const allProjects = await projectService.getPublicProjects();
        
        // Find current project by slug or id
        const currentProject = allProjects.find(p => 
          p.slug === id || String(p.id) === id
        );
        
        if (currentProject) {
          // Transform project data
          const transformedProject = {
            id: currentProject.id,
            title: currentProject.title,
            slug: currentProject.slug,
            category: currentProject.category,
            description: currentProject.description,
            shortDesc: currentProject.description,
            longDesc: currentProject.case_study_content || currentProject.description,
            image: currentProject.image_url || currentProject.image || '',
            images: (currentProject.images && currentProject.images.length > 0) ? currentProject.images : [currentProject.image_url || currentProject.image || ''],
            technologies: currentProject.tech_stack || currentProject.technologies || [],
            techStack: currentProject.tech_stack || currentProject.technologies || [],
            featured: currentProject.featured,
            liveLink: currentProject.live_demo_url || currentProject.liveUrl,
            githubLink: currentProject.github_url || currentProject.githubUrl,
            status: currentProject.status,
            date: currentProject.completion_date,
            clientName: currentProject.client_name,
            metrics: currentProject.metrics,
            features: currentProject.key_features || [],
            duration: currentProject.project_duration,
            teamSize: currentProject.team_size
          };
          setProject(transformedProject);
          
          // Find related projects (same category, excluding current)
          const related = allProjects
            .filter(p => p.category === currentProject.category && p.id !== currentProject.id)
            .slice(0, 3)
            .map(p => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              category: p.category,
              description: p.description,
              shortDesc: p.description,
              image: p.image_url || p.image || '',
              technologies: p.tech_stack || p.technologies || [],
              featured: p.featured
            }));
          setRelatedProjects(related);
        }
      } catch (error) {
        setLoadError(true);
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (settings && typeof settings.enable_share_buttons !== 'undefined') {
          setShareEnabled(settings.enable_share_buttons);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    
    fetchProjectData();
    fetchSettings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, attempt]);

  // Show loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (loadError) return <section className="work-status"><SEO title="Load project - METECHQ"/><h1>We couldn’t load this project</h1><p>Please check the connection and try again.</p><button className="studio-button" onClick={() => setAttempt(n => n + 1)}>Try again</button><Link className="studio-text-link" to="/portfolio">Back to our work</Link></section>;
  if (!project) {
    return (
      <>
        <SEO title="Project Not Found - METECHQ" />
        <div className="portfolio-item-page-premium">
          <div className="not-found-container">
            <div className="not-found-content">
              <h1 className="not-found-title">Project Not Found</h1>
              <p className="not-found-text">The project you're looking for doesn't exist or has been removed.</p>
              <Link to="/portfolio">
                <Button className="back-to-portfolio-btn">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Portfolio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": project.title,
    "description": project.description,
    "image": project.image,
    "author": {
      "@type": "Organization",
      "name": "METECHQ"
    },
    "datePublished": project.date,
    "keywords": project.technologies.join(', ')
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <SEO
        title={project.seo?.title || `${project.title} - METECHQ Portfolio`}
        description={project.seo?.description || project.description}
        keywords={project.technologies ? project.technologies.join(', ') : ''}
        canonical={`https://metechq.com/portfolio/${project.slug || project.id}`}
        ogType="article"
        ogTitle={project.title}
        ogDescription={project.description}
        ogImage={project.image}
        ogUrl={`https://metechq.com/portfolio/${project.slug || project.id}`}
        twitterCard="summary_large_image"
        twitterTitle={project.title}
        twitterDescription={project.description}
        twitterImage={project.image}
        structuredData={structuredData}
      />

      <div className="portfolio-item-page-premium">
        {/* Back Navigation */}
        <div className="portfolio-item-nav" data-admin-editable="back-nav">
          <div className="section-container-premium">
            <Link to="/portfolio">
              <Button variant="ghost" className="back-button-premium">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Portfolio</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 1. PROJECT HERO SECTION */}
        <section className="project-hero-section" data-admin-editable={`project-hero-${project.id}`}>
          <div className="project-hero-background">
            <div className="hero-gradient-orb orb-1"></div>
            <div className="hero-gradient-orb orb-2"></div>
            <div className="hero-gradient-orb orb-3"></div>
          </div>
          
          <div className="section-container-premium">
            <div className="project-hero-content">
              <div className="project-hero-meta">
                {project.featured && (
                  <span className="project-featured-label" data-testid="featured-badge">
                    <Sparkles className="h-4 w-4" />
                    Featured Project
                  </span>
                )}
                <span className="project-category-label" data-admin-editable={`project-category-${project.id}`} data-testid="project-category">
                  {project.category}
                </span>
              </div>

              <h1 className="project-hero-title" data-admin-editable={`project-title-${project.id}`} data-testid="project-title">
                {project.title}
              </h1>

              <p className="project-hero-description" data-admin-editable={`project-desc-${project.id}`} data-testid="project-description">
                {project.shortDesc || project.description}
              </p>

              {/* Tech Stack Badges */}
              <div className="project-hero-tech-badges">
                {project.technologies.slice(0, 5).map((tech, idx) => (
                  <span key={idx} className="hero-tech-badge" data-testid={`tech-badge-${idx}`}>
                    {tech}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="project-hero-actions">
                {project.liveLink && (
                  <>
                    {project.liveLink.startsWith('/') ? (
                      <Button asChild className="project-action-btn btn-primary" data-testid="live-demo-btn">
                        <Link to={project.liveLink}>
                          <ExternalLink className="h-5 w-5 mr-2" />
                          <span>{project.liveLink.startsWith('/demo/') ? 'View live demo' : 'Visit deployed website'}</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="project-action-btn btn-primary" data-testid="live-demo-btn">
                        <a href={project.liveLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-5 w-5 mr-2" />
                          <span>{project.liveLink.startsWith('/demo/') ? 'View live demo' : 'Visit deployed website'}</span>
                        </a>
                      </Button>
                    )}
                  </>
                )}
                {project.githubLink && (
                  <a href={project.githubLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="project-action-btn btn-secondary" data-testid="github-btn">
                      <Github className="h-5 w-5" />
                      <span>View Source Code</span>
                    </Button>
                  </a>
                )}
              </div>

              {/* Share Buttons */}
              {shareEnabled && (
                <div style={{ 
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <ShareButtons 
                    title={project.title}
                    url={window.location.href}
                    showLabel={true}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. IMAGE GALLERY */}
        <section className="project-gallery-section" data-admin-editable={`project-gallery-${project.id}`}>
          <div className="section-container-premium">
            <ImageGallery 
              images={project.images || [project.image]} 
              projectTitle={project.title}
              currentIndex={currentImageIndex}
              setCurrentIndex={setCurrentImageIndex}
            />
          </div>
        </section>

        {/* 3. PROJECT OVERVIEW & SIDEBAR */}
        <section className="project-details-section-premium">
          <div className="section-container-premium">
            <div className="project-details-grid-premium">
              
              {/* Main Content */}
              <div className="project-main-content-premium">
                {/* Overview Section */}
                <div className="content-block" data-admin-editable={`project-overview-${project.id}`}>
                  <h2 className="content-block-title">Project Overview</h2>
                  <p className="content-block-text" style={{ whiteSpace: 'pre-line' }}>{project.longDesc || project.description}</p>
                </div>
                {project.features.length > 0 && (
                  <div className="content-block features-block">
                    <h2 className="content-block-title">Key Features & Functionality</h2>
                    <ul className="features-list-premium">
                      {project.features.map((feature, idx) => <li key={idx} className="feature-item-premium"><CheckCircle className="feature-check" /><span>{feature}</span></li>)}
                    </ul>
                  </div>
                )}

                {/* 5. DEVELOPMENT PROCESS */}
                <DevelopmentProcess />

                {/* 6. TECHNOLOGY STACK */}
                <div className="content-block" data-admin-editable={`project-tech-${project.id}`}>
                  <h2 className="content-block-title">Technology Stack</h2>
                  <TechStack technologies={project.techStack || project.technologies} />
                </div>

                {/* 7. RESULTS & IMPACT */}
                {(project.metrics || project.results) && (
                  <div className="content-block results-impact-block" data-admin-editable={`project-results-${project.id}`}>
                    <h2 className="content-block-title">Results & Impact</h2>
                    
                    {/* Metrics Cards */}
                    {project.metrics && (
                      <div className="project-metrics-block">
                        <div className="metrics-grid">
                          {project.metrics.users && (
                            <div className="metric-card" data-testid="metric-users">
                              <Users className="metric-icon" />
                              <div className="metric-value">{project.metrics.users}</div>
                              <div className="metric-label">Active Users</div>
                            </div>
                          )}
                          {project.metrics.increase && (
                            <div className="metric-card" data-testid="metric-increase">
                              <TrendingUp className="metric-icon" />
                              <div className="metric-value">{project.metrics.increase}</div>
                              <div className="metric-label">Performance Increase</div>
                            </div>
                          )}
                          {project.metrics.revenue && (
                            <div className="metric-card" data-testid="metric-revenue">
                              <DollarSign className="metric-icon" />
                              <div className="metric-value">{project.metrics.revenue}</div>
                              <div className="metric-label">Revenue Growth</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Detailed Results */}
                    {project.results && project.results.length > 0 && (
                      <div className="results-grid">
                        {project.results.map((result, idx) => (
                          <div key={idx} className="result-card" data-testid={`result-${idx}`}>
                            <div className="result-metric">{result.value}</div>
                            <h3 className="result-title">{result.metric}</h3>
                            <p className="result-desc">{result.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Challenges & Solutions */}
                {project.challenges && project.challenges.length > 0 && (
                  <div className="content-block" data-admin-editable={`project-challenges-${project.id}`}>
                    <h2 className="content-block-title">Challenges & Solutions</h2>
                    <div className="challenges-grid">
                      {project.challenges.map((challenge, idx) => (
                        <div key={idx} className="challenge-card" data-testid={`challenge-${idx}`}>
                          <div className="challenge-number">{String(idx + 1).padStart(2, '0')}</div>
                          <h3 className="challenge-title">{challenge.title}</h3>
                          <p className="challenge-desc">{challenge.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. CLIENT TESTIMONIAL (Optional) */}
                {project.testimonial && (
                  <div className="content-block testimonial-block" data-admin-editable={`project-testimonial-${project.id}`}>
                    <h2 className="content-block-title">Client Testimonial</h2>
                    <Card className="project-testimonial-card">
                      <div className="testimonial-quote-large">"</div>
                      <p className="testimonial-content-large">
                        {project.testimonial.content}
                      </p>
                      <div className="testimonial-author-large">
                        <div className="author-avatar-large">
                          {project.testimonial.name.charAt(0)}
                        </div>
                        <div>
                          <div className="author-name-large">{project.testimonial.name}</div>
                          <div className="author-role-large">{project.testimonial.role}, {project.testimonial.company}</div>
                        </div>
                      </div>
                      {project.testimonial.rating && (
                        <div className="testimonial-stars-large">
                          {[...Array(project.testimonial.rating)].map((_, i) => (
                            <span key={i} className="star">★</span>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="project-sidebar-premium">
                {/* Project Info Card */}
                <Card className="project-info-card-premium" data-admin-editable={`project-info-${project.id}`}>
                  <h3 className="sidebar-card-title">Project Information</h3>
                  
                  {project.clientName && (
                    <div className="info-item-premium">
                      <User className="info-icon" />
                      <div className="info-content">
                        <div className="info-label">Client</div>
                        <div className="info-value">{project.clientName}</div>
                      </div>
                    </div>
                  )}

                  {project.role && (
                    <div className="info-item-premium">
                      <Target className="info-icon" />
                      <div className="info-content">
                        <div className="info-label">Role</div>
                        <div className="info-value">{project.role}</div>
                      </div>
                    </div>
                  )}

                  {project.date && (
                    <div className="info-item-premium">
                      <Calendar className="info-icon" />
                      <div className="info-content">
                        <div className="info-label">Completed</div>
                        <div className="info-value">{new Date(project.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                      </div>
                    </div>
                  )}

                  <div className="info-item-premium">
                    <TagIcon className="info-icon" />
                    <div className="info-content">
                      <div className="info-label">Category</div>
                      <div className="info-value">{project.category}</div>
                    </div>
                  </div>

                  {project.duration && (
                    <div className="info-item-premium">
                      <Clock className="info-icon" />
                      <div className="info-content">
                        <div className="info-label">Duration</div>
                        <div className="info-value">{project.duration}</div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* 10. CTA Card */}
                <Card className="project-cta-card-premium">
                  <div className="cta-card-content">
                    <Sparkles className="cta-card-icon" />
                    <h3 className="cta-card-title">Want a Similar Project?</h3>
                    <p className="cta-card-text">
                      Let's discuss how we can create something amazing together that exceeds your expectations.
                    </p>
                    <Link to="/contact">
                      <Button className="cta-card-button" data-testid="cta-start-project-btn">
                        Start Your Project
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 9. RELATED PROJECTS */}
        {relatedProjects.length > 0 && (
          <section className="related-projects-section-premium" data-admin-editable="related-projects">
            <div className="section-container-premium">
              <div className="section-header-center">
                <h2 className="section-title-premium">More Projects Like This</h2>
                <p className="section-description-premium">
                  Explore other projects in the {project.category} category
                </p>
              </div>

              <div className="related-projects-grid-premium">
                {relatedProjects.map((relatedProject) => (
                  <Link 
                    key={relatedProject.id} 
                    to={`/portfolio/${relatedProject.slug || relatedProject.id}`}
                    className="related-project-card"
                    data-testid={`related-project-${relatedProject.id}`}
                  >
                    <div className="related-project-image-wrapper">
                      <img 
                        src={relatedProject.image} 
                        alt={relatedProject.title}
                        className="related-project-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                      {relatedProject.featured && (
                        <div className="related-project-featured">
                          <Sparkles className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div className="related-project-content">
                      <span className="related-project-category">{relatedProject.category}</span>
                      <h4 className="related-project-title">{relatedProject.title}</h4>
                      <p className="related-project-desc">{relatedProject.shortDesc || relatedProject.description}</p>
                      <div className="related-project-tech">
                        {relatedProject.technologies.slice(0, 3).map((tech, idx) => (
                          <span key={idx} className="related-tech-tag">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="view-all-projects">
                <Link to="/portfolio">
                  <Button variant="outline" className="view-all-btn" data-testid="view-all-projects-btn">
                    View All Projects
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default PortfolioItemPage;
