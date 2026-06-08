import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Tag, Button, Empty, Skeleton } from 'antd';
import { GithubOutlined, LinkOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { projectsAPI } from '../../api/alumni';
import { getImageUrl } from '../../utils/image';
import { Link } from 'react-router-dom';

const ProjectsSection = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        projectsAPI.featured()
            .then(res => {
                setProjects(res.data?.data || []);
            })
            .catch(err => console.error("Failed to fetch featured projects:", err))
            .finally(() => setLoading(false));
    }, []);

    if (!loading && projects.length === 0) return null;

    return (
        <section className="py-16 px-6 bg-white overflow-hidden">
            <div className="max-w-[1200px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <Tag color="cyan" className="mb-4 px-3 py-1 text-sm font-medium rounded-full uppercase tracking-wider">
                            Real-World Projects
                        </Tag>
                        <h2 className="text-2xl md:text-[32px] font-bold text-slate-900 leading-tight">
                            Built by Our <span className="text-[#00B4D8]">Trainees</span>
                        </h2>
                        <p className="text-base text-slate-600 mt-3 max-w-2xl">
                            Real projects built during our hands-on training programs —
                            from AI agents to enterprise full-stack solutions.
                        </p>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <Link to="/alumni">
                            <Button type="primary" size="large" className="rounded-lg">
                                View All Projects <ArrowRightOutlined />
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {loading ? (
                    <Row gutter={[24, 24]}>
                        {[1, 2, 3].map(i => (
                            <Col xs={24} md={8} key={i}>
                                <Skeleton active avatar paragraph={{ rows: 4 }} />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Row gutter={[24, 24]}>
                        {projects.map((project, index) => (
                            <Col xs={24} md={12} lg={8} key={project.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -10 }}
                                >
                                    <Link to={`/alumni/projects/${project.slug}`}>
                                    <Card
                                        hoverable
                                        className="h-full rounded-2xl overflow-hidden border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500"
                                        cover={
                                            <div className="relative h-48 overflow-hidden group">
                                                <img 
                                                    alt={project.title} 
                                                    src={getImageUrl(project.thumbnail)} 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
                                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                    <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                                                        {project.github_url && (
                                                            <Button shape="circle" icon={<GithubOutlined />} href={project.github_url} target="_blank" className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white hover:text-slate-900" />
                                                        )}
                                                        {project.demo_url && (
                                                            <Button shape="circle" icon={<LinkOutlined />} href={project.demo_url} target="_blank" className="bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white hover:text-slate-900" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    >
                                        <div className="mb-4">
                                            <div className="text-xs font-semibold text-[#00B4D8] uppercase tracking-widest mb-1">
                                                By {project.student_name}
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 line-clamp-1 group-hover:text-[#00B4D8] transition-colors">
                                                {project.title}
                                            </h3>
                                        </div>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                                            {project.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            {project.tech_tags?.slice(0, 3).map(tag => (
                                                <Tag key={tag.id} className="m-0 border-none bg-slate-50 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                                                    {tag.name}
                                                </Tag>
                                            ))}
                                            {project.tech_tags?.length > 3 && (
                                                <span className="text-[10px] text-slate-400 font-bold">+{project.tech_tags.length - 3}</span>
                                            )}
                                        </div>
                                    </Card>
                                    </Link>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </section>
    );
};

export default ProjectsSection;
