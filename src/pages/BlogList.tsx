import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { blogPosts } from '../data/blogData';
import AdSpace from '../components/AdSpace';

const POSTS_PER_PAGE = 12;

export default function BlogList() {
    const { t, i18n } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(blogPosts.length / POSTS_PER_PAGE);

    const currentPosts = useMemo(() => {
        const start = (currentPage - 1) * POSTS_PER_PAGE;
        return blogPosts.slice(start, start + POSTS_PER_PAGE);
    }, [currentPage]);

    return (
        <div className="container mx-auto px-4 py-8 min-h-[70vh]">
            <Helmet>
                <title>Blog - PDF Guides & Tips | OpalPDF</title>
                <meta name="description" content="Discover expert tips, guides, and tutorials on managing, securing, and converting PDF documents on the OpalPDF Blog." />
                <link rel="canonical" href="https://opalpdf.com/blog" />
            </Helmet>

            <div className="w-full mb-8">
                <AdSpace placement="header" className="w-full" />
            </div>

            <header className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">OpalPDF <span className="text-blue-400">Blog</span></h1>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                    {t('blog.subtitle', 'Master your PDF documents with our expert tools, tutorials, and security guides.')}
                </p>
            </header>

            {blogPosts.length === 0 ? (
                <div className="text-center text-slate-500 py-12">No posts available yet. Check back soon!</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {currentPosts.map(post => {
                        const isEnglish = i18n.language.startsWith('en');
                        const title = isEnglish ? post.title : t(`blogData.${post.id}.title`, { defaultValue: post.title });
                        const excerpt = isEnglish ? post.excerpt : t(`blogData.${post.id}.excerpt`, { defaultValue: post.excerpt });

                        return (
                            <a href={`/blog/${post.id}`} key={post.id} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all block">
                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                                        <span>{post.date}</span>
                                        <span>•</span>
                                        <span>{post.readTime} min read</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                        {title}
                                    </h3>
                                    <p className="text-slate-400 text-sm line-clamp-3">
                                        {excerpt}
                                    </p>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center mt-12 gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${currentPage === i + 1
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            <div className="w-full mt-12">
                <AdSpace placement="footer" className="w-full" />
            </div>
        </div>
    );
}
