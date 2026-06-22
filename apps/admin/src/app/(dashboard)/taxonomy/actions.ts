"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminBackendError,
  bulkApplyAdminTaxonomy,
  createAdminTaxonomyCategory,
  deleteAdminTaxonomyCategory,
  rebindAdminTaxonomyPrompts,
  updateAdminTaxonomy
} from "@/lib/admin-service";

type TaxonomyFilterParams = {
  q?: string | null;
  poolMode?: string | null;
  scope?: string | null;
  status?: string | null;
  exposure?: string | null;
  config?: string | null;
  bulkModality?: string | null;
  poolQ?: string | null;
  page?: string | null;
  pageSize?: string | null;
};

function resolveReturnPath(
  section?: string | null,
  selected?: string | null,
  filters?: TaxonomyFilterParams
) {
  const query = new URLSearchParams();
  if (section?.trim()) {
    query.set("section", section.trim());
  }
  if (selected?.trim()) {
    query.set("selected", selected.trim());
  }
  if (filters?.q?.trim()) {
    query.set("q", filters.q.trim());
  }
  if (filters?.poolMode?.trim()) {
    query.set("poolMode", filters.poolMode.trim());
  }
  if (filters?.scope?.trim()) {
    query.set("scope", filters.scope.trim());
  }
  if (filters?.status?.trim()) {
    query.set("status", filters.status.trim());
  }
  if (filters?.exposure?.trim()) {
    query.set("exposure", filters.exposure.trim());
  }
  if (filters?.config?.trim()) {
    query.set("config", filters.config.trim());
  }
  if (filters?.bulkModality?.trim()) {
    query.set("bulkModality", filters.bulkModality.trim());
  }
  if (filters?.poolQ?.trim()) {
    query.set("poolQ", filters.poolQ.trim());
  }
  if (filters?.page?.trim()) {
    query.set("page", filters.page.trim());
  }
  if (filters?.pageSize?.trim()) {
    query.set("pageSize", filters.pageSize.trim());
  }

  const queryString = query.toString();
  return queryString ? `/taxonomy?${queryString}` : "/taxonomy";
}

function buildErrorRedirect(
  message: string,
  section?: string | null,
  selected?: string | null,
  filters?: TaxonomyFilterParams
) {
  const base = resolveReturnPath(section, selected, filters);
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}error=${encodeURIComponent(message)}`;
}

function buildSuccessRedirect(
  message: string,
  section?: string | null,
  selected?: string | null,
  filters?: TaxonomyFilterParams
) {
  const base = resolveReturnPath(section, selected, filters);
  const joiner = base.includes("?") ? "&" : "?";
  revalidatePath("/taxonomy");
  redirect(`${base}${joiner}success=${encodeURIComponent(message)}`);
}

function readFilters(formData: FormData): TaxonomyFilterParams {
  return {
    q: String(formData.get("q") ?? "").trim(),
    poolMode: String(formData.get("poolMode") ?? "").trim(),
    scope: String(formData.get("scope") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    exposure: String(formData.get("exposure") ?? "").trim(),
    config: String(formData.get("config") ?? "").trim(),
    bulkModality: String(formData.get("bulkModality") ?? "").trim(),
    poolQ: String(formData.get("poolQ") ?? "").trim(),
    page: String(formData.get("page") ?? "").trim(),
    pageSize: String(formData.get("pageSize") ?? "").trim()
  };
}

export async function updateTaxonomyAction(formData: FormData) {
  const sectionKey = String(formData.get("sectionKey") ?? "").trim();
  const categoryValue = String(formData.get("categoryValue") ?? "").trim();
  const statusCode = String(formData.get("statusCode") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  const noteText = String(formData.get("noteText") ?? "").trim();
  const filters = readFilters(formData);
  const exposureFlags = formData
    .getAll("exposureFlags")
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);

  if (!sectionKey || !categoryValue || !statusCode || !sortOrderRaw) {
    redirect(buildErrorRedirect("分类治理参数不完整。", sectionKey, categoryValue, filters));
  }

  const sortOrder = Number.parseInt(sortOrderRaw, 10);
  if (Number.isNaN(sortOrder)) {
    redirect(buildErrorRedirect("排序值无效。", sectionKey, categoryValue, filters));
  }

  try {
    await updateAdminTaxonomy({
      sectionKey,
      categoryValue,
      statusCode,
      sortOrder,
      exposureFlags,
      noteText
    });
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? ` (requestId: ${error.requestId})` : ""}`
        : "分类治理保存失败，请稍后重试。";
    redirect(buildErrorRedirect(message, sectionKey, categoryValue, filters));
  }

  buildSuccessRedirect("分类治理配置已保存。", sectionKey, categoryValue, filters);
}

export async function bulkApplyTaxonomyAction(formData: FormData) {
  const modality = String(formData.get("bulkModality") ?? "").trim();
  const modelCategory = String(formData.get("bulkModelCategory") ?? "").trim();
  const contentCategory = String(formData.get("bulkContentCategory") ?? "").trim();
  const compositionCategory = String(formData.get("bulkCompositionCategory") ?? "").trim();
  const modelUsageCategory = String(formData.get("bulkModelUsageCategory") ?? "").trim();
  const promptIds = formData
    .getAll("promptIds")
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
  const sectionKey = String(formData.get("sectionKey") ?? "").trim();
  const categoryValue = String(formData.get("categoryValue") ?? "").trim();
  const filters = readFilters(formData);

  if (!modality || promptIds.length === 0) {
    redirect(buildErrorRedirect("请先勾选要批量处理的提示词。", sectionKey, categoryValue, filters));
  }

  if (!modelCategory || !contentCategory) {
    redirect(buildErrorRedirect("模型分类和内容分类都必须填写。", sectionKey, categoryValue, filters));
  }

  if (modality === "video" && !modelUsageCategory && !compositionCategory) {
    redirect(buildErrorRedirect("视频提示词必须填写模型使用方式。", sectionKey, categoryValue, filters));
  }

  let updatedCount = 0;
  try {
    const response = await bulkApplyAdminTaxonomy({
      modality,
      promptIds,
      modelCategory: modelCategory || undefined,
      contentCategory: contentCategory || undefined,
      compositionCategory: compositionCategory || undefined,
      modelUsageCategory: modelUsageCategory || compositionCategory || undefined
    });
    updatedCount = response.data.updatedCount;
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? ` (requestId: ${error.requestId})` : ""}`
        : "批量分类保存失败，请稍后重试。";
    redirect(buildErrorRedirect(message, sectionKey, categoryValue, filters));
  }

  buildSuccessRedirect(`已批量更新 ${updatedCount} 条提示词。`, sectionKey, categoryValue, filters);
}

export async function createTaxonomyCategoryAction(formData: FormData) {
  const sectionKey = String(formData.get("sectionKey") ?? "").trim();
  const categoryValue = String(formData.get("categoryValue") ?? "").trim();
  const filters = readFilters(formData);

  if (!sectionKey || !categoryValue) {
    redirect(buildErrorRedirect("请先选择分类维度并填写分类名称。", sectionKey, null, filters));
  }

  try {
    await createAdminTaxonomyCategory({
      sectionKey,
      categoryValue
    });
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? ` (requestId: ${error.requestId})` : ""}`
        : "新增分类失败，请稍后重试。";
    redirect(buildErrorRedirect(message, sectionKey, categoryValue, filters));
  }

  buildSuccessRedirect("分类已创建。", sectionKey, categoryValue, filters);
}

export async function deleteTaxonomyCategoryAction(formData: FormData) {
  const sectionKey = String(formData.get("sectionKey") ?? "").trim();
  const categoryValue = String(formData.get("categoryValue") ?? "").trim();
  const filters = readFilters(formData);

  if (!sectionKey || !categoryValue) {
    redirect(buildErrorRedirect("缺少要删除的分类。", sectionKey, categoryValue, filters));
  }

  try {
    await deleteAdminTaxonomyCategory(sectionKey, categoryValue);
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? ` (requestId: ${error.requestId})` : ""}`
        : "删除分类失败，请稍后重试。";
    redirect(buildErrorRedirect(message, sectionKey, categoryValue, filters));
  }

  buildSuccessRedirect("分类已删除。", sectionKey, null, filters);
}

export async function rebindTaxonomyPromptsAction(formData: FormData) {
  const sectionKey = String(formData.get("sectionKey") ?? "").trim();
  const categoryValue = String(formData.get("categoryValue") ?? "").trim();
  const promptIds = formData
    .getAll("promptIds")
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
  const filters = readFilters(formData);

  if (!sectionKey || !categoryValue || promptIds.length === 0) {
    redirect(buildErrorRedirect("请先选择分类并勾选提示词。", sectionKey, categoryValue, filters));
  }

  let updatedCount = 0;
  try {
    const response = await rebindAdminTaxonomyPrompts({
      sectionKey,
      categoryValue,
      promptIds
    });
    updatedCount = response.data.updatedCount;
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? ` (requestId: ${error.requestId})` : ""}`
        : "提示词重绑失败，请稍后重试。";
    redirect(buildErrorRedirect(message, sectionKey, categoryValue, filters));
  }

  buildSuccessRedirect(`已重绑 ${updatedCount} 条提示词。`, sectionKey, categoryValue, filters);
}
