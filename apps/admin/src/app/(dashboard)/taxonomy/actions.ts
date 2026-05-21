"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminBackendError, bulkApplyAdminTaxonomy, updateAdminTaxonomy } from "@/lib/admin-service";

type TaxonomyFilterParams = {
  q?: string | null;
  scope?: string | null;
  status?: string | null;
  exposure?: string | null;
  config?: string | null;
  bulkModality?: string | null;
  poolQ?: string | null;
};

function resolveReturnPath(
  section?: string | null,
  selected?: string | null,
  filters?: TaxonomyFilterParams
) {
  const query = new URLSearchParams();
  if (section && section.trim()) {
    query.set("section", section.trim());
  }
  if (selected && selected.trim()) {
    query.set("selected", selected.trim());
  }
  if (filters?.q && filters.q.trim()) {
    query.set("q", filters.q.trim());
  }
  if (filters?.scope && filters.scope.trim()) {
    query.set("scope", filters.scope.trim());
  }
  if (filters?.status && filters.status.trim()) {
    query.set("status", filters.status.trim());
  }
  if (filters?.exposure && filters.exposure.trim()) {
    query.set("exposure", filters.exposure.trim());
  }
  if (filters?.config && filters.config.trim()) {
    query.set("config", filters.config.trim());
  }
  if (filters?.bulkModality && filters.bulkModality.trim()) {
    query.set("bulkModality", filters.bulkModality.trim());
  }
  if (filters?.poolQ && filters.poolQ.trim()) {
    query.set("poolQ", filters.poolQ.trim());
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
  const target = `${base}${joiner}success=${encodeURIComponent(message)}`;
  revalidatePath("/taxonomy");
  redirect(target);
}

export async function updateTaxonomyAction(formData: FormData) {
  const sectionKey = String(formData.get("sectionKey") ?? "").trim();
  const categoryValue = String(formData.get("categoryValue") ?? "").trim();
  const statusCode = String(formData.get("statusCode") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  const noteText = String(formData.get("noteText") ?? "").trim();
  const filters: TaxonomyFilterParams = {
    q: String(formData.get("q") ?? "").trim(),
    scope: String(formData.get("scope") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    exposure: String(formData.get("exposure") ?? "").trim(),
    config: String(formData.get("config") ?? "").trim(),
    bulkModality: String(formData.get("bulkModality") ?? "").trim(),
    poolQ: String(formData.get("poolQ") ?? "").trim()
  };
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
        ? `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
        : "分类治理保存失败，请稍后重试。";
    redirect(buildErrorRedirect(message, sectionKey, categoryValue, filters));
  }

  buildSuccessRedirect("治理配置已保存。", sectionKey, categoryValue, filters);
}

export async function bulkApplyTaxonomyAction(formData: FormData) {
  const modality = String(formData.get("bulkModality") ?? "").trim();
  const modelCategory = String(formData.get("bulkModelCategory") ?? "").trim();
  const contentCategory = String(formData.get("bulkContentCategory") ?? "").trim();
  const compositionCategory = String(formData.get("bulkCompositionCategory") ?? "").trim();
  const promptIds = formData
    .getAll("promptIds")
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
  const sectionKey = String(formData.get("sectionKey") ?? "").trim();
  const categoryValue = String(formData.get("categoryValue") ?? "").trim();
  const filters: TaxonomyFilterParams = {
    q: String(formData.get("q") ?? "").trim(),
    scope: String(formData.get("scope") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    exposure: String(formData.get("exposure") ?? "").trim(),
    config: String(formData.get("config") ?? "").trim(),
    bulkModality: String(formData.get("bulkModality") ?? "").trim(),
    poolQ: String(formData.get("poolQ") ?? "").trim()
  };

  if (!modality || promptIds.length === 0) {
    redirect(buildErrorRedirect("请先勾选待修正提示词。", sectionKey, categoryValue, filters));
  }

  if (!modelCategory || !contentCategory || !compositionCategory) {
    redirect(buildErrorRedirect("模型分类、内容分类、构图分类都必须填写。", sectionKey, categoryValue, filters));
  }

  let updatedCount = 0;
  try {
    const response = await bulkApplyAdminTaxonomy({
      modality,
      promptIds,
      modelCategory: modelCategory || undefined,
      contentCategory: contentCategory || undefined,
      compositionCategory: compositionCategory || undefined
    });
    updatedCount = response.data.updatedCount;
  } catch (error) {
    const message =
      error instanceof AdminBackendError
        ? `${error.message}${error.requestId ? `（requestId: ${error.requestId}）` : ""}`
        : "批量修正分类失败，请稍后重试。";
    redirect(buildErrorRedirect(message, sectionKey, categoryValue, filters));
  }

  buildSuccessRedirect(`已批量修正 ${updatedCount} 条提示词分类。`, sectionKey, categoryValue, filters);
}
