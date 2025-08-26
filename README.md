
# 聚火盆 AI 知识库管理系统 - 项目状态文档

**URL**: https://lovable.dev/projects/43e332e0-c9e3-44f2-a540-be9b906fab2e

## 1. 项目概述

本项目是一个专为教育咨询领域打造的 **AI 知识库管理与应用系统**。其核心目标是高效地将非结构化的文档（如微信公众号文章、PDF 手册、图片等）转化为结构化、高质量的知识单元，并基于此构建一个智能问答（RAG）系统，为最终用户提供精准、可靠的咨询服务。

目前，项目已完成前端核心功能的开发，并搭建了完整的后端服务框架（基于 Supabase）。前端实现了从文档上传、智能分析、人工审核到知识入库的全流程管理界面。

## 2. 已实现的核心功能

### a. 多格式文档上传
- **单个与批量上传**: 支持一次上传单个或多个文件，优化了用户操作效率。
- **多种格式兼容**: 可处理微信文章（HTML）、PDF文档以及图片（PNG/JPG）等主流内容载体。
- **系统自检**: 上传前会自动检测与 Supabase 数据库和存储的连接，确保系统处于可用状态。

### b. 自动化知识提取流程
- **内容提取**: 后端服务 (`process-document`) 自动从上传的文档中提取纯文本内容。
- **AI 驱动的知识分析**:
    - 调用核心的 `analyze-knowledge` AI 服务，将大段文本拆解成独立的、结构化的**知识单元 (Knowledge Units)**。
    - 每个知识单元包含 `content` (内容) 和 `labels` (标签) 等字段。
- **自动向量化**: 知识单元在入库后，会通过数据库触发器自动进行向量化处理，无需任何手动操作。

### c. 先进的质量保障体系 (Quality Assurance)
为了解决 AI 模型生成内容质量不稳定的问题，我们设计并实现了一套复杂的质量保障服务 (`QualityAssuranceService`)，在知识入库前对AI生成内容进行自动评估和过滤：
1.  **内容去重**: 基于内容指纹算法，有效剔除重复或高度相似的知识单元。
2.  **质量评估**: 从四个维度对每个知识单元进行打分（0-1分）：
    - **完整性 (Completeness)**: 信息是否全面，是否包含上下文、条件和结果。
    - **相关性 (Relevance)**: 是否与教育咨询领域高度相关。
    - **具体性 (Specificity)**: 是否包含数字、专业名称、具体要求等细节信息。
    - **可操作性 (Actionability)**: 是否提供明确的建议、步骤或决策依据。
3.  **加权总分**: 根据预设权重 (`相关性 > 具体性 > 完整性 > 可操作性`) 计算出综合质量分。
4.  **低质内容过滤**: 自动过滤掉综合评分低于 `0.4` 的知识单元，确保入库的知识具有基本质量。
5.  **高质量内容预审**: 综合评分高于 `0.7` 的内容将被自动标记为“批准”，减少人工审核负担。
6.  **标签标准化**: 将常见的别名（如“西浦”）统一为标准名称（“西交利物浦大学”）。

### d. 人机协同的知识管理
- **知识预览与审核**: 在“知识管理”界面，用户可以查看、修改、批准或删除由 AI 提取的知识单元。
- **缓存机制**: 使用 `CacheManager` 在本地缓存分析结果，避免用户刷新页面后丢失未保存的进度。
- **增删改查**: 支持手动添加新的知识单元，或对现有单元进行内容和标签的修改。
- **持久化存储**: 经用户批准的知识单元将被永久保存到 Supabase 的 `knowledge_units` 表中。

### e. RAG 智能问答
- **聊天界面**: 提供了一个基础的聊天机器人界面。
- **后端驱动**: 调用 `rag-chat` 后端服务，该服务会根据用户提问，在 `knowledge_units` 向量数据库中进行相似度搜索，并将最相关的知识作为上下文，生成精准的回答。

## 3. 技术栈

- **前端**:
    - **框架**: React (Vite)
    - **语言**: TypeScript
    - **UI**: shadcn/ui, Tailwind CSS
- **后端 (Serverless)**:
    - **平台**: Supabase
    - **数据库**: PostgreSQL (with `pg_vector` for semantic search)
    - **存储**: Supabase Storage
    - **函数计算**: Supabase Edge Functions (Deno)
- **AI 模型**:
    - 通过 API 在 Edge Functions 中调用，主要为 **DeepSeek** 或 **OpenAI** 的模型。

## 4. AI模型与API密钥配置

本项目中的AI能力由部署在Supabase上的多个后台函数（Edge Functions）提供。这些函数通过API调用外部AI模型（如DeepSeek、OpenAI）来完成任务。

- **API密钥管理**:
    - **严禁**将API密钥硬编码在代码中。
    - 所有密钥均已通过 Supabase 的 **Secrets** 功能进行管理。请登录您的 Supabase 项目后台，在 `Settings` -> `Secrets` 中查看和修改 `DEEPSEEK_API_KEY` 和 `OPENAI_API_KEY`。

- **核心AI服务位置**:
    - **知识分析**: `supabase/functions/analyze-knowledge/index.ts`
    - **向量生成**: `supabase/functions/generate-embeddings/index.ts`
    - **智能问答**: `supabase/functions/rag-chat/index.ts`
    - **文档处理**: `supabase/functions/process-document/index.ts`

## 5. 核心工作流

1.  **上传**: 用户在前端上传文档 -> `DocumentUpload.tsx`。
2.  **存储**: 文件被上传至 Supabase Storage，并在 `source_documents` 表中创建记录。
3.  **文本提取**: `process-document` Edge Function 被触发，从文件中提取文本。
4.  **分析**: 用户在“文档管理”中点击“知识管理”，触发 `KnowledgeAnalysisManager.tsx`。
5.  **AI处理**: `AnalysisService.tsx` 调用 `analyze-knowledge` Edge Function 进行知识提取。
6.  **质量控制**: 返回的原始数据经过 `QualityAssuranceService.tsx` 的清洗、评估、过滤和排序。
7.  **审核**: 结果展示在前端，供用户审核、修改和批准。
8.  **入库**: 用户点击保存，批准的知识单元存入 `knowledge_units` 表。
9.  **自动向量化**: 新知识入库时，数据库触发器会自动调用 `generate-embeddings` 函数，为新知识生成向量嵌入，无需手动操作。
10. **问答**: 用户在聊天界面提问，`rag-chat` 函数执行向量搜索并生成回答。

## 6. 后端开发交接说明 (For Cursor)

您现在可以专注于后端逻辑的深度优化。以下是建议的着手点：

- **提示词工程 (Prompt Engineering)**:
    - **审查与优化**: 深入 `supabase/functions/analyze-knowledge/index.ts` 和 `rag-chat/index.ts` 文件。这是提升质量最直接的地方。检查其中的 `system prompt` 和 `user prompt`，确保它们足够清晰、具体，并能引导模型输出期望的格式和内容。
    - **结构化输出**: 强制模型以 JSON 格式输出，并提供清晰的 JSON Schema 定义，可以极大提升数据处理的稳定性。

- **数据库与自动化**:
    - **触发器 (Triggers)**: 已为 `knowledge_units` 表创建数据库触发器。当有新知识插入时，会自动调用 `generate-embeddings` 函数，实现向量的实时更新。
    - **索引优化**: 检查 `knowledge_units` 表的索引策略，特别是 `embedding` 列的 `IVF_FLAT` 或 `HNSW` 索引，确保高效率的向量检索。

- **RAG 流程优化**:
    - **检索策略**: 优化 `rag-chat` 中的检索逻辑。可以尝试混合搜索（关键字 + 向量）、查询重写（将用户口语化提问改写为更适合检索的查询）、或实现 Re-ranking（用更强大的模型对初步检索结果进行重排序）。
    - **上下文管理**: 精细化控制注入到 Prompt 中的上下文长度和数量，避免超出模型限制或引入噪声。

- **函数健壮性**:
    - **错误处理**: 为所有 Edge Functions 添加更详尽的错误捕获和日志记录。
    - **环境变量**: 确保所有 API Key 和敏感配置都已通过 Supabase Secrets 管理，而不是硬编码。

---

## 原始 Lovable 项目信息

若需在 Lovable 环境中继续开发前端，可参考以下信息。

**如何运行项目 (本地开发)**

```sh
# Step 1: 克隆仓库
git clone <YOUR_GIT_URL>

# Step 2: 进入项目目录
cd <YOUR_PROJECT_NAME>

# Step 3: 安装依赖
npm i

# Step 4: 启动开发服务器
npm run dev
```
