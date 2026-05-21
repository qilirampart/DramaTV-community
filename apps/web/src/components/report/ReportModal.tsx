"use client";

import { useMemo, useState } from "react";
import styles from "./ReportModal.module.css";
import type { ApiReportReasonCode, ApiReportTargetType } from "@/lib/contracts/community-api";

type ReportModalProps = {
  open: boolean;
  title: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    targetType: ApiReportTargetType;
    targetId: string;
    reasonCode: ApiReportReasonCode;
    descriptionText?: string;
  }) => Promise<void>;
  targetType: ApiReportTargetType;
  targetId: string;
};

const REPORT_REASONS: Array<{ code: ApiReportReasonCode; label: string }> = [
  { code: "pornographic", label: "涉黄/不适宜内容" },
  { code: "political", label: "涉政/敏感内容" },
  { code: "spam", label: "垃圾信息/刷屏" },
  { code: "abuse", label: "辱骂/攻击" },
  { code: "copyright", label: "侵权/搬运" },
  { code: "misleading", label: "虚假/误导" },
  { code: "other", label: "其他" }
];

export function ReportModal({
  open,
  title,
  submitting = false,
  onClose,
  onSubmit,
  targetType,
  targetId
}: ReportModalProps) {
  const [reasonCode, setReasonCode] = useState<ApiReportReasonCode>("pornographic");
  const [descriptionText, setDescriptionText] = useState("");

  const reasonOptions = useMemo(() => REPORT_REASONS, []);

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    await onSubmit({
      targetType,
      targetId,
      reasonCode,
      descriptionText: descriptionText.trim() || undefined
    });
  }

  return (
    <div className={styles.reportModalBackdrop} role="presentation" onMouseDown={onClose}>
      <div
        aria-label="举报内容"
        aria-modal="true"
        className={styles.reportModal}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.reportModalHeader}>
          <div>
            <span className={styles.reportModalEyebrow}>举报</span>
            <h2>{title}</h2>
          </div>
          <button aria-label="关闭举报弹窗" className={styles.reportModalClose} type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.reportModalBody}>
          <label className={styles.reportModalField}>
            <span>举报原因</span>
            <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value as ApiReportReasonCode)}>
              {reasonOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.reportModalField}>
            <span>补充说明</span>
            <textarea
              maxLength={400}
              placeholder="可补充一句话说明，便于后续审核"
              value={descriptionText}
              onChange={(event) => setDescriptionText(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.reportModalFooter}>
          <button className={styles.reportModalSecondary} disabled={submitting} type="button" onClick={onClose}>
            取消
          </button>
          <button className={styles.reportModalPrimary} disabled={submitting} type="button" onClick={handleSubmit}>
            {submitting ? "提交中..." : "提交举报"}
          </button>
        </div>
      </div>
    </div>
  );
}
