export interface BlogPostMeta {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    content: string; // HTML or Markdown content
}

import { blogPosts1 } from './blogPosts1';
import { blogPosts2 } from './blogPosts2';
import { blogPosts3 } from './blogPosts3';
import { blogPosts4 } from './blogPosts4';
import { blogPosts5 } from './blogPosts5';

export const blogPosts: BlogPostMeta[] = [
    ...blogPosts1,
    ...blogPosts2,
    ...blogPosts3,
    ...blogPosts4,
    ...blogPosts5
];
