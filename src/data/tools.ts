import {
    Link, Split, Minimize2, FileText, Image, Stamp, RefreshCw, Hash, PenTool, Tags, Layers, Crop, Lock, Unlock, Wrench, Droplet, Moon, Eraser, EyeOff, GitCompare
} from 'lucide-react';

export interface Tool {
    id: string;
    title: string;
    desc: string;
    icon: any;
    category: string;
}

// Full list of tools with Lucide icons
export const tools: Tool[] = [
    { id: 'merge', title: 'PDF Fusion Deck', desc: 'Combine reports, contracts, and files into a single master PDF.', icon: Link, category: 'Organize' },
    { id: 'split', title: 'PDF Page Splitter', desc: 'Instantly separate specific pages or split large PDF documents.', icon: Split, category: 'Organize' },
    { id: 'compress', title: 'Hyper-Compress PDF', desc: 'Optimize PDF file size for email & web without losing quality.', icon: Minimize2, category: 'Optimize' },
    { id: 'word-to-pdf', title: 'Docx to PDF Pro', desc: 'Transform Word documents into professional, ready-to-share PDFs.', icon: FileText, category: 'Convert' },
    { id: 'pdf-to-word', title: 'PDF to Word Doc', desc: 'Convert static PDFs back into editable Word documents.', icon: FileText, category: 'Convert' },
    { id: 'pdf-to-excel', title: 'PDF Table Extractor', desc: 'Turn PDF tables into fully editable Excel spreadsheets.', icon: FileText, category: 'Convert' },
    { id: 'pdf-to-img', title: 'PDF to Image HD', desc: 'Convert PDF pages to high-resolution JPGs for easy sharing.', icon: Image, category: 'Convert' },
    { id: 'pdf-to-png', title: 'PDF to PNG Lossless', desc: 'Extract pages as crisp, lossless PNG images from your PDF.', icon: Image, category: 'Convert' },
    { id: 'img-to-pdf', title: 'Image to PDF Binder', desc: 'Turn photos and scans into a clean PDF document.', icon: Image, category: 'Convert' },
    { id: 'ocr', title: 'PDF Text Recognizer', desc: 'Make scanned PDF documents searchable and selectable instantly.', icon: FileText, category: 'Convert' },
    { id: 'rotate', title: 'PDF Page Rotator', desc: 'Fix PDF page orientation permanently.', icon: RefreshCw, category: 'Organize' },
    { id: 'page-number', title: 'PDF Page Numbering', desc: 'Add professional page numbering to your PDF documents.', icon: Hash, category: 'Edit' },
    { id: 'sign', title: 'PDF E-Signature', desc: 'Draw and place your digital signature on any PDF.', icon: PenTool, category: 'Edit' },
    { id: 'organize', title: 'PDF Page Organizer', desc: 'Reorder, delete, or rearrange PDF pages visually.', icon: Split, category: 'Organize' },
    { id: 'watermark', title: 'PDF Brand Stamper', desc: 'Apply professional logos or text watermarks to your PDF.', icon: Stamp, category: 'Edit' },
    { id: 'edit-metadata', title: 'PDF Meta Editor', desc: 'Update PDF properties like Author, Title, and Keywords.', icon: Tags, category: 'Edit' },
    { id: 'flatten', title: 'PDF Flattener Tool', desc: 'Lock PDF form fields and annotations permanently.', icon: Layers, category: 'Organize' },
    { id: 'trim', title: 'PDF Smart Crop', desc: 'Remove whitespace or resize PDF pages for print.', icon: Crop, category: 'Organize' },
    { id: 'compare', title: 'PDF Visual Diff', desc: 'Compare two PDF documents side-by-side to spot changes.', icon: GitCompare, category: 'Organize' },
    { id: 'protect', title: 'PDF Secure Vault', desc: 'Encrypt your PDF with military-grade AES protection.', icon: Lock, category: 'Security' },
    { id: 'unlock', title: 'PDF Password Remover', desc: 'Remove passwords and restrictions from your PDF files.', icon: Unlock, category: 'Security' },
    { id: 'repair', title: 'PDF File Repair', desc: 'Recover data from corrupted or broken PDF files.', icon: Wrench, category: 'Organize' },
    { id: 'grayscale', title: 'PDF Grayscale Converter', desc: 'Convert colored PDFs to professional grayscale documents.', icon: Droplet, category: 'Optimize' },
    { id: 'invert-colors', title: 'PDF Night Mode', desc: 'Invert PDF colors for comfortable reading in low light.', icon: Moon, category: 'Optimize' },
    { id: 'extract-text', title: 'PDF Text Scraper', desc: 'Pull raw text content from your PDF into a .txt file.', icon: FileText, category: 'Convert' },
    { id: 'remove-annotations', title: 'Clean PDF Markup', desc: 'Strip comments, highlights, and markup from PDFs.', icon: Eraser, category: 'Edit' },
    { id: 'redact', title: 'PDF Secure Redact', desc: 'Permanently remove sensitive private info from PDFs.', icon: EyeOff, category: 'Security' },
    { id: 'pdf-to-ppt', title: 'PDF to PowerPoint', desc: 'Convert PDF documents into editable PowerPoint slides.', icon: FileText, category: 'Convert' },
    { id: 'excel-to-pdf', title: 'Excel to PDF Converter', desc: 'Turn Excel spreadsheets into clean PDF reports.', icon: FileText, category: 'Convert' },
    { id: 'ppt-to-pdf', title: 'PowerPoint to PDF', desc: 'Save PowerPoint presentations as professional PDF handouts.', icon: FileText, category: 'Convert' },
    { id: 'html-to-pdf', title: 'Web to PDF Capture', desc: 'Capture websites as clean, readable PDF documents.', icon: FileText, category: 'Convert' },
];
