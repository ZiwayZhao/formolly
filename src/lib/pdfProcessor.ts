
import * as pdfjsLib from 'pdfjs-dist';

// 为了避免服务端渲染（SSR）出现问题，我们先检查是否在浏览器环境中。
// 我们使用 `new URL()` 来构建 worker 文件的路径。
// 这是 Vite 等打包工具处理静态资源引用的标准方式。
// 这样可以确保 worker 文件在最终构建中被正确定位和加载。
// 我们指向了压缩后的 worker 脚本以提高效率。
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString();
}

/**
 * 在浏览器端从PDF文件中提取纯文本内容。
 * @param file 要处理的PDF文件。
 * @returns 返回一个包含所有页面文本的字符串。
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const numPages = pdfDoc.numPages;
  const pageTexts = await Promise.all(
    Array.from({ length: numPages }, async (_, i) => {
      const page = await pdfDoc.getPage(i + 1);
      const content = await page.getTextContent();
      // content.items 是一个 TextItem 数组，每个 item 都有 .str 属性
      return content.items.map((item: any) => item.str).join(' ');
    })
  );

  return pageTexts.join('\n\n');
}
