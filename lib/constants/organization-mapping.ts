/**
 * Duliday 组织ID到品牌名称的映射表
 *
 * 这个映射表用于将 Duliday API 中的 organizationId 转换为我们系统中的品牌名称
 * 请根据实际的组织ID手动维护这个映射关系
 */
export const ORGANIZATION_MAPPING: Record<number, string> = {
  5: "肯德基",
  941: "成都你六姐",
  985: "大米先生",
  // TODO: 根据实际的 organizationId 添加更多品牌映射
  // 可以通过调用 Duliday API 获取组织列表来确定具体的 ID
};

/**
 * 获取所有可同步的品牌列表
 */
export function getAvailableBrands(): Array<{ id: number; name: string }> {
  return Object.entries(ORGANIZATION_MAPPING).map(([id, name]) => ({
    id: parseInt(id),
    name,
  }));
}

/**
 * 根据组织ID获取品牌名称
 */
export function getBrandNameByOrgId(orgId: number): string | undefined {
  return ORGANIZATION_MAPPING[orgId];
}

/**
 * 根据品牌名称获取组织ID
 */
export function getOrgIdByBrandName(brandName: string): number | undefined {
  const entry = Object.entries(ORGANIZATION_MAPPING).find(
    ([_, name]) => name === brandName
  );
  return entry ? parseInt(entry[0]) : undefined;
}
