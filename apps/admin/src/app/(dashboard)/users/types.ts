export type DisplayRole = "普通用户" | "创作者" | "管理员" | "审核" | "运营";
export type DisplayStatus = "正常" | "禁用" | "观察中";
export type DisplaySource = "社区本地" | "画布账号" | "邮箱注册" | "其他";

export type DisplayUser = {
  id: string;
  displayName: string;
  userId: string;
  accountLabel: string;
  username: string;
  roleLabel: DisplayRole;
  roleCode: string;
  publishedCount: number;
  likesCount: number;
  followerCount: number;
  reportedTickets: number;
  assignedOpenTickets: number;
  lastActiveAt: string;
  statusLabel: DisplayStatus;
  statusCode: string;
  sourceLabel: DisplaySource;
  registrationAt: string;
  note: string;
  avatarText: string;
  avatarTone: "amber" | "stone" | "navy" | "rose" | "teal" | "violet";
};

export type DetailContentItem = {
  targetType: string;
  targetLabel: string;
  title: string;
  publishStatus: string;
  publishedAt: string;
};

export type UserDetailData = {
  id: string;
  displayName: string;
  accountLabel: string;
  roleLabel: DisplayRole;
  roleCode: string;
  statusLabel: DisplayStatus;
  statusCode: string;
  registrationAt: string;
  lastActiveAt: string;
  sourceLabel: DisplaySource;
  note: string;
  avatarText: string;
  avatarTone: DisplayUser["avatarTone"];
  username: string;
  userId: string;
  emailLabel: string;
  phoneLabel: string;
  contentSummary: string;
  moderationSummary: string;
  followerCount: number;
  likesCount: number;
  openReportsAgainstUser: number;
  canLogin: boolean;
  canPublish: boolean;
  canManageAdmin: boolean;
  hasLocalPassword: boolean;
  canInitializePassword: boolean;
  canResetPassword: boolean;
  passwordActionLabel: string;
  passwordHint: string;
  recentContents: DetailContentItem[];
};

export type PageData = {
  totalUsers: number;
  backendRoleUsers: number;
  displayedUsers: number;
  blockedUsers: number;
  currentPage: number;
  pageSize: number;
  totalMatchedUsers: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  users: DisplayUser[];
  selectedUserId: string | null;
  selectedDetail: UserDetailData | null;
  modeLabel: string;
  modeDetail: string;
  isFallback: boolean;
  searchQuery: string;
  tableCountLabel: string;
  emptyMessage: string | null;
  detailErrorMessage: string | null;
};

export type ResetPasswordActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  temporaryPassword: string | null;
  passwordActionLabel: string | null;
  userId: string | null;
};

export type CreateUserActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  requestId: string | null;
  createdUserId: string | null;
  temporaryPassword: string | null;
  passwordMode: "custom" | "default" | null;
  createdUsername: string | null;
  createdDisplayName: string | null;
};
