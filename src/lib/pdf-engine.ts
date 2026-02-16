import { PDFDocument, rgb, StandardFonts, degrees, PDFName } from 'pdf-lib';
import JSZip from 'jszip';

// Helper to get PDFJS only when needed
// Helper to get PDFJS only when needed
const getPdfJs = async () => {
    // @ts-ignore
    const pdfjsLib = await import('pdfjs-dist');
    // @ts-ignore
    const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.js?url')).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    return pdfjsLib;
};



// Helper to sanitize text for WinAnsi (StandardFonts)
const sanitizeText = (text: string): string => {
    return text
        .replace(/\t/g, '    ')      // Replace tabs with 4 spaces
        .replace(/[\u2018\u2019]/g, "'") // Smart quotes
        .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
        .replace(/[\u2013\u2014]/g, '-') // Dashes
        .replace(/\u2026/g, '...')       // Ellipsis
        .replace(/\u2192/g, '->')        // Right arrow
        .replace(/\u2190/g, '<-')        // Left arrow
        .replace(/\u2022/g, '*')         // Bullet
        .replace(/[^\x00-\xFF]/g, '?');  // Strip all other non-Latin-1 chars to prevent crash
};

export const OrbitPDFEngine = {
    // 1. Merge PDFs
    async mergePDFs(files: File[]): Promise<Uint8Array> {
        const mergedPdf = await PDFDocument.create();
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        return await mergedPdf.save();
    },

    // 2. Split PDF -> ZIP of all pages OR Single PDF of extracted range
    async splitPDF(file: File, range?: string): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();

        // Mode A: Extract Range (Return Single PDF)
        if (range && range.trim().length > 0) {
            const indicesToKeep = new Set<number>();
            const parts = range.split(',');

            parts.forEach(part => {
                part = part.trim();
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(p => parseInt(p, 10));
                    if (!isNaN(start) && !isNaN(end)) {
                        for (let i = start; i <= end; i++) {
                            if (i >= 1 && i <= pageCount) indicesToKeep.add(i - 1);
                        }
                    }
                } else {
                    const pageNum = parseInt(part, 10);
                    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pageCount) {
                        indicesToKeep.add(pageNum - 1);
                    }
                }
            });

            if (indicesToKeep.size === 0) throw new Error("Invalid page range.");

            const sortedIndices = Array.from(indicesToKeep).sort((a, b) => a - b);
            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdfDoc, sortedIndices);
            copiedPages.forEach(page => newPdf.addPage(page));

            return await newPdf.save();
        }

        // Mode B: Burst All Pages (Return ZIP)
        const zip = new JSZip();
        const baseName = file.name.replace('.pdf', '');

        for (let i = 0; i < pageCount; i++) {
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);
            const pdfBytes = await newPdf.save();
            zip.file(`${baseName}_page_${i + 1}.pdf`, pdfBytes);
        }

        return await zip.generateAsync({ type: 'uint8array' });
    },

    // 3. Rotate PDF
    async rotatePDF(file: File, rotationDegrees: number = 90): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        pages.forEach(page => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + rotationDegrees));
        });
        return await pdfDoc.save();
    },

    // 4. Protect PDF (Encrypt - Workaround via Rasterization)
    async protectPDF(file: File, password: string): Promise<Uint8Array> {

        return await this._rasterizeAndRebuild(file, { userPassword: password, ownerPassword: password, userPermissions: ['print', 'modify', 'copy', 'annot-forms'] });
    },

    // 4b. Unlock PDF (Remove Password - Workaround via Rasterization)
    async unlockPDF(file: File, password: string): Promise<Uint8Array> {

        return await this._rasterizeAndRebuild(file, undefined, password);
    },

    // 4c. Repair PDF
    async repairPDF(file: File, forceRebuild: boolean = false): Promise<Uint8Array> {
        let arrayBuffer = await file.arrayBuffer();

        // 0. Heuristic: Fix PDF Header if missing or garbage at start
        arrayBuffer = this._sanitizePdfHeader(arrayBuffer);



        // Step 1: Try Standard Repair (Load & Save) to fix structure/XREF
        try {

            // pdfDoc is loaded but not used directly if we just save? 
            // Actually, loading and saving IS the repair.
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            await pdfDoc.save();
        } catch (error) {
            console.warn("OrbitPDF: Standard Repair failed to load/save. Using sanitized raw buffer.", error);
            // If standard repair fails completely (can't load), we use the raw sanitized buffer
            // but effectively this means structure is still potentially broken for pdf.js
            // repairedBuffer = new Uint8Array(arrayBuffer);
        }



        let step1Buffer: Uint8Array;

        try {

            const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const newDoc = await PDFDocument.create();
            const pageIndices = srcDoc.getPageIndices();
            const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
            copiedPages.forEach(page => newDoc.addPage(page));
            step1Buffer = await newDoc.save();
        } catch (error) {
            console.warn("OrbitPDF: Step 1 (Strong Repair) failed. Using raw sanitized buffer.", error);
            step1Buffer = new Uint8Array(arrayBuffer);
        }

        if (forceRebuild) {

            // Now we feed the potentially fixed structure to pdf.js
            try {
                return await this._rasterizeAndRebuild(step1Buffer);
            } catch (err) {
                console.error("OrbitPDF: Deep Repair failed even on normalized buffer.", err);
                // If deep repair fails, we fall back to returning the Step 1 result (better than nothing)
                // alerting the user would be ideal, but we'll return the structural fix at least.
                return step1Buffer;
            }
        }

        return step1Buffer;
    },

    // Helper: Fix common header issues
    _sanitizePdfHeader(buffer: ArrayBuffer): ArrayBuffer {
        const uint8 = new Uint8Array(buffer);
        // const header = "%PDF";
        const headerBytes = [0x25, 0x50, 0x44, 0x46]; // %PDF

        // Check if starts with %PDF
        let found = true;
        for (let i = 0; i < 4; i++) {
            if (uint8[i] !== headerBytes[i]) {
                found = false;
                break;
            }
        }
        if (found) return buffer;

        console.warn("OrbitPDF: Header missing or garbage at start. Searching...");

        // Search in first 2KB
        const limit = Math.min(uint8.length, 2048);
        for (let i = 0; i < limit; i++) {
            if (uint8[i] === 0x25 && uint8[i + 1] === 0x50 && uint8[i + 2] === 0x44 && uint8[i + 3] === 0x46) {

                return buffer.slice(i);
            }
        }

        console.warn("OrbitPDF: No header found. Prepending default header.");
        // If not found, PREPEND %PDF-1.4
        const newHeader = new TextEncoder().encode("%PDF-1.4\n");
        const newBuffer = new Uint8Array(newHeader.length + uint8.length);
        newBuffer.set(newHeader);
        newBuffer.set(uint8, newHeader.length);
        return newBuffer.buffer;
    },

    // 17. Compare PDF (Side-by-Side with Highlights)
    async comparePDFs(files: File[], strings?: { page: string, noPageInFile1: string, noPageInFile2: string }): Promise<Uint8Array> {
        if (files.length !== 2) throw new Error("Comparison requires exactly 2 PDF files.");

        const str = {
            page: strings?.page || "Page",
            noPageInFile1: strings?.noPageInFile1 || "(No page in File 1)",
            noPageInFile2: strings?.noPageInFile2 || "(No page in File 2)"
        };

        const pdfDoc1 = await PDFDocument.load(await files[0].arrayBuffer());
        const pdfDoc2 = await PDFDocument.load(await files[1].arrayBuffer());

        const outputDoc = await PDFDocument.create();
        const font = await outputDoc.embedFont(StandardFonts.HelveticaBold);

        const count1 = pdfDoc1.getPageCount();
        const count2 = pdfDoc2.getPageCount();
        const maxPages = Math.max(count1, count2);

        // Load PDF.js for text extraction
        const pdfjsLib = await getPdfJs();
        // We need array buffers for PDF.js independently
        const ab1 = await files[0].arrayBuffer();
        const ab2 = await files[1].arrayBuffer();

        const doc1Js = await pdfjsLib.getDocument(ab1).promise;
        const doc2Js = await pdfjsLib.getDocument(ab2).promise;

        for (let i = 0; i < maxPages; i++) {
            // Create a landscape page wide enough for two A4s + margin
            const page = outputDoc.addPage([1250, 900]);
            const { width, height } = page.getSize();

            // Draw Labels
            page.drawText(`${str.page} ${i + 1}`, { x: width / 2 - 30, y: height - 40, size: 20, font, color: rgb(0, 0, 0) });

            // Extract & Group Text for Diffing
            let items1: any[] = [];
            let items2: any[] = [];

            if (i < count1) {
                const p1 = await doc1Js.getPage(i + 1);
                const tc1 = await p1.getTextContent();
                items1 = tc1.items;
            }
            if (i < count2) {
                const p2 = await doc2Js.getPage(i + 1);
                const tc2 = await p2.getTextContent();
                items2 = tc2.items;
            }

            // Helper: Group items into Lines
            const extractLines = (items: any[]) => {
                // 1. Sort by Y (descending) then X (ascending)
                // Note: transform[5] is Y, transform[4] is X
                const sorted = [...items].sort((a, b) => {
                    const yDiff = b.transform[5] - a.transform[5];
                    if (Math.abs(yDiff) > 5) return yDiff; // Significant Y diff
                    return a.transform[4] - b.transform[4]; // Same line, sort by X
                });

                // 2. Group
                const lines: { text: string, items: any[] }[] = [];
                let currentLine: any[] = [];
                let currentY = -9999;

                for (const item of sorted) {
                    const y = item.transform[5];
                    if (Math.abs(y - currentY) > 8) { // Threshold for new line
                        if (currentLine.length > 0) {
                            lines.push({
                                text: currentLine.map(i => i.str).join(''),
                                items: currentLine
                            });
                        }
                        currentLine = [item];
                        currentY = y;
                    } else {
                        currentLine.push(item);
                    }
                }
                // Last line
                if (currentLine.length > 0) {
                    lines.push({
                        text: currentLine.map(i => i.str).join(''),
                        items: currentLine
                    });
                }
                return lines;
            };

            const lines1 = extractLines(items1);
            const lines2 = extractLines(items2);

            // Diff on Lines
            const computeDiff = (arr1: typeof lines1, arr2: typeof lines2) => {
                const n = arr1.length;
                const m = arr2.length;
                const dp = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));

                for (let r = 1; r <= n; r++) {
                    for (let c = 1; c <= m; c++) {
                        // Compare accumulated text of the line
                        if (arr1[r - 1].text === arr2[c - 1].text) {
                            dp[r][c] = dp[r - 1][c - 1] + 1;
                        } else {
                            dp[r][c] = Math.max(dp[r - 1][c], dp[r][c - 1]);
                        }
                    }
                }

                const removed: typeof lines1 = [];
                const added: typeof lines2 = [];
                let r = n, c = m;
                while (r > 0 || c > 0) {
                    if (r > 0 && c > 0 && arr1[r - 1].text === arr2[c - 1].text) {
                        r--; c--;
                    } else if (c > 0 && (r === 0 || dp[r][c - 1] >= dp[r - 1][c])) {
                        added.push(arr2[c - 1]);
                        c--;
                    } else {
                        removed.push(arr1[r - 1]);
                        r--;
                    }
                }
                return { removed, added };
            };

            const { removed, added } = computeDiff(lines1, lines2);

            // File 1 (Left) - Draw + Highlight Removed Lines
            if (i < count1) {
                page.drawText(`${files[0].name}`, { x: 50, y: height - 40, size: 14, font, color: rgb(0.3, 0.3, 0.3) });
                const [embeddedPage] = await outputDoc.embedPages([pdfDoc1.getPages()[i]]);
                const scale = Math.min(600 / embeddedPage.width, 800 / embeddedPage.height);

                // Draw Page
                const boxBottomY = height - 60 - (embeddedPage.height * scale);
                page.drawPage(embeddedPage, {
                    x: 20,
                    y: boxBottomY,
                    width: embeddedPage.width * scale,
                    height: embeddedPage.height * scale,
                });

                // Highlight Removed Lines
                removed.forEach(line => {
                    // Highlight each item in the removed line
                    line.items.forEach((item: any) => {
                        const tx = item.transform;
                        const origX = tx[4];
                        const origY = tx[5];
                        const w = item.width * scale;
                        const h = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) * scale * 1.2;

                        if (w > 0 && h > 0) {
                            page.drawRectangle({
                                x: 20 + (origX * scale),
                                y: boxBottomY + (origY * scale) - (h * 0.2),
                                width: w,
                                height: h,
                                color: rgb(1, 0, 0), // RED
                                opacity: 0.3,
                            });
                        }
                    });
                });

            } else {
                page.drawText(str.noPageInFile1, { x: 100, y: height / 2, size: 18, color: rgb(0.5, 0.5, 0.5) });
            }

            // Separator Line
            page.drawLine({
                start: { x: width / 2, y: height - 20 },
                end: { x: width / 2, y: 20 },
                thickness: 2,
                color: rgb(0.8, 0.8, 0.8),
            });

            // File 2 (Right) - Draw + Highlight Added Lines
            if (i < count2) {
                page.drawText(`${files[1].name}`, { x: width / 2 + 50, y: height - 40, size: 14, font, color: rgb(0.3, 0.3, 0.3) });
                const [embeddedPage] = await outputDoc.embedPages([pdfDoc2.getPages()[i]]);
                const scale = Math.min(600 / embeddedPage.width, 800 / embeddedPage.height);

                const boxBottomY = height - 60 - (embeddedPage.height * scale);
                const baseX = width / 2 + 20;

                page.drawPage(embeddedPage, {
                    x: baseX,
                    y: boxBottomY,
                    width: embeddedPage.width * scale,
                    height: embeddedPage.height * scale,
                });

                // Highlight Added Lines
                added.forEach(line => {
                    line.items.forEach((item: any) => {
                        const tx = item.transform;
                        const origX = tx[4];
                        const origY = tx[5];
                        const w = item.width * scale;
                        const h = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) * scale * 1.2;

                        if (w > 0 && h > 0) {
                            page.drawRectangle({
                                x: baseX + (origX * scale),
                                y: boxBottomY + (origY * scale) - (h * 0.2),
                                width: w,
                                height: h,
                                color: rgb(0, 1, 0), // GREEN
                                opacity: 0.3,
                            });
                        }
                    });
                });

            } else {
                page.drawText(str.noPageInFile2, { x: width / 2 + 100, y: height / 2, size: 18, color: rgb(0.5, 0.5, 0.5) });
            }
        }

        return await outputDoc.save();
    },

    // 16. Redact PDF (Search & Destroy + Rasterize)
    async redactPDF(file: File, searchTerms: string[], redactNumbers: boolean = false): Promise<Uint8Array> {


        const arrayBuffer = await file.arrayBuffer();
        // Load for editing
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // Load for text inspection
        const pdfjsLib = await getPdfJs();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }); // Copy buffer to be safe
        const pdf = await loadingTask.promise;

        const termsLower = searchTerms.map(t => t.toLowerCase().trim()).filter(t => t.length > 0);

        for (let i = 0; i < pdf.numPages; i++) {
            const page = pages[i]; // pdf-lib page (0-indexed)
            const pdfPage = await pdf.getPage(i + 1); // pdf.js page (1-indexed)
            const textContent = await pdfPage.getTextContent();
            // const { height } = page.getSize();

            // Iterate text items
            for (const item of textContent.items as any[]) {
                const text = item.str;
                const textLower = text.toLowerCase();
                let shouldRedact = false;

                // Check numbers
                if (redactNumbers && /\d/.test(text)) {
                    // If it contains a digit sequence, and we are redacting numbers, finding the exact digit might be hard if mixed with text
                    // For now, if "Redact Numbers" is on, we redact the whole text item if it contains digits.
                    // This is safer for "Bank Account: 1234" -> redact "1234" (if separate item) or "Account: 1234" (if one item).
                    // Ideally we'd split, but pdf-lib drawing over partial text is hard without font metrics matching exactly.
                    if (/\d+/.test(text)) shouldRedact = true;
                }

                // Check terms
                if (!shouldRedact) {
                    for (const term of termsLower) {
                        if (textLower.includes(term)) {
                            shouldRedact = true;
                            break;
                        }
                    }
                }

                if (shouldRedact) {
                    // Calculate coordinates
                    // item.transform is [scaleX, skewY, skewX, scaleY, x, y]
                    const tx = item.transform;
                    const x = tx[4];
                    const y = tx[5];
                    const w = item.width;
                    const h = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]); // Scale Y roughly font size

                    if (w > 0 && h > 0) {
                        page.drawRectangle({
                            x: x,
                            y: y - (h * 0.2), // Adjust for baseline
                            width: w,
                            height: h * 1.2,
                            color: rgb(0, 0, 0),
                            opacity: 1,
                        });
                    }
                }
            }
        }

        // Save modified vector PDF
        const redactedBuffer = await pdfDoc.save();

        // Rasterize for permanence (Flatten)

        // @ts-ignore
        // Use high scale (2.5) and high JPEG quality (0.95) for crisp text
        return await this._rasterizeAndRebuild(redactedBuffer, undefined, undefined, false, false, 2.5, 0.95);
    },

    // Helper: Rasterize & Rebuild using jsPDF
    async _rasterizeAndRebuild(input: File | ArrayBuffer | Uint8Array, encryption?: any, openPassword?: string, grayscale: boolean = false, invert: boolean = false, renderScale: number = 2.0, jpegQuality: number = 0.95): Promise<Uint8Array> {
        // @ts-ignore
        const { jsPDF } = await import('jspdf');

        let data: ArrayBuffer | Uint8Array;
        if (input instanceof File) {
            data = await input.arrayBuffer();
        } else {
            data = input;
        }

        const pdfjsLib = await getPdfJs();

        // Load with password if provided (for unlock)
        const loadingTask = pdfjsLib.getDocument({ data: data, password: openPassword });
        const pdf = await loadingTask.promise;

        const doc = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4',
            encryption: encryption // Apply encryption if provided (for protect)
        });

        // Loop through pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: renderScale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (!context) throw new Error("Canvas context failed");

            try {
                await page.render({ canvasContext: context, viewport: viewport }).promise;
            } catch (err) {
                console.warn(`OrbitPDF: Failed to render page ${i}`, err);
                // Continue to next page rather than failing entire doc
                continue;
            }

            // Apply Grayscale Filter (Manual Pixel Manipulation)
            // context.filter is sometimes ignored by toDataURL or render(), so we do it manually to be safe.
            if (grayscale || invert) {
                const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                for (let j = 0; j < data.length; j += 4) {
                    const r = data[j];
                    const g = data[j + 1];
                    const b = data[j + 2];

                    if (grayscale) {
                        // Rec. 601 luma formula
                        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                        data[j] = gray;
                        data[j + 1] = gray;
                        data[j + 2] = gray;
                    }

                    if (invert) {
                        data[j] = 255 - data[j];
                        data[j + 1] = 255 - data[j + 1];
                        data[j + 2] = 255 - data[j + 2];
                    }
                    // data[j+3] is alpha, leave it
                }
                context.putImageData(imgData, 0, 0);
            }

            const imgDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);

            // Generally safer to add a new page for every content page
            doc.addPage([viewport.width, viewport.height], viewport.width > viewport.height ? 'l' : 'p');
            doc.addImage(imgDataUrl, 'JPEG', 0, 0, viewport.width, viewport.height);
        }

        // Clean up the initial default page if we added content
        if (doc.getNumberOfPages() > 1) {
            doc.deletePage(1);
        }


        return new Uint8Array(doc.output('arraybuffer'));
    },

    // 4d. Grayscale PDF
    async grayscalePDF(file: File): Promise<Uint8Array> {
        // @ts-ignore
        return await this._rasterizeAndRebuild(file, undefined, undefined, true, false);
    },

    // 4e. Invert Colors PDF
    async invertPDF(file: File): Promise<Uint8Array> {
        // @ts-ignore
        return await this._rasterizeAndRebuild(file, undefined, undefined, false, true);
    },

    // 4f. Extract Text
    async extractText(file: File): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await getPdfJs();
        // Standard load
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Extract text items
            const pageText = textContent.items.map((item: any) => item.str).join(' ');

            fullText += `--- Page ${i} ---\n\n${pageText}\n\n`;
        }

        return new TextEncoder().encode(fullText);
    },

    // 4g. Remove Annotations
    async removeAnnotations(file: File): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        // Load with ignoreEncryption to ensure we can edit if it has an empty owner password, though typically we'd need the password.
        // Assuming standard load is fine as per other tools.
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // 1. Remove Annots from every page
        pages.forEach(page => {
            page.node.delete(PDFName.of('Annots'));
        });

        // 2. Remove AcroForm (Form Fields) from Catalog
        // some viewers typically fall back to Annots if AcroForm is missing, but best to remove both.
        pdfDoc.catalog.delete(PDFName.of('AcroForm'));

        return await pdfDoc.save();
    },

    // 5. Watermark PDF (Text or Image)
    async watermarkPDF(
        file: File,
        watermarkText: string,
        type: 'text' | 'image',
        image?: File,
        options: {
            position: string; // 'center', 'top-left', 'top-center', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right', 'tiled'
            opacity: number;
            rotation: number;
        } = { position: 'center', opacity: 0.3, rotation: 0 }
    ): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        let imageBytes: ArrayBuffer | null = null;
        let embeddedImage: any = null;
        let font: any = null;

        if (type === 'image' && image) {
            imageBytes = await image.arrayBuffer();
            const fileName = image.name.toLowerCase();
            if (fileName.endsWith('.png')) {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
            }
        } else {
            // Font for text watermark
            font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        }

        pages.forEach(page => {
            const { width, height } = page.getSize();
            const opacity = options.opacity;
            const rotation = degrees(options.rotation);

            if (embeddedImage) {
                // Image Watermark
                const scale = 0.5; // Base scale, could be option
                const dims = embeddedImage.scale(scale); // Use scale instead of fit to keep aspect ratio simple
                // Or let's stick to fit logic if we want to ensure it's not huge
                // const dims = embeddedImage.scaleToFit(width * 0.5, height * 0.5); 

                let x = width / 2 - dims.width / 2;
                let y = height / 2 - dims.height / 2;

                if (options.position !== 'tiled') {
                    switch (options.position) {
                        case 'top-left': x = 20; y = height - dims.height - 20; break;
                        case 'top-center': x = width / 2 - dims.width / 2; y = height - dims.height - 20; break;
                        case 'top-right': x = width - dims.width - 20; y = height - dims.height - 20; break;
                        case 'center-left': x = 20; y = height / 2 - dims.height / 2; break;
                        case 'center': x = width / 2 - dims.width / 2; y = height / 2 - dims.height / 2; break;
                        case 'center-right': x = width - dims.width - 20; y = height / 2 - dims.height / 2; break;
                        case 'bottom-left': x = 20; y = 20; break;
                        case 'bottom-center': x = width / 2 - dims.width / 2; y = 20; break;
                        case 'bottom-right': x = width - dims.width - 20; y = 20; break;
                    }

                    page.drawImage(embeddedImage, {
                        x,
                        y,
                        width: dims.width,
                        height: dims.height,
                        opacity: opacity,
                        rotate: rotation,
                    });
                } else {
                    // Tiled Image Logic
                    const gap = 300;
                    const diagonal = Math.sqrt(width * width + height * height);
                    for (let tx = -diagonal; tx < diagonal; tx += gap) {
                        for (let ty = -diagonal; ty < diagonal; ty += gap) {
                            page.drawImage(embeddedImage, {
                                x: tx,
                                y: ty,
                                width: dims.width,
                                height: dims.height,
                                opacity: opacity,
                                rotate: rotation,
                            });
                        }
                    }
                }
            } else {
                // Text Watermark
                const fontSize = 50;
                const color = rgb(0.6, 0.6, 0.6); // Slightly darker for better visibility controls

                const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
                const textHeight = font.heightAtSize(fontSize);

                let x = width / 2 - textWidth / 2;
                let y = height / 2 - textHeight / 2;

                if (options.position === 'tiled') {
                    const gap = 300;
                    const diagonal = Math.sqrt(width * width + height * height);
                    for (let tx = -diagonal; tx < diagonal; tx += gap) {
                        for (let ty = -diagonal; ty < diagonal; ty += gap) {
                            page.drawText(watermarkText, {
                                x: tx,
                                y: ty,
                                size: fontSize,
                                font: font,
                                color: color,
                                opacity: opacity,
                                rotate: rotation,
                            });
                        }
                    }
                } else {
                    switch (options.position) {
                        case 'top-left': x = 20; y = height - textHeight - 20; break;
                        case 'top-center': x = width / 2 - textWidth / 2; y = height - textHeight - 20; break;
                        case 'top-right': x = width - textWidth - 20; y = height - textHeight - 20; break;
                        case 'center-left': x = 20; y = height / 2 - textHeight / 2; break;
                        case 'center': x = width / 2 - textWidth / 2; y = height / 2 - textHeight / 2; break;
                        case 'center-right': x = width - textWidth - 20; y = height / 2 - textHeight / 2; break;
                        case 'bottom-left': x = 20; y = 20; break;
                        case 'bottom-center': x = width / 2 - textWidth / 2; y = 20; break;
                        case 'bottom-right': x = width - textWidth - 20; y = 20; break;
                    }

                    page.drawText(watermarkText, {
                        x,
                        y,
                        size: fontSize,
                        font: font,
                        color: color,
                        opacity: opacity,
                        rotate: rotation,
                    });
                }
            }
        });

        return await pdfDoc.save();
    },

    // 7. Compress PDF (Rasterize & Rebuild Strategy)
    async compressPDF(file: File, quality: number = 0.7): Promise<Uint8Array> {

        const arrayBuffer = await file.arrayBuffer();

        try {
            const pdfjsLib = await getPdfJs();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            const newPdfDoc = await PDFDocument.create();

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // Good balance for readability
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) throw new Error("Canvas context failed");

                // Render
                await page.render({ canvasContext: context, viewport: viewport }).promise;

                // Compress to JPEG
                const blob = await new Promise<Blob | null>(resolve =>
                    canvas.toBlob(resolve, 'image/jpeg', quality)
                );

                if (!blob) throw new Error("Compression failed for page " + i);

                const arrayBufferImg = await blob.arrayBuffer();
                const jpgImage = await newPdfDoc.embedJpg(arrayBufferImg);
                const jpgDims = jpgImage.scale(1);

                const newPage = newPdfDoc.addPage([jpgDims.width, jpgDims.height]);
                newPage.drawImage(jpgImage, {
                    x: 0,
                    y: 0,
                    width: jpgDims.width,
                    height: jpgDims.height,
                });
            }


            return await newPdfDoc.save();

        } catch (e: any) {
            console.error("Compression Error:", e);
            throw new Error(`Compression failed: ${e.message}`);
        }
    },

    // 8. PDF to JPG (Lazy Load PDF.js)
    async pdfToJpg(file: File): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();

        try {
            const pdfjsLib = await getPdfJs();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            const zip = new JSZip();
            const baseName = file.name.replace('.pdf', '');

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) throw new Error("Canvas context failed");
                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
                if (blob) zip.file(`${baseName}_page_${i}.jpg`, blob);
            }
            return await zip.generateAsync({ type: 'uint8array' });
        } catch (e: any) {
            throw new Error(`PDF to Image failed: ${e.message}`);
        }
    },

    // 8b. PDF to PNG (Lossless)
    async pdfToPng(file: File): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();

        try {
            const pdfjsLib = await getPdfJs();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            const zip = new JSZip();
            const baseName = file.name.replace('.pdf', '');

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) throw new Error("Canvas context failed");
                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                if (blob) zip.file(`${baseName}_page_${i}.png`, blob);
            }
            return await zip.generateAsync({ type: 'uint8array' });
        } catch (e: any) {
            throw new Error(`PDF to PNG failed: ${e.message}`);
        }
    },

    // 9. Word to PDF (Client-Side Text Extraction Fallback)
    async convertToPDF(file: File): Promise<Uint8Array> {


        // Dynamic imports
        // @ts-ignore
        const mammoth = await import('mammoth');

        const arrayBuffer = await file.arrayBuffer();

        // 1. Extract RAW TEXT

        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        let text = result.value;

        if (!text || text.trim().length === 0) {
            throw new Error("Could not extract any text from this document. It might be image-based.");
        }

        // SANITIZE TEXT to avoid "WinAnsi cannot encode" errors
        text = sanitizeText(text);



        // 2. Create PDF manually using pdf-lib
        const pdfDoc = await PDFDocument.create();

        // Font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = 12;
        const lineHeight = 14;
        const margin = 50;

        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const maxWidth = width - (margin * 2);

        // Helper to wrap text
        const wrapText = (text: string, maxWidth: number): string[] => {
            const words = text.split(' ');
            let lines: string[] = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
                if (width < maxWidth) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines;
        };

        // 3. Draw Text
        let y = height - margin;

        // Split by newlines first to preserve paragraphs
        const paragraphs = text.split(/\n+/);

        for (const paragraph of paragraphs) {
            const lines = wrapText(paragraph, maxWidth);

            for (const line of lines) {
                if (y < margin + lineHeight) {
                    // New Page
                    page = pdfDoc.addPage();
                    y = height - margin;
                }

                page.drawText(line, {
                    x: margin,
                    y: y,
                    size: fontSize,
                    font: font,
                    color: rgb(0, 0, 0),
                });

                y -= lineHeight;
            }
            // Extra gap for paragraph
            y -= lineHeight * 0.5;
        }


        return await pdfDoc.save();
    },

    // 10. PDF to Word (Text-Flow Extractor)
    async pdfToDocx(file: File, strings?: { convertedBy: string }): Promise<Uint8Array> {


        // Dynamic imports
        // @ts-ignore
        const docx = await import('docx');
        const pdfjsLib = await getPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const docParagraphs: any[] = [];

        // Header for the generated Doc
        docParagraphs.push(
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: strings?.convertedBy || "Converted by OrbitPDF",
                        bold: true,
                        size: 24,
                        color: "888888"
                    }),
                ],
                spacing: { after: 400 },
            })
        );

        // Iterate Pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Simple extraction: Join all string items with a space
            const pageTextItems = textContent.items
                .map((item: any) => item.str)
                .join(" ");

            if (pageTextItems.trim().length > 0) {
                docParagraphs.push(
                    new docx.Paragraph({
                        children: [new docx.TextRun(pageTextItems)],
                        spacing: { after: 200 },
                    })
                );
            }

            // Page break
            if (i < pdf.numPages) {
                docParagraphs.push(new docx.Paragraph({ children: [new docx.PageBreak()] }));
            }
        }

        // Create Document
        const doc = new docx.Document({
            sections: [{
                properties: {},
                children: docParagraphs,
            }],
        });

        // Generate Blob
        const blob = await docx.Packer.toBlob(doc);
        return new Uint8Array(await blob.arrayBuffer());
    },

    // 11. Organize PDF (Reorder/Delete Pages)
    // Takes original file and an array of 0-based INDICES to keep/order.
    async organizePDF(file: File, pageIndices: number[]): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const newPdf = await PDFDocument.create();

        // Copy pages based on the indices array
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);

        copiedPages.forEach(page => newPdf.addPage(page));
        return await newPdf.save();
    },

    // 12. Get Thumbnails for UI
    async getThumbnails(file: File): Promise<string[]> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await getPdfJs();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const thumbnails: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                thumbnails.push(canvas.toDataURL('image/jpeg', 0.8));
            }
        }
        return thumbnails;
    },

    // 13. Images to PDF (JPG, PNG, BMP, WebP, etc.)
    async imagesToPDF(files: File[]): Promise<Uint8Array> {
        const pdfDoc = await PDFDocument.create();
        console.log(`[imagesToPDF] Processing ${files.length} files.`);

        for (const file of files) {
            try {
                // Yield to main thread
                await new Promise(resolve => setTimeout(resolve, 10));

                let imageBytes: ArrayBuffer | null = null;
                let imageType: 'png' | 'jpg' | null = null;
                let usedFallback = false;

                // Strategy 1: Direct Embed (Fastest, preserves quality)
                const isJpg = file.type === 'image/jpeg' || /\.(jpg|jpeg)$/i.test(file.name);
                const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);

                if (isJpg || isPng) {
                    try {
                        imageBytes = await file.arrayBuffer();
                        imageType = isJpg ? 'jpg' : 'png';
                        // Test embed immediately to catch errors early
                        // We don't add page yet, just verifying it embeds
                        /* 
                           Note: pdf-lib doesn't throw on embed usually until save, 
                           but invalid data might throw. 
                           To be safe, we will proceed to logic 2.
                        */
                    } catch (e) {
                        console.warn(`[imagesToPDF] Direct read failed for ${file.name}, trying fallback.`, e);
                        imageBytes = null; // Trigger fallback
                    }
                }

                // Strategy 2: Canvas Conversion (Fallback for BMP, WebP, or broken JPG/PNG)
                if (!imageBytes) {
                    usedFallback = true;
                    try {
                        const bitmap = await createImageBitmap(file);
                        const canvas = document.createElement('canvas');
                        canvas.width = bitmap.width;
                        canvas.height = bitmap.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(bitmap, 0, 0);
                            // Convert to JPEG for PDF (smaller size usually)
                            const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.9));
                            if (blob) {
                                imageBytes = await blob.arrayBuffer();
                                imageType = 'jpg';
                            }
                        }
                    } catch (e) {
                        console.error(`[imagesToPDF] Canvas conversion failed for ${file.name}`, e);
                        continue; // Nothing we can do
                    }
                }

                // 3. Embed into PDF
                if (imageBytes && imageType) {

                    let embeddedImage;
                    const cleanType = imageType; // capture for closure if needed

                    try {
                        if (cleanType === 'jpg') embeddedImage = await pdfDoc.embedJpg(imageBytes);
                        else embeddedImage = await pdfDoc.embedPng(imageBytes);
                    } catch (e) {
                        // If direct embed failed (e.g. really a transparent PNG labeled as JPG, or corrupt)
                        // AND we haven't tried fallback yet, try fallback now.
                        if (!usedFallback) {
                            console.warn(`[imagesToPDF] Direct embed failed for ${file.name}, trying fallback conversion.`, e);
                            try {
                                const bitmap = await createImageBitmap(file);
                                const canvas = document.createElement('canvas');
                                canvas.width = bitmap.width;
                                canvas.height = bitmap.height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                    ctx.drawImage(bitmap, 0, 0);
                                    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.9));
                                    if (blob) {
                                        const newBytes = await blob.arrayBuffer();
                                        embeddedImage = await pdfDoc.embedJpg(newBytes);
                                    }
                                }
                            } catch (err2) {
                                console.error(`[imagesToPDF] Double fallback failed for ${file.name}`, err2);
                                continue;
                            }
                        } else {
                            throw e;
                        }
                    }

                    if (embeddedImage) {
                        const { width, height } = embeddedImage.scale(1);
                        const page = pdfDoc.addPage([width, height]);
                        page.drawImage(embeddedImage, {
                            x: 0,
                            y: 0,
                            width: width,
                            height: height,
                        });
                        console.log(`[imagesToPDF] Successfully added page for ${file.name}. Total pages: ${pdfDoc.getPageCount()}`);
                    } else {
                        console.warn(`[imagesToPDF] Skipping ${file.name} - failed to embed image.`);
                    }
                }

            } catch (err) {
                console.error(`[imagesToPDF] Error processing file ${file.name}`, err);
            }
        }

        console.log(`[imagesToPDF] Finished processing. Final page count: ${pdfDoc.getPageCount()}`);

        if (pdfDoc.getPageCount() === 0) {
            throw new Error("No images could be successfully converted.");
        }

        const pdfBytes = await pdfDoc.save();
        console.log(`[imagesToPDF] PDF saved. Total bytes: ${pdfBytes.length}`);
        return pdfBytes;
    },

    // 14. Add Page Numbers
    async addPageNumbers(file: File, position: 'top' | 'bottom' = 'bottom', strings?: { pageOverview: string }): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;

        for (let i = 0; i < totalPages; i++) {
            const page = pages[i];
            const { width, height } = page.getSize();
            const format = strings?.pageOverview || "Page {{current}} of {{total}}";
            const text = format.replace('{{current}}', (i + 1).toString()).replace('{{total}}', totalPages.toString());
            const textSize = 12;
            const textWidth = helveticaFont.widthOfTextAtSize(text, textSize);
            const textHeight = textSize;

            // Calculate coordinates
            const x = (width / 2) - (textWidth / 2);
            const y = position === 'top' ? height - 30 : 20;

            // Draw "Pill" Background for nice look
            page.drawRectangle({
                x: x - 10,
                y: y - 5,
                width: textWidth + 20,
                height: textHeight + 10,
                color: rgb(0.95, 0.95, 0.95), // Light Gray
                opacity: 0.8,
                borderWidth: 0,
            });

            // Draw Text
            page.drawText(text, {
                x: x,
                y: y,
                size: textSize,
                font: helveticaFont,
                color: rgb(0.2, 0.2, 0.2), // Dark Gray
            });
        }

        return await pdfDoc.save();
    },

    // 15. Sign PDF (Customizable Position)
    async signPDF(file: File, signatureDataUrl: string, options?: { alignmentX?: 'left' | 'center' | 'right', alignmentY?: 'top' | 'center' | 'bottom', pageIndex?: 'first' | 'last' | 'all' }): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const validDataUrl = signatureDataUrl.split(',')[1] ? signatureDataUrl : signatureDataUrl;
        const imageBytes = Uint8Array.from(atob(validDataUrl.split(',')[1]), c => c.charCodeAt(0));

        const embeddedImage = await pdfDoc.embedPng(imageBytes);
        // Default scale 0.5, maybe allow config later
        const { width: imgWidth, height: imgHeight } = embeddedImage.scale(0.5);

        const pages = pdfDoc.getPages();
        const totalPages = pages.length;

        // Determine target pages
        let targetPageIndices: number[] = [];
        if (options?.pageIndex === 'all') {
            targetPageIndices = pages.map((_, i) => i);
        } else if (options?.pageIndex === 'first') {
            targetPageIndices = [0];
        } else {
            // Default to last
            targetPageIndices = [totalPages - 1];
        }

        targetPageIndices.forEach(index => {
            const page = pages[index];
            const { width: pageWidth, height: pageHeight } = page.getSize();

            // Calculate X
            let x = 0;
            const margin = 50;

            if (options?.alignmentX === 'left') {
                x = margin;
            } else if (options?.alignmentX === 'center') {
                x = (pageWidth / 2) - (imgWidth / 2);
            } else {
                // Default Right
                x = pageWidth - imgWidth - margin;
            }

            // Calculate Y
            let y = 0;
            if (options?.alignmentY === 'top') {
                y = pageHeight - imgHeight - margin;
            } else if (options?.alignmentY === 'center') {
                y = (pageHeight / 2) - (imgHeight / 2);
            } else {
                // Default Bottom
                y = margin;
            }

            page.drawImage(embeddedImage, {
                x: x,
                y: y,
                width: imgWidth,
                height: imgHeight,
            });
        });

        return await pdfDoc.save();
    },

    // 16. Edit Metadata
    async editMetadata(file: File, metadata: { title?: string, author?: string, subject?: string, keywords?: string[], creator?: string, producer?: string }): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
        if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
        if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
        if (metadata.keywords !== undefined) pdfDoc.setKeywords(metadata.keywords);
        if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
        if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

        return await pdfDoc.save();
    },

    // 17. Flatten PDF (Form Fields)
    async flattenPDF(file: File): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const form = pdfDoc.getForm();
        try {
            form.flatten();
        } catch (e) {
            // If no form exists or specific flattening fails, we might just ignore it 
            // or perhaps log it. For now, assume it works if form exists.
            console.warn("Flattening form failed or no fields to flatten:", e);
        }

        return await pdfDoc.save();
    },

    // 18. Trim PDF (Crop Margins)
    async trimPDF(file: File, margins: { top: number, bottom: number, left: number, right: number }): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        pages.forEach(page => {
            const { x, y, width, height } = page.getCropBox(); // Get current visible box

            // Margins are in points (1 inch = 72 points) - we will assume input is points provided by UI
            // Ensure we don't crop beyond size
            const newX = x + margins.left;
            const newY = y + margins.bottom;
            const newWidth = width - margins.left - margins.right;

            const newHeight = height - margins.top - margins.bottom;

            if (newWidth > 0 && newHeight > 0) {
                page.setCropBox(newX, newY, newWidth, newHeight);
            }
        });

        return await pdfDoc.save();
    },

    // 19. PDF to Excel (Table Extraction)
    async pdfToExcel(file: File): Promise<Uint8Array> {


        // Dynamic import xlsx
        // @ts-ignore
        const XLSX = await import('xlsx');
        const pdfjsLib = await getPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const wb = XLSX.utils.book_new();

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Basic coordinate-based extraction
            // 1. Map items with useful data
            const items = textContent.items.map((item: any) => ({
                str: item.str,
                x: item.transform[4], // translation x
                y: item.transform[5], // translation y
                h: item.height || 10
            })).filter(item => item.str.trim().length > 0);

            // 2. Sort by Y (descending - top to bottom) then X (ascending - left to right)
            items.sort((a, b) => {
                if (Math.abs(a.y - b.y) < 5) { // If Y is close enough, treat as same row
                    return a.x - b.x;
                }
                return b.y - a.y; // Higher Y is higher on page
            });

            // 3. Group into rows
            const rows: string[][] = [];
            let currentRow: string[] = [];
            let lastY = items.length > 0 ? items[0].y : 0;

            for (const item of items) {
                // Check if new row (Y diff > threshold)
                if (Math.abs(item.y - lastY) > 8) { // 8px threshold
                    rows.push(currentRow);
                    currentRow = [];
                    lastY = item.y;
                }
                currentRow.push(item.str);
            }
            if (currentRow.length > 0) rows.push(currentRow);

            // 4. Create Sheet
            const ws = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, `Page ${i}`);
        }

        // 5. Generate Output
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        return new Uint8Array(wbout);
    },

    // 20. OCR PDF (Make Searchable)
    async ocrPDF(file: File, language: string = 'eng', onProgress?: (status: string) => void): Promise<Uint8Array> {
        console.log(`[ocrPDF] Starting OCR Process for: ${file.name}`);
        console.log(`[ocrPDF] Target Language: ${language}`);

        let worker: any = null;
        try {
            // 1. Setup PDF.js and Tesseract.js
            console.log("[ocrPDF] Step 1: Loading libraries...");
            // @ts-ignore
            const { createWorker } = await import('tesseract.js');
            const pdfjsLib = await getPdfJs();
            console.log("[ocrPDF] Libraries loaded successfully");

            console.log("[ocrPDF] Step 2: Reading file buffer...");
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            console.log(`[ocrPDF] PDF loaded. Total pages: ${pdf.numPages}`);

            const newPdfDoc = await PDFDocument.create();
            const helveticaFont = await newPdfDoc.embedFont(StandardFonts.Helvetica);

            // 2. REGISTER FONTKIT (One-time)
            console.log("[ocrPDF] Step 3: Registering fontkit...");
            // @ts-ignore
            const fontkit = await import('@pdf-lib/fontkit');
            newPdfDoc.registerFontkit(fontkit.default || fontkit);

            // Helper to load font safely
            const loadCustomFont = async (doc: any, url: string) => {
                console.log(`[ocrPDF] Attempting to load font: ${url}`);
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        console.warn(`[ocrPDF] Font fetch failed (${response.status}): ${url}`);
                        return null;
                    }
                    const fontBytes = await response.arrayBuffer();
                    if (fontBytes.byteLength < 20 * 1024) {
                        console.warn(`[ocrPDF] Font too small: ${url} (${fontBytes.byteLength} bytes)`);
                        return null;
                    }
                    const font = await doc.embedFont(fontBytes);
                    console.log(`[ocrPDF] Font loaded successfully: ${url}`);
                    return font;
                } catch (e) {
                    console.warn(`[ocrPDF] Exception loading font ${url}:`, e);
                    return null;
                }
            };

            // 3. Load Fonts (One-time)
            console.log("[ocrPDF] Step 4: Loading auxiliary fonts...");
            const [fontArabic] = await Promise.all([
                // loadCustomFont(newPdfDoc, '/fonts/NotoSansArabic.ttf'),
            ]);

            // 4. Initialize Tesseract Worker (One-time)
            console.log(`[ocrPDF] Step 5: Initializing Tesseract worker for ${language}...`);
            worker = await createWorker(language, 1, {
                logger: m => {
                    if (m.status === 'recognizing text' && onProgress) {
                        // Optional: detailed progress
                        // onProgress(`Recognizing: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            console.log("[ocrPDF] Worker created");

            await worker.setParameters({
                tessedit_create_tsv: '1',
                tessedit_create_hocr: '1',
                tessedit_create_box: '1',
                tessedit_pageseg_mode: '1' as any, // PSM_AUTO_OSD
            });
            console.log("[ocrPDF] Worker parameters set");

            for (let i = 1; i <= pdf.numPages; i++) {
                console.log(`[ocrPDF] --- Processing Page ${i}/${pdf.numPages} ---`);
                try {
                    if (onProgress) onProgress(`Processing Page ${i} of ${pdf.numPages}...`);

                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    if (!context) throw new Error("Canvas 2D context creation failed");

                    context.fillStyle = '#FFFFFF';
                    context.fillRect(0, 0, canvas.width, canvas.height);

                    console.log(`[ocrPDF] Rendering page ${i} to canvas...`);
                    await page.render({ canvasContext: context, viewport: viewport }).promise;

                    console.log(`[ocrPDF] Page ${i} rendered. Converting to data URL...`);
                    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.90);

                    console.log(`[ocrPDF] Page ${i}: Running Tesseract recognition...`);
                    const result = await worker.recognize(imgDataUrl, {}, {
                        text: true,
                        blocks: true,
                        hocr: true,
                        tsv: true,
                        box: true
                    });
                    console.log(`[ocrPDF] Page ${i}: Recognition complete.`);

                    const data = result.data as any;
                    let words = data.words || [];
                    let lines = data.lines || [];

                    // FALLBACKS
                    if ((!words || words.length === 0) && data.tsv) {
                        console.log(`[ocrPDF] Page ${i}: Using TSV fallback parser`);
                        const tsvLines = data.tsv.split('\n');
                        const tsvWords: any[] = [];
                        let leftIdx = 6, topIdx = 7, widthIdx = 8, heightIdx = 9, textIdx = 11, confIdx = 10;
                        if (tsvLines.length > 0) {
                            const header = tsvLines[0].split('\t');
                            leftIdx = header.indexOf('left'); topIdx = header.indexOf('top');
                            widthIdx = header.indexOf('width'); heightIdx = header.indexOf('height');
                            textIdx = header.indexOf('text'); confIdx = header.indexOf('conf');
                        }
                        for (let j = 1; j < tsvLines.length; j++) {
                            const row = tsvLines[j].split('\t');
                            if (row.length < 10) continue;
                            const valText = row[textIdx];
                            if (valText && valText.trim().length > 0) {
                                tsvWords.push({
                                    text: valText.trim(),
                                    bbox: {
                                        x0: parseInt(row[leftIdx]) || 0,
                                        y0: parseInt(row[topIdx]) || 0,
                                        x1: (parseInt(row[leftIdx]) || 0) + (parseInt(row[widthIdx]) || 0),
                                        y1: (parseInt(row[topIdx]) || 0) + (parseInt(row[heightIdx]) || 0)
                                    },
                                    confidence: parseFloat(row[confIdx]) || 0
                                });
                            }
                        }
                        if (tsvWords.length > 0) words = tsvWords;
                    }

                    // Deep Fallback via blocks
                    if ((!words || words.length === 0) && data.blocks) {
                        console.warn(`[ocrPDF] Page ${i}: Using Block fallback`);
                        const extractedWords: any[] = [];
                        data.blocks.forEach((block: any) => {
                            (block.paragraphs || []).forEach((p: any) => {
                                (p.lines || []).forEach((l: any) => {
                                    (l.words || []).forEach((w: any) => extractedWords.push(w));
                                });
                            });
                        });
                        if (extractedWords.length > 0) words = extractedWords;
                    }

                    const originalViewport = page.getViewport({ scale: 1.0 });
                    const pdfPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height]);

                    console.log(`[ocrPDF] Page ${i}: Embedding background image...`);
                    const embeddedImage = await newPdfDoc.embedJpg(imgDataUrl);
                    pdfPage.drawImage(embeddedImage, {
                        x: 0, y: 0, width: originalViewport.width, height: originalViewport.height
                    });

                    const scaleFactor = originalViewport.width / viewport.width;

                    const drawWord = (word: any) => {
                        const { bbox, text } = word;
                        if (!bbox || !text) return;

                        // Safety checks for coordinates
                        const x0 = parseFloat(bbox.x0);
                        const y0 = parseFloat(bbox.y0);
                        const x1 = parseFloat(bbox.x1);
                        const y1 = parseFloat(bbox.y1);

                        if (isNaN(x0) || isNaN(y0) || isNaN(x1) || isNaN(y1)) return;

                        const x = x0 * scaleFactor;
                        const y = originalViewport.height - (y1 * scaleFactor);
                        const h = (y1 - y0) * scaleFactor;
                        const fontSize = Math.max(h, 2) || 8;

                        let selectedFont = helveticaFont;
                        if (/[\u0600-\u06FF]/.test(text) && fontArabic) selectedFont = fontArabic;

                        try {
                            pdfPage.drawText(text, {
                                x: x, y: y, size: fontSize, font: selectedFont, color: rgb(0, 0, 0), opacity: 0
                            });
                        } catch (drawErr) {
                            // Silently ignore encoding errors for individual words
                        }
                    };

                    console.log(`[ocrPDF] Page ${i}: Drawing invisible text layer...`);
                    if (lines && lines.length > 0) {
                        lines.forEach((line: any) => (line.words || []).forEach(drawWord));
                    } else if (words && words.length > 0) {
                        words.forEach(drawWord);
                    }
                    console.log(`[ocrPDF] Page ${i}: Summary - Processed ${words.length} words.`);

                } catch (pageErr) {
                    console.error(`[ocrPDF] Critical error on page ${i}:`, pageErr);
                }
            }

            console.log("[ocrPDF] Step 6: Finalizing PDF...");
            const finalBytes = await newPdfDoc.save();
            console.log(`[ocrPDF] OCR finished. Final bytes: ${finalBytes.length}`);
            return finalBytes;

        } catch (fatalErr) {
            console.error("[ocrPDF] FATAL ERROR during OCR process:", fatalErr);
            throw fatalErr; // Re-throw so ToolProcessor handles it
        } finally {
            if (worker) {
                console.log("[ocrPDF] Cleaning up Tesseract worker...");
                await worker.terminate();
            }
        }
    },

    // 17. PDF to PowerPoint (Image based)
    async pdfToPowerPoint(file: File): Promise<Uint8Array> {
        const PptxGenJS = (await import('pptxgenjs')).default;
        const pptx = new PptxGenJS();

        const pdfjsLib = await getPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;

        for (let i = 1; i <= pageCount; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // High res for PPT
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (!context) continue;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const imgData = canvas.toDataURL('image/jpeg', 0.8);

            // Add Slide
            const slide = pptx.addSlide();
            // PptxGenJS fits image to slide if sizing is handled, 
            // but we can just set background for simplicity and full coverage
            slide.background = { data: imgData };
        }

        // Generate Blob
        const blob = await pptx.write({ outputType: 'blob' }) as Blob;
        return new Uint8Array(await blob.arrayBuffer());
    },

    // 18. Excel to PDF
    async excelToPDF(file: File): Promise<Uint8Array> {
        // Dynamic imports
        const XLSX = await import('xlsx');
        // @ts-ignore
        const html2pdf = (await import('html2pdf.js')).default;

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        if (workbook.SheetNames.length === 0) throw new Error("Excel file is empty.");

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to HTML
        const html = XLSX.utils.sheet_to_html(worksheet);

        // Create a wrapper to style it
        const container = document.createElement('div');
        container.innerHTML = `
            <style>
                body { margin: 0; padding: 0; background-color: #fff; }
                table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 11px; color: #000; }
                th, td { border: 1px solid #ccc; padding: 4px; vertical-align: top; word-wrap: break-word; }
                th { background-color: #f4f4f4; font-weight: bold; }
                h1 { font-size: 16px; text-align: center; margin-bottom: 20px; font-family: sans-serif; color: #000; }
            </style>
            <h1>${file.name.replace(/\.[^/.]+$/, "")}</h1>
            ${html}
        `;

        // Fixed options for better layout (landscape, fit width)
        const opt = {
            margin: 5,
            filename: 'document.pdf',
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
        };

        const pdfArrayBuffer = await html2pdf().from(container).set(opt).output('arraybuffer');
        return new Uint8Array(pdfArrayBuffer);
    },

    // 19. PowerPoint to PDF (Content Extractor with Images)
    async pptxToPDF(file: File): Promise<Uint8Array> {
        const JSZip = (await import('jszip')).default;
        // @ts-ignore
        const html2pdf = (await import('html2pdf.js')).default;

        const zip = await JSZip.loadAsync(file);

        // Find slides
        const slideFiles: string[] = [];
        zip.folder("ppt/slides")?.forEach((relativePath, _file) => {
            if (relativePath.startsWith("slide") && relativePath.endsWith(".xml")) {
                slideFiles.push(relativePath);
            }
        });

        // Sort slides naturally
        slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)![0]);
            const numB = parseInt(b.match(/\d+/)![0]);
            return numA - numB;
        });

        if (slideFiles.length === 0) throw new Error("No slides found in this PowerPoint file.");

        let htmlContent = `<div style="font-family: sans-serif; padding: 20px;">`;
        htmlContent += `<h1 style="text-align:center; color:#333;">${file.name}</h1>`;

        const parser = new DOMParser();

        for (const slidePath of slideFiles) {
            // 1. Get Text
            const xmlStr = await zip.file(`ppt/slides/${slidePath}`)?.async("string");
            if (!xmlStr) continue;

            const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
            const textNodes = xmlDoc.getElementsByTagName("a:t");

            let slideText = "";
            if (textNodes.length > 0) {
                for (let i = 0; i < textNodes.length; i++) {
                    slideText += textNodes[i].textContent + " ";
                }
            } else {
                // Fallback for namespace issues
                const allTags = xmlDoc.getElementsByTagName("*");
                for (let i = 0; i < allTags.length; i++) {
                    if (allTags[i].localName === "t") slideText += allTags[i].textContent + " ";
                }
            }

            // 2. Get Images (via Relationships)
            // Rel file is usually ppt/slides/_rels/slideX.xml.rels
            const relPath = `ppt/slides/_rels/${slidePath}.rels`;
            const relXmlStr = await zip.file(relPath)?.async("string");
            let imagesHtml = "";

            if (relXmlStr) {
                const relDoc = parser.parseFromString(relXmlStr, "text/xml");
                const rels = relDoc.getElementsByTagName("Relationship");

                for (let i = 0; i < rels.length; i++) {
                    const type = rels[i].getAttribute("Type");
                    const target = rels[i].getAttribute("Target"); // e.g., "../media/image1.png"

                    if (type && type.includes("image") && target) {
                        try {
                            // Resolve path: "../media/image1.png" relative to "ppt/slides/" -> "ppt/media/image1.png"
                            // Or usually just "ppt/media/..." if we handle the "../" lookup
                            const cleanTarget = target.replace("../", "ppt/");

                            // Check if file exists in zip
                            const imgFile = zip.file(cleanTarget);
                            if (imgFile) {
                                const imgBase64 = await imgFile.async("base64");
                                // Detect mime type roughly from extension
                                const ext = cleanTarget.split('.').pop() || 'jpeg';
                                const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

                                imagesHtml += `<img src="data:${mime};base64,${imgBase64}" style="max-width: 100%; height: auto; margin-top: 10px; border: 1px solid #ddd;" /><br/>`;
                            }
                        } catch (e) {
                            console.warn("Failed to load slide image", e);
                        }
                    }
                }
            }

            htmlContent += `
                <div style="border: 1px solid #ccc; margin-bottom: 20px; padding: 20px; border-radius: 8px; page-break-inside: avoid;">
                    <h2 style="margin-top:0; color: #555; border-bottom: 1px solid #eee; padding-bottom: 5px;">Slide ${slidePath.match(/\d+/)}</h2>
                    <p style="white-space: pre-wrap; color: #000;">${slideText.trim() || "(No text content)"}</p>
                    <div style="margin-top: 15px;">${imagesHtml}</div>
                </div>
            `;
        }
        htmlContent += `</div>`;

        const container = document.createElement('div');
        container.innerHTML = htmlContent;

        const opt = {
            margin: 10,
            filename: 'presentation.pdf',
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        const pdfArrayBuffer = await html2pdf().from(container).set(opt).output('arraybuffer');
        return new Uint8Array(pdfArrayBuffer);
    },

    // 20. HTML to PDF (Isolated Rendering via Iframe)
    async htmlToPDF(file: File): Promise<Uint8Array> {
        // PULSE-CAPTURE: Segmented vertical mirror to prevent main-thread freeze
        const text = await file.text();
        const isFullDoc = /<html/i.test(text);

        // @ts-ignore
        const html2canvas = (await import('html2canvas')).default;
        // @ts-ignore
        const { jsPDF } = await import('jspdf');

        // 1. Enter Stealth Mode: Quantum Overlay
        document.body.setAttribute('data-orbit-pdf-locking', 'true');
        const vault = document.createElement('iframe');
        vault.id = 'orbit-pdf-the-vault-pulse';
        Object.assign(vault.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            border: 'none',
            visibility: 'visible',
            opacity: '0.005',
            zIndex: '2147483647',
            pointerEvents: 'none'
        });
        document.body.appendChild(vault);

        const CHUNK_HEIGHT = 1000; // Neural Pulse: Micro-slices to prevent main-thread spikes

        try {
            const vaultDoc = vault.contentDocument || vault.contentWindow?.document;
            if (!vaultDoc) throw new Error("Quantum access denied.");

            // Optimized Proxy: Yield every 2 images to keep spinner alive
            const proxyImagesToDataUrls = async (doc: Document) => {
                const images = Array.from(doc.querySelectorAll('img'));
                for (let i = 0; i < images.length; i++) {
                    if (i % 2 === 0) await new Promise(r => setTimeout(r, 60));
                    const img = images[i];
                    try {
                        if (!img.complete) {
                            await new Promise(res => {
                                img.onload = res;
                                img.onerror = res;
                                setTimeout(res, 2000);
                            });
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;
                        if (canvas.width > 0 && canvas.height > 0) {
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0);
                            img.src = canvas.toDataURL('image/jpeg', 0.9);
                            img.setAttribute('crossOrigin', 'anonymous');
                        }
                    } catch (e) {
                        console.warn("OrbitPDF: Neural-proxy skipped image.", e);
                    }
                }
            };

            const scrubDOM = (doc: Document, isNuclear: boolean) => {
                const root = doc.body || doc.documentElement;
                if (!root) return;
                const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
                let node;
                const toRemove: Element[] = [];
                while (node = walker.nextNode() as Element) {
                    node.removeAttribute('style');
                    const tag = node.tagName.toLowerCase();
                    if (['svg', 'canvas', 'iframe', 'symbol', 'use', 'pattern', 'defs', 'script', 'noscript'].includes(tag)) {
                        toRemove.push(node);
                    }
                    if (isNuclear && !['p', 'h1', 'h2', 'h3', 'h4', 'span', 'img', 'body', 'html', 'div', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li'].includes(tag)) {
                        toRemove.push(node);
                    }
                }
                toRemove.forEach(el => el.remove());
            };

            const injectContent = (isNuclear: boolean) => {
                vaultDoc.open();
                const safeText = text.trim() || "<p>Empty document</p>";
                const content = isFullDoc ? safeText : `
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <style>
                                body { 
                                    background: white !important; 
                                    color: black !important; 
                                    margin: 0 !important; 
                                    padding: 60px !important; 
                                    width: 800px !important; 
                                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                                    line-height: 1.6 !important;
                                    word-wrap: break-word !important;
                                }
                                * { 
                                    background: transparent !important;
                                    background-image: none !important;
                                    box-shadow: none !important;
                                }
                                img { max-width: 100%; height: auto; display: block; margin: 30px 0; border-radius: 4px; }
                                h1, h2, h3 { color: #0f172a !important; margin-top: 30px; font-weight: bold !important; }
                                p { margin-bottom: 20px; font-size: 16px !important; }
                                #orbit-safety-anchor { height: 1px; width: 800px; clear: both; }
                            </style>
                        </head>
                        <body>${safeText}<div id="orbit-safety-anchor"></div></body>
                    </html>
                `;
                vaultDoc.write(content);
                vaultDoc.close();
                scrubDOM(vaultDoc, isNuclear);
            };

            injectContent(false);

            await new Promise((resolve) => {
                const start = Date.now();
                const check = () => {
                    const elapsed = Date.now() - start;
                    if ((vaultDoc.readyState === 'complete' && (vaultDoc.body?.scrollHeight || 0) > 10) || elapsed > 10000) resolve(null);
                    else setTimeout(check, 100);
                };
                check();
            });

            await proxyImagesToDataUrls(vaultDoc);
            await new Promise(r => setTimeout(r, 1000));

            const totalHeight = Math.max(vaultDoc.body?.scrollHeight || 0, vaultDoc.documentElement.scrollHeight || 0, 1000);
            vault.style.height = `${totalHeight + 200}px`;

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            let currentPointer = 0;

            // Neural Pulse Loop: High-speed JPEG encoding with paint-cycle sync
            while (currentPointer < totalHeight) {
                // Heartbeat: Wait for a full browser repaint to keep spinner fluid
                await new Promise(r => {
                    requestAnimationFrame(() => {
                        setTimeout(r, 150); // Generous yield for UI
                    });
                });

                const remaining = totalHeight - currentPointer;
                const chunkHeight = Math.min(CHUNK_HEIGHT, remaining);

                const canvas = await html2canvas(vaultDoc.body || vaultDoc.documentElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: 800,
                    height: chunkHeight,
                    windowWidth: 800,
                    windowHeight: chunkHeight,
                    y: currentPointer,
                    scrollX: 0,
                    scrollY: -currentPointer,
                    parent: document.body
                });

                // Turbo Encoding: JPEG is much faster to compress than PNG
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const imgProps = pdf.getImageProperties(imgData);
                const chunkHeightMM = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, chunkHeightMM);

                currentPointer += chunkHeight;
                if (currentPointer < totalHeight) pdf.addPage();

                // Final slice yield
                await new Promise(r => setTimeout(r, 50));
            }

            // Yield before final serialization
            await new Promise(r => setTimeout(r, 200));
            const arrayBuffer = pdf.output('arraybuffer');
            return new Uint8Array(arrayBuffer);

        } finally {
            vault.remove();
            document.body.removeAttribute('data-orbit-pdf-locking');
        }
    }
};