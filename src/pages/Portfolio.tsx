import { useState, useEffect } from 'react';
import { FolderKanban, Plus, Trash2, X, Edit, ExternalLink, Image, Star } from 'lucide-react';
import { getPortfolioProjects, createPortfolioProject, updatePortfolioProject, deletePortfolioProject, supabase } from '../lib/supabase';

interface Project {
    id: string;
    title: string;
    description: string | null;
    service_type: string | null;
    client_name: string | null;
    image_url: string | null;
    project_url: string | null;
    technologies: string[] | null;
    is_featured: boolean;
    is_active: boolean;
    display_order: number;
    created_at: string;
}

export default function Portfolio() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        service_type: 'web_dev',
        client_name: '',
        image_url: '',
        project_url: '',
        technologies: '',
        is_featured: false,
    });

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        setLoading(true);
        const { data } = await getPortfolioProjects();
        if (data) setProjects(data);
        setLoading(false);
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            service_type: 'web_dev',
            client_name: '',
            image_url: '',
            project_url: '',
            technologies: '',
            is_featured: false,
        });
        setEditingProject(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const projectData = {
            title: formData.title,
            description: formData.description || undefined,
            service_type: formData.service_type,
            client_name: formData.client_name || undefined,
            image_url: formData.image_url || undefined,
            project_url: formData.project_url || undefined,
            technologies: formData.technologies ? formData.technologies.split(',').map(t => t.trim()) : undefined,
            is_featured: formData.is_featured,
            is_active: true,
        };

        if (editingProject) {
            await updatePortfolioProject(editingProject.id, projectData);
        } else {
            await createPortfolioProject({
                ...projectData,
                display_order: projects.length,
            });
        }

        resetForm();
        setShowForm(false);
        await loadProjects();
    };

    const handleEdit = (project: Project) => {
        setFormData({
            title: project.title,
            description: project.description || '',
            service_type: project.service_type || 'web_dev',
            client_name: project.client_name || '',
            image_url: project.image_url || '',
            project_url: project.project_url || '',
            technologies: project.technologies?.join(', ') || '',
            is_featured: project.is_featured,
        });
        setEditingProject(project);
        setShowForm(true);
    };

    const handleDelete = async (projectId: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            await deletePortfolioProject(projectId);
            await loadProjects();
        }
    };

    const handleToggleActive = async (project: Project) => {
        await updatePortfolioProject(project.id, { is_active: !project.is_active });
        await loadProjects();
    };

    const handleToggleFeatured = async (project: Project) => {
        await updatePortfolioProject(project.id, { is_featured: !project.is_featured });
        await loadProjects();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `portfolio/${fileName}`;

        const { error } = await supabase.storage
            .from('public-assets')
            .upload(filePath, file);

        if (!error) {
            const { data } = supabase.storage.from('public-assets').getPublicUrl(filePath);
            setFormData({ ...formData, image_url: data.publicUrl });
        }
        setUploading(false);
    };

    const serviceTypes: Record<string, string> = {
        web_dev: 'Web Development',
        saas: 'SaaS Product',
        android: 'Android App',
        ecommerce: 'E-commerce',
        custom: 'Custom Project',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Portfolio Projects</h1>
                    <p className="text-dark-400">Manage showcase projects for stachbit.in</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
                    <Plus className="w-5 h-5" />
                    Add Project
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="glass-card p-6 w-full max-w-2xl my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingProject ? 'Edit Project' : 'Add New Project'}
                            </h2>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 hover:bg-dark-700 rounded">
                                <X className="w-5 h-5 text-dark-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Project Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Client Name</label>
                                    <input
                                        type="text"
                                        value={formData.client_name}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input resize-none"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Service Type</label>
                                    <select
                                        value={formData.service_type}
                                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                        className="select"
                                    >
                                        {Object.entries(serviceTypes).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Project URL</label>
                                    <input
                                        type="url"
                                        value={formData.project_url}
                                        onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                                        className="input"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Technologies (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.technologies}
                                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                                    className="input"
                                    placeholder="React, Node.js, PostgreSQL"
                                />
                            </div>
                            <div>
                                <label className="label">Project Image</label>
                                <div className="flex gap-4 items-start">
                                    {formData.image_url && (
                                        <img
                                            src={formData.image_url}
                                            alt="Preview"
                                            className="w-24 h-24 object-cover rounded-lg bg-dark-800"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="url"
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                            className="input mb-2"
                                            placeholder="Image URL"
                                        />
                                        <label className="btn-secondary btn-sm cursor-pointer inline-flex items-center gap-2">
                                            <Image className="w-4 h-4" />
                                            {uploading ? 'Uploading...' : 'Upload Image'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={uploading}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_featured}
                                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                        className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500"
                                    />
                                    <span className="text-dark-300">Featured Project</span>
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    {editingProject ? 'Save Changes' : 'Add Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Projects Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card">
                            <div className="skeleton h-48 rounded-t-2xl" />
                            <div className="p-4">
                                <div className="skeleton h-6 w-3/4 mb-2 rounded" />
                                <div className="skeleton h-4 w-full rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="card p-12 text-center">
                    <FolderKanban className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
                    <p className="text-dark-400 mb-6">Add your first portfolio project to showcase your work</p>
                    <button onClick={() => setShowForm(true)} className="btn-primary">
                        <Plus className="w-5 h-5" />
                        Add Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className={`card overflow-hidden ${!project.is_active ? 'opacity-50' : ''}`}
                        >
                            {/* Image */}
                            <div className="relative h-48 bg-dark-800">
                                {project.image_url ? (
                                    <img
                                        src={project.image_url}
                                        alt={project.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FolderKanban className="w-12 h-12 text-dark-600" />
                                    </div>
                                )}
                                {project.is_featured && (
                                    <div className="absolute top-2 left-2 badge-warning flex items-center gap-1">
                                        <Star className="w-3 h-3" />
                                        Featured
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-white">{project.title}</h3>
                                    {project.project_url && (
                                        <a
                                            href={project.project_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 hover:bg-dark-700 rounded"
                                        >
                                            <ExternalLink className="w-4 h-4 text-dark-400" />
                                        </a>
                                    )}
                                </div>
                                {project.description && (
                                    <p className="text-dark-400 text-sm mb-3 line-clamp-2">{project.description}</p>
                                )}
                                {project.technologies && project.technologies.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {project.technologies.slice(0, 3).map((tech) => (
                                            <span key={tech} className="badge-primary text-xs">{tech}</span>
                                        ))}
                                        {project.technologies.length > 3 && (
                                            <span className="badge text-xs">+{project.technologies.length - 3}</span>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-3 border-t border-dark-700">
                                    <button
                                        onClick={() => handleEdit(project)}
                                        className="p-2 hover:bg-dark-700 rounded-lg"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4 text-dark-400" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleFeatured(project)}
                                        className={`p-2 hover:bg-dark-700 rounded-lg ${project.is_featured ? 'text-yellow-400' : 'text-dark-400'}`}
                                        title="Toggle Featured"
                                    >
                                        <Star className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(project)}
                                        className={`px-3 py-1 text-xs rounded-lg ${project.is_active
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}
                                    >
                                        {project.is_active ? 'Active' : 'Hidden'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 ml-auto"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
