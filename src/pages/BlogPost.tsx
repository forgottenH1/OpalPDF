import { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { blogPosts } from '../data/blogData';
import AdSpace from '../components/AdSpace';

export default function BlogPost() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const isEnglish = i18n.language.startsWith('en');

    const post = useMemo(() => blogPosts.find(p => p.id === id), [id]);

    if (!post) {
        return <Navigate to="/blog" replace />;
    }

    // Related posts (simple algorithm: next 3 posts)
    const relatedPosts = useMemo(() => {
        const index = blogPosts.findIndex(p => p.id === id);
        if (index === -1) return [];
        return blogPosts.slice(index + 1, index + 4).concat(blogPosts.slice(0, 3)).slice(0, 3);
    }, [id]);

    const title = isEnglish ? post.title : t(`blogData.${post.id}.title`, { defaultValue: post.title });
    const excerpt = isEnglish ? post.excerpt : t(`blogData.${post.id}.excerpt`, { defaultValue: post.excerpt });
    const content = isEnglish ? post.content : t(`blogData.${post.id}.content`, { defaultValue: post.content });

    return (
        <article className="container mx-auto px-4 py-8 min-h-screen">
            <Helmet>
                <title>{title} | OpalPDF Blog</title>
                <meta name="description" content={excerpt} />
                <meta property="og:title" content={`${title} | OpalPDF Blog`} />
                <meta property="og:description" content={excerpt} />
                <link rel="canonical" href={`https://opalpdf.com/blog/${post.id}`} />
            </Helmet>

            <div className="w-full mb-8 max-w-4xl mx-auto">
                <AdSpace placement="header" className="w-full" />
            </div>

            <header className="max-w-3xl mx-auto mb-12 text-center">
                <div className="flex items-center justify-center gap-3 text-sm text-slate-400 mb-6 uppercase tracking-wider font-medium">
                    <a href="/blog" className="hover:text-blue-400 transition-colors">Blog</a>
                    <span>/</span>
                    <span>{post.date}</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
                    {title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-slate-400 text-sm">
                    <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {post.readTime} min read
                    </span>
                </div>
            </header>

            <div className="flex flex-col xl:flex-row max-w-7xl mx-auto gap-8 justify-center">
                {/* Left Sidebar */}
                <div className="hidden xl:block w-[160px] flex-shrink-0">
                    <div className="sticky top-24">
                        <AdSpace placement="sidebar-left" />
                    </div>
                </div>

                <div className="flex-1 max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-12 prose prose-invert prose-blue prose-lg">
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>

                {/* Right Sidebar */}
                <div className="hidden xl:block w-[160px] flex-shrink-0">
                    <div className="sticky top-24">
                        <AdSpace placement="sidebar-right" />
                    </div>
                </div>
            </div>

            <div className="w-full mt-12 max-w-4xl mx-auto">
                <AdSpace placement="footer" className="w-full" />
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <div className="max-w-5xl mx-auto mt-20">
                    <h3 className="text-2xl font-bold text-white mb-8">{t('blog.relatedArticles', 'Related Articles')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relatedPosts.map(rp => {
                            const rpTitle = isEnglish ? rp.title : t(`blogData.${rp.id}.title`, { defaultValue: rp.title });
                            const rpExcerpt = isEnglish ? rp.excerpt : t(`blogData.${rp.id}.excerpt`, { defaultValue: rp.excerpt });

                            return (
                                <a href={`/blog/${rp.id}`} key={rp.id} className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/50 transition-all block">
                                    <h4 className="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                                        {rpTitle}
                                    </h4>
                                    <p className="text-slate-400 text-sm line-clamp-2">{rpExcerpt}</p>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
        </article>
    );
}
