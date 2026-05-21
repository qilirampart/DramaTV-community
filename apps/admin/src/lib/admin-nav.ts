import type { AdminRole } from "@/lib/admin-auth";

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export type AdminNavItem = {
  href: string;
  label: string;
  note: string;
  allowedRoles: readonly AdminRole[];
};

const ALL_ROLES = ["admin", "operator", "moderator"] as const satisfies readonly AdminRole[];
const OPS_ROLES = ["admin", "operator"] as const satisfies readonly AdminRole[];
const MODERATION_ROLES = ["admin", "moderator"] as const satisfies readonly AdminRole[];

export const ADMIN_NAV_GROUPS: readonly AdminNavGroup[] = [
  {
    title: "总控",
    items: [
      {
        href: "/dashboard",
        label: "概览台",
        note: "积压、风险与异常快照",
        allowedRoles: ALL_ROLES
      }
    ]
  },
  {
    title: "治理",
    items: [
      {
        href: "/users",
        label: "用户管理",
        note: "账号状态、角色与密码重置",
        allowedRoles: ALL_ROLES
      },
      {
        href: "/moderation",
        label: "内容审核",
        note: "提示词、工作流、帖子统一审核",
        allowedRoles: MODERATION_ROLES
      },
      {
        href: "/resources",
        label: "资源治理",
        note: "全量查看提示词、工作流、帖子与下线恢复",
        allowedRoles: MODERATION_ROLES
      },
      {
        href: "/reports",
        label: "举报中心",
        note: "工单处理与联动动作",
        allowedRoles: MODERATION_ROLES
      },
      {
        href: "/comments",
        label: "评论治理",
        note: "评论清理、楼中楼与目标开关",
        allowedRoles: MODERATION_ROLES
      }
    ]
  },
  {
    title: "运营",
    items: [
      {
        href: "/feed-ops/home",
        label: "运营配置",
        note: "首页、精选页与讨论区展示编排",
        allowedRoles: OPS_ROLES
      },
      {
        href: "/taxonomy",
        label: "分类管理",
        note: "标签、分区与模型口径",
        allowedRoles: OPS_ROLES
      }
    ]
  },
  {
    title: "排障",
    items: [
      {
        href: "/media-tasks",
        label: "媒体任务",
        note: "上传、封面、预览与重试",
        allowedRoles: ALL_ROLES
      },
      {
        href: "/audit-logs",
        label: "操作日志",
        note: "后台行为审计与回溯",
        allowedRoles: ALL_ROLES
      }
    ]
  }
] as const;

export function getVisibleNavGroups(role: AdminRole) {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.allowedRoles.includes(role))
  })).filter((group) => group.items.length > 0);
}
